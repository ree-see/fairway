class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods
  include ApiValidation
  
  # No global authentication - each controller defines its own
  
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from JWT::DecodeError, with: :invalid_token
  rescue_from ActionController::ParameterMissing, with: :parameter_missing
  
  attr_reader :current_user

  private

  def authenticate_user!
    token = extract_token
    return unauthorized_response unless token

    begin
      payload = JwtService.decode_token(token, 'access')
      @current_user = User.find(payload['user_id'])
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::InvalidPayload, ActiveRecord::RecordNotFound => e
      Rails.logger.warn "Authentication failed: #{e.message}"
      unauthorized_response
    end
  end

  def extract_token
    authenticate_with_http_token do |token, _options|
      token
    end
  end

  def generate_jwt_tokens(user)
    JwtService.generate_tokens(user)
  end

  # Legacy method for backward compatibility
  def generate_jwt_token(user)
    tokens = generate_jwt_tokens(user)
    tokens[:access_token]
  end

  def render_success(data = nil, message = nil, status = :ok)
    response_data = { success: true }
    response_data[:data] = data if data
    response_data[:message] = message if message
    
    render json: response_data, status: status
  end

  def render_error(message, status = :unprocessable_entity, errors = nil)
    response_data = { 
      success: false, 
      error: message 
    }
    response_data[:errors] = errors if errors
    
    render json: response_data, status: status
  end

  def record_not_found(exception)
    render_error("Record not found: #{exception.message}", :not_found)
  end

  def record_invalid(exception)
    render_error(
      "Validation failed", 
      :unprocessable_entity, 
      exception.record.errors.full_messages
    )
  end

  def unauthorized_response
    render_error("Unauthorized", :unauthorized)
  end

  def invalid_token
    render_error("Invalid or expired token", :unauthorized)
  end
  
  def parameter_missing(exception)
    render_error(exception.message, :bad_request)
  end

  def health_check
    render_success({ status: "ok", timestamp: Time.current })
  end
end
