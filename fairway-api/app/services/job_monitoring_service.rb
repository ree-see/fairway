class JobMonitoringService
  def initialize
    @logger = Rails.logger
  end

  # Get comprehensive job status
  def job_status
    {
      active_jobs: active_jobs_count,
      failed_jobs: failed_jobs_count,
      queue_sizes: queue_sizes,
      worker_status: worker_status,
      recent_failures: recent_failure_summary,
      error_trends: error_trends,
      performance_metrics: performance_metrics
    }
  end

  # Get health check status
  def health_check
    status = {
      healthy: true,
      issues: []
    }

    # Check for too many failed jobs
    if failed_jobs_count > 100
      status[:healthy] = false
      status[:issues] << "High number of failed jobs: #{failed_jobs_count}"
    end

    # Check for stuck jobs (running for too long)
    stuck_jobs = stuck_jobs_count
    if stuck_jobs > 0
      status[:healthy] = false
      status[:issues] << "#{stuck_jobs} jobs appear to be stuck"
    end

    # Check queue backup
    large_queues = queue_sizes.select { |_, size| size > 1000 }
    if large_queues.any?
      status[:healthy] = false
      status[:issues] << "Large queue backlog: #{large_queues.inspect}"
    end

    status
  end

  # Retry all retryable failed jobs
  def retry_failed_jobs(limit: 50)
    retried_count = 0
    failed_count = 0

    FailedJob.recent.retryable.limit(limit).each do |failed_job|
      if failed_job.retry!
        retried_count += 1
        @logger.info "Retried failed job: #{failed_job.job_class} (#{failed_job.job_id})"
      else
        failed_count += 1
        @logger.error "Failed to retry job: #{failed_job.job_class} (#{failed_job.job_id})"
      end
    end

    {
      retried: retried_count,
      failed_to_retry: failed_count
    }
  end

  # Clean up old data
  def cleanup_old_data
    # Clean up old failed job records
    FailedJob.cleanup_old_records

    # Clean up old completed jobs from SolidQueue
    if defined?(SolidQueue)
      SolidQueue::Job.where('finished_at < ?', 7.days.ago).limit(1000).delete_all
    end

    @logger.info "Cleaned up old job data"
  end

  private

  def active_jobs_count
    if defined?(SolidQueue)
      SolidQueue::Job.where(finished_at: nil).count
    else
      0
    end
  end

  def failed_jobs_count
    FailedJob.count
  end

  def queue_sizes
    if defined?(SolidQueue)
      SolidQueue::Job.where(finished_at: nil)
                     .group(:queue_name)
                     .count
    else
      {}
    end
  end

  def worker_status
    if defined?(SolidQueue)
      {
        total_workers: SolidQueue::Process.count,
        active_workers: SolidQueue::Process.where('last_heartbeat_at > ?', 5.minutes.ago).count,
        last_heartbeat: SolidQueue::Process.maximum(:last_heartbeat_at)
      }
    else
      {}
    end
  end

  def recent_failure_summary(since: 24.hours.ago)
    FailedJob.where('failed_at >= ?', since)
             .group(:error_class)
             .order(count: :desc)
             .count
             .first(5)
             .to_h
  end

  def error_trends
    # Get error counts for last 7 days
    trend_data = {}
    
    7.downto(0).each do |days_ago|
      date = days_ago.days.ago.beginning_of_day
      count = FailedJob.where(failed_at: date..date.end_of_day).count
      trend_data[date.strftime('%Y-%m-%d')] = count
    end
    
    trend_data
  end

  def performance_metrics
    if defined?(SolidQueue)
      completed_jobs = SolidQueue::Job.where('finished_at >= ?', 24.hours.ago)
      
      return {} if completed_jobs.empty?

      # Calculate average job duration
      job_durations = completed_jobs.where.not(created_at: nil, finished_at: nil)
                                  .pluck(:created_at, :finished_at)
                                  .map { |created, finished| (finished - created).to_f }

      {
        completed_last_24h: completed_jobs.count,
        avg_duration_seconds: job_durations.empty? ? 0 : (job_durations.sum / job_durations.count).round(2),
        min_duration_seconds: job_durations.empty? ? 0 : job_durations.min.round(2),
        max_duration_seconds: job_durations.empty? ? 0 : job_durations.max.round(2),
        throughput_per_hour: (completed_jobs.count / 24.0).round(2)
      }
    else
      {}
    end
  end

  def stuck_jobs_count
    if defined?(SolidQueue)
      # Jobs running for more than 1 hour are considered stuck
      SolidQueue::Job.joins(:claimed_executions)
                     .where('solid_queue_claimed_executions.created_at < ?', 1.hour.ago)
                     .where(finished_at: nil)
                     .count
    else
      0
    end
  end
end