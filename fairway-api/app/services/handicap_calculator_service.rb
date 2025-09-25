class HandicapCalculatorService
  # USGA Handicap System constants
  HANDICAP_DIFFERENTIAL_FACTOR = 113.0
  MAX_HANDICAP_INDEX = 54.0
  MIN_HANDICAP_INDEX = -10.0
  MINIMUM_ROUNDS_FOR_HANDICAP = 5
  MINIMUM_ROUNDS_FOR_VERIFIED_HANDICAP = 10
  MAX_ROUNDS_FOR_CALCULATION = 20
  EXCEPTIONAL_SCORE_REDUCTION = 1.0

  def initialize(user)
    @user = user
  end

  # Calculate standard handicap index from all completed rounds
  def calculate_handicap_index
    eligible_rounds = get_eligible_rounds_for_handicap
    return nil if eligible_rounds.count < MINIMUM_ROUNDS_FOR_HANDICAP

    handicap_differentials = calculate_differentials(eligible_rounds)
    return nil if handicap_differentials.empty?

    # Apply USGA handicap calculation rules
    handicap_index = apply_handicap_calculation_rules(handicap_differentials)
    apply_exceptional_score_reduction(handicap_index, handicap_differentials)
  end

  # Calculate verified handicap from verified rounds only
  def calculate_verified_handicap
    verified_rounds = get_eligible_verified_rounds
    return nil if verified_rounds.count < MINIMUM_ROUNDS_FOR_VERIFIED_HANDICAP

    handicap_differentials = calculate_differentials(verified_rounds)
    return nil if handicap_differentials.empty?

    handicap_index = apply_handicap_calculation_rules(handicap_differentials)
    apply_exceptional_score_reduction(handicap_index, handicap_differentials)
  end

  # Calculate score differential for a specific round
  def calculate_score_differential(round)
    return nil unless round.completed? && round.total_strokes && round.course_rating && round.slope_rating

    # Apply ESC (Equitable Stroke Control) adjustments
    adjusted_score = apply_esc_adjustments(round)
    
    # Score Differential = (Adjusted Gross Score - Course Rating) × 113 / Slope Rating
    differential = (adjusted_score - round.course_rating) * HANDICAP_DIFFERENTIAL_FACTOR / round.slope_rating
    differential.round(1)
  end

  # Get recent rounds for trend analysis
  def get_recent_trend(rounds_count = 10)
    recent_rounds = @user.rounds.completed
                         .where.not(score_differential: nil)
                         .order(completed_at: :desc)
                         .limit(rounds_count)
    
    return nil if recent_rounds.count < 5

    differentials = recent_rounds.pluck(:score_differential)
    calculate_trend(differentials)
  end

  # Get performance statistics
  def get_performance_stats
    completed_rounds = @user.rounds.completed.includes(:course)
    
    return {} if completed_rounds.empty?

    {
      total_rounds: completed_rounds.count,
      verified_rounds: completed_rounds.verified.count,
      average_score: calculate_average_score(completed_rounds),
      average_differential: calculate_average_differential(completed_rounds),
      lowest_round: completed_rounds.minimum(:total_strokes),
      best_differential: completed_rounds.minimum(:score_differential),
      courses_played: completed_rounds.joins(:course).distinct.count('courses.id'),
      improvement_rate: calculate_improvement_rate(completed_rounds)
    }
  end

  # Calculate playing handicap for a specific course/tee
  def calculate_playing_handicap(course_handicap = nil, slope_rating = nil)
    handicap_index = @user.handicap_index
    return nil unless handicap_index

    # If no course handicap provided, use the handicap index
    return handicap_index.round if course_handicap.nil?

    # Playing Handicap = Course Handicap × (Slope Rating ÷ 113) + Course Rating - Par
    return course_handicap if slope_rating.nil?

    playing_handicap = course_handicap * (slope_rating / HANDICAP_DIFFERENTIAL_FACTOR)
    [playing_handicap.round, 0].max # Ensure non-negative
  end

  private

  def get_eligible_rounds_for_handicap
    @user.rounds.completed
         .where.not(total_strokes: nil, course_rating: nil, slope_rating: nil)
         .where('completed_at >= ?', 365.days.ago) # Only rounds from last year
         .order(completed_at: :desc)
         .limit(MAX_ROUNDS_FOR_CALCULATION)
  end

  def get_eligible_verified_rounds
    @user.rounds.completed.verified
         .where.not(total_strokes: nil, course_rating: nil, slope_rating: nil)
         .where('completed_at >= ?', 365.days.ago)
         .order(completed_at: :desc)
         .limit(MAX_ROUNDS_FOR_CALCULATION)
  end

  def calculate_differentials(rounds)
    rounds.map { |round| calculate_score_differential(round) }.compact
  end

  def apply_handicap_calculation_rules(differentials)
    differentials = differentials.sort
    
    # Use appropriate number of lowest differentials based on total rounds
    case differentials.count
    when 5..6
      lowest_count = 1
    when 7..8
      lowest_count = 2
    when 9..11
      lowest_count = 3
    when 12..14
      lowest_count = 4
    when 15..16
      lowest_count = 5
    when 17..18
      lowest_count = 6
    when 19
      lowest_count = 7
    else # 20 or more
      lowest_count = 8
    end

    lowest_differentials = differentials.first(lowest_count)
    average_differential = lowest_differentials.sum / lowest_differentials.count.to_f
    
    # Apply 96% factor as per USGA rules
    handicap_index = average_differential * 0.96
    
    # Cap at maximum/minimum values
    [[handicap_index, MAX_HANDICAP_INDEX].min, MIN_HANDICAP_INDEX].max
  end

  def apply_exceptional_score_reduction(handicap_index, differentials)
    # Check for exceptional tournament scores
    low_differentials = differentials.select { |d| d <= handicap_index - 7.0 }
    
    if low_differentials.count >= 3
      handicap_index - EXCEPTIONAL_SCORE_REDUCTION
    else
      handicap_index
    end
  end

  def apply_esc_adjustments(round)
    # Equitable Stroke Control based on handicap
    handicap = @user.handicap_index || 54.0
    
    # Determine maximum score per hole based on handicap
    max_score_per_hole = case handicap
                        when -Float::INFINITY..9.4
                          6 # Double bogey + handicap strokes
                        when 9.4..19.4
                          7
                        when 19.4..29.4
                          8
                        when 29.4..39.4
                          9
                        else
                          10
                        end

    # Apply ESC to hole scores
    total_adjusted = 0
    round.hole_scores.includes(:hole).each do |hole_score|
      hole_par = hole_score.hole.par
      max_for_hole = hole_par + max_score_per_hole - hole_par # Simplified ESC
      adjusted_strokes = [hole_score.strokes, max_for_hole].min
      total_adjusted += adjusted_strokes
    end

    # If no hole scores, use total strokes (assume ESC already applied)
    total_adjusted > 0 ? total_adjusted : round.total_strokes
  end

  def calculate_trend(differentials)
    return "insufficient_data" if differentials.count < 5

    recent_half = differentials.first(differentials.count / 2)
    older_half = differentials.last(differentials.count / 2)

    recent_avg = recent_half.sum / recent_half.count.to_f
    older_avg = older_half.sum / older_half.count.to_f

    difference = recent_avg - older_avg

    case difference
    when -Float::INFINITY..-1.0
      "improving"
    when -1.0..1.0
      "stable"
    else
      "declining"
    end
  end

  def calculate_average_score(rounds)
    scores = rounds.where.not(total_strokes: nil).pluck(:total_strokes)
    return nil if scores.empty?
    
    (scores.sum / scores.count.to_f).round(1)
  end

  def calculate_average_differential(rounds)
    differentials = rounds.where.not(score_differential: nil).pluck(:score_differential)
    return nil if differentials.empty?
    
    (differentials.sum / differentials.count.to_f).round(1)
  end

  def calculate_improvement_rate(rounds)
    return nil if rounds.count < 10

    # Compare first 5 and last 5 rounds
    first_five = rounds.order(:completed_at).limit(5).average(:score_differential)
    last_five = rounds.order(completed_at: :desc).limit(5).average(:score_differential)

    return nil unless first_five && last_five

    improvement = first_five - last_five
    (improvement / first_five * 100).round(1) # Percentage improvement
  end
end