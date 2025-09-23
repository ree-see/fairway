class JwtService
  ACCESS_TOKEN_EXPIRY = 15.minutes
  REFRESH_TOKEN_EXPIRY = 7.days
  
  class << self
    def generate_tokens(user)
      access_payload = {
        user_id: user.id,
        type: 'access',
        exp: ACCESS_TOKEN_EXPIRY.from_now.to_i,
        iat: Time.current.to_i
      }
      
      refresh_payload = {
        user_id: user.id,
        type: 'refresh',
        exp: REFRESH_TOKEN_EXPIRY.from_now.to_i,
        iat: Time.current.to_i,
        jti: SecureRandom.uuid # Unique identifier for refresh token
      }
      
      access_token = JWT.encode(access_payload, secret_key, 'HS256')
      refresh_token = JWT.encode(refresh_payload, secret_key, 'HS256')
      
      # Store refresh token in database for revocation capability
      store_refresh_token(user.id, refresh_payload[:jti], refresh_payload[:exp])
      
      {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: ACCESS_TOKEN_EXPIRY.to_i
      }
    end
    
    def decode_token(token, token_type = 'access')
      decoded_token = JWT.decode(token, secret_key, true, { algorithm: 'HS256' })
      payload = decoded_token[0]
      
      # Verify token type
      if payload['type'] != token_type
        raise JWT::InvalidPayload, "Invalid token type. Expected #{token_type}, got #{payload['type']}"
      end
      
      # For refresh tokens, verify it's not revoked
      if token_type == 'refresh'
        unless valid_refresh_token?(payload['user_id'], payload['jti'])
          raise JWT::InvalidPayload, "Refresh token has been revoked"
        end
      end
      
      payload
    rescue JWT::ExpiredSignature
      raise JWT::ExpiredSignature, "Token has expired"
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
    
    private
    
    def secret_key
      Rails.application.secret_key_base
    end
    
    def store_refresh_token(user_id, jti, expiry)
      # Store in cache with expiration
      Rails.cache.write(
        "refresh_token:#{user_id}:#{jti}", 
        true, 
        expires_at: Time.at(expiry)
      )
    end
    
    def valid_refresh_token?(user_id, jti)
      Rails.cache.read("refresh_token:#{user_id}:#{jti}") == true
    end
  end
end