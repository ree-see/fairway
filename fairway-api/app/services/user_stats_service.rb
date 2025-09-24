class UserStatsService
  PERFORMANCE_CATEGORIES = %w[driving approach putting short_game overall].freeze

  class << self
    def calculate_user_statistics(user, limit: 10)
      recent_rounds = user.rounds.completed
                          .includes(:hole_scores, :course)
                          .order(started_at: :desc)
                          .limit(limit)

      return empty_stats if recent_rounds.empty?

      {
        basic_stats: calculate_basic_stats(recent_rounds),
        performance_trends: calculate_performance_trends(recent_rounds),
        handicap_analysis: HandicapService.playing_ability_assessment(user),
        consistency_metrics: calculate_consistency_metrics(recent_rounds),
        improvement_areas: identify_improvement_opportunities(recent_rounds),
        course_performance: calculate_course_performance(recent_rounds)
      }
    end

    def strokes_gained_analysis(user, rounds_limit: 5)
      recent_rounds = user.rounds.completed
                          .includes(:hole_scores)
                          .order(started_at: :desc)
                          .limit(rounds_limit)

      return {} if recent_rounds.empty?

      {
        overall: calculate_strokes_gained_overall(recent_rounds),
        driving: calculate_strokes_gained_driving(recent_rounds),
        approach: calculate_strokes_gained_approach(recent_rounds),
        short_game: calculate_strokes_gained_short_game(recent_rounds),
        putting: calculate_strokes_gained_putting(recent_rounds)
      }
    end

    def performance_comparison(user, comparison_period_days: 30)
      cutoff_date = comparison_period_days.days.ago
      
      recent_rounds = user.rounds.completed
                          .where('started_at >= ?', cutoff_date)
                          .includes(:hole_scores)

      previous_rounds = user.rounds.completed
                            .where('started_at < ?', cutoff_date)
                            .includes(:hole_scores)
                            .limit(20)

      return {} if recent_rounds.empty? || previous_rounds.empty?

      {
        scoring_average: {
          recent: recent_rounds.average(:total_strokes)&.round(1),
          previous: previous_rounds.average(:total_strokes)&.round(1)
        },
        handicap_trend: calculate_handicap_trend(user),
        category_improvements: calculate_category_improvements(recent_rounds, previous_rounds),
        consistency_change: calculate_consistency_change(recent_rounds, previous_rounds)
      }
    end

    def course_recommendations(user)
      user_handicap = user.handicap_index || 20.0
      preferred_difficulty = determine_preferred_difficulty(user)
      
      # This would integrate with course database
      {
        difficulty_match: preferred_difficulty,
        recommended_tees: recommend_tees_for_handicap(user_handicap),
        course_types: analyze_course_preferences(user),
        improvement_courses: suggest_improvement_courses(user)
      }
    end

    def generate_performance_report(user, period: :monthly)
      case period
      when :weekly
        date_range = 1.week.ago..Time.current
      when :monthly
        date_range = 1.month.ago..Time.current
      when :quarterly
        date_range = 3.months.ago..Time.current
      else
        date_range = 1.month.ago..Time.current
      end

      rounds = user.rounds.completed
                   .where(started_at: date_range)
                   .includes(:hole_scores, :course)

      return {} if rounds.empty?

      {
        period: period,
        date_range: {
          start: date_range.begin.to_date,
          end: date_range.end.to_date
        },
        rounds_played: rounds.count,
        verified_rounds: rounds.where(is_verified: true).count,
        average_score: rounds.average(:total_strokes)&.round(1),
        best_round: rounds.minimum(:total_strokes),
        handicap_change: calculate_handicap_change_in_period(user, date_range),
        key_improvements: identify_key_improvements(rounds),
        focus_areas: identify_focus_areas(rounds),
        milestones_achieved: identify_milestones(rounds)
      }
    end

    private

    def empty_stats
      {
        basic_stats: {},
        performance_trends: {},
        handicap_analysis: {},
        consistency_metrics: {},
        improvement_areas: [],
        course_performance: {}
      }
    end

    def calculate_basic_stats(rounds)
      total_holes = rounds.sum { |r| r.course.holes.count }
      
      {
        rounds_played: rounds.count,
        total_holes: total_holes,
        average_score: rounds.average(:total_strokes)&.round(1),
        best_score: rounds.minimum(:total_strokes),
        worst_score: rounds.maximum(:total_strokes),
        average_putts: calculate_average_putts(rounds),
        fairway_percentage: calculate_fairway_percentage(rounds),
        gir_percentage: calculate_gir_percentage(rounds),
        average_penalties: rounds.average(:total_penalties)&.round(1)
      }
    end

    def calculate_performance_trends(rounds)
      return {} if rounds.count < 3

      scores = rounds.map(&:total_strokes).reverse # chronological order
      
      {
        score_trend: calculate_trend_direction(scores),
        recent_form: analyze_recent_form(scores.last(5)),
        volatility: calculate_score_volatility(scores),
        improvement_rate: calculate_improvement_rate(scores)
      }
    end

    def calculate_consistency_metrics(rounds)
      scores = rounds.map(&:total_strokes)
      return {} if scores.length < 3

      mean = scores.sum / scores.length.to_f
      variance = scores.map { |score| (score - mean) ** 2 }.sum / scores.length.to_f
      std_dev = Math.sqrt(variance)

      {
        standard_deviation: std_dev.round(1),
        consistency_score: [100 - (std_dev * 3), 0].max.round(1),
        score_range: scores.max - scores.min,
        within_one_stroke: calculate_consistency_within_range(scores, 1),
        within_three_strokes: calculate_consistency_within_range(scores, 3)
      }
    end

    def identify_improvement_opportunities(rounds)
      opportunities = []
      
      # Analyze putting
      avg_putts = calculate_average_putts(rounds)
      opportunities << {
        category: 'putting',
        priority: 'high',
        description: 'Focus on lag putting practice',
        metric: avg_putts
      } if avg_putts > 2.0

      # Analyze fairway accuracy
      fairway_pct = calculate_fairway_percentage(rounds)
      opportunities << {
        category: 'driving',
        priority: 'medium',
        description: 'Work on driver accuracy',
        metric: fairway_pct
      } if fairway_pct < 50.0

      # Analyze GIR
      gir_pct = calculate_gir_percentage(rounds)
      opportunities << {
        category: 'approach',
        priority: 'high',
        description: 'Improve iron play and course management',
        metric: gir_pct
      } if gir_pct < 40.0

      opportunities
    end

    def calculate_course_performance(rounds)
      performance_by_course = rounds.group_by(&:course)
                                   .transform_values do |course_rounds|
        {
          rounds_played: course_rounds.count,
          average_score: course_rounds.map(&:total_strokes).sum.to_f / course_rounds.count,
          best_score: course_rounds.map(&:total_strokes).min,
          average_to_par: calculate_average_to_par(course_rounds)
        }
      end

      {
        courses_played: performance_by_course.keys.count,
        favorite_course: find_favorite_course(performance_by_course),
        best_course_performance: find_best_course_performance(performance_by_course),
        course_variety: analyze_course_variety(rounds)
      }
    end

    # Strokes Gained Calculations (simplified)
    def calculate_strokes_gained_overall(rounds)
      # This is a simplified version - real implementation would use PGA Tour baseline data
      benchmark_score = 85.0 # Average recreational golfer
      actual_scores = rounds.map(&:total_strokes)
      
      strokes_gained = actual_scores.map { |score| benchmark_score - score }
      strokes_gained.sum.to_f / strokes_gained.count
    end

    def calculate_strokes_gained_driving(rounds)
      # Simplified - would need detailed shot tracking
      fairway_percentages = rounds.map { |r| calculate_round_fairway_percentage(r) }
      benchmark = 50.0 # 50% fairway accuracy benchmark
      
      avg_fairway_pct = fairway_percentages.sum / fairway_percentages.count.to_f
      (avg_fairway_pct - benchmark) / 10.0 # Convert to approximate strokes gained
    end

    def calculate_strokes_gained_approach(rounds)
      gir_percentages = rounds.map { |r| calculate_round_gir_percentage(r) }
      benchmark = 45.0 # 45% GIR benchmark
      
      avg_gir_pct = gir_percentages.sum / gir_percentages.count.to_f
      (avg_gir_pct - benchmark) / 8.0 # Convert to approximate strokes gained
    end

    def calculate_strokes_gained_short_game(rounds)
      # Simplified calculation based on up-and-down percentage
      0.0 # Placeholder - would need detailed short game tracking
    end

    def calculate_strokes_gained_putting(rounds)
      avg_putts = calculate_average_putts(rounds)
      benchmark_putts = 1.8 # Putts per hole benchmark
      
      (benchmark_putts - avg_putts) * 18 # Convert to 18-hole strokes gained
    end

    # Helper methods
    def calculate_average_putts(rounds)
      total_putts = rounds.sum(&:total_putts)
      total_holes = rounds.sum { |r| r.course.holes.count }
      
      return 0.0 if total_holes.zero?
      total_putts.to_f / total_holes
    end

    def calculate_fairway_percentage(rounds)
      total_fairways_hit = rounds.sum(&:fairways_hit)
      total_driveable_holes = rounds.sum { |r| r.course.holes.where('par >= ?', 4).count }
      
      return 0.0 if total_driveable_holes.zero?
      (total_fairways_hit.to_f / total_driveable_holes * 100).round(1)
    end

    def calculate_gir_percentage(rounds)
      total_gir = rounds.sum(&:greens_in_regulation)
      total_holes = rounds.sum { |r| r.course.holes.count }
      
      return 0.0 if total_holes.zero?
      (total_gir.to_f / total_holes * 100).round(1)
    end

    def calculate_trend_direction(scores)
      return 'stable' if scores.length < 3
      
      recent_avg = scores.last(3).sum / 3.0
      earlier_avg = scores.first(3).sum / 3.0
      
      difference = earlier_avg - recent_avg
      
      case
      when difference > 2
        'improving'
      when difference < -2
        'declining'
      else
        'stable'
      end
    end

    def analyze_recent_form(recent_scores)
      return 'insufficient_data' if recent_scores.length < 3
      
      std_dev = Math.sqrt(recent_scores.map { |s| (s - recent_scores.sum.to_f / recent_scores.length) ** 2 }.sum / recent_scores.length)
      
      case
      when std_dev < 3
        'very_consistent'
      when std_dev < 5
        'consistent'
      when std_dev < 8
        'variable'
      else
        'inconsistent'
      end
    end

    def calculate_score_volatility(scores)
      return 0.0 if scores.length < 2
      
      differences = scores.each_cons(2).map { |a, b| (a - b).abs }
      differences.sum.to_f / differences.length
    end

    def calculate_improvement_rate(scores)
      return 0.0 if scores.length < 4
      
      # Simple linear regression to find improvement rate
      x_values = (1..scores.length).to_a
      n = scores.length
      
      sum_x = x_values.sum
      sum_y = scores.sum
      sum_xy = x_values.zip(scores).map { |x, y| x * y }.sum
      sum_x_squared = x_values.map { |x| x * x }.sum
      
      slope = (n * sum_xy - sum_x * sum_y).to_f / (n * sum_x_squared - sum_x * sum_x)
      -slope # Negative because lower scores are better
    end

    def calculate_consistency_within_range(scores, range)
      return 0.0 if scores.empty?
      
      mean = scores.sum.to_f / scores.length
      within_range = scores.count { |score| (score - mean).abs <= range }
      
      (within_range.to_f / scores.length * 100).round(1)
    end
  end
end