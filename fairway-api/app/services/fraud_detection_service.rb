class FraudDetectionService
  def initialize(round)
    @round = round
  end

  def calculate_fraud_risk_score
    return 0.0 unless @round.persisted?

    risk_factors = []
    score = 0.0

    # Check for unusual scoring patterns
    score += check_scoring_patterns(risk_factors)
    
    # Check location consistency
    score += check_location_consistency(risk_factors)
    
    # Check round duration
    score += check_round_duration(risk_factors)
    
    # Check historical patterns
    score += check_historical_patterns(risk_factors)

    # Store risk factors as JSON
    @round.update_column(:fraud_risk_factors, risk_factors.to_json) unless risk_factors.empty?

    [score, 100.0].min # Cap at 100
  end

  def fraud_risk_factors_list
    return [] unless @round.fraud_risk_factors.present?
    
    JSON.parse(@round.fraud_risk_factors)
  rescue JSON::ParserError
    []
  end

  def verify_location(start_latitude, start_longitude)
    return false unless start_latitude && start_longitude
    
    # Use GeolocationService for consistent calculation
    geolocation_service = GeolocationService.new(
      latitude: start_latitude, 
      longitude: start_longitude
    )
    
    geolocation_service.within_radius_of?(@round.course, @round.course.geofence_radius)
  end

  private

  def check_scoring_patterns(risk_factors)
    return 0.0 unless @round.hole_scores.any?

    risk_score = 0.0
    hole_scores = @round.hole_scores.includes(:hole)

    # Check for unusual ace frequency
    aces = hole_scores.joins(:hole).where('hole_scores.strokes = 1 AND holes.par > 1').count
    if aces > 1
      risk_factors << "Multiple aces in single round"
      risk_score += 30.0
    end

    # Check for impossible scores (albatross on par 4, etc.)
    eagles_on_par_4 = hole_scores.joins(:hole)
                                .where('hole_scores.strokes = 2 AND holes.par = 4').count
    if eagles_on_par_4 > 2
      risk_factors << "Multiple eagles on par 4s"
      risk_score += 25.0
    end

    # Check for dramatically improved scoring
    recent_average = @round.user.recent_rounds(5).average(:total_strokes)
    if recent_average && @round.total_strokes < (recent_average - 10)
      risk_factors << "Score significantly better than recent average"
      risk_score += 20.0
    end

    risk_score
  end

  def check_location_consistency(risk_factors)
    return 0.0 unless @round.start_latitude && @round.start_longitude

    risk_score = 0.0

    # Check if started outside geofence
    unless @round.location_verified
      risk_factors << "Round started outside course geofence"
      risk_score += 15.0
    end

    # TODO: Check for GPS track consistency during round
    # This would require storing GPS points throughout the round

    risk_score
  end

  def check_round_duration(risk_factors)
    return 0.0 unless @round.started_at && @round.completed_at

    risk_score = 0.0
    duration_hours = (@round.completed_at - @round.started_at) / 1.hour

    # Check for suspiciously short rounds
    if duration_hours < 2.0 && @round.holes_completed >= 9
      risk_factors << "Round completed unusually quickly"
      risk_score += 25.0
    end

    # Check for suspiciously long rounds (possible data manipulation)
    if duration_hours > 8.0
      risk_factors << "Round duration unusually long"
      risk_score += 10.0
    end

    risk_score
  end

  def check_historical_patterns(risk_factors)
    return 0.0 unless @round.user

    risk_score = 0.0

    # Check for frequent very good rounds without progression
    excellent_rounds = @round.user.rounds.completed
                                  .where('total_strokes < ?', 75)
                                  .where('started_at > ?', 30.days.ago)
                                  .count

    if excellent_rounds > 5 && @round.user.handicap_index.to_f > 10.0
      risk_factors << "Frequent excellent scores inconsistent with handicap"
      risk_score += 20.0
    end

    # Check for new user with immediately excellent scores
    if @round.user.rounds.count < 5 && @round.total_strokes.to_i < 80
      risk_factors << "New user with immediately excellent scores"
      risk_score += 15.0
    end

    risk_score
  end
end