module ErrorHandler
  extend ActiveSupport::Concern

  included do
    # Custom application errors (most specific first)
    rescue_from ApplicationError, with: :handle_application_error
    rescue_from AuthenticationError, with: :handle_authentication_error
    rescue_from AuthorizationError, with: :handle_authorization_error
    rescue_from ValidationError, with: :handle_validation_error
    rescue_from ResourceNotFoundError, with: :handle_resource_not_found
    rescue_from ResourceConflictError, with: :handle_resource_conflict
    rescue_from LocationError, with: :handle_location_error
    rescue_from VerificationError, with: :handle_verification_error
    rescue_from ExternalServiceError, with: :handle_external_service_error
    rescue_from RateLimitError, with: :handle_rate_limit_error
    rescue_from SubscriptionError, with: :handle_subscription_error

    # Rails framework errors
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_active_record_validation_error
    rescue_from ActiveRecord::RecordNotUnique, with: :handle_duplicate_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from Pundit::NotAuthorizedError, with: :handle_pundit_authorization_error

    # JWT errors
    rescue_from JWT::DecodeError, with: :handle_jwt_error
    rescue_from JWT::ExpiredSignature, with: :handle_jwt_expired

    # Generic errors (least specific)
    rescue_from ArgumentError, with: :handle_argument_error
    rescue_from StandardError, with: :handle_standard_error
  end

  private

  # Custom application error handlers
  def handle_application_error(exception)
    log_error(exception, level: :error)
    render json: exception.to_hash, status: exception.status
  end

  def handle_authentication_error(exception)
    log_error(exception, level: :warn)
    render json: exception.to_hash, status: exception.status
  end

  def handle_authorization_error(exception)
    log_error(exception, level: :warn)
    render json: exception.to_hash, status: exception.status
  end

  def handle_validation_error(exception)
    log_error(exception, level: :info)
    render json: exception.to_hash, status: exception.status
  end

  def handle_resource_not_found(exception)
    log_error(exception, level: :info)
    render json: exception.to_hash, status: exception.status
  end

  def handle_resource_conflict(exception)
    log_error(exception, level: :info)
    render json: exception.to_hash, status: exception.status
  end

  def handle_location_error(exception)
    log_error(exception, level: :warn)
    render json: exception.to_hash, status: exception.status
  end

  def handle_verification_error(exception)
    log_error(exception, level: :warn)
    render json: exception.to_hash, status: exception.status
  end

  def handle_external_service_error(exception)
    log_error(exception, level: :error)
    render json: exception.to_hash, status: exception.status
  end

  def handle_rate_limit_error(exception)
    log_error(exception, level: :warn)
    render json: exception.to_hash, status: exception.status
  end

  def handle_subscription_error(exception)
    log_error(exception, level: :info)
    render json: exception.to_hash, status: exception.status
  end

  # Rails framework error handlers
  def handle_pundit_authorization_error(exception)
    log_error(exception, level: :warn)
    
    render_error(
      status: :forbidden,
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to perform this action',
      details: nil
    )
  end

  def handle_active_record_validation_error(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :unprocessable_entity,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        errors: format_validation_errors(exception.record.errors)
      }
    )
  end

  def handle_standard_error(exception)
    log_error(exception)
    
    if Rails.env.production?
      render_error(
        status: :internal_server_error,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: nil
      )
    else
      render_error(
        status: :internal_server_error,
        code: 'INTERNAL_ERROR',
        message: exception.message,
        details: {
          backtrace: exception.backtrace&.first(10)
        }
      )
    end
  end

  def handle_not_found(exception)
    log_error(exception, level: :warn)
    
    render_error(
      status: :not_found,
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource was not found',
      details: nil
    )
  end

  def handle_validation_error(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :unprocessable_entity,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        errors: format_validation_errors(exception.record.errors)
      }
    )
  end

  def handle_duplicate_error(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :conflict,
      code: 'DUPLICATE_RESOURCE',
      message: 'A resource with these attributes already exists',
      details: nil
    )
  end

  def handle_parameter_missing(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :bad_request,
      code: 'MISSING_PARAMETER',
      message: "Required parameter missing: #{exception.param}",
      details: {
        parameter: exception.param
      }
    )
  end

  def handle_authorization_error(exception)
    log_error(exception, level: :warn)
    
    render_error(
      status: :forbidden,
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to perform this action',
      details: nil
    )
  end

  def handle_jwt_error(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :unauthorized,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
      details: nil
    )
  end

  def handle_jwt_expired(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :unauthorized,
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      details: {
        expired_at: exception.payload['exp']
      }
    )
  end

  def handle_argument_error(exception)
    log_error(exception, level: :info)
    
    render_error(
      status: :bad_request,
      code: 'INVALID_ARGUMENT',
      message: 'Invalid argument provided',
      details: {
        message: exception.message
      }
    )
  end

  def render_error(status:, code:, message:, details: nil)
    error_response = {
      error: {
        code: code,
        message: message,
        timestamp: Time.current.iso8601,
        request_id: request.uuid
      }
    }

    error_response[:error][:details] = details if details.present?

    render json: error_response, status: status
  end

  def log_error(exception, level: :error)
    logger.send(level) do
      {
        error_class: exception.class.name,
        error_message: exception.message,
        request_id: request&.uuid,
        request_path: request&.path,
        request_method: request&.method,
        user_id: current_user&.id,
        backtrace: exception.backtrace&.first(5)
      }.to_json
    end
  end

  def format_validation_errors(errors)
    errors.details.transform_values do |error_details|
      error_details.map do |detail|
        {
          error: detail[:error],
          message: errors.generate_message(detail[:attribute], detail[:error], detail.except(:attribute, :error))
        }
      end
    end
  end
end