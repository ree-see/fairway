class Rack::Attack
  # Configure Redis (if available) or memory store for rate limiting
  if Rails.env.production?
    Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'))
  else
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  # Throttle login attempts for a given email
  throttle('login_attempts_per_email', limit: 5, period: 15.minutes) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      req.params['email']&.downcase&.strip
    end
  end

  # Throttle registration attempts per IP
  throttle('registration_attempts_per_ip', limit: 3, period: 1.hour) do |req|
    if req.path == '/api/v1/auth/register' && req.post?
      req.ip
    end
  end

  # Throttle password change attempts per user
  throttle('password_change_attempts', limit: 3, period: 30.minutes) do |req|
    if req.path == '/api/v1/auth/change_password' && req.post?
      # Extract user ID from JWT token
      token = req.env['HTTP_AUTHORIZATION']&.split(' ')&.last
      if token
        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base, true, { algorithm: 'HS256' })
          decoded[0]['user_id']
        rescue JWT::DecodeError
          nil
        end
      end
    end
  end

  # Throttle general API requests per IP
  throttle('api_requests_per_ip', limit: 300, period: 5.minutes) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Throttle round submission to prevent abuse
  throttle('round_submissions_per_user', limit: 10, period: 1.day) do |req|
    if req.path.match?(/\/api\/v1\/rounds$/) && req.post?
      token = req.env['HTTP_AUTHORIZATION']&.split(' ')&.last
      if token
        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base, true, { algorithm: 'HS256' })
          decoded[0]['user_id']
        rescue JWT::DecodeError
          nil
        end
      end
    end
  end

  # Block suspicious IPs (this would be configured based on monitoring)
  blocklist('block_suspicious_ips') do |req|
    # Example: Block known malicious IPs
    ['192.168.1.100', '10.0.0.50'].include?(req.ip)
  end

  # Allow local development and testing
  safelist('allow_local') do |req|
    ['127.0.0.1', '::1', 'localhost'].include?(req.ip) && Rails.env.development?
  end

  # Golf-specific protections
  # Prevent rapid course searches (potential scraping)
  throttle('course_searches_per_ip', limit: 100, period: 10.minutes) do |req|
    req.ip if req.path.start_with?('/api/v1/courses')
  end

  # Prevent GPS location verification abuse
  throttle('location_verifications_per_ip', limit: 50, period: 5.minutes) do |req|
    if req.path == '/api/v1/courses/verify_location' && req.post?
      req.ip
    end
  end

  # Prevent handicap calculation abuse
  throttle('handicap_calculations_per_user', limit: 20, period: 1.hour) do |req|
    if req.path.match?(/\/api\/v1\/users\/.*\/handicap/) && req.get?
      extract_user_id_from_token(req)
    end
  end

  # Protect course synchronization endpoints (admin only)
  throttle('course_sync_per_ip', limit: 10, period: 1.hour) do |req|
    req.ip if req.path.start_with?('/api/v1/admin/courses/sync')
  end

  # Prevent score manipulation attempts
  throttle('hole_scores_per_user', limit: 200, period: 1.day) do |req|
    if req.path.match?(/\/api\/v1\/rounds\/.*\/hole_scores/) && req.post?
      extract_user_id_from_token(req)
    end
  end

  # Prevent attestation spam
  throttle('attestations_per_user', limit: 50, period: 1.day) do |req|
    if req.path.match?(/\/api\/v1\/rounds\/.*\/request_attestation/) && req.post?
      extract_user_id_from_token(req)
    end
  end

  # Rate limit by authenticated user for general API usage
  throttle('authenticated_user_requests', limit: 1000, period: 1.hour) do |req|
    if req.path.start_with?('/api/v1/') && req.env['HTTP_AUTHORIZATION']
      extract_user_id_from_token(req)
    end
  end

  # Stricter limits for unregistered users
  throttle('unauthenticated_requests_per_ip', limit: 60, period: 1.hour) do |req|
    if req.path.start_with?('/api/v1/') && !req.env['HTTP_AUTHORIZATION']
      req.ip
    end
  end

  # Geographic-based limiting (example)
  throttle('requests_per_country', limit: 10000, period: 1.hour) do |req|
    # This would require a GeoIP service
    # country_code = GeoIP.country(req.ip)
    # "#{country_code}" if country_code
  end

  # Progressive rate limiting - stricter for repeated violations
  throttle('progressive_limit_violation', limit: 5, period: 1.hour) do |req|
    violations_key = "violations:#{req.ip}"
    violations = Rack::Attack.cache.read(violations_key) || 0
    
    if violations > 0
      # Exponentially decrease allowed requests based on previous violations
      adjusted_limit = [100 / (2 ** violations), 10].max
      req.ip if violations >= 3 # Only apply to repeat offenders
    end
  end

  # Custom response for throttled requests
  self.throttled_responder = lambda do |env|
    match_data = env['rack.attack.match_data']
    now = match_data[:epoch_time]
    headers = {
      'RateLimit-Limit' => match_data[:limit].to_s,
      'RateLimit-Remaining' => '0',
      'RateLimit-Reset' => (now + (match_data[:period] - now % match_data[:period])).to_s,
      'Content-Type' => 'application/json'
    }

    response_body = {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retry_after: match_data[:period] - (now % match_data[:period])
    }.to_json

    [429, headers, [response_body]]
  end

  # Custom response for blocked requests
  self.blocklisted_responder = lambda do |env|
    [403, { 'Content-Type' => 'application/json' }, [{
      success: false,
      error: 'Access forbidden'
    }.to_json]]
  end

  # Track and log attacks
  ActiveSupport::Notifications.subscribe('rack.attack') do |name, start, finish, request_id, payload|
    req = payload[:request]
    
    case req.env['rack.attack.match_type']
    when :throttle
      Rails.logger.warn({
        event: 'rate_limit_triggered',
        ip: req.ip,
        path: req.path,
        matched_rule: req.env['rack.attack.matched'],
        user_agent: req.user_agent,
        timestamp: Time.current.iso8601
      }.to_json)
      
      # Track violations for progressive limiting
      violations_key = "violations:#{req.ip}"
      violations = Rack::Attack.cache.read(violations_key) || 0
      Rack::Attack.cache.write(violations_key, violations + 1, expires_in: 24.hours)
      
    when :blocklist
      Rails.logger.error({
        event: 'request_blocked',
        ip: req.ip,
        path: req.path,
        matched_rule: req.env['rack.attack.matched'],
        user_agent: req.user_agent,
        timestamp: Time.current.iso8601
      }.to_json)
    end
  end

  # Helper method to extract user ID from JWT token
  def self.extract_user_id_from_token(req)
    token = req.env['HTTP_AUTHORIZATION']&.split(' ')&.last
    return nil unless token
    
    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base, true, { algorithm: 'HS256' })
      decoded[0]['user_id']
    rescue JWT::DecodeError
      nil
    end
  end

  # Conditional rate limiting based on user trust score
  throttle('untrusted_user_requests', limit: 100, period: 1.hour) do |req|
    if req.path.start_with?('/api/v1/') && req.env['HTTP_AUTHORIZATION']
      user_id = extract_user_id_from_token(req)
      if user_id
        user = User.find_by(id: user_id)
        # Apply stricter limits to new or untrusted users
        if user&.created_at&.> 7.days.ago || (user&.verified_rounds&.< 5)
          user_id
        end
      end
    end
  end

  # Protect sensitive endpoints with stricter limits
  throttle('sensitive_endpoint_access', limit: 10, period: 1.hour) do |req|
    sensitive_paths = [
      '/api/v1/auth/change_password',
      '/api/v1/auth/reset_password',
      '/api/v1/users/delete_account',
      '/api/v1/admin'
    ]
    
    if sensitive_paths.any? { |path| req.path.start_with?(path) }
      req.ip
    end
  end
end