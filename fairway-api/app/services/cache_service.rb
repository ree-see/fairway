class CacheService
  class << self
    # Cache TTL constants (in seconds)
    USER_STATS_TTL = 1.hour
    COURSE_DATA_TTL = 1.day
    HANDICAP_TTL = 30.minutes
    LEADERBOARD_TTL = 5.minutes
    WEATHER_TTL = 15.minutes

    # User statistics caching
    def fetch_user_stats(user_id, options = {})
      cache_key = "user_stats:#{user_id}:#{cache_version(options)}"
      
      Rails.cache.fetch(cache_key, expires_in: USER_STATS_TTL) do
        UserStatsService.calculate_user_statistics(User.find(user_id))
      end
    end

    def invalidate_user_stats(user_id)
      Rails.cache.delete_matched("user_stats:#{user_id}:*")
    end

    # Course data caching
    def fetch_course_details(course_id)
      cache_key = "course:#{course_id}"
      
      Rails.cache.fetch(cache_key, expires_in: COURSE_DATA_TTL) do
        Course.includes(:holes).find(course_id).as_json(include: :holes)
      end
    end

    def fetch_course_search_results(query, location = nil)
      location_key = location ? "#{location[:latitude]},#{location[:longitude]}" : 'global'
      cache_key = "course_search:#{Digest::MD5.hexdigest(query)}:#{location_key}"
      
      Rails.cache.fetch(cache_key, expires_in: 1.hour) do
        # This would integrate with external course API
        perform_course_search(query, location)
      end
    end

    def invalidate_course_cache(course_id)
      Rails.cache.delete("course:#{course_id}")
      Rails.cache.delete_matched("course_search:*")
    end

    # Handicap caching
    def fetch_user_handicap(user_id)
      cache_key = "handicap:#{user_id}"
      
      Rails.cache.fetch(cache_key, expires_in: HANDICAP_TTL) do
        user = User.find(user_id)
        {
          provisional: HandicapService.calculate_provisional_handicap(user),
          verified: HandicapService.calculate_verified_handicap(user),
          updated_at: Time.current
        }
      end
    end

    def invalidate_user_handicap(user_id)
      Rails.cache.delete("handicap:#{user_id}")
      # Also invalidate related caches
      invalidate_user_stats(user_id)
    end

    # Leaderboard caching
    def fetch_leaderboard(league_id, period = 'current')
      cache_key = "leaderboard:#{league_id}:#{period}"
      
      Rails.cache.fetch(cache_key, expires_in: LEADERBOARD_TTL) do
        calculate_leaderboard(league_id, period)
      end
    end

    def invalidate_leaderboard(league_id)
      Rails.cache.delete_matched("leaderboard:#{league_id}:*")
    end

    # Weather data caching
    def fetch_weather_data(course_id)
      cache_key = "weather:#{course_id}"
      
      Rails.cache.fetch(cache_key, expires_in: WEATHER_TTL) do
        # This would integrate with weather API
        fetch_course_weather(course_id)
      end
    end

    # Round statistics caching
    def fetch_round_statistics(round_id)
      cache_key = "round_stats:#{round_id}"
      
      Rails.cache.fetch(cache_key, expires_in: 1.day) do
        round = Round.includes(:hole_scores, :course).find(round_id)
        RoundService.statistics_for_round(round)
      end
    end

    def invalidate_round_statistics(round_id)
      Rails.cache.delete("round_stats:#{round_id}")
    end

    # Batch operations for performance
    def warm_user_cache(user_id)
      # Pre-load commonly accessed data
      [
        -> { fetch_user_handicap(user_id) },
        -> { fetch_user_stats(user_id) }
      ].each { |operation| operation.call }
    end

    def batch_invalidate_user_data(user_id)
      keys_to_delete = [
        "handicap:#{user_id}",
        "user_stats:#{user_id}:*",
        "round_stats:*" # User's rounds might be affected
      ]
      
      keys_to_delete.each do |pattern|
        if pattern.include?('*')
          Rails.cache.delete_matched(pattern)
        else
          Rails.cache.delete(pattern)
        end
      end
    end

    # Cache warming for popular courses
    def warm_popular_courses_cache
      popular_course_ids = Course.joins(:rounds)
                                .group('courses.id')
                                .order('COUNT(rounds.id) DESC')
                                .limit(50)
                                .pluck(:id)

      popular_course_ids.each do |course_id|
        fetch_course_details(course_id)
      end
    end

    # Performance monitoring
    def cache_hit_rate(pattern = nil)
      # This would require custom cache store with hit tracking
      # Implementation depends on cache backend (Redis, Memcached, etc.)
      0.0 # Placeholder
    end

    def cache_size_info
      # Return cache usage statistics
      {
        total_keys: Rails.cache.respond_to?(:size) ? Rails.cache.size : 'unknown',
        memory_usage: 'unknown', # Would need cache-specific implementation
        hit_rate: cache_hit_rate
      }
    end

    private

    def cache_version(options)
      # Create a version string based on options to enable selective cache invalidation
      Digest::MD5.hexdigest(options.sort.to_h.to_s)
    end

    def perform_course_search(query, location)
      # Placeholder for actual course search implementation
      # This would integrate with external course database API
      {
        courses: [],
        total: 0,
        query: query,
        location: location
      }
    end

    def calculate_leaderboard(league_id, period)
      # Placeholder for leaderboard calculation
      # This would calculate rankings based on handicap-adjusted scores
      {
        league_id: league_id,
        period: period,
        rankings: [],
        updated_at: Time.current
      }
    end

    def fetch_course_weather(course_id)
      # Placeholder for weather API integration
      course = Course.find(course_id)
      {
        course_id: course_id,
        current: {
          temperature: 22,
          humidity: 65,
          wind_speed: 8,
          wind_direction: 'SW',
          conditions: 'partly_cloudy'
        },
        forecast: []
      }
    end
  end
end