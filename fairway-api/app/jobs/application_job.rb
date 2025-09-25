class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  retry_on ActiveRecord::Deadlocked, wait: :exponentially_longer, attempts: 3

  # Most jobs are safe to ignore if the underlying records are no longer available
  discard_on ActiveJob::DeserializationError

  # Custom retry logic for different error types
  rescue_from StandardError do |error|
    case error
    when CoursesSyncErrors::RateLimitError
      # For rate limiting, wait and retry with exponential backoff
      retry_job(wait: calculate_retry_delay(error), queue: :low_priority)
    when CoursesSyncErrors::NetworkError, CoursesSyncErrors::ApiError
      # For network/API errors, retry with exponential backoff up to 5 times
      if executions < 5
        retry_job(wait: exponential_backoff_delay)
      else
        # Move to dead letter queue after max retries
        Rails.logger.error "Job #{job_id} failed permanently: #{error.message}"
        send_to_dead_letter_queue(error)
      end
    when CoursesSyncErrors::AuthenticationError, CoursesSyncErrors::CircuitBreakerOpenError
      # Don't retry authentication errors or circuit breaker - these need manual intervention
      Rails.logger.error "Job #{job_id} failed with non-retryable error: #{error.message}"
      send_to_dead_letter_queue(error)
    else
      # For other errors, use default retry behavior
      if executions < 3
        retry_job(wait: exponential_backoff_delay)
      else
        Rails.logger.error "Job #{job_id} failed permanently: #{error.message}"
        send_to_dead_letter_queue(error)
      end
    end
  end

  private

  def calculate_retry_delay(error)
    if error.respond_to?(:retry_after) && error.retry_after
      error.retry_after.seconds
    else
      exponential_backoff_delay
    end
  end

  def exponential_backoff_delay
    # Exponential backoff: 2^attempt seconds, capped at 10 minutes
    delay = 2 ** executions
    [delay, 600].min.seconds
  end

  def send_to_dead_letter_queue(error)
    DeadLetterJob.perform_later(
      job_class: self.class.name,
      job_id: job_id,
      arguments: arguments,
      error_class: error.class.name,
      error_message: error.message,
      error_backtrace: error.backtrace&.first(10),
      failed_at: Time.current,
      executions: executions
    )
  end
end
