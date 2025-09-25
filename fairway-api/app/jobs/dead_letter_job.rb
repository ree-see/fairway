class DeadLetterJob < ApplicationJob
  queue_as :critical

  def perform(job_class:, job_id:, arguments:, error_class:, error_message:, error_backtrace:, failed_at:, executions:)
    # Log the failed job details
    Rails.logger.error({
      event: 'job_dead_letter',
      job_class: job_class,
      job_id: job_id,
      error_class: error_class,
      error_message: error_message,
      failed_at: failed_at,
      executions: executions,
      arguments: arguments
    }.to_json)

    # Store in database for monitoring and potential manual retry
    FailedJob.create!(
      job_class: job_class,
      job_id: job_id,
      arguments: arguments.to_json,
      error_class: error_class,
      error_message: error_message,
      error_backtrace: error_backtrace&.join("\n"),
      failed_at: failed_at,
      executions: executions
    )

    # Send alert for critical jobs
    if critical_job?(job_class)
      send_critical_job_alert(job_class, error_message)
    end

    # Clean up old failed jobs (keep last 1000)
    FailedJob.order(:created_at).limit(-1000).destroy_all
  end

  private

  def critical_job?(job_class)
    critical_jobs = %w[
      CoursesSyncJob
      UserHandicapUpdateJob
      PaymentProcessingJob
    ]
    critical_jobs.include?(job_class)
  end

  def send_critical_job_alert(job_class, error_message)
    # In a real application, this would send notifications via:
    # - Email to administrators
    # - Slack/Discord webhook
    # - PagerDuty/OpsGenie
    # - Application monitoring service (Sentry, Rollbar, etc.)
    
    Rails.logger.error({
      event: 'critical_job_failure_alert',
      job_class: job_class,
      error_message: error_message,
      timestamp: Time.current.iso8601
    }.to_json)
  end
end