require 'test_helper'

class CoursesSyncServiceTest < ActiveSupport::TestCase
  def setup
    @service = CoursesSyncService.new(api_key: 'test_api_key')
    @sample_api_response = {
      'id' => '12345',
      'club_name' => 'Pine Valley',
      'course_name' => 'Championship Course',
      'location' => {
        'address' => '123 Golf Lane',
        'city' => 'Pine Valley',
        'state' => 'NJ',
        'country' => 'United States',
        'latitude' => 39.7767,
        'longitude' => -74.9581
      },
      'tees' => {
        'male' => [{
          'course_rating' => 74.3,
          'slope_rating' => 155,
          'par_total' => 70,
          'total_yards' => 6765
        }]
      }
    }
    
    # Stub API calls
    stub_request(:any, /api.golfcourseapi.com/).
      to_return(status: 200, body: { course: @sample_api_response }.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  test "transform_course_data maps API data to Course attributes correctly" do
    transformed = @service.send(:transform_course_data, @sample_api_response)
    
    assert_equal 'Pine Valley - Championship Course', transformed['name']
    assert_equal '123 Golf Lane', transformed['address']
    assert_equal 'Pine Valley', transformed['city']
    assert_equal 'NJ', transformed['state']
    assert_equal 'US', transformed['country']
    assert_equal 39.7767, transformed['latitude']
    assert_equal -74.9581, transformed['longitude']
    assert_equal 74.3, transformed['course_rating']
    assert_equal 155, transformed['slope_rating']
    assert_equal 70, transformed['par']
    assert_equal 6765, transformed['total_yardage']
  end
  
  test "expand_golf_abbreviations expands common abbreviations" do
    test_cases = {
      'Pebble Beach Gc' => 'Pebble Beach Golf Course',
      'Augusta National GC' => 'Augusta National Golf Club',
      'Country Club CC' => 'Country Club Country Club',
      'Pine Valley G&CC' => 'Pine Valley Golf & Country Club',
      'Desert Mountain GL' => 'Desert Mountain Golf Links',
      'Bandon Dunes GR' => 'Bandon Dunes Golf Resort'
    }
    
    test_cases.each do |input, expected|
      result = @service.send(:expand_golf_abbreviations, input)
      assert_equal expected, result, "Failed to expand '#{input}'"
    end
  end
  
  test "find_duplicate_course detects duplicates by external_id" do
    existing = Course.create!(
      name: 'Existing Course',
      external_id: '12345',
      external_source: 'golfcourseapi',
      latitude: 40.0,
      longitude: -75.0
    )
    
    duplicate = @service.send(:find_duplicate_course, { 'name' => 'New Name' }, '12345')
    assert_equal existing.id, duplicate.id
  end
  
  test "find_duplicate_course detects duplicates by location" do
    existing = Course.create!(
      name: 'Pine Valley Golf Course',
      city: 'Pine Valley',
      state: 'NJ',
      latitude: 40.0,
      longitude: -75.0
    )
    
    duplicate = @service.send(:find_duplicate_course, {
      'name' => 'Pine Valley Golf Course',
      'city' => 'Pine Valley',
      'state' => 'NJ'
    }, nil)
    assert_equal existing.id, duplicate.id
  end
  
  test "extract_postal_code extracts various postal code formats" do
    test_cases = {
      '123 Main St, City, ST 12345' => '12345',
      '456 Oak Ave, City, ST 12345-6789' => '12345-6789',
      'No postal code here' => nil
    }
    
    test_cases.each do |input, expected|
      result = @service.send(:extract_postal_code, input)
      assert_equal expected, result, "Failed to extract from '#{input}'"
    end
  end

  test "sync_course creates new course when none exists" do
    assert_difference 'Course.count', 1 do
      course = @service.send(:sync_course, @sample_api_response)
      
      assert_equal 'Pine Valley Golf Club', course.name
      assert_equal 'golfcourseapi', course.external_source
      assert_equal '12345', course.external_id
      assert course.sync_enabled?
      assert_not_nil course.last_synced_at
    end
  end

  test "sync_course updates existing course" do
    # Create existing course
    existing_course = Course.create!(
      name: 'Old Name',
      latitude: 40.0,
      longitude: -75.0,
      external_id: '12345',
      external_source: 'golfcourseapi',
      sync_enabled: true
    )

    assert_no_difference 'Course.count' do
      updated_course = @service.send(:sync_course, @sample_api_response, existing_course: existing_course)
      
      assert_equal existing_course.id, updated_course.id
      assert_equal 'Pine Valley Golf Club', updated_course.name
      assert_equal 39.7767, updated_course.latitude.to_f
      assert_not_nil updated_course.last_synced_at
    end
  end

  test "sync_stats returns correct statistics" do
    # Create test data
    Course.create!(name: 'Course 1', latitude: 40.0, longitude: -75.0, external_source: 'golfcourseapi', sync_enabled: true)
    Course.create!(name: 'Course 2', latitude: 40.1, longitude: -75.1, external_source: 'golfcourseapi', sync_enabled: false)
    Course.create!(name: 'Course 3', latitude: 40.2, longitude: -75.2) # Manual course
    Course.create!(name: 'Course 4', latitude: 40.3, longitude: -75.3, external_source: 'golfcourseapi', sync_enabled: true, last_synced_at: 2.weeks.ago)

    stats = @service.sync_stats

    assert_equal 4, stats[:total_courses]
    assert_equal 3, stats[:external_courses]
    assert_equal 2, stats[:sync_enabled]
    assert_equal 1, stats[:needs_sync]
    assert_equal 0, stats[:synced_recently]
    assert_equal 1, stats[:never_synced]
  end

  test "parse_courses_response handles different response formats" do
    # Hash with courses array
    hash_response = { 'courses' => [@sample_api_response] }
    result = @service.send(:parse_courses_response, hash_response)
    assert_equal [@sample_api_response], result

    # Hash with data array  
    data_response = { 'data' => [@sample_api_response] }
    result = @service.send(:parse_courses_response, data_response)
    assert_equal [@sample_api_response], result

    # Single hash
    result = @service.send(:parse_courses_response, @sample_api_response)
    assert_equal [@sample_api_response], result

    # Direct array
    array_response = [@sample_api_response]
    result = @service.send(:parse_courses_response, array_response)
    assert_equal [@sample_api_response], result

    # Empty or invalid response
    result = @service.send(:parse_courses_response, nil)
    assert_equal [], result

    result = @service.send(:parse_courses_response, "invalid")
    assert_equal [], result
  end
  
  test "initial_sync handles API errors gracefully" do
    stub_request(:get, /api.golfcourseapi.com/).
      to_return(status: 500, body: 'Internal Server Error')
    
    result = @service.initial_sync(limit: 1, start_id: 5000)
    
    assert_not_nil result
    assert_equal 0, result[:synced]
    assert result[:errors] > 0
  end
  
  test "sync_course_by_external_id handles 404 responses" do
    stub_request(:get, /api.golfcourseapi.com.*99999/).
      to_return(status: 404, body: 'Not Found')
    
    course = @service.sync_course_by_external_id('99999')
    assert_nil course
  end
  
  test "update_sync respects rate limits" do
    Course.create!(
      name: 'Test Course 1',
      external_id: '1001',
      external_source: 'golfcourseapi',
      sync_enabled: true,
      last_synced_at: 2.weeks.ago,
      latitude: 40.0,
      longitude: -75.0
    )
    
    start_time = Time.current
    result = @service.update_sync
    duration = Time.current - start_time
    
    # Should have rate limit delay
    assert duration >= 1.second
    assert_not_nil result
  end
  
  test "get_primary_tee_data prioritizes male tees" do
    api_data_with_tees = {
      'tees' => {
        'male' => [{ 'course_rating' => 72.5, 'slope_rating' => 130 }],
        'female' => [{ 'course_rating' => 74.0, 'slope_rating' => 125 }]
      }
    }
    
    tee_data = @service.send(:get_primary_tee_data, api_data_with_tees)
    assert_equal 72.5, tee_data['course_rating']
    assert_equal 130, tee_data['slope_rating']
  end
  
  test "get_primary_tee_data falls back to female tees" do
    api_data_with_tees = {
      'tees' => {
        'female' => [{ 'course_rating' => 74.0, 'slope_rating' => 125 }]
      }
    }
    
    tee_data = @service.send(:get_primary_tee_data, api_data_with_tees)
    assert_equal 74.0, tee_data['course_rating']
    assert_equal 125, tee_data['slope_rating']
  end
  
  test "handles missing API key in development" do
    service = CoursesSyncService.new(api_key: nil)
    # In development without API key, should return mock data
    if Rails.env.development?
      result = service.send(:http_request, 'v1/courses/mock_1')
      assert_not_nil result
    end
  end
end