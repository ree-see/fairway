class Api::V1::RoundsController < ApplicationController
  before_action :set_round, only: [:show, :update, :complete, :request_attestation, :hole_scores]

  def index
    rounds = current_user.rounds.includes(:course, :hole_scores).recent
    
    # Filter by status if provided
    case params[:status]
    when 'completed'
      rounds = rounds.completed
    when 'in_progress'
      rounds = rounds.in_progress
    when 'verified'
      rounds = rounds.verified
    end

    # Limit results
    limit = [params[:limit]&.to_i || 20, 50].min
    rounds = rounds.limit(limit)

    render_success({
      rounds: rounds.map { |round| round_response(round) }
    })
  end

  def show
    render_success({ 
      round: detailed_round_response(@round),
      hole_scores: @round.hole_scores.includes(:hole).order('holes.number').map { |score| hole_score_response(score) }
    })
  end

  def create
    # Verify user is at course location
    course = Course.find(round_params[:course_id])
    
    if round_params[:start_latitude] && round_params[:start_longitude]
      unless course.within_geofence?(round_params[:start_latitude].to_f, round_params[:start_longitude].to_f)
        return render_error("You must be at the course to start a round", :forbidden)
      end
    end

    round = current_user.rounds.build(round_params)
    round.started_at = Time.current
    round.course_rating = course.course_rating
    round.slope_rating = course.slope_rating

    if round.save
      render_success({ round: detailed_round_response(round) }, "Round started successfully", :created)
    else
      render_error("Failed to start round", :unprocessable_entity, round.errors.full_messages)
    end
  end

  def update
    return render_error("Round already completed") if @round.completed?

    if @round.update(round_update_params)
      render_success({ round: detailed_round_response(@round) }, "Round updated successfully")
    else
      render_error("Failed to update round", :unprocessable_entity, @round.errors.full_messages)
    end
  end

  def complete
    return render_error("Round already completed") if @round.completed?
    
    # Verify minimum number of holes completed
    if @round.holes_completed < 9
      return render_error("Must complete at least 9 holes to finish round")
    end

    @round.completed_at = Time.current
    @round.submitted_at = Time.current

    if @round.save
      render_success({ round: detailed_round_response(@round) }, "Round completed successfully")
    else
      render_error("Failed to complete round", :unprocessable_entity, @round.errors.full_messages)
    end
  end

  def request_attestation
    return render_error("Round must be completed first") unless @round.completed?
    
    attester_email = params[:attester_email]&.downcase&.strip
    return render_error("Attester email required") unless attester_email

    attester = User.find_by(email: attester_email)
    return render_error("Attester not found") unless attester

    if @round.request_attestation(attester)
      # In a real app, this would send a push notification or email
      render_success(nil, "Attestation request sent successfully")
    else
      render_error("Failed to send attestation request")
    end
  end

  def hole_scores
    scores = @round.hole_scores.includes(:hole).order('holes.number')
    
    render_success({
      round: round_response(@round),
      hole_scores: scores.map { |score| hole_score_response(score) }
    })
  end

  def add_hole_score
    hole = @round.course.holes.find_by(number: hole_score_params[:hole_number])
    return render_error("Hole not found") unless hole

    # Check if score already exists for this hole
    existing_score = @round.hole_scores.find_by(hole: hole)
    
    if existing_score
      if existing_score.update(hole_score_params.except(:hole_number))
        render_success({ hole_score: hole_score_response(existing_score) }, "Hole score updated")
      else
        render_error("Failed to update hole score", :unprocessable_entity, existing_score.errors.full_messages)
      end
    else
      score = @round.hole_scores.build(hole_score_params)
      score.hole = hole
      score.started_at = Time.current
      score.completed_at = Time.current

      if score.save
        render_success({ hole_score: hole_score_response(score) }, "Hole score added", :created)
      else
        render_error("Failed to add hole score", :unprocessable_entity, score.errors.full_messages)
      end
    end
  end

  def statistics
    rounds = current_user.rounds.completed.includes(:hole_scores, :course)
    
    stats = {
      total_rounds: rounds.count,
      verified_rounds: rounds.verified.count,
      average_score: current_user.average_score,
      lowest_score: rounds.minimum(:total_strokes),
      handicap_index: current_user.handicap_index,
      verified_handicap: current_user.verified_handicap,
      recent_trend: calculate_recent_trend(rounds.limit(10))
    }

    render_success({ statistics: stats })
  end

  private

  def set_round
    @round = current_user.rounds.find(params[:id])
  end

  def round_params
    params.require(:round).permit(:course_id, :tee_color, :start_latitude, :start_longitude, :weather_conditions, :temperature, :wind_speed, :wind_direction)
  end

  def round_update_params
    params.require(:round).permit(:weather_conditions, :temperature, :wind_speed, :wind_direction)
  end

  def hole_score_params
    params.require(:hole_score).permit(:hole_number, :strokes, :putts, :fairway_hit, :green_in_regulation, :penalties, :drive_distance, :approach_distance)
  end

  def round_response(round)
    {
      id: round.id,
      course_id: round.course_id,
      course_name: round.course.name,
      started_at: round.started_at,
      completed_at: round.completed_at,
      tee_color: round.tee_color,
      total_strokes: round.total_strokes,
      total_putts: round.total_putts,
      holes_completed: round.holes_completed,
      completion_percentage: round.completion_percentage,
      is_verified: round.is_verified,
      is_provisional: round.is_provisional,
      verification_count: round.verification_count,
      fraud_risk_score: round.fraud_risk_score,
      location_verified: round.location_verified,
      weather_conditions: round.weather_conditions,
      temperature: round.temperature
    }
  end

  def detailed_round_response(round)
    base_response = round_response(round)
    base_response.merge({
      course: {
        id: round.course.id,
        name: round.course.name,
        par: round.course.par,
        course_rating: round.course_rating,
        slope_rating: round.slope_rating
      },
      score_differential: round.score_differential,
      fairways_hit: round.fairways_hit,
      greens_in_regulation: round.greens_in_regulation,
      total_penalties: round.total_penalties,
      duration_minutes: round.duration_minutes
    })
  end

  def hole_score_response(score)
    {
      id: score.id,
      hole_number: score.hole_number,
      par: score.hole.par,
      strokes: score.strokes,
      putts: score.putts,
      fairway_hit: score.fairway_hit,
      green_in_regulation: score.green_in_regulation,
      penalties: score.penalties,
      drive_distance: score.drive_distance,
      approach_distance: score.approach_distance,
      score_relative_to_par: score.score_relative_to_par,
      score_name: score.score_name,
      strokes_gained_total: score.strokes_gained_total,
      net_score: score.net_score
    }
  end

  def calculate_recent_trend(recent_rounds)
    return nil if recent_rounds.count < 5
    
    scores = recent_rounds.pluck(:total_strokes).compact
    return nil if scores.empty?

    first_half = scores.last(scores.count / 2)
    second_half = scores.first(scores.count / 2)
    
    first_avg = first_half.sum / first_half.count.to_f
    second_avg = second_half.sum / second_half.count.to_f
    
    difference = second_avg - first_avg
    
    if difference < -1.0
      "improving"
    elsif difference > 1.0
      "declining" 
    else
      "stable"
    end
  end
end