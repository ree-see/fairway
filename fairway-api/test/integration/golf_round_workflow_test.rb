require 'test_helper'

class GolfRoundWorkflowTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:one)
    @course = courses(:one)
    @tokens = JwtService.generate_tokens(@user)
    @access_token = @tokens[:access_token]
    @auth_headers = { 
      'Authorization' => "Bearer #{@access_token}",
      'Content-Type' => 'application/json'
    }
    
    # Set up course with proper data
    @course.update!(
      course_rating: 72.5,
      slope_rating: 130,
      par: 72,
      latitude: 40.0,
      longitude: -75.0,
      geofence_radius: 500
    )
  end

  test "complete golf round workflow with GPS verification" do
    # Start a round at the course location
    round_params = {
      course_id: @course.id,
      tee_color: 'white',
      start_latitude: 40.0001, # Very close to course location
      start_longitude: -74.9999,
      weather_conditions: 'Sunny'
    }

    post '/api/v1/rounds',
         params: { round: round_params },
         headers: @auth_headers

    assert_response :created
    response_data = JSON.parse(response.body)
    assert response_data['success']
    
    round_id = response_data['data']['round']['id']
    assert_equal @course.id, response_data['data']['round']['course_id']
    assert_equal 'white', response_data['data']['round']['tee_color']

    # Add hole scores
    18.times do |hole_number|
      hole_score_params = {
        hole_number: hole_number + 1,
        strokes: 4,
        putts: 2,
        fairway_hit: true,
        green_in_regulation: true
      }

      post "/api/v1/rounds/#{round_id}/add_hole_score",
           params: { hole_score: hole_score_params },
           headers: @auth_headers

      assert_response :success
    end

    # Complete the round
    patch "/api/v1/rounds/#{round_id}/complete",
          headers: @auth_headers

    assert_response :success
    response_data = JSON.parse(response.body)
    
    round_data = response_data['data']['round']
    assert_present round_data['completed_at']
    assert_equal 72, round_data['total_strokes'] # 4 strokes per hole * 18 holes
    assert_equal 18, round_data['holes_completed']
    assert_present round_data['score_differential']

    # Verify round appears in user's rounds
    get '/api/v1/rounds',
        headers: @auth_headers

    assert_response :success
    rounds_data = JSON.parse(response.body)
    assert rounds_data['data']['rounds'].any? { |r| r['id'] == round_id }
  end

  test "cannot start round outside geofence" do
    round_params = {
      course_id: @course.id,
      tee_color: 'white',
      start_latitude: 41.0, # Too far from course
      start_longitude: -76.0,
      weather_conditions: 'Sunny'
    }

    post '/api/v1/rounds',
         params: { round: round_params },
         headers: @auth_headers

    assert_response :forbidden
    response_data = JSON.parse(response.body)
    assert_includes response_data['error'], 'must be at the course'
  end

  test "round with peer attestation workflow" do
    # Create another user (attester)
    attester = User.create!(
      email: 'attester@example.com',
      password: 'SecurePassword123!',
      first_name: 'Golf',
      last_name: 'Buddy'
    )

    # Start and complete a round
    round = @user.rounds.create!(
      course: @course,
      started_at: 2.hours.ago,
      completed_at: 1.hour.ago,
      total_strokes: 85,
      tee_color: 'white',
      course_rating: @course.course_rating,
      slope_rating: @course.slope_rating
    )

    # Request attestation
    post "/api/v1/rounds/#{round.id}/request_attestation",
         params: { attester_email: attester.email },
         headers: @auth_headers

    assert_response :success

    # Verify attestation was created
    attestation = round.round_attestations.first
    assert_not_nil attestation
    assert_equal attester.id, attestation.attester_id
    assert_not attestation.is_approved?

    # Check round verification status
    get "/api/v1/rounds/#{round.id}",
        headers: @auth_headers

    assert_response :success
    response_data = JSON.parse(response.body)
    round_data = response_data['data']['round']
    
    # Round should not be verified yet
    assert_not round_data['is_verified']
  end

  test "handicap calculation updates after completed rounds" do
    # Get initial handicap
    get '/api/v1/users/profile',
        headers: @auth_headers

    initial_response = JSON.parse(response.body)
    initial_handicap = initial_response['data']['user']['handicap_index']

    # Create multiple completed rounds to trigger handicap calculation
    5.times do |i|
      round = @user.rounds.create!(
        course: @course,
        started_at: (i + 1).days.ago,
        completed_at: (i + 1).days.ago + 4.hours,
        total_strokes: 85 + i, # Varying scores
        tee_color: 'white',
        course_rating: @course.course_rating,
        slope_rating: @course.slope_rating
      )

      # Calculate score differential
      calculator = HandicapCalculatorService.new(@user)
      round.update!(score_differential: calculator.calculate_score_differential(round))
    end

    # Trigger handicap recalculation
    @user.save!

    # Get updated handicap
    get '/api/v1/users/profile',
        headers: @auth_headers

    updated_response = JSON.parse(response.body)
    updated_handicap = updated_response['data']['user']['handicap_index']

    # Handicap should be calculated now (not necessarily different from initial)
    assert_not_nil updated_handicap
  end

  test "round statistics are calculated correctly" do
    # Create completed rounds with known data
    rounds_data = [
      { strokes: 72, putts: 28, fairways: 10, gir: 12 },
      { strokes: 78, putts: 32, fairways: 8, gir: 10 },
      { strokes: 85, putts: 36, fairways: 6, gir: 8 }
    ]

    rounds_data.each_with_index do |data, i|
      @user.rounds.create!(
        course: @course,
        started_at: (i + 1).days.ago,
        completed_at: (i + 1).days.ago + 4.hours,
        total_strokes: data[:strokes],
        total_putts: data[:putts],
        fairways_hit: data[:fairways],
        greens_in_regulation: data[:gir],
        tee_color: 'white',
        course_rating: @course.course_rating,
        slope_rating: @course.slope_rating
      )
    end

    # Get statistics
    get '/api/v1/rounds/statistics',
        headers: @auth_headers

    assert_response :success
    response_data = JSON.parse(response.body)
    stats = response_data['data']['statistics']

    assert_equal 3, stats['total_rounds']
    assert_equal 78.33, stats['average_score'].round(2) # (72 + 78 + 85) / 3
    assert_equal 72, stats['lowest_score']
  end

  test "hole score validation prevents invalid data" do
    round = @user.rounds.create!(
      course: @course,
      started_at: 1.hour.ago,
      tee_color: 'white'
    )

    # Try to add invalid hole score
    invalid_hole_score = {
      hole_number: 19, # Invalid hole number
      strokes: 20, # Unreasonable stroke count
      putts: 15 # Unreasonable putt count
    }

    post "/api/v1/rounds/#{round.id}/add_hole_score",
         params: { hole_score: invalid_hole_score },
         headers: @auth_headers

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_includes response_data['error'], 'Valid hole number'
  end

  test "cannot complete round without minimum holes" do
    round = @user.rounds.create!(
      course: @course,
      started_at: 1.hour.ago,
      tee_color: 'white'
    )

    # Add only a few hole scores (less than 9)
    3.times do |i|
      round.hole_scores.create!(
        hole: @course.holes.create!(number: i + 1, par: 4),
        hole_number: i + 1,
        strokes: 4
      )
    end

    # Try to complete round
    patch "/api/v1/rounds/#{round.id}/complete",
          headers: @auth_headers

    assert_response :unprocessable_entity
    response_data = JSON.parse(response.body)
    assert_includes response_data['error'], 'Must complete at least 9 holes'
  end

  private

  def assert_present(value)
    assert_not_nil value
    assert_not value.to_s.empty?
  end
end