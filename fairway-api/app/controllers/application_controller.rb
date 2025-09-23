class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods
  
  before_action :authenticate_user!, except: [:health_check]
  
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from JWT::DecodeError, with: :invalid_token
  
  attr_reader :current_user

  private

  def authenticate_user!
    token = extract_token
    return unauthorized_response unless token

    begin
      decoded_token = JWT.decode(token, Rails.application.secret_key_base, true, { algorithm: 'HS256' })
      user_id = decoded_token[0]['user_id']
      @current_user = User.find(user_id)
    rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
      unauthorized_response
    end
  end

  def extract_token
    authenticate_with_http_token do |token, _options|
      token
    end
  end

  def generate_jwt_token(user)
    payload = {
      user_id: user.id,
      exp: 30.days.from_now.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
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

  def health_check
    render_success({ status: "ok", timestamp: Time.current })
  end
end
