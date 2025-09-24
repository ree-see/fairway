class JwtService
  ACCESS_TOKEN_EXPIRY = 15.minutes
  REFRESH_TOKEN_EXPIRY = 7.days
  ALGORITHM = 'HS256'
  
  # Token blacklist for immediate revocation
  BLACKLISTED_TOKENS_KEY = 'blacklisted_tokens'
  
  class << self
    def generate_tokens(user, device_info: nil, ip_address: nil)
      # Generate unique identifiers for both tokens
      access_jti = SecureRandom.uuid
      refresh_jti = SecureRandom.uuid
      
      current_time = Time.current.to_i
      
      access_payload = {
        user_id: user.id,
        type: 'access',
        exp: ACCESS_TOKEN_EXPIRY.from_now.to_i,
        iat: current_time,
        jti: access_jti,
        # Security claims
        aud: 'fairway-mobile', # Audience
        iss: 'fairway-api',    # Issuer
        sub: user.id.to_s      # Subject
      }
      
      refresh_payload = {
        user_id: user.id,
        type: 'refresh',
        exp: REFRESH_TOKEN_EXPIRY.from_now.to_i,
        iat: current_time,
        jti: refresh_jti,
        aud: 'fairway-mobile',
        iss: 'fairway-api',
        sub: user.id.to_s,
        # Additional security info
        device_info: device_info,
        ip_address: ip_address
      }
      
      access_token = JWT.encode(access_payload, secret_key, ALGORITHM)
      refresh_token = JWT.encode(refresh_payload, secret_key, ALGORITHM)
      
      # Store both tokens for revocation capability
      store_refresh_token(user.id, refresh_payload[:jti], refresh_payload[:exp], device_info, ip_address)
      store_access_token_jti(access_jti, access_payload[:exp])
      
      # Update user's last sign-in information
      update_user_sign_in_info(user, ip_address, device_info)
      
      {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: ACCESS_TOKEN_EXPIRY.to_i,
        token_type: 'Bearer'
      }
    end
    
    def decode_token(token, token_type = 'access', verify_claims: true)
      # Check if token is blacklisted
      if blacklisted_token?(token)
        raise JWT::InvalidPayload, "Token has been blacklisted"
      end
      
      decode_options = {
        algorithm: ALGORITHM,
        verify_expiration: true,
        verify_iat: true
      }
      
      if verify_claims
        decode_options.merge!(
          verify_aud: true,
          verify_iss: true,
          aud: 'fairway-mobile',
          iss: 'fairway-api'
        )
      end
      
      decoded_token = JWT.decode(token, secret_key, true, decode_options)
      payload = decoded_token[0]
      
      # Verify token type
      if payload['type'] != token_type
        raise JWT::InvalidPayload, "Invalid token type. Expected #{token_type}, got #{payload['type']}"
      end
      
      # Check if token has JTI (should have for security)
      unless payload['jti']
        raise JWT::InvalidPayload, "Token missing required JTI claim"
      end
      
      # For both token types, check if specifically revoked by JTI
      if token_revoked_by_jti?(payload['jti'])
        raise JWT::InvalidPayload, "Token has been revoked"
      end
      
      # For refresh tokens, additional validation
      if token_type == 'refresh'
        unless valid_refresh_token?(payload['user_id'], payload['jti'])
          raise JWT::InvalidPayload, "Refresh token has been revoked"
        end
      end
      
      payload
    rescue JWT::ExpiredSignature
      raise JWT::ExpiredSignature, "Token has expired"
    rescue JWT::InvalidAudienceError
      raise JWT::DecodeError, "Invalid token audience"
    rescue JWT::InvalidIssuerError  
      raise JWT::DecodeError, "Invalid token issuer"
    rescue JWT::DecodeError => e
      raise JWT::DecodeError, "Invalid token: #{e.message}"
    end
    
    def refresh_access_token(refresh_token)
      refresh_payload = decode_token(refresh_token, 'refresh')
      user = User.find(refresh_payload['user_id'])
      
      # Generate new access token only
      access_payload = {
        user_id: user.id,
        type: 'access',
        exp: ACCESS_TOKEN_EXPIRY.from_now.to_i,
        iat: Time.current.to_i
      }
      
      access_token = JWT.encode(access_payload, secret_key, 'HS256')
      
      {
        access_token: access_token,
        expires_in: ACCESS_TOKEN_EXPIRY.to_i
      }
    end
    
    def revoke_refresh_token(user_id, jti)
      Rails.cache.delete("refresh_token:#{user_id}:#{jti}")
    end
    
    def revoke_all_refresh_tokens(user_id)
      # In production, you'd want to store these in Redis with a pattern
      # For now, we'll use a simple approach
      Rails.cache.delete_matched("refresh_token:#{user_id}:*")
    end
    
    def blacklist_token(token)
      # Extract JTI from token without full validation (for logout)
      begin
        payload = JWT.decode(token, nil, false)[0] # Don't verify signature for blacklisting
        jti = payload['jti']
        exp = payload['exp']
        
        if jti && exp
          # Store in blacklist until expiration
          Rails.cache.write(
            "blacklisted:#{jti}",
            true,
            expires_at: Time.at(exp)
          )
        end
      rescue => e
        # If we can't decode, still add to general blacklist
        Rails.logger.warn "Could not extract JTI for blacklisting: #{e.message}"
      end
      
      # Also add full token to blacklist as backup
      token_hash = Digest::SHA256.hexdigest(token)
      Rails.cache.write(
        "blacklisted_token:#{token_hash}",
        true,
        expires_in: ACCESS_TOKEN_EXPIRY
      )
    end
    
    def blacklisted_token?(token)
      # Check by JTI first (more efficient)
      begin
        payload = JWT.decode(token, nil, false)[0]
        jti = payload['jti']
        return true if jti && Rails.cache.read("blacklisted:#{jti}")
      rescue
        # Ignore decode errors for blacklist check
      end
      
      # Check by full token hash
      token_hash = Digest::SHA256.hexdigest(token)
      Rails.cache.read("blacklisted_token:#{token_hash}") == true
    end
    
    def validate_token_security(token, expected_ip: nil, expected_device: nil)
      payload = decode_token(token, 'refresh', false)
      
      security_issues = []
      
      # Check IP address if provided
      if expected_ip && payload['ip_address'] && payload['ip_address'] != expected_ip
        security_issues << "IP address mismatch"
      end
      
      # Check device info if provided
      if expected_device && payload['device_info'] && payload['device_info'] != expected_device
        security_issues << "Device mismatch"
      end
      
      # Check token age (flag very old tokens)
      token_age = Time.current.to_i - payload['iat']
      if token_age > REFRESH_TOKEN_EXPIRY.to_i * 0.8 # 80% of max age
        security_issues << "Token approaching expiration"
      end
      
      {
        valid: security_issues.empty?,
        issues: security_issues,
        payload: payload
      }
    end
    
    def get_user_active_sessions(user_id)
      # This would be more sophisticated in production with Redis
      # For now, return basic info
      refresh_tokens = Rails.cache.read("user_sessions:#{user_id}") || []
      
      refresh_tokens.map do |token_info|
        {
          jti: token_info[:jti],
          device_info: token_info[:device_info],
          ip_address: token_info[:ip_address],
          created_at: token_info[:created_at],
          last_used: token_info[:last_used]
        }
      end
    end
    
    def revoke_user_session(user_id, jti)
      revoke_refresh_token(user_id, jti)
      
      # Also revoke any associated access tokens
      Rails.cache.write(
        "revoked_session:#{user_id}:#{jti}",
        true,
        expires_in: ACCESS_TOKEN_EXPIRY
      )
    end
    
    private
    
    def secret_key
      Rails.application.secret_key_base
    end
    
    def store_refresh_token(user_id, jti, expiry, device_info, ip_address)
      # Store in cache with expiration
      Rails.cache.write(
        "refresh_token:#{user_id}:#{jti}", 
        {
          active: true,
          device_info: device_info,
          ip_address: ip_address,
          created_at: Time.current
        }, 
        expires_at: Time.at(expiry)
      )
      
      # Also maintain user session list
      update_user_sessions(user_id, jti, device_info, ip_address)
    end
    
    def store_access_token_jti(jti, expiry)
      # Store access token JTI for revocation capability
      Rails.cache.write(
        "access_token_jti:#{jti}",
        true,
        expires_at: Time.at(expiry)
      )
    end
    
    def token_revoked_by_jti?(jti)
      # Check if specific token JTI has been revoked
      Rails.cache.read("blacklisted:#{jti}") == true
    end
    
    def valid_refresh_token?(user_id, jti)
      token_data = Rails.cache.read("refresh_token:#{user_id}:#{jti}")
      token_data.is_a?(Hash) && token_data[:active] == true
    end
    
    def update_user_sign_in_info(user, ip_address, device_info)
      user.update!(
        last_sign_in_at: Time.current,
        last_sign_in_ip: ip_address,
        sign_in_count: (user.sign_in_count || 0) + 1
      )
    rescue => e
      Rails.logger.error "Failed to update user sign-in info: #{e.message}"
    end
    
    def update_user_sessions(user_id, jti, device_info, ip_address)
      sessions = Rails.cache.read("user_sessions:#{user_id}") || []
      
      # Add new session
      sessions << {
        jti: jti,
        device_info: device_info,
        ip_address: ip_address,
        created_at: Time.current,
        last_used: Time.current
      }
      
      # Keep only last 10 sessions
      sessions = sessions.last(10)
      
      Rails.cache.write(
        "user_sessions:#{user_id}",
        sessions,
        expires_in: REFRESH_TOKEN_EXPIRY
      )
    end
  end
end