class ApplicationError < StandardError
  attr_reader :code, :status, :details

  def initialize(message = nil, code: nil, status: :internal_server_error, details: nil)
    super(message)
    @code = code || self.class.name.demodulize.underscore.upcase
    @status = status
    @details = details
  end

  def to_hash
    {
      error: {
        code: code,
        message: message,
        status: status,
        details: details,
        timestamp: Time.current.iso8601
      }.compact
    }
  end
end

# Authentication and Authorization Errors
class AuthenticationError < ApplicationError
  def initialize(message = 'Authentication failed', **kwargs)
    super(message, status: :unauthorized, **kwargs)
  end
end

class AuthorizationError < ApplicationError
  def initialize(message = 'Access denied', **kwargs)
    super(message, status: :forbidden, **kwargs)
  end
end

class TokenExpiredError < AuthenticationError
  def initialize(message = 'Token has expired', **kwargs)
    super(message, code: 'TOKEN_EXPIRED', **kwargs)
  end
end

class InvalidTokenError < AuthenticationError
  def initialize(message = 'Invalid token provided', **kwargs)
    super(message, code: 'INVALID_TOKEN', **kwargs)
  end
end

# Validation and Input Errors
class ValidationError < ApplicationError
  def initialize(message = 'Validation failed', **kwargs)
    super(message, status: :unprocessable_entity, **kwargs)
  end
end

class InvalidParameterError < ApplicationError
  def initialize(message = 'Invalid parameter provided', **kwargs)
    super(message, status: :bad_request, **kwargs)
  end
end

class MissingParameterError < ApplicationError
  def initialize(parameter_name, **kwargs)
    message = "Required parameter missing: #{parameter_name}"
    super(message, status: :bad_request, code: 'MISSING_PARAMETER', **kwargs)
  end
end

# Resource Errors
class ResourceNotFoundError < ApplicationError
  def initialize(resource = 'Resource', **kwargs)
    message = "#{resource} not found"
    super(message, status: :not_found, code: 'RESOURCE_NOT_FOUND', **kwargs)
  end
end

class ResourceConflictError < ApplicationError
  def initialize(message = 'Resource conflict', **kwargs)
    super(message, status: :conflict, code: 'RESOURCE_CONFLICT', **kwargs)
  end
end

class DuplicateResourceError < ResourceConflictError
  def initialize(message = 'Resource already exists', **kwargs)
    super(message, code: 'DUPLICATE_RESOURCE', **kwargs)
  end
end

# Business Logic Errors
class HandicapCalculationError < ApplicationError
  def initialize(message = 'Unable to calculate handicap', **kwargs)
    super(message, status: :unprocessable_entity, code: 'HANDICAP_CALCULATION_ERROR', **kwargs)
  end
end

class InsufficientRoundsError < HandicapCalculationError
  def initialize(required_rounds = 5, **kwargs)
    message = "Insufficient rounds for handicap calculation. Need at least #{required_rounds} rounds."
    super(message, code: 'INSUFFICIENT_ROUNDS', details: { required_rounds: required_rounds }, **kwargs)
  end
end

class CourseNotFoundError < ResourceNotFoundError
  def initialize(**kwargs)
    super('Course', **kwargs)
  end
end

class RoundNotFoundError < ResourceNotFoundError
  def initialize(**kwargs)
    super('Round', **kwargs)
  end
end

class UserNotFoundError < ResourceNotFoundError
  def initialize(**kwargs)
    super('User', **kwargs)
  end
end

# GPS and Location Errors
class LocationError < ApplicationError
  def initialize(message = 'Location error', **kwargs)
    super(message, status: :unprocessable_entity, **kwargs)
  end
end

class GeofenceViolationError < LocationError
  def initialize(message = 'Location is outside course boundaries', **kwargs)
    super(message, code: 'GEOFENCE_VIOLATION', **kwargs)
  end
end

class InvalidCoordinatesError < LocationError
  def initialize(message = 'Invalid GPS coordinates provided', **kwargs)
    super(message, code: 'INVALID_COORDINATES', **kwargs)
  end
end

# Verification and Fraud Errors
class VerificationError < ApplicationError
  def initialize(message = 'Verification failed', **kwargs)
    super(message, status: :unprocessable_entity, **kwargs)
  end
end

class AttestationError < VerificationError
  def initialize(message = 'Attestation error', **kwargs)
    super(message, code: 'ATTESTATION_ERROR', **kwargs)
  end
end

class FraudDetectionError < VerificationError
  def initialize(message = 'Fraudulent activity detected', **kwargs)
    super(message, code: 'FRAUD_DETECTED', **kwargs)
  end
end

class HighRiskScoreError < FraudDetectionError
  def initialize(risk_score, **kwargs)
    message = "Round flagged for high fraud risk (score: #{risk_score})"
    super(message, details: { risk_score: risk_score }, **kwargs)
  end
end

# External Service Errors
class ExternalServiceError < ApplicationError
  def initialize(service_name, message = 'External service error', **kwargs)
    super(message, status: :service_unavailable, code: 'EXTERNAL_SERVICE_ERROR', 
          details: { service: service_name }, **kwargs)
  end
end

class CourseApiError < ExternalServiceError
  def initialize(message = 'Course API unavailable', **kwargs)
    super('Course API', message, **kwargs)
  end
end

class PaymentServiceError < ExternalServiceError
  def initialize(message = 'Payment processing failed', **kwargs)
    super('Payment Service', message, **kwargs)
  end
end

# Rate Limiting Errors
class RateLimitError < ApplicationError
  def initialize(message = 'Rate limit exceeded', **kwargs)
    super(message, status: :too_many_requests, code: 'RATE_LIMIT_EXCEEDED', **kwargs)
  end
end

# Subscription and Payment Errors
class SubscriptionError < ApplicationError
  def initialize(message = 'Subscription error', **kwargs)
    super(message, status: :payment_required, **kwargs)
  end
end

class SubscriptionRequiredError < SubscriptionError
  def initialize(feature = 'feature', **kwargs)
    message = "Premium subscription required to access #{feature}"
    super(message, code: 'SUBSCRIPTION_REQUIRED', details: { feature: feature }, **kwargs)
  end
end

class SubscriptionExpiredError < SubscriptionError
  def initialize(message = 'Subscription has expired', **kwargs)
    super(message, code: 'SUBSCRIPTION_EXPIRED', **kwargs)
  end
end