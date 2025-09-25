# Solid Queue configuration
# Note: Recurring jobs may not be available in all versions of solid_queue
# For now, we'll use manual scheduling or rake tasks for periodic sync
# 
# If recurring jobs are supported in your version, uncomment below:
# 
# if defined?(SolidQueue) && defined?(SolidQueue::RecurringJob)
#   recurring_jobs_file = Rails.root.join('config', 'recurring_jobs.yml')
#   
#   if File.exist?(recurring_jobs_file)
#     SolidQueue::RecurringJob.load_from_file(recurring_jobs_file)
#   end
# end

Rails.logger.info "Solid Queue configured for CoursesSyncJob"