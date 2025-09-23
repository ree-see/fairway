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

  # Custom response for throttled requests
  self.throttled_response = lambda do |env|
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
  self.blocked_response = lambda do |env|
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
      Rails.logger.warn "[Rack::Attack] Throttled #{req.ip} for #{req.env['rack.attack.matched']}"
    when :blocklist
      Rails.logger.error "[Rack::Attack] Blocked #{req.ip} for #{req.env['rack.attack.matched']}"
    end
  end
end