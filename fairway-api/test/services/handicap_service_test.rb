require 'test_helper'

class HandicapServiceTest < ActiveSupport::TestCase
  def setup
    @user = create_test_user
    @course = create_test_course
  end

  test "calculate_provisional_handicap with insufficient rounds returns nil" do
    # Create only 4 rounds (need 5 minimum)
    4.times { create_completed_round(user: @user, total_strokes: 85) }
    
    handicap = HandicapService.calculate_provisional_handicap(@user)
    assert_nil handicap
  end

  test "calculate_provisional_handicap with sufficient rounds returns correct value" do
    # Create 8 rounds with known scores
    scores = [85, 90, 88, 92, 87, 89, 86, 91]
    scores.each { |score| create_completed_round(user: @user, total_strokes: score) }
    
    handicap = HandicapService.calculate_provisional_handicap(@user)
    assert_not_nil handicap
    assert_kind_of Float, handicap
    assert handicap >= 0
  end

  test "calculate_verified_handicap excludes unverified rounds" do
    # Create 5 verified rounds
    5.times do 
      round = create_completed_round(user: @user, total_strokes: 85)
      round.update!(is_verified: true)
    end
    
    # Create 3 unverified rounds with much higher scores
    3.times { create_completed_round(user: @user, total_strokes: 110) }
    
    verified_handicap = HandicapService.calculate_verified_handicap(@user)
    provisional_handicap = HandicapService.calculate_provisional_handicap(@user)
    
    assert_not_nil verified_handicap
    assert_not_nil provisional_handicap
    assert verified_handicap < provisional_handicap, 
           "Verified handicap should be lower when excluding high unverified scores"
  end

  test "update_user_handicaps recalculates both handicaps" do
    # Create rounds
    6.times do 
      round = create_completed_round(user: @user, total_strokes: 85)
      round.update!(is_verified: true) if rand < 0.5
    end
    
    initial_provisional = @user.provisional_handicap
    initial_verified = @user.verified_handicap
    
    HandicapService.update_user_handicaps(@user)
    @user.reload
    
    # Handicaps should be calculated (not nil)
    assert_not_nil @user.provisional_handicap
    # May be nil if no verified rounds exist
  end

  test "calculate_course_handicap applies slope rating correctly" do
    @user.update!(handicap_index: 15.0)
    course_handicap = HandicapService.calculate_course_handicap(@user, @course)
    
    expected = (15.0 * @course.slope_rating / 113.0).round
    assert_equal expected, course_handicap
  end

  test "calculate_playing_handicap adjusts for tee and par" do
    @user.update!(handicap_index: 15.0)
    playing_handicap = HandicapService.calculate_playing_handicap(@user, @course, 'blue')
    
    assert_kind_of Integer, playing_handicap
    assert playing_handicap >= 0
  end

  test "net_double_bogey_for_hole calculates maximum score correctly" do
    hole = OpenStruct.new(par: 4, handicap: 10)
    max_score = HandicapService.net_double_bogey_for_hole(hole, 15.0, 125)
    
    # Net Double Bogey = Par + 2 + handicap strokes for hole
    assert max_score >= 6 # Par + 2 at minimum
    assert_kind_of Integer, max_score
  end

  test "handicap_differential_calculation follows USGA formula" do
    round = create_completed_round(user: @user, total_strokes: 85)
    round.update!(
      course_rating: 71.2,
      slope_rating: 125,
      score_differential: nil
    )
    
    differential = HandicapService.calculate_score_differential(round)
    
    # Formula: (113 / Slope Rating) × (Adjusted Gross Score − Course Rating − PCC)
    expected = (113.0 / 125) * (85 - 71.2 - 0) # PCC = 0 for simplicity
    assert_in_delta expected, differential, 0.1
    assert_equal differential, round.score_differential
  end

  test "playing_ability_assessment provides comprehensive analysis" do
    # Create variety of rounds
    scores = [78, 82, 85, 88, 92, 81, 79, 86, 90, 84]
    scores.each { |score| create_completed_round(user: @user, total_strokes: score) }
    @user.update!(handicap_index: 12.5)
    
    assessment = HandicapService.playing_ability_assessment(@user)
    
    assert_includes assessment.keys, :handicap_index
    assert_includes assessment.keys, :skill_level
    assert_includes assessment.keys, :consistency_rating
    assert_includes assessment.keys, :recent_trend
    assert_includes assessment.keys, :strengths
    assert_includes assessment.keys, :improvement_areas
    
    assert_equal 12.5, assessment[:handicap_index]
    assert_includes ['beginner', 'novice', 'intermediate', 'advanced', 'expert'], 
                    assessment[:skill_level]
  end

  test "consistency_analysis identifies playing patterns" do
    # Create consistent scores (low variance)
    consistent_scores = [84, 85, 86, 85, 84, 86, 85, 84]
    consistent_scores.each { |score| create_completed_round(user: @user, total_strokes: score) }
    
    analysis = HandicapService.consistency_analysis(@user)
    
    assert_includes analysis.keys, :standard_deviation
    assert_includes analysis.keys, :consistency_score
    assert_includes analysis.keys, :volatility_rating
    
    assert analysis[:standard_deviation] < 2.0, "Should have low standard deviation"
    assert analysis[:consistency_score] > 80, "Should have high consistency score"
  end

  test "trend_analysis detects improvement and decline" do
    # Create improving trend (scores getting lower over time)
    improving_scores = [95, 92, 89, 87, 84, 82, 80, 78]
    improving_scores.each_with_index do |score, index|
      travel_to(index.weeks.ago) do
        create_completed_round(user: @user, total_strokes: score)
      end
    end
    
    trend = HandicapService.trend_analysis(@user)
    
    assert_includes trend.keys, :direction
    assert_includes trend.keys, :rate_of_change
    assert_includes trend.keys, :confidence
    
    assert_equal 'improving', trend[:direction]
    assert trend[:rate_of_change] < 0, "Negative rate indicates improvement"
  end

  test "performance_against_handicap measures accuracy" do
    @user.update!(handicap_index: 15.0)
    
    # Create rounds that match handicap expectation
    5.times do
      create_completed_round(user: @user, total_strokes: 87) # About right for 15 handicap
    end
    
    performance = HandicapService.performance_against_handicap(@user)
    
    assert_includes performance.keys, :average_differential
    assert_includes performance.keys, :expected_score_range
    assert_includes performance.keys, :accuracy_rating
    
    assert performance[:accuracy_rating] >= 70, "Should be reasonably accurate"
  end

  test "edge_case_zero_handicap_player" do
    # Test with scratch golfer
    scores = [70, 72, 71, 73, 69, 74, 72, 71]
    scores.each { |score| create_completed_round(user: @user, total_strokes: score) }
    
    HandicapService.update_user_handicaps(@user)
    @user.reload
    
    assert @user.handicap_index <= 2.0, "Should be low handicap"
    
    course_handicap = HandicapService.calculate_course_handicap(@user, @course)
    assert course_handicap >= 0, "Course handicap should not be negative"
  end

  test "edge_case_high_handicap_player" do
    # Test with high handicap player
    scores = [110, 115, 108, 112, 118, 106, 113, 109]
    scores.each { |score| create_completed_round(user: @user, total_strokes: score) }
    
    HandicapService.update_user_handicaps(@user)
    @user.reload
    
    assert @user.handicap_index >= 30.0, "Should be high handicap"
    
    playing_handicap = HandicapService.calculate_playing_handicap(@user, @course, 'red')
    assert playing_handicap <= 36, "Playing handicap should be capped at 36"
  end

  test "performance_testing_bulk_calculations" do
    # Create many rounds to test performance
    user_with_many_rounds = create_test_user
    
    assert_performance(500) do
      25.times { create_completed_round(user: user_with_many_rounds, total_strokes: rand(75..95)) }
    end
    
    assert_performance(100) do
      HandicapService.update_user_handicaps(user_with_many_rounds)
    end
  end

  test "concurrent_handicap_updates_thread_safety" do
    users = 5.times.map { create_test_user }
    
    # Give each user some rounds
    users.each do |user|
      6.times { create_completed_round(user: user, total_strokes: rand(80..95)) }
    end
    
    # Update handicaps concurrently
    threads = users.map do |user|
      Thread.new { HandicapService.update_user_handicaps(user) }
    end
    
    threads.each(&:join)
    
    # Verify all handicaps were calculated
    users.each do |user|
      user.reload
      assert_not_nil user.provisional_handicap, "All users should have provisional handicap"
    end
  end

  test "invalid_data_handling" do
    # Test with invalid course rating
    round = create_completed_round(user: @user, total_strokes: 85)
    round.update!(course_rating: nil)
    
    differential = HandicapService.calculate_score_differential(round)
    assert_nil differential, "Should return nil for invalid data"
    
    # Test with missing slope rating
    round.update!(course_rating: 71.2, slope_rating: nil)
    differential = HandicapService.calculate_score_differential(round)
    assert_nil differential, "Should return nil for missing slope rating"
  end
end