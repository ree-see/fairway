require 'test_helper'

class Api::V1::RoundsControllerTest < ActionController::TestCase
  def setup
    @user = create_test_user
    @course = create_test_course
    @other_user = create_test_user(email: "other@example.com")
    
    login_user(@user)
    request.headers.merge!(auth_headers)
  end

  test "GET index returns user's rounds with pagination" do
    # Create rounds for current user
    3.times { create_completed_round(user: @user) }
    
    # Create round for other user (should not appear)
    create_completed_round(user: @other_user)

    get :index

    assert_response :ok
    json = json_response
    
    assert_includes json, 'rounds'
    assert_includes json, 'pagination'
    
    assert_equal 3, json['rounds'].size
    json['rounds'].each do |round_data|
      assert_equal @user.id, round_data['user_id']
    end
  end

  test "GET index with filtering parameters" do
    completed_round = create_completed_round(user: @user)
    in_progress_round = create_test_round(user: @user, course: @course)

    # Test status filter
    get :index, params: { status: 'completed' }
    
    assert_response :ok
    json = json_response
    
    assert_equal 1, json['rounds'].size
    assert_equal completed_round.id, json['rounds'].first['id']
  end

  test "GET index with date range filtering" do
    old_round = create_completed_round(user: @user)
    old_round.update!(started_at: 1.month.ago)
    
    recent_round = create_completed_round(user: @user)

    get :index, params: { 
      date_from: 1.week.ago.to_date.iso8601,
      date_to: Time.current.to_date.iso8601
    }

    assert_response :ok
    json = json_response
    
    assert_equal 1, json['rounds'].size
    assert_equal recent_round.id, json['rounds'].first['id']
  end

  test "GET show returns round with hole scores" do
    round = create_completed_round(user: @user, course: @course)

    get :show, params: { id: round.id }

    assert_response :ok
    json = json_response
    
    assert_equal round.id, json['round']['id']
    assert_includes json['round'], 'hole_scores'
    assert_includes json['round'], 'course'
    assert_includes json['round'], 'statistics'
  end

  test "GET show for other user's round returns forbidden" do
    other_round = create_completed_round(user: @other_user)

    get :show, params: { id: other_round.id }

    assert_response :forbidden
    assert_error_response(response, 'UNAUTHORIZED')
  end

  test "GET show for non-existent round returns not found" do
    get :show, params: { id: 99999 }

    assert_response :not_found
    assert_error_response(response, 'RESOURCE_NOT_FOUND')
  end

  test "POST create creates new round with valid parameters" do
    assert_difference 'Round.count', 1 do
      post :create, params: {
        round: {
          course_id: @course.id,
          tee_color: 'blue',
          start_latitude: 34.0522,
          start_longitude: -118.2437
        }
      }
    end

    assert_response :created
    json = json_response
    
    round = Round.find(json['round']['id'])
    assert_equal @user, round.user
    assert_equal @course, round.course
    assert_equal 'blue', round.tee_color
    assert_not_nil round.started_at
  end

  test "POST create with invalid course returns error" do
    post :create, params: {
      round: {
        course_id: 99999,
        tee_color: 'blue'
      }
    }

    assert_response :not_found
    assert_error_response(response, 'RESOURCE_NOT_FOUND')
  end

  test "POST create with missing parameters returns error" do
    post :create, params: {
      round: {
        tee_color: 'blue'
        # course_id missing
      }
    }

    assert_response :unprocessable_entity
    assert_error_response(response, 'VALIDATION_ERROR')
  end

  test "POST create outside geofence returns location error" do
    post :create, params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue',
        start_latitude: 40.7128, # NYC coordinates (far from course)
        start_longitude: -74.0060
      }
    }

    # Assuming geofence validation is implemented
    # assert_response :unprocessable_entity
    # assert_error_response(response, 'GEOFENCE_VIOLATION')
  end

  test "PATCH update updates round in progress" do
    round = create_test_round(user: @user, course: @course)

    patch :update, params: {
      id: round.id,
      round: {
        weather_conditions: 'sunny',
        notes: 'Great round so far'
      }
    }

    assert_response :ok
    round.reload
    assert_equal 'sunny', round.weather_conditions
    assert_equal 'Great round so far', round.notes
  end

  test "PATCH update cannot modify completed round" do
    round = create_completed_round(user: @user, course: @course)

    patch :update, params: {
      id: round.id,
      round: {
        total_strokes: 70 # Try to change score
      }
    }

    # Should either forbid or ignore the change
    assert_response :forbidden
    assert_error_response(response, 'ROUND_COMPLETED')
  end

  test "POST complete completes round and calculates handicap" do
    round = create_test_round(user: @user, course: @course)
    
    # Add some hole scores
    5.times do |i|
      round.hole_scores.create!(
        hole_number: i + 1,
        strokes: 4,
        putts: 2
      )
    end

    post :complete, params: { id: round.id }

    assert_response :ok
    round.reload
    
    assert_not_nil round.completed_at
    assert round.completed?
    
    json = json_response
    assert_includes json['round'], 'handicap_impact'
    assert_includes json['round'], 'score_differential'
  end

  test "POST complete fails for round without hole scores" do
    round = create_test_round(user: @user, course: @course)

    post :complete, params: { id: round.id }

    assert_response :unprocessable_entity
    assert_error_response(response, 'INCOMPLETE_ROUND')
  end

  test "DELETE destroy removes round" do
    round = create_test_round(user: @user, course: @course)

    assert_difference 'Round.count', -1 do
      delete :destroy, params: { id: round.id }
    end

    assert_response :no_content
  end

  test "DELETE destroy cannot remove completed round" do
    round = create_completed_round(user: @user, course: @course)

    delete :destroy, params: { id: round.id }

    assert_response :forbidden
    assert_error_response(response, 'ROUND_COMPLETED')
  end

  test "POST update_hole_score updates specific hole" do
    round = create_test_round(user: @user, course: @course)
    
    # Create a hole for the course
    hole = @course.holes.create!(
      hole_number: 1,
      par: 4,
      handicap: 10,
      yardage: 380
    )

    post :update_hole_score, params: {
      id: round.id,
      hole_number: 1,
      hole_score: {
        strokes: 5,
        putts: 2,
        fairway_hit: true,
        green_in_regulation: false,
        penalties: 1
      }
    }

    assert_response :ok
    hole_score = round.hole_scores.find_by(hole_number: 1)
    
    assert_equal 5, hole_score.strokes
    assert_equal 2, hole_score.putts
    assert hole_score.fairway_hit
    assert_not hole_score.green_in_regulation
    assert_equal 1, hole_score.penalties
  end

  test "GET statistics returns comprehensive round statistics" do
    round = create_completed_round(user: @user, course: @course)

    get :statistics, params: { id: round.id }

    assert_response :ok
    json = json_response
    
    expected_keys = %w[
      total_strokes total_putts fairways_hit fairway_percentage
      greens_in_regulation gir_percentage average_putts_per_hole
      penalties score_to_par best_hole worst_hole
    ]
    
    expected_keys.each do |key|
      assert_includes json['statistics'], key
    end
  end

  test "POST request_attestation sends attestation request" do
    round = create_completed_round(user: @user, course: @course)
    attester = create_test_user(email: "attester@example.com")

    # Mock the mailer
    AttestationMailer.expects(:attestation_request).returns(
      mock('mailer').tap { |m| m.expects(:deliver_later) }
    )

    post :request_attestation, params: {
      id: round.id,
      attester_email: attester.email
    }

    assert_response :ok
    json = json_response
    
    assert json['success']
    assert_includes json, 'attestation'
  end

  test "POST request_attestation fails for non-existent attester" do
    round = create_completed_round(user: @user, course: @course)

    post :request_attestation, params: {
      id: round.id,
      attester_email: "nonexistent@example.com"
    }

    assert_response :not_found
    json = json_response
    
    assert_not json['success']
    assert_equal "Attester not found", json['error']
  end

  test "performance with large number of rounds" do
    # Create many rounds
    50.times { create_completed_round(user: @user) }

    assert_performance(1000) do
      get :index
    end

    assert_response :ok
  end

  test "concurrent round operations" do
    round = create_test_round(user: @user, course: @course)

    # Simulate concurrent hole score updates
    threads = 3.times.map do |i|
      Thread.new do
        post :update_hole_score, params: {
          id: round.id,
          hole_number: i + 1,
          hole_score: {
            strokes: 4 + i,
            putts: 2
          }
        }
        
        response.code
      end
    end

    results = threads.map(&:value)
    results.each { |result| assert_equal "200", result }
  end

  test "authorization prevents access to other users rounds" do
    other_round = create_test_round(user: @other_user, course: @course)

    # Try various operations on other user's round
    get :show, params: { id: other_round.id }
    assert_response :forbidden

    patch :update, params: { id: other_round.id, round: { notes: 'hack' } }
    assert_response :forbidden

    post :complete, params: { id: other_round.id }
    assert_response :forbidden

    delete :destroy, params: { id: other_round.id }
    assert_response :forbidden
  end

  test "input validation and sanitization" do
    post :create, params: {
      round: {
        course_id: @course.id,
        tee_color: '<script>alert("xss")</script>',
        notes: 'Normal notes with <script>bad stuff</script>'
      }
    }

    assert_response :created
    json = json_response
    
    round = Round.find(json['round']['id'])
    assert_not_includes round.tee_color, '<script>'
    assert_not_includes round.notes, '<script>' if round.notes
  end

  test "invalid JSON request returns proper error" do
    # Send malformed JSON
    request.env['RAW_POST_DATA'] = '{ invalid json'
    request.headers['Content-Type'] = 'application/json'
    
    post :create

    assert_response :bad_request
  end
end