class RoundService
  class << self
    def create_round(user:, course:, tee_color:, start_location: nil)
      round = user.rounds.build(
        course: course,
        tee_color: tee_color,
        started_at: Time.current,
        course_rating: course.course_rating_for_tee(tee_color),
        slope_rating: course.slope_rating_for_tee(tee_color)
      )

      if start_location
        round.start_latitude = start_location[:latitude]
        round.start_longitude = start_location[:longitude]
      end

      round.save!
      round
    end

    def complete_round(round)
      return false unless round.in_progress?
      return false unless round.hole_scores.any?

      round.update!(
        completed_at: Time.current,
        holes_completed: round.hole_scores.count
      )

      # Trigger handicap recalculation
      HandicapService.update_user_handicaps(round.user)
      
      true
    end

    def calculate_score_differential(round)
      return nil unless valid_for_differential?(round)

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
        HandicapService.net_double_bogey_for_hole(hole, round.user.handicap_index, round.slope_rating)
      end

      [round.total_strokes, max_scores.sum].min
    end

    def calculate_fraud_risk_score(round)
      factors = []
      risk_score = 0.0

      # Factor 1: Score compared to user's average
      if round.user.rounds.completed.any?
        avg_score = round.user.rounds.completed.average(:total_strokes)
        score_improvement = ((avg_score - round.total_strokes) / avg_score * 100)
        
        if score_improvement > 15
          factors << "significant_score_improvement"
          risk_score += 25.0
        end
      end

      # Factor 2: Round duration (too fast or too slow)
      duration = round.duration_minutes
      if duration
        expected_duration = round.course.holes.count * 12 # 12 minutes per hole average
        
        if duration < expected_duration * 0.5
          factors << "round_too_fast"
          risk_score += 20.0
        elsif duration > expected_duration * 2
          factors << "round_too_slow"
          risk_score += 10.0
        end
      end

      # Factor 3: Location verification
      unless round.location_verified?
        factors << "location_not_verified"
        risk_score += 30.0
      end

      # Factor 4: Unusual scoring patterns
      if unusual_scoring_pattern?(round)
        factors << "unusual_scoring_pattern"
        risk_score += 15.0
      end

      # Factor 5: Time of day (very early or very late)
      hour = round.started_at.hour
      if hour < 5 || hour > 20
        factors << "unusual_tee_time"
        risk_score += 5.0
      end

      round.update!(
        fraud_risk_score: [risk_score, 100.0].min,
        fraud_risk_factors: factors.to_json
      )

      risk_score
    end

    def request_attestation(round, attester_email)
      attester = User.find_by(email: attester_email.downcase.strip)
      return { success: false, error: "Attester not found" } unless attester
      return { success: false, error: "Cannot attest own round" } if attester == round.user
      return { success: false, error: "Already requested" } if round.attesters.include?(attester)

      attestation = round.round_attestations.create!(
        attester: attester,
        requested_at: Time.current,
        is_approved: false
      )

      # Send notification to attester
      AttestationMailer.attestation_request(attestation).deliver_later

      { success: true, attestation: attestation }
    end

    def process_attestation(round, attester, approved:, comments: nil)
      attestation = round.round_attestations.find_by(attester: attester)
      return { success: false, error: "Attestation request not found" } unless attestation

      attestation.update!(
        is_approved: approved,
        comments: comments,
        attested_at: Time.current
      )

      update_verification_status(round)

      { success: true, attestation: attestation }
    end

    def statistics_for_round(round)
      return {} unless round.hole_scores.any?

      hole_scores = round.hole_scores.includes(:hole)
      
      {
        total_strokes: round.total_strokes,
        total_putts: round.total_putts,
        fairways_hit: round.fairways_hit,
        fairway_percentage: calculate_percentage(round.fairways_hit, driveable_holes(round)),
        greens_in_regulation: round.greens_in_regulation,
        gir_percentage: calculate_percentage(round.greens_in_regulation, round.course.holes.count),
        average_putts_per_hole: round.total_putts.to_f / round.course.holes.count,
        penalties: round.total_penalties,
        score_to_par: round.total_strokes - round.course.par,
        best_hole: best_hole_performance(hole_scores),
        worst_hole: worst_hole_performance(hole_scores)
      }
    end

    private

    def valid_for_differential?(round)
      round.total_strokes.present? &&
        round.course_rating.present? &&
        round.slope_rating.present? &&
        round.completed_at.present?
    end

    def unusual_scoring_pattern?(round)
      hole_scores = round.hole_scores.order(:hole_number)
      return false if hole_scores.count < 9

      # Check for too many eagles/birdies
      eagles_birdies = hole_scores.joins(:hole).where(
        'hole_scores.strokes <= holes.par - 1'
      ).count
      
      eagles_birdies > 6 # More than 6 eagles/birdies is unusual
    end

    def update_verification_status(round)
      verification_count = round.round_attestations.where(is_approved: true).count
      
      round.update!(
        verification_count: verification_count,
        is_verified: verification_count >= 1 && round.fraud_risk_score < 50.0,
        is_provisional: !(verification_count >= 1 && round.fraud_risk_score < 50.0)
      )

      # Update user handicaps if verification status changed
      HandicapService.update_user_handicaps(round.user) if round.saved_change_to_is_verified?
    end

    def calculate_percentage(numerator, denominator)
      return 0.0 if denominator.zero?
      (numerator.to_f / denominator * 100).round(1)
    end

    def driveable_holes(round)
      round.course.holes.where('par >= ?', 4).count
    end

    def best_hole_performance(hole_scores)
      hole_scores.joins(:hole)
                 .select('hole_scores.*, holes.par, (hole_scores.strokes - holes.par) as score_to_par')
                 .order('score_to_par ASC')
                 .first
    end

    def worst_hole_performance(hole_scores)
      hole_scores.joins(:hole)
                 .select('hole_scores.*, holes.par, (hole_scores.strokes - holes.par) as score_to_par')
                 .order('score_to_par DESC')
                 .first
    end
  end
end