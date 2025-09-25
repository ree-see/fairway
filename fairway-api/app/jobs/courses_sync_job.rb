class CoursesSyncJob < ApplicationJob
  queue_as :default
  
  # Retry with exponential backoff for transient failures
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(sync_type = 'update', options = {})
    Rails.logger.info "Starting CoursesSyncJob with type: #{sync_type}"
    
    service = CoursesSyncService.new
    
    case sync_type.to_s
    when 'initial'
      result = service.initial_sync(limit: options['limit'])
      Rails.logger.info "Initial sync completed: #{result[:synced]} synced, #{result[:errors]} errors"
    when 'update'
      result = service.update_sync
      Rails.logger.info "Update sync completed: #{result[:synced]} synced, #{result[:errors]} errors"
    else
      raise ArgumentError, "Unknown sync type: #{sync_type}"
    end
    
    result
  end
end