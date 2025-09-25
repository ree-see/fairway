class FailedJob < ApplicationRecord
  validates :job_class, presence: true
  validates :job_id, presence: true, uniqueness: true
  validates :error_class, presence: true
  validates :error_message, presence: true
  validates :failed_at, presence: true
  validates :executions, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :recent, -> { order(failed_at: :desc) }
  scope :by_job_class, ->(job_class) { where(job_class: job_class) }
  scope :by_error_class, ->(error_class) { where(error_class: error_class) }
  scope :critical, -> { where(job_class: %w[CoursesSyncJob UserHandicapUpdateJob PaymentProcessingJob]) }

  # Parse arguments from JSON
  def parsed_arguments
    return [] if arguments.blank?
    JSON.parse(arguments)
  rescue JSON::ParserError
    []
  end

  # Check if this job can be retried
  def retryable?
    non_retryable_errors = %w[
      CoursesSyncErrors::AuthenticationError
      CoursesSyncErrors::CircuitBreakerOpenError
      ActiveJob::DeserializationError
    ]
    !non_retryable_errors.include?(error_class)
  end

  # Get error summary for monitoring
  def self.error_summary(since: 24.hours.ago)
    where('failed_at >= ?', since).group(:error_class).count
  end

  # Get job failure summary
  def self.job_failure_summary(since: 24.hours.ago)
    where('failed_at >= ?', since).group(:job_class).count
  end

  # Clean up old records
  def self.cleanup_old_records(keep_count: 1000)
    return if count <= keep_count
    
    oldest_to_keep = order(failed_at: :desc).limit(keep_count).minimum(:failed_at)
    where('failed_at < ?', oldest_to_keep).delete_all
  end

  # Manual retry of a failed job
  def retry!
    return false unless retryable?
    
    job_class_constant = job_class.constantize
    job_class_constant.perform_later(*parsed_arguments)
    
    update!(retried_at: Time.current)
    true
  rescue => e
    Rails.logger.error "Failed to retry job #{job_id}: #{e.message}"
    false
  end
end
