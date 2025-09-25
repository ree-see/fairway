class RoundScoringService
  def initialize(round)
    @round = round
  end

  def calculate_totals
    return unless @round.hole_scores.any?
    
    {
      total_strokes: @round.hole_scores.sum(:strokes),
      total_putts: @round.hole_scores.sum(:putts).presence || 0,
      fairways_hit: @round.hole_scores.where(fairway_hit: true).count,
      greens_in_regulation: @round.hole_scores.where(green_in_regulation: true).count,
      total_penalties: @round.hole_scores.sum(:penalties)
    }
  end

  def calculate_score_differential
    return nil unless @round.total_strokes && @round.course_rating && @round.slope_rating

    calculator = HandicapCalculatorService.new(@round.user)
    calculator.calculate_score_differential(@round)
  end

  def maximum_hole_scores
    return @round.total_strokes unless @round.course.holes.any?
    
    @round.course.holes.sum do |hole|
      # Net Double Bogey = Par + 2 + handicap strokes
      hole.par + 2 + handicap_strokes_for_hole(hole)
    end
  end

  def handicap_strokes_for_hole(hole)
    return 0 unless @round.user.handicap_index
    
    # Calculate strokes received on this hole based on handicap
    course_handicap = (@round.user.handicap_index * @round.slope_rating / 113.0).round
    
    if course_handicap >= hole.handicap
      1 + ((course_handicap - hole.handicap) / 18)
    else
      0
    end
  end

  def completion_percentage
    return 0 if @round.course.holes.empty?
    (@round.hole_scores.count.to_f / @round.course.holes.count * 100).round(1)
  end

  def duration_minutes
    return nil unless @round.started_at && @round.completed_at
    ((@round.completed_at - @round.started_at) / 60).round
  end
end