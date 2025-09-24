class HandicapService
  MINIMUM_ROUNDS_FOR_HANDICAP = 5
  MAXIMUM_ROUNDS_CONSIDERED = 20
  BEST_SCORES_USED = 8
  HANDICAP_MULTIPLIER = 0.96
  
  class << self
    def calculate_provisional_handicap(user)
      rounds = eligible_rounds_for_handicap(user, verified_only: false)
      return nil if rounds.count < MINIMUM_ROUNDS_FOR_HANDICAP

      calculate_handicap_from_rounds(rounds)
    end

    def calculate_verified_handicap(user)
      rounds = eligible_rounds_for_handicap(user, verified_only: true)
      return nil if rounds.count < MINIMUM_ROUNDS_FOR_HANDICAP

      calculate_handicap_from_rounds(rounds)
    end

    def update_user_handicaps(user)
      user.update!(
        handicap_index: calculate_provisional_handicap(user),
        verified_handicap: calculate_verified_handicap(user)
      )
    end

    def calculate_score_differential(round)
      return nil unless valid_round_for_differential?(round)

      # USGA Score Differential Formula:
      # (113 / Slope Rating) x (Adjusted Gross Score - Course Rating - PCC)
      slope_rating = round.slope_rating
      course_rating = round.course_rating
      adjusted_gross_score = calculate_adjusted_gross_score(round)
      pcc = 0 # Playing Conditions Calculation (simplified to 0 for now)

      differential = (113.0 / slope_rating) * (adjusted_gross_score - course_rating - pcc)
      differential.round(1)
    end

    def calculate_adjusted_gross_score(round)
      return round.total_strokes unless round.course.holes.any?

      # Apply maximum hole scores based on Net Double Bogey
      max_scores = round.course.holes.map do |hole|
        net_double_bogey_for_hole(hole, round.user.handicap_index, round.slope_rating)
      end

      [round.total_strokes, max_scores.sum].min
    end

    def net_double_bogey_for_hole(hole, handicap_index, slope_rating)
      # Net Double Bogey = Par + 2 + handicap strokes for hole
      par = hole.par
      handicap_strokes = calculate_handicap_strokes_for_hole(hole, handicap_index, slope_rating)
      
      par + 2 + handicap_strokes
    end

    def calculate_handicap_strokes_for_hole(hole, handicap_index, slope_rating)
      return 0 unless handicap_index

      # Calculate course handicap
      course_handicap = (handicap_index * slope_rating / 113.0).round
      
      # Determine strokes received on this hole
      if course_handicap >= hole.handicap
        1 + ((course_handicap - hole.handicap) / 18)
      else
        0
      end
    end

    def handicap_trend_analysis(user, periods = 5)
      recent_rounds = user.rounds.completed
                          .includes(:course)
                          .order(started_at: :desc)
                          .limit(periods * 4) # 4 rounds per period

      return nil if recent_rounds.count < periods * 2

      # Group rounds into periods and calculate trend
      rounds_per_period = recent_rounds.each_slice(4).to_a.first(periods)
      
      period_handicaps = rounds_per_period.map do |period_rounds|
        calculate_handicap_from_rounds(period_rounds)
      end

      calculate_trend(period_handicaps.compact)
    end

    def playing_ability_assessment(user)
      recent_rounds = user.rounds.completed.includes(:hole_scores).limit(10)
      return nil if recent_rounds.empty?

      {
        consistency: calculate_consistency_score(recent_rounds),
        improvement_trend: handicap_trend_analysis(user),
        strength_areas: identify_strength_areas(recent_rounds),
        improvement_areas: identify_improvement_areas(recent_rounds)
      }
    end

    private

    def eligible_rounds_for_handicap(user, verified_only: false)
      scope = user.rounds.completed
                  .where.not(score_differential: nil)
                  .order(started_at: :desc)
                  .limit(MAXIMUM_ROUNDS_CONSIDERED)

      scope = scope.where(is_verified: true) if verified_only
      scope
    end

    def calculate_handicap_from_rounds(rounds)
      return nil if rounds.empty?

      differentials = rounds.map(&:score_differential).compact.sort
      return nil if differentials.empty?

      # Use best 8 scores, or all if fewer than 8
      best_count = [BEST_SCORES_USED, differentials.count].min
      best_differentials = differentials.first(best_count)

      average_differential = best_differentials.sum / best_differentials.count.to_f
      (average_differential * HANDICAP_MULTIPLIER).round(1)
    end

    def valid_round_for_differential?(round)
      round.total_strokes.present? &&
        round.course_rating.present? &&
        round.slope_rating.present? &&
        round.completed_at.present?
    end

    def calculate_trend(values)
      return 'stable' if values.length < 2

      # Simple linear regression slope
      n = values.length
      x_values = (1..n).to_a
      
      sum_x = x_values.sum
      sum_y = values.sum
      sum_xy = x_values.zip(values).map { |x, y| x * y }.sum
      sum_x_squared = x_values.map { |x| x * x }.sum

      slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x_squared - sum_x * sum_x).to_f

      case
      when slope < -0.5
        'improving'
      when slope > 0.5
        'declining'
      else
        'stable'
      end
    end

    def calculate_consistency_score(rounds)
      scores = rounds.map(&:total_strokes).compact
      return 0 if scores.length < 3

      mean = scores.sum / scores.length.to_f
      variance = scores.map { |score| (score - mean) ** 2 }.sum / scores.length.to_f
      std_dev = Math.sqrt(variance)

      # Convert to 0-100 scale (lower std_dev = higher consistency)
      consistency = [100 - (std_dev * 5), 0].max.round(1)
      [consistency, 100].min
    end

    def identify_strength_areas(rounds)
      scores_by_category = {
        driving: rounds.flat_map { |r| r.hole_scores.map(&:fairway_hit) }.compact,
        approach: rounds.flat_map { |r| r.hole_scores.map(&:green_in_regulation) }.compact,
        putting: rounds.flat_map { |r| r.hole_scores.map(&:putts) }.compact.select(&:positive?)
      }

      strengths = []
      
      # Driving accuracy
      if scores_by_category[:driving].any?
        accuracy = scores_by_category[:driving].count(true) / scores_by_category[:driving].length.to_f
        strengths << 'driving' if accuracy > 0.7
      end

      # GIR percentage
      if scores_by_category[:approach].any?
        gir_percentage = scores_by_category[:approach].count(true) / scores_by_category[:approach].length.to_f
        strengths << 'approach' if gir_percentage > 0.6
      end

      # Putting average
      if scores_by_category[:putting].any?
        avg_putts = scores_by_category[:putting].sum / scores_by_category[:putting].length.to_f
        strengths << 'putting' if avg_putts < 1.8
      end

      strengths
    end

    def identify_improvement_areas(rounds)
      # Inverse of strength areas
      all_areas = %w[driving approach putting short_game]
      strengths = identify_strength_areas(rounds)
      all_areas - strengths
    end
  end
end