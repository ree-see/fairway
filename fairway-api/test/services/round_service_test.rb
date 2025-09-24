require 'test_helper'

class RoundServiceTest < ActiveSupport::TestCase
  def setup
    @user = create_test_user
    @course = create_test_course
    @location = { latitude: @course.latitude, longitude: @course.longitude }
  end

  test "create_round creates round with valid parameters" do
    assert_difference 'Round.count', 1 do
      round = RoundService.create_round(
        user: @user,
        course: @course,
        tee_color: 'blue',
        start_location: @location
      )
      
      assert round.persisted?
      assert_equal @user, round.user
      assert_equal @course, round.course
      assert_equal 'blue', round.tee_color
      assert_not_nil round.started_at
      assert_equal @course.course_rating_for_tee('blue'), round.course_rating
      assert_equal @course.slope_rating_for_tee('blue'), round.slope_rating
      assert_equal @location[:latitude], round.start_latitude
      assert_equal @location[:longitude], round.start_longitude
    end
  end

  test "create_round without location still creates valid round" do
    round = RoundService.create_round(
      user: @user,
      course: @course,
      tee_color: 'white'
    )
    
    assert round.persisted?
    assert_nil round.start_latitude
    assert_nil round.start_longitude
  end

  test "complete_round updates round and triggers handicap calculation" do
    round = create_test_round(user: @user, course: @course)
    
    # Add some hole scores
    5.times do |i|
      round.hole_scores.create!(
        hole_number: i + 1,
        strokes: 4,
        putts: 2
      )
    end
    
    # Mock handicap service call
    HandicapService.expects(:update_user_handicaps).with(@user).once
    
    assert RoundService.complete_round(round)
    
    round.reload
    assert_not_nil round.completed_at
    assert_equal 5, round.holes_completed
  end

  test "complete_round fails for already completed round" do
    round = create_completed_round(user: @user, course: @course)
    
    assert_not RoundService.complete_round(round)
  end

  test "complete_round fails for round without hole scores" do
    round = create_test_round(user: @user, course: @course)
    
    assert_not RoundService.complete_round(round)
  end

  test "calculate_score_differential follows USGA formula" do
    round = create_completed_round(user: @user, course: @course, total_strokes: 85)
    round.update!(
      course_rating: 71.2,
      slope_rating: 125,
      score_differential: nil
    )
    
    differential = RoundService.calculate_score_differential(round)
    
    expected = (113.0 / 125) * (85 - 71.2 - 0) # PCC = 0
    assert_in_delta expected, differential, 0.1
  end

  test "calculate_score_differential returns nil for invalid data" do
    round = create_test_round(user: @user, course: @course)
    round.update!(total_strokes: nil)
    
    differential = RoundService.calculate_score_differential(round)
    assert_nil differential
  end

  test "calculate_adjusted_gross_score applies maximum hole scores" do
    round = create_completed_round(user: @user, course: @course, total_strokes: 120)
    
    # Create holes with very high scores
    round.hole_scores.destroy_all
    18.times do |i|
      round.course.holes.create!(
        hole_number: i + 1,
        par: 4,
        handicap: i + 1,
        yardage: 400
      ) unless round.course.holes.exists?(hole_number: i + 1)
      
      round.hole_scores.create!(
        hole_number: i + 1,
        strokes: 10, # Very high score
        putts: 3
      )
    end
    round.update!(total_strokes: 180)
    
    adjusted_score = RoundService.calculate_adjusted_gross_score(round)
    
    assert adjusted_score < 180, "Adjusted score should be lower than actual"
    assert adjusted_score > 100, "Adjusted score should still be reasonable"
  end

  test "calculate_fraud_risk_score identifies suspicious patterns" do
    # Create user with established scoring pattern
    5.times { create_completed_round(user: @user, total_strokes: 90) }
    
    # Create suspiciously good round
    suspicious_round = create_completed_round(user: @user, total_strokes: 68)
    suspicious_round.update!(
      duration_minutes: 90, # Unusually fast
      location_verified: false,
      started_at: Time.current.change(hour: 3) # Very early
    )
    
    risk_score = RoundService.calculate_fraud_risk_score(suspicious_round)
    
    assert risk_score > 50, "Should flag suspicious round with high risk score"
    
    suspicious_round.reload
    factors = JSON.parse(suspicious_round.fraud_risk_factors)
    assert_includes factors, "significant_score_improvement"
    assert_includes factors, "round_too_fast"
    assert_includes factors, "location_not_verified"
    assert_includes factors, "unusual_tee_time"
  end

  test "request_attestation creates attestation request" do
    round = create_completed_round(user: @user, course: @course)
    attester = create_test_user(email: "attester@example.com")
    
    # Mock mailer
    AttestationMailer.expects(:attestation_request).returns(
      mock('mailer').tap { |m| m.expects(:deliver_later) }
    )
    
    result = RoundService.request_attestation(round, attester.email)
    
    assert result[:success]
    assert_kind_of RoundAttestation, result[:attestation]
    assert_equal attester, result[:attestation].attester
  end

  test "request_attestation fails for non-existent user" do
    round = create_completed_round(user: @user, course: @course)
    
    result = RoundService.request_attestation(round, "nonexistent@example.com")
    
    assert_not result[:success]
    assert_equal "Attester not found", result[:error]
  end

  test "request_attestation fails for self-attestation" do
    round = create_completed_round(user: @user, course: @course)
    
    result = RoundService.request_attestation(round, @user.email)
    
    assert_not result[:success]
    assert_equal "Cannot attest own round", result[:error]
  end

  test "process_attestation approves and updates verification" do
    round = create_completed_round(user: @user, course: @course)
    attester = create_test_user
    
    # Create existing attestation request
    attestation = round.round_attestations.create!(
      attester: attester,
      requested_at: 1.hour.ago,
      is_approved: false
    )
    
    result = RoundService.process_attestation(round, attester, approved: true, comments: "Good round!")
    
    assert result[:success]
    attestation.reload
    assert attestation.is_approved
    assert_equal "Good round!", attestation.comments
    assert_not_nil attestation.attested_at
    
    round.reload
    assert_equal 1, round.verification_count
  end

  test "statistics_for_round calculates comprehensive stats" do
    round = create_completed_round(user: @user, course: @course)
    
    # Create specific hole scores for testing
    round.hole_scores.destroy_all
    
    # Par 3 hole (not driveable)
    round.course.holes.create!(hole_number: 1, par: 3, handicap: 18, yardage: 150)
    round.hole_scores.create!(hole_number: 1, strokes: 2, putts: 1, fairway_hit: false, green_in_regulation: true)
    
    # Par 4 hole (driveable)
    round.course.holes.create!(hole_number: 2, par: 4, handicap: 1, yardage: 380)
    round.hole_scores.create!(hole_number: 2, strokes: 4, putts: 2, fairway_hit: true, green_in_regulation: true)
    
    round.update!(
      total_strokes: 6,
      total_putts: 3,
      fairways_hit: 1,
      greens_in_regulation: 2,
      total_penalties: 0
    )
    
    stats = RoundService.statistics_for_round(round)
    
    assert_equal 6, stats[:total_strokes]
    assert_equal 3, stats[:total_putts]
    assert_equal 1, stats[:fairways_hit]
    assert_equal 100.0, stats[:fairway_percentage] # 1/1 driveable holes
    assert_equal 2, stats[:greens_in_regulation]
    assert_equal 100.0, stats[:gir_percentage] # 2/2 holes
    assert_equal 1.5, stats[:average_putts_per_hole]
    assert_equal 0, stats[:penalties]
    assert_equal(-1, stats[:score_to_par]) # 6 strokes on 7 par (3+4)
  end

  test "performance_with_large_dataset" do
    # Create course with full 18 holes
    18.times do |i|
      @course.holes.create!(
        hole_number: i + 1,
        par: [3, 4, 4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4][i],
        handicap: i + 1,
        yardage: [150, 380, 420, 160, 520, 390, 410, 140, 400, 370, 540, 380, 130, 400, 430, 170, 510, 360][i]
      )
    end
    
    assert_performance(500) do
      round = RoundService.create_round(
        user: @user,
        course: @course,
        tee_color: 'blue',
        start_location: @location
      )
      
      # Add all 18 hole scores
      18.times do |i|
        round.hole_scores.create!(
          hole_number: i + 1,
          strokes: rand(3..7),
          putts: rand(1..3),
          fairway_hit: rand < 0.6,
          green_in_regulation: rand < 0.5,
          penalties: rand < 0.1 ? 1 : 0
        )
      end
      
      RoundService.complete_round(round)
      RoundService.statistics_for_round(round)
    end
  end

  test "concurrent_round_operations" do
    users = 3.times.map { create_test_user }
    rounds = []
    
    # Create rounds concurrently
    threads = users.map do |user|
      Thread.new do
        rounds << RoundService.create_round(
          user: user,
          course: @course,
          tee_color: 'blue'
        )
      end
    end
    
    threads.each(&:join)
    
    assert_equal 3, rounds.compact.size
    rounds.each { |round| assert round.persisted? }
  end

  test "edge_case_handling" do
    # Test with missing course holes
    course_without_holes = create_test_course
    round = RoundService.create_round(
      user: @user,
      course: course_without_holes,
      tee_color: 'blue'
    )
    
    adjusted_score = RoundService.calculate_adjusted_gross_score(round)
    assert_equal round.total_strokes, adjusted_score
  end

  test "fraud_detection_with_normal_round" do
    # Create normal round
    normal_round = create_completed_round(user: @user, total_strokes: 85)
    normal_round.update!(
      duration_minutes: 240, # 4 hours - normal
      location_verified: true,
      started_at: Time.current.change(hour: 8) # 8 AM - normal
    )
    
    risk_score = RoundService.calculate_fraud_risk_score(normal_round)
    
    assert risk_score < 25, "Normal round should have low risk score"
  end

  test "attestation_workflow_complete" do
    round = create_completed_round(user: @user, course: @course)
    attester1 = create_test_user(email: "attester1@example.com")
    attester2 = create_test_user(email: "attester2@example.com")
    
    # Mock mailer for both requests
    AttestationMailer.stubs(:attestation_request).returns(
      mock('mailer').tap { |m| m.stubs(:deliver_later) }
    )
    
    # Request attestations
    result1 = RoundService.request_attestation(round, attester1.email)
    result2 = RoundService.request_attestation(round, attester2.email)
    
    assert result1[:success]
    assert result2[:success]
    
    # First attester approves
    RoundService.process_attestation(round, attester1, approved: true)
    round.reload
    assert_equal 1, round.verification_count
    
    # Second attester also approves
    RoundService.process_attestation(round, attester2, approved: true)
    round.reload
    assert_equal 2, round.verification_count
  end
end