module CoursesSyncErrors
  class BaseSyncError < StandardError
    attr_reader :details, :retry_after

    def initialize(message, details: {}, retry_after: nil)
      super(message)
      @details = details
      @retry_after = retry_after
    end

    def to_h
      {
        error: self.class.name,
        message: message,
        details: details,
        retry_after: retry_after,
        timestamp: Time.current.iso8601
      }
    end
  end

  class ApiError < BaseSyncError; end
  class RateLimitError < ApiError; end
  class AuthenticationError < ApiError; end
  class NotFoundError < ApiError; end
  class NetworkError < BaseSyncError; end
  class DataValidationError < BaseSyncError; end
  class CircuitBreakerOpenError < BaseSyncError; end
  
  # Circuit breaker for API failures
  class CircuitBreaker
    attr_reader :failure_count, :last_failure_time, :state

    FAILURE_THRESHOLD = 5
    TIMEOUT = 60.seconds
    STATES = %w[closed open half_open].freeze

    def initialize
      @failure_count = 0
      @last_failure_time = nil
      @state = 'closed'
    end

    def call
      raise CircuitBreakerOpenError.new("Circuit breaker is open", retry_after: retry_after_seconds) if open?

      begin
        result = yield
        record_success
        result
      rescue => error
        record_failure
        raise
      end
    end

    def open?
      @state == 'open' && Time.current < (@last_failure_time + TIMEOUT)
    end

    def half_open?
      @state == 'half_open'
    end

    def closed?
      @state == 'closed'
    end

    private

    def record_success
      @failure_count = 0
      @state = 'closed'
    end

    def record_failure
      @failure_count += 1
      @last_failure_time = Time.current

      if @failure_count >= FAILURE_THRESHOLD
        @state = 'open'
      elsif @state == 'closed'
        @state = 'half_open'
      end
    end

    def retry_after_seconds
      return 0 unless @last_failure_time

      remaining = (@last_failure_time + TIMEOUT) - Time.current
      [remaining.to_i, 0].max
    end
  end

  # Track errors for monitoring and alerting
  class ErrorTracker
    def initialize
      @errors = []
      @error_counts = Hash.new(0)
    end

    def record_error(error, context = {})
      error_data = {
        error_class: error.class.name,
        message: error.message,
        context: context,
        timestamp: Time.current,
        backtrace: error.backtrace&.first(5)
      }

      @errors << error_data
      @error_counts[error.class.name] += 1

      # Log structured error for monitoring systems
      Rails.logger.error({
        event: 'courses_sync_error',
        **error_data
      }.to_json)

      # Keep only recent errors in memory
      @errors = @errors.last(100) if @errors.size > 100
    end

    def error_summary
      {
        total_errors: @errors.count,
        error_types: @error_counts,
        recent_errors: @errors.last(10),
        most_common_error: @error_counts.max_by(&:last)&.first
      }
    end

    def has_critical_errors?
      critical_error_types = [
        'CoursesSyncErrors::AuthenticationError',
        'CoursesSyncErrors::CircuitBreakerOpenError'
      ]
      
      @error_counts.keys.any? { |error_type| critical_error_types.include?(error_type) }
    end
  end
end