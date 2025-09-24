require 'test_helper'

class RoundWorkflowTest < ActionDispatch::IntegrationTest
  def setup
    @user = create_test_user(email: 'golfer@example.com')
    @course = create_test_course
    @attester = create_test_user(email: 'attester@example.com')
    
    # Create course holes
    18.times do |i|
      @course.holes.create!(
        hole_number: i + 1,
        par: [3, 4, 4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4][i],
        handicap: i + 1,
        yardage: [150, 380, 420, 160, 520, 390, 410, 140, 400, 370, 540, 380, 130, 400, 430, 170, 510, 360][i]
      )
    end
    
    # Login user
    tokens = JwtService.generate_tokens(@user)
    @auth_headers = { 'Authorization' => "Bearer #{tokens[:access_token]}" }
  end

  test "complete golf round workflow from start to verification" do
    # Step 1: Create new round
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue',
        start_latitude: @course.latitude,
        start_longitude: @course.longitude
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_response = JSON.parse(response.body)
    round_id = round_response['round']['id']
    
    assert_equal @user.id, round_response['round']['user_id']
    assert_equal @course.id, round_response['round']['course_id']
    assert_equal 'blue', round_response['round']['tee_color']
    assert_not_nil round_response['round']['started_at']

    # Step 2: Add hole scores progressively
    hole_scores = [4, 5, 4, 3, 6, 4, 5, 3, 4, 4, 6, 4, 3, 5, 4, 3, 6, 4]
    
    hole_scores.each_with_index do |strokes, index|
      hole_number = index + 1
      
      post "/api/v1/rounds/#{round_id}/holes/#{hole_number}", params: {
        hole_score: {
          strokes: strokes,
          putts: rand(1..3),
          fairway_hit: hole_number > 3 ? [true, false].sample : false, # No fairway on par 3s
          green_in_regulation: strokes <= (@course.holes.find_by(hole_number: hole_number).par),
          penalties: strokes > 6 ? 1 : 0
        }
      }, headers: @auth_headers, as: :json

      assert_response :ok
      hole_response = JSON.parse(response.body)
      assert_equal strokes, hole_response['hole_score']['strokes']
    end

    # Step 3: Check round progress
    get "/api/v1/rounds/#{round_id}", headers: @auth_headers

    assert_response :ok
    progress_response = JSON.parse(response.body)
    assert_equal 18, progress_response['round']['hole_scores'].size
    assert_equal hole_scores.sum, progress_response['round']['total_strokes']

    # Step 4: Complete the round
    post "/api/v1/rounds/#{round_id}/complete", headers: @auth_headers, as: :json

    assert_response :ok
    complete_response = JSON.parse(response.body)
    assert_not_nil complete_response['round']['completed_at']
    assert complete_response['round']['completed']
    assert_not_nil complete_response['round']['score_differential']

    # Step 5: View round statistics
    get "/api/v1/rounds/#{round_id}/statistics", headers: @auth_headers

    assert_response :ok
    stats_response = JSON.parse(response.body)
    
    expected_stats = %w[total_strokes total_putts fairways_hit fairway_percentage 
                       greens_in_regulation gir_percentage average_putts_per_hole 
                       penalties score_to_par best_hole worst_hole]
    
    expected_stats.each do |stat|
      assert_includes stats_response['statistics'], stat
    end

    # Step 6: Request attestation
    # Mock mailer
    AttestationMailer.expects(:attestation_request).returns(
      mock('mailer').tap { |m| m.expects(:deliver_later) }
    )

    post "/api/v1/rounds/#{round_id}/request_attestation", params: {
      attester_email: @attester.email
    }, headers: @auth_headers, as: :json

    assert_response :ok
    attestation_response = JSON.parse(response.body)
    assert attestation_response['success']
    assert_not_nil attestation_response['attestation']['id']

    # Step 7: Attester approves the round (simulate attester login)
    attester_tokens = JwtService.generate_tokens(@attester)
    attester_headers = { 'Authorization' => "Bearer #{attester_tokens[:access_token]}" }

    attestation_id = attestation_response['attestation']['id']

    patch "/api/v1/attestations/#{attestation_id}", params: {
      attestation: {
        is_approved: true,
        comments: "Great round! Played together, all scores accurate."
      }
    }, headers: attester_headers, as: :json

    assert_response :ok
    approval_response = JSON.parse(response.body)
    assert approval_response['attestation']['is_approved']
    assert_equal "Great round! Played together, all scores accurate.", 
                 approval_response['attestation']['comments']

    # Step 8: Verify round is now verified
    get "/api/v1/rounds/#{round_id}", headers: @auth_headers

    assert_response :ok
    verified_response = JSON.parse(response.body)
    assert verified_response['round']['is_verified']
    assert_equal 1, verified_response['round']['verification_count']

    # Step 9: Check user's updated handicap
    get "/api/v1/auth/me", headers: @auth_headers

    assert_response :ok
    user_response = JSON.parse(response.body)
    # Handicap should be updated after completing verified round
    assert_not_nil user_response['user']['provisional_handicap']
  end

  test "round with suspicious scoring triggers fraud detection" do
    # Create user with established scoring history
    5.times { create_completed_round(user: @user, total_strokes: 85) }

    # Create suspiciously good round
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue',
        start_latitude: @course.latitude + 0.01, # Slightly off location
        start_longitude: @course.longitude + 0.01
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_response = JSON.parse(response.body)
    round_id = round_response['round']['id']

    # Add unusually good scores
    excellent_scores = [2, 3, 3, 2, 4, 3, 3, 2, 3, 3, 4, 3, 2, 3, 3, 2, 4, 3] # ~52 total

    excellent_scores.each_with_index do |strokes, index|
      hole_number = index + 1
      
      post "/api/v1/rounds/#{round_id}/holes/#{hole_number}", params: {
        hole_score: {
          strokes: strokes,
          putts: 1,
          fairway_hit: true,
          green_in_regulation: true,
          penalties: 0
        }
      }, headers: @auth_headers, as: :json

      assert_response :ok
    end

    # Complete the round quickly (simulate short duration)
    travel_to(1.hour.from_now) do
      post "/api/v1/rounds/#{round_id}/complete", headers: @auth_headers, as: :json
    end

    assert_response :ok
    complete_response = JSON.parse(response.body)
    
    # Check fraud risk score
    get "/api/v1/rounds/#{round_id}", headers: @auth_headers

    assert_response :ok
    round_data = JSON.parse(response.body)
    
    # Should have high fraud risk score
    assert round_data['round']['fraud_risk_score'] > 50
    assert round_data['round']['fraud_risk_factors'].any?
    
    # Round should not be automatically verified
    assert_not round_data['round']['is_verified']
  end

  test "round completion updates user statistics and handicap" do
    initial_rounds_count = @user.rounds.completed.count
    
    # Create and complete a round
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'white'
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_id = JSON.parse(response.body)['round']['id']

    # Add reasonable scores
    scores = [4, 5, 4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4] # 82 total

    scores.each_with_index do |strokes, index|
      post "/api/v1/rounds/#{round_id}/holes/#{index + 1}", params: {
        hole_score: {
          strokes: strokes,
          putts: 2,
          fairway_hit: index > 2 && rand < 0.6, # Par 3s don't count for fairways
          green_in_regulation: strokes <= @course.holes.find_by(hole_number: index + 1).par,
          penalties: 0
        }
      }, headers: @auth_headers, as: :json

      assert_response :ok
    end

    # Complete round
    post "/api/v1/rounds/#{round_id}/complete", headers: @auth_headers, as: :json

    assert_response :ok

    # Check updated user stats
    @user.reload
    assert_equal initial_rounds_count + 1, @user.rounds.completed.count

    # Get user statistics
    get "/api/v1/users/statistics", headers: @auth_headers

    assert_response :ok
    stats_response = JSON.parse(response.body)
    
    assert_includes stats_response['statistics'], 'basic_stats'
    assert_includes stats_response['statistics'], 'performance_trends'
    assert_includes stats_response['statistics']['basic_stats'], 'rounds_played'
    assert stats_response['statistics']['basic_stats']['rounds_played'] >= 1
  end

  test "concurrent round operations maintain data integrity" do
    # Create a round
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue'
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_id = JSON.parse(response.body)['round']['id']

    # Simulate concurrent hole score updates
    threads = []
    
    (1..18).each do |hole_number|
      threads << Thread.new do
        post "/api/v1/rounds/#{round_id}/holes/#{hole_number}", params: {
          hole_score: {
            strokes: 4,
            putts: 2,
            fairway_hit: true,
            green_in_regulation: true,
            penalties: 0
          }
        }, headers: @auth_headers, as: :json
        
        response.status
      end
    end

    results = threads.map(&:value)
    
    # All updates should succeed
    results.each { |status| assert_equal 200, status }

    # Verify all hole scores were recorded correctly
    get "/api/v1/rounds/#{round_id}", headers: @auth_headers

    assert_response :ok
    round_data = JSON.parse(response.body)
    assert_equal 18, round_data['round']['hole_scores'].size
    assert_equal 72, round_data['round']['total_strokes'] # 18 holes × 4 strokes
  end

  test "round workflow with location verification" do
    # Test starting round at course location
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue',
        start_latitude: @course.latitude,
        start_longitude: @course.longitude
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_response = JSON.parse(response.body)
    
    assert round_response['round']['location_verified']

    # Test starting round away from course (should still create but flag location)
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'red',
        start_latitude: @course.latitude + 1.0, # Far from course
        start_longitude: @course.longitude + 1.0
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    away_round_response = JSON.parse(response.body)
    
    # Location should not be verified
    assert_not away_round_response['round']['location_verified']
  end

  test "unauthorized access to rounds is prevented" do
    # Create round as first user
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue'
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_id = JSON.parse(response.body)['round']['id']

    # Try to access as different user
    other_user = create_test_user(email: 'other@example.com')
    other_tokens = JwtService.generate_tokens(other_user)
    other_headers = { 'Authorization' => "Bearer #{other_tokens[:access_token]}" }

    # Should not be able to view
    get "/api/v1/rounds/#{round_id}", headers: other_headers

    assert_response :forbidden

    # Should not be able to update
    patch "/api/v1/rounds/#{round_id}", params: {
      round: { notes: 'hacked' }
    }, headers: other_headers, as: :json

    assert_response :forbidden

    # Should not be able to add hole scores
    post "/api/v1/rounds/#{round_id}/holes/1", params: {
      hole_score: { strokes: 1 }
    }, headers: other_headers, as: :json

    assert_response :forbidden
  end

  test "round data validation and sanitization" do
    # Test XSS protection in round creation
    post '/api/v1/rounds', params: {
      round: {
        course_id: @course.id,
        tee_color: 'blue',
        notes: '<script>alert("xss")</script>Normal notes'
      }
    }, headers: @auth_headers, as: :json

    assert_response :created
    round_response = JSON.parse(response.body)
    
    # Script tags should be removed/sanitized
    assert_not_includes round_response['round']['notes'], '<script>'

    # Test invalid hole score values
    round_id = round_response['round']['id']

    post "/api/v1/rounds/#{round_id}/holes/1", params: {
      hole_score: {
        strokes: -1, # Invalid negative score
        putts: 10,   # Unreasonably high
        penalties: -1 # Invalid negative
      }
    }, headers: @auth_headers, as: :json

    assert_response :unprocessable_entity
    error_response = JSON.parse(response.body)
    assert_equal 'VALIDATION_ERROR', error_response['error']['code']
  end

  test "performance with realistic data volumes" do
    # Create user with significant round history
    user_with_history = create_test_user(email: 'experienced@example.com')
    
    # Create 50 completed rounds
    50.times do |i|
      round = create_completed_round(
        user: user_with_history, 
        course: @course, 
        total_strokes: rand(75..95)
      )
      # Vary the dates
      round.update!(started_at: i.days.ago, completed_at: i.days.ago + 4.hours)
    end

    # Login as experienced user
    exp_tokens = JwtService.generate_tokens(user_with_history)
    exp_headers = { 'Authorization' => "Bearer #{exp_tokens[:access_token]}" }

    # Test performance of rounds listing
    assert_performance(1000) do
      get '/api/v1/rounds', headers: exp_headers
    end

    assert_response :ok

    # Test performance of statistics calculation
    assert_performance(2000) do
      get '/api/v1/users/statistics', headers: exp_headers
    end

    assert_response :ok
  end
end