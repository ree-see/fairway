namespace :courses do
  namespace :sync do
    desc "Initial population of courses database from third-party API"
    task :initial, [:limit, :start_id] => :environment do |task, args|
      limit = args[:limit]&.to_i
      start_id = args[:start_id]&.to_i || 5000
      
      puts "🏌️  Starting initial course synchronization..."
      puts "📊 Limit: #{limit || 'No limit'}"
      puts "🎯 Starting from ID: #{start_id}"
      
      service = CoursesSyncService.new
      
      # Show current stats
      stats = service.sync_stats
      puts "\n📈 Current database stats:"
      puts "   Total courses: #{stats[:total_courses]}"
      puts "   External courses: #{stats[:external_courses]}"
      puts "   Never synced: #{stats[:never_synced]}"
      
      # Perform initial sync
      start_time = Time.current
      result = service.initial_sync(limit: limit, start_id: start_id)
      duration = Time.current - start_time
      
      puts "\n✅ Sync completed in #{duration.round(2)} seconds"
      puts "   Courses synced: #{result[:synced]}"
      puts "   Errors: #{result[:errors]}"
      
      # Show updated stats
      updated_stats = service.sync_stats
      puts "\n📈 Updated database stats:"
      puts "   Total courses: #{updated_stats[:total_courses]}"
      puts "   External courses: #{updated_stats[:external_courses]}"
      puts "   Sync enabled: #{updated_stats[:sync_enabled]}"
      
      if result[:errors] > 0
        puts "\n⚠️  Some courses failed to sync. Check logs for details."
      end
    end

    desc "Update existing courses that need refreshing"
    task update: :environment do
      puts "🔄 Starting course update synchronization..."
      
      service = CoursesSyncService.new
      
      # Show courses that need updating
      courses_needing_sync = Course.sync_enabled.needs_sync.count
      puts "📊 Courses needing sync: #{courses_needing_sync}"
      
      if courses_needing_sync == 0
        puts "✅ All courses are up to date!"
        exit
      end
      
      # Perform update sync
      start_time = Time.current
      result = service.update_sync
      duration = Time.current - start_time
      
      puts "\n✅ Update completed in #{duration.round(2)} seconds"
      puts "   Courses updated: #{result[:synced]}"
      puts "   Errors: #{result[:errors]}"
      
      if result[:errors] > 0
        puts "\n⚠️  Some courses failed to update. Check logs for details."
      end
    end

    desc "Sync a specific course by external ID"
    task :course, [:external_id] => :environment do |task, args|
      external_id = args[:external_id]
      
      if external_id.blank?
        puts "❌ Please provide an external ID: rake courses:sync:course[12345]"
        exit 1
      end
      
      puts "🔄 Syncing course with external ID: #{external_id}..."
      
      service = CoursesSyncService.new
      
      begin
        course = service.sync_course_by_external_id(external_id)
        
        if course
          puts "✅ Course synced successfully:"
          puts "   Name: #{course.name}"
          puts "   Location: #{course.full_address}"
          puts "   Last synced: #{course.last_synced_at}"
        else
          puts "❌ Course not found with external ID: #{external_id}"
        end
        
      rescue => e
        puts "❌ Failed to sync course: #{e.message}"
        puts e.backtrace.first(5) if Rails.env.development?
      end
    end

    desc "Show synchronization statistics"
    task status: :environment do
      puts "📊 Course Synchronization Status"
      puts "=" * 40
      
      service = CoursesSyncService.new
      stats = service.sync_stats
      
      puts "Total courses in database: #{stats[:total_courses]}"
      puts "Courses from external API: #{stats[:external_courses]}"
      puts "Sync enabled courses: #{stats[:sync_enabled]}"
      puts "Courses needing sync: #{stats[:needs_sync]}"
      puts "Synced in last 24 hours: #{stats[:synced_recently]}"
      puts "Never synced: #{stats[:never_synced]}"
      
      # Show breakdown by source
      puts "\n📈 Breakdown by source:"
      Course.group(:external_source).count.each do |source, count|
        source_name = source || 'manual'
        puts "   #{source_name}: #{count} courses"
      end
      
      # Show recent sync activity
      recent_syncs = Course.where.not(last_synced_at: nil)
                          .order(last_synced_at: :desc)
                          .limit(5)
      
      if recent_syncs.any?
        puts "\n🕐 Recent sync activity:"
        recent_syncs.each do |course|
          time_ago = time_ago_in_words(course.last_synced_at)
          puts "   #{course.name} - #{time_ago} ago"
        end
      end
      
      # Show courses that need attention
      stale_courses = Course.sync_enabled.where('last_synced_at < ?', 1.month.ago).limit(5)
      if stale_courses.any?
        puts "\n⚠️  Courses not synced in over a month:"
        stale_courses.each do |course|
          time_ago = course.last_synced_at ? time_ago_in_words(course.last_synced_at) : 'never'
          puts "   #{course.name} - #{time_ago} ago"
        end
      end
    end

    desc "Enable sync for all external courses"
    task enable_sync: :environment do
      count = Course.from_external_source('golfcourseapi').update_all(sync_enabled: true)
      puts "✅ Enabled sync for #{count} courses from external API"
    end

    desc "Disable sync for all courses"
    task disable_sync: :environment do
      count = Course.update_all(sync_enabled: false)
      puts "⏹️  Disabled sync for #{count} courses"
    end

    desc "Expand abbreviations in existing course names"
    task expand_abbreviations: :environment do
      puts "🔧 Expanding course name abbreviations..."
      
      # Define abbreviations to expand
      abbreviations = {
        'Gc' => 'Golf Course',
        'GC' => 'Golf Club', 
        'CC' => 'Country Club',
        'Cc' => 'Country Club',
        'G&CC' => 'Golf & Country Club',
        'G&Cc' => 'Golf & Country Club', 
        'G & CC' => 'Golf & Country Club',
        'G & Cc' => 'Golf & Country Club',
        'RC' => 'Resort & Club',
        'Rc' => 'Resort & Club',
        'GL' => 'Golf Links',
        'Gl' => 'Golf Links',
        'GR' => 'Golf Resort',
        'Gr' => 'Golf Resort'
      }
      
      fixed_count = 0
      
      Course.all.each do |course|
        original_name = course.name
        new_name = original_name
        
        abbreviations.each do |abbrev, expansion|
          new_name = new_name.gsub(/\b#{Regexp.escape(abbrev)}\b/, expansion)
        end
        
        if new_name != original_name
          puts "Expanding: '#{original_name}' → '#{new_name}'"
          course.update!(name: new_name)
          fixed_count += 1
        end
      end
      
      puts "✅ Expanded #{fixed_count} course name abbreviations"
    end

    desc "Fix duplicate course names in existing data"
    task fix_duplicate_names: :environment do
      puts "🔧 Fixing duplicate course names..."
      
      fixed_count = 0
      
      Course.where("name LIKE '% - %'").each do |course|
        parts = course.name.split(' - ')
        
        # Check if the parts are the same or very similar
        if parts.length == 2 && (parts[0].strip.downcase == parts[1].strip.downcase)
          new_name = parts[0].strip
          puts "Fixing: '#{course.name}' → '#{new_name}'"
          course.update!(name: new_name)
          fixed_count += 1
        end
      end
      
      puts "✅ Fixed #{fixed_count} duplicate course names"
    end

    desc "Clean up duplicate courses in the database"
    task remove_duplicates: :environment do
      puts "🧹 Starting duplicate course cleanup..."
      
      # Group courses by name and location to find potential duplicates
      duplicates_found = 0
      duplicates_removed = 0
      
      Course.select('name, city, state, COUNT(*) as course_count')
            .group('name, city, state')
            .having('COUNT(*) > 1')
            .each do |group|
        
        puts "Found duplicates: #{group.name} in #{group.city}, #{group.state} (#{group.course_count} courses)"
        duplicates_found += group.course_count - 1
        
        # Get all courses in this group
        duplicate_courses = Course.where(name: group.name, city: group.city, state: group.state)
                                 .order(:created_at) # Keep the oldest one
        
        # Remove all but the first (oldest) course
        courses_to_remove = duplicate_courses.drop(1)
        courses_to_remove.each do |course|
          puts "  Removing duplicate: #{course.name} (ID: #{course.id}, External ID: #{course.external_id})"
          course.destroy!
          duplicates_removed += 1
        end
      end
      
      puts "\n✅ Duplicate cleanup completed"
      puts "   Duplicates found: #{duplicates_found}"
      puts "   Duplicates removed: #{duplicates_removed}"
      puts "   Note: Kept the oldest version of each duplicate course"
    end

    desc "Clean up orphaned external courses (courses that no longer exist in API)"
    task cleanup: :environment do
      puts "🧹 Starting cleanup of orphaned external courses..."
      
      # This would require checking each external course against the API
      # Implementation would depend on specific business rules
      puts "⚠️  Cleanup task not yet implemented"
      puts "   This should check external courses against the API and handle orphaned records"
    end
  end

  # Helper method for time formatting
  def time_ago_in_words(time)
    distance = Time.current - time
    case distance
    when 0..59
      "#{distance.to_i} seconds"
    when 60..3599
      "#{(distance / 60).to_i} minutes"
    when 3600..86399
      "#{(distance / 3600).to_i} hours"
    else
      "#{(distance / 86400).to_i} days"
    end
  end
end