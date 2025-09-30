class CoursesSyncService
  include CoursesSyncErrors

  API_BASE_URL = 'https://api.golfcourseapi.com'.freeze
  RATE_LIMIT_DELAY = 1.second # Delay between requests to respect rate limits
  BATCH_SIZE = 50 # Number of courses to process in one batch
  MAX_RETRIES = 3

  def initialize(api_key: nil)
    @api_key = api_key || Rails.application.credentials.golf_course_api_key
    @base_uri = URI(API_BASE_URL)
    @logger = Rails.logger
    @circuit_breaker = CircuitBreaker.new
    @error_tracker = ErrorTracker.new
  end

  # Initial sync to populate database with all courses
  def initial_sync(limit: nil, start_id: 5000, max_id: 30000)
    @logger.info "Starting initial course sync#{limit ? " (limited to #{limit})" : ""}"
    @logger.info "Scanning course IDs from #{start_id} to #{limit ? [start_id + limit - 1, max_id].min : max_id}"
    
    synced_count = 0
    error_count = 0
    not_found_count = 0
    consecutive_not_found = 0
    
    current_id = start_id
    
    while current_id <= max_id
      break if limit && synced_count >= limit
      break if consecutive_not_found >= 100 # Stop if 100 consecutive courses not found
      
      begin
        course_data = fetch_course_by_id(current_id)
        
        if course_data && course_data['id']
          sync_course(course_data, is_initial: true)
          synced_count += 1
          consecutive_not_found = 0
          @logger.info "Synced course #{current_id}: #{course_data['club_name']} - #{course_data['course_name']}"
        else
          not_found_count += 1
          consecutive_not_found += 1
        end
        
        # Rate limiting - respect API limits
        sleep(RATE_LIMIT_DELAY)
        
      rescue => e
        if e.message.include?('404')
          not_found_count += 1
          consecutive_not_found += 1
        else
          @logger.error "Failed to sync course #{current_id}: #{e.message}"
          error_count += 1
          consecutive_not_found = 0
        end
      end
      
      current_id += 1
    end
    
    @logger.info "Initial sync completed: #{synced_count} courses synced, #{error_count} errors, #{not_found_count} not found"
    { synced: synced_count, errors: error_count, not_found: not_found_count }
  end

  # Update existing courses that need refreshing
  def update_sync
    @logger.info "Starting update sync for courses needing refresh"
    
    courses_to_sync = Course.sync_enabled.needs_sync.limit(BATCH_SIZE)
    synced_count = 0
    error_count = 0
    
    courses_to_sync.find_each do |course|
      begin
        if course.external_id.present?
          course_data = fetch_course_by_id(course.external_id)
          sync_course(course_data, existing_course: course) if course_data
          synced_count += 1
        else
          @logger.warn "Course #{course.id} has no external_id, skipping"
        end
        
        # Rate limiting
        sleep(RATE_LIMIT_DELAY)
        
      rescue => e
        @logger.error "Failed to update course #{course.id}: #{e.message}"
        error_count += 1
      end
    end
    
    @logger.info "Update sync completed: #{synced_count} courses updated, #{error_count} errors"
    { synced: synced_count, errors: error_count }
  end

  # Sync a specific course by external ID
  def sync_course_by_external_id(external_id)
    course_data = fetch_course_by_id(external_id)
    return nil unless course_data
    
    existing_course = Course.find_by(external_id: external_id)
    sync_course(course_data, existing_course: existing_course)
  end

  # Get sync statistics
  def sync_stats
    {
      total_courses: Course.count,
      external_courses: Course.from_external_source('golfcourseapi').count,
      sync_enabled: Course.sync_enabled.count,
      needs_sync: Course.needs_sync.count,
      synced_recently: Course.synced_recently.count,
      never_synced: Course.where(last_synced_at: nil).count
    }
  end

  private

  def http_request(path, params = {})
    require 'net/http'
    require 'json'
    
    # For testing without API key, return mock data
    if @api_key.blank? && Rails.env.development?
      @logger.warn "No API key found, returning mock data for testing"
      return generate_mock_response(path, params)
    end
    
    @circuit_breaker.call do
      uri = @base_uri.dup
      uri.path = "/#{path}".gsub('//', '/')
      
      # Add query parameters
      if params.any?
        uri.query = URI.encode_www_form(params)
      end
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.read_timeout = 30
      http.open_timeout = 10
      
      request = Net::HTTP::Get.new(uri)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Key #{@api_key}" if @api_key.present?
      request['User-Agent'] = 'FairwayAPI/1.0'
      
      begin
        response = http.request(request)
        handle_response(response, uri.to_s)
      rescue Net::TimeoutError, Net::OpenTimeout => e
        error = NetworkError.new("Request timeout: #{e.message}", details: { uri: uri.to_s })
        @error_tracker.record_error(error, { path: path, params: params })
        raise error
      rescue Net::HTTPError, SocketError => e
        error = NetworkError.new("Network error: #{e.message}", details: { uri: uri.to_s })
        @error_tracker.record_error(error, { path: path, params: params })
        raise error
      end
    end
  rescue CircuitBreakerOpenError => e
    @error_tracker.record_error(e, { path: path, params: params })
    raise
  end

  def handle_response(response, uri)
    case response
    when Net::HTTPSuccess
      begin
        JSON.parse(response.body)
      rescue JSON::ParserError => e
        error = DataValidationError.new("Invalid JSON response: #{e.message}", details: { uri: uri })
        @error_tracker.record_error(error)
        raise error
      end
    when Net::HTTPUnauthorized
      error = AuthenticationError.new("Authentication failed", details: { uri: uri })
      @error_tracker.record_error(error)
      raise error
    when Net::HTTPTooManyRequests
      retry_after = response['Retry-After']&.to_i || 60
      error = RateLimitError.new("Rate limit exceeded", details: { uri: uri }, retry_after: retry_after)
      @error_tracker.record_error(error)
      raise error
    when Net::HTTPNotFound
      error = NotFoundError.new("Resource not found", details: { uri: uri })
      @error_tracker.record_error(error)
      raise error
    else
      error = ApiError.new("HTTP #{response.code}: #{response.message}", details: { uri: uri, body: response.body[0..500] })
      @error_tracker.record_error(error)
      raise error
    end
  end

  def generate_mock_response(path, params)
    if path.include?('courses') && !path.include?('/')
      # Mock course list response
      page = params['page'].to_i
      per_page = params['per_page'].to_i
      
      # Generate mock courses
      courses = (1..per_page).map do |i|
        course_num = (page - 1) * per_page + i
        {
          'id' => "mock_#{course_num}",
          'name' => "Mock Golf Course #{course_num}",
          'address' => "#{course_num} Golf Lane",
          'city' => 'Mock City',
          'state' => 'MC',
          'country' => 'US',
          'postal_code' => '12345',
          'latitude' => 40.0 + (course_num * 0.01),
          'longitude' => -74.0 + (course_num * 0.01),
          'phone' => "(555) 123-#{1000 + course_num}",
          'website' => "https://mock-course-#{course_num}.com",
          'course_rating' => 72.0 + (course_num % 5),
          'slope_rating' => 120 + (course_num % 20),
          'par' => 72,
          'total_yardage' => 6500 + (course_num * 10),
          'private' => course_num % 3 == 0
        }
      end
      
      return { 'courses' => courses }
    end
    
    # Default empty response
    {}
  end


  def fetch_course_by_id(course_id)
    retries = 0
    
    begin
      response = http_request("v1/courses/#{course_id}")
      
      # Extract the course data from the nested response
      course_data = response.is_a?(Hash) && response.key?('course') ? response['course'] : response
      
      # Validate course data structure
      validate_course_data(course_data, course_id)
      
      course_data
      
    rescue RateLimitError => e
      @logger.warn "Rate limit hit for course #{course_id}, waiting #{e.retry_after} seconds"
      sleep(e.retry_after || RATE_LIMIT_DELAY)
      retry if retries < MAX_RETRIES
      raise
    rescue NotFoundError => e
      @logger.debug "Course #{course_id} not found in API"
      nil # Return nil for 404s - this is expected behavior
    rescue NetworkError, ApiError => e
      retries += 1
      if retries <= MAX_RETRIES
        wait_time = exponential_backoff(retries)
        @logger.warn "Retrying course fetch for ID #{course_id} (attempt #{retries}/#{MAX_RETRIES}): #{e.message}, waiting #{wait_time}s"
        sleep(wait_time)
        retry
      else
        @logger.error "Failed to fetch course #{course_id} after #{MAX_RETRIES} retries: #{e.message}"
        raise
      end
    rescue => e
      error = ApiError.new("Unexpected error fetching course #{course_id}: #{e.message}")
      @error_tracker.record_error(error, { course_id: course_id, retries: retries })
      raise error
    end
  end

  def parse_courses_response(response)
    # Adjust this based on the actual API response structure
    # This is a generic structure that should be customized
    if response.is_a?(Hash)
      response['courses'] || response['data'] || [response]
    elsif response.is_a?(Array)
      response
    else
      []
    end
  end

  def sync_course(course_data, existing_course: nil, is_initial: false)
    # Transform API data to our schema format
    transformed_data = transform_course_data(course_data)

    if existing_course
      # Update existing course
      existing_course.update_from_external_data!(transformed_data)

      # Sync holes if API provides them
      sync_holes_for_course(existing_course, course_data) if course_data['tees']

      @logger.debug "Updated course: #{existing_course.name}"
      existing_course
    else
      # Check for duplicates before creating new course
      duplicate_course = find_duplicate_course(transformed_data, course_data['id'].to_s)

      if duplicate_course
        @logger.info "Duplicate course found: #{duplicate_course.name} (ID: #{duplicate_course.id}) - skipping #{transformed_data['name']}"
        return duplicate_course
      end

      # Create new course (skip default hole creation callback)
      course = Course.new(transformed_data)
      course.external_source = 'golfcourseapi'
      course.external_id = course_data['id'].to_s
      course.sync_enabled = true
      course.last_synced_at = Time.current

      # Set defaults for required fields if not provided
      course.geofence_radius ||= 500
      course.active = true

      # Skip automatic hole creation since we'll create them from API data
      course.skip_default_holes = true

      course.save!

      # Create holes from API data
      sync_holes_for_course(course, course_data) if course_data['tees']

      @logger.debug "Created course: #{course.name}"
      course
    end
  end

  def find_duplicate_course(transformed_data, external_id)
    # Check by external_id first (most reliable)
    return Course.find_by(external_id: external_id) if external_id
    
    name = transformed_data['name']
    city = transformed_data['city']
    state = transformed_data['state']
    latitude = transformed_data['latitude']
    longitude = transformed_data['longitude']
    
    # Check by exact name and location
    if name.present? && city.present? && state.present?
      exact_match = Course.where(name: name, city: city, state: state).first
      return exact_match if exact_match
    end
    
    # Check by name similarity and proximity (within 1km)
    if name.present? && latitude.present? && longitude.present?
      similar_courses = Course.where("name ILIKE ?", "%#{name.split(' - ').first}%")
                             .where("latitude IS NOT NULL AND longitude IS NOT NULL")
      
      similar_courses.each do |course|
        distance = course.distance_from(latitude.to_f, longitude.to_f)
        if distance && distance < 1000 # Within 1km
          return course
        end
      end
    end
    
    nil # No duplicate found
  end

  def transform_course_data(api_data)
    # Transform the new API data structure to match our Course model
    location = api_data['location'] || {}
    
    # Get the first available tee data for course rating/slope
    tee_data = get_primary_tee_data(api_data)
    
    # Create a smart combined name avoiding duplicates
    club_name = api_data['club_name']&.strip
    course_name = api_data['course_name']&.strip
    
    # If course_name is the same as club_name or very similar, use just one
    final_name = if club_name.blank?
      course_name
    elsif course_name.blank? || course_name == club_name || course_name.downcase.include?(club_name.downcase)
      club_name
    elsif club_name.downcase.include?(course_name.downcase)
      club_name
    else
      "#{club_name} - #{course_name}"
    end
    
    # Expand common golf course abbreviations
    final_name = expand_golf_abbreviations(final_name)
    
    {
      'name' => final_name,
      'address' => location['address'],
      'city' => location['city'],
      'state' => location['state'],
      'country' => location['country'] == 'United States' ? 'US' : location['country'],
      'postal_code' => extract_postal_code(location['address']),
      'latitude' => location['latitude'],
      'longitude' => location['longitude'],
      'course_rating' => tee_data&.dig('course_rating'),
      'slope_rating' => tee_data&.dig('slope_rating'),
      'par' => tee_data&.dig('par_total'),
      'total_yardage' => tee_data&.dig('total_yards'),
      'private_course' => false, # API doesn't specify, default to public
      'description' => final_name
    }.compact # Remove nil values
  end

  def get_primary_tee_data(api_data)
    tees = api_data['tees']
    return nil unless tees
    
    # Prefer male tees, then female tees, then any available
    if tees['male']&.any?
      tees['male'].first
    elsif tees['female']&.any?
      tees['female'].first
    else
      nil
    end
  end

  def extract_postal_code(address)
    return nil unless address
    # Extract postal code from address using regex
    match = address.match(/\b(\d{5}(-\d{4})?)\b/)
    match ? match[1] : nil
  end

  def expand_golf_abbreviations(name)
    return name unless name

    # Define common golf course abbreviations and their expansions
    abbreviations = {
      'Gc' => 'Golf Course',
      'GC' => 'Golf Club',
      'CC' => 'Country Club',
      'Cc' => 'Country Club',
      'G&CC' => 'Golf & Country Club',
      'G&Cc' => 'Golf & Country Club',
      'G & CC' => 'Golf & Country Club',
      'G & Cc' => 'Golf & Country Club',
      'RC' => 'Resort & Club',
      'Rc' => 'Resort & Club',
      'GL' => 'Golf Links',
      'Gl' => 'Golf Links',
      'GR' => 'Golf Resort',
      'Gr' => 'Golf Resort'
    }

    # Apply replacements, being careful with word boundaries
    expanded_name = name
    abbreviations.each do |abbrev, expansion|
      # Match abbreviation at word boundaries or at the end
      expanded_name = expanded_name.gsub(/\b#{Regexp.escape(abbrev)}\b/, expansion)
    end

    expanded_name
  end

  def validate_course_data(course_data, course_id)
    return if course_data.nil? # Allow nil for 404 cases

    unless course_data.is_a?(Hash)
      raise DataValidationError.new("Invalid course data format for course #{course_id}", 
                                   details: { course_id: course_id, data_type: course_data.class })
    end

    # Validate required fields
    required_fields = %w[id]
    missing_fields = required_fields.reject { |field| course_data.key?(field) }
    
    if missing_fields.any?
      raise DataValidationError.new("Missing required fields for course #{course_id}: #{missing_fields.join(', ')}", 
                                   details: { course_id: course_id, missing_fields: missing_fields })
    end
  end

  def sync_holes_for_course(course, course_data)
    tees_data = course_data['tees']
    return unless tees_data

    # Extract all tee sets and build a comprehensive hole data structure
    # We'll create one hole record per hole number with yardages from all tees
    hole_data_by_number = {}

    # Process male tees first (preferred for par and handicap)
    if tees_data['male']&.any?
      primary_tee = tees_data['male'].first
      primary_tee['holes']&.each_with_index do |hole_info, index|
        hole_number = index + 1
        hole_data_by_number[hole_number] = {
          number: hole_number,
          par: hole_info['par'],
          handicap: hole_info['handicap'] || hole_number, # Default to hole number if not provided
          yardages: {}
        }
      end

      # Map yardages from all male tees
      tees_data['male'].each do |tee_set|
        tee_color = map_tee_name_to_color(tee_set['tee_name'])
        tee_set['holes']&.each_with_index do |hole_info, index|
          hole_number = index + 1
          if hole_data_by_number[hole_number]
            hole_data_by_number[hole_number][:yardages][tee_color] = hole_info['yardage']
          end
        end
      end
    end

    # Add female tee yardages
    if tees_data['female']&.any?
      tees_data['female'].each do |tee_set|
        tee_color = map_tee_name_to_color(tee_set['tee_name'])
        tee_set['holes']&.each_with_index do |hole_info, index|
          hole_number = index + 1

          # Initialize if not already created (some courses only have female tees)
          unless hole_data_by_number[hole_number]
            hole_data_by_number[hole_number] = {
              number: hole_number,
              par: hole_info['par'],
              handicap: hole_info['handicap'] || hole_number, # Default to hole number if not provided
              yardages: {}
            }
          end

          hole_data_by_number[hole_number][:yardages][tee_color] = hole_info['yardage']
        end
      end
    end

    # Create or update holes
    hole_data_by_number.each do |hole_number, data|
      hole = course.holes.find_or_initialize_by(number: hole_number)
      hole.par = data[:par]
      hole.handicap = data[:handicap]

      # Set yardages for each tee color
      hole.yardage_black = data[:yardages][:black]
      hole.yardage_blue = data[:yardages][:blue]
      hole.yardage_white = data[:yardages][:white]
      hole.yardage_red = data[:yardages][:red]
      hole.yardage_gold = data[:yardages][:gold]

      hole.save!
    end

    @logger.debug "Synced #{hole_data_by_number.size} holes for #{course.name}"
  end

  def map_tee_name_to_color(tee_name)
    # Map API tee names to our standard colors
    normalized_name = tee_name.to_s.downcase

    return :black if normalized_name.include?('black')
    return :blue if normalized_name.include?('blue')
    return :white if normalized_name.include?('white')
    return :red if normalized_name.include?('red')
    return :gold if normalized_name.include?('gold') || normalized_name.include?('green')

    # Default mapping for unknown tee names
    :white
  end

  def exponential_backoff(attempt)
    [2 ** attempt, 60].min # Cap at 60 seconds
  end

  # Get comprehensive error summary for monitoring
  def error_summary
    @error_tracker.error_summary.merge(
      circuit_breaker_state: @circuit_breaker.state,
      circuit_breaker_failures: @circuit_breaker.failure_count,
      has_critical_errors: @error_tracker.has_critical_errors?
    )
  end
end