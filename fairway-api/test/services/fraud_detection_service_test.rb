require_relative '../service_test_base'

class FraudDetectionServiceTest < ServiceTestBase
  def setup
    super
    # Create test data
    @user = User.create!(
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User'
    )
    
    @course = Course.create!(
      name: 'Test Course',
      latitude: 40.0,
      longitude: -75.0,
      geofence_radius: 500,
      course_rating: 72.0,
      slope_rating: 113,
      par: 72
    )
    
    @round = Round.create!(
      user: @user,
      course: @course,
      started_at: 2.hours.ago,
      completed_at: 30.minutes.ago,
      total_strokes: 85,
      tee_color: 'white',
      course_rating: @course.course_rating,
      slope_rating: @course.slope_rating,
      fraud_risk_score: nil
    )
    
    @service = FraudDetectionService.new(@round)
  end

  test "calculates basic fraud risk score" do
    score = @service.calculate_fraud_risk_score
    
    assert score >= 0.0
    assert score <= 100.0
  end

  test "detects suspicious quick round completion" do
    # Round completed in 1 hour with 18 holes
    @round.update!(
      started_at: 1.hour.ago,
      completed_at: Time.current,
      holes_completed: 18
    )
    
    # Create hole scores to simulate completion
    18.times do |i|
      hole = @course.holes.create!(number: i + 1, par: 4)
      @round.hole_scores.create!(hole: hole, hole_number: i + 1, strokes: 4)
    end
    
    score = @service.calculate_fraud_risk_score
    
    # Should have higher risk due to quick completion
    assert score > 20.0
  end

  test "detects multiple aces as suspicious" do
    # Create holes and add multiple aces
    2.times do |i|
      hole = @course.holes.create!(number: i + 1, par: 3)
      @round.hole_scores.create!(hole: hole, hole_number: i + 1, strokes: 1)
    end
    
    score = @service.calculate_fraud_risk_score
    
    # Should flag multiple aces
    assert score > 25.0
  end

  test "detects dramatically improved scoring" do
    # Create previous rounds with high scores
    5.times do |i|
      previous_round = @user.rounds.create!(
        course: @course,
        started_at: (i + 1).days.ago,
        completed_at: (i + 1).days.ago + 4.hours,
        total_strokes: 95 + i
      )
    end
    
    # Current round with much lower score
    @round.update!(total_strokes: 72)
    
    score = @service.calculate_fraud_risk_score
    
    # Should detect improvement as suspicious
    assert score > 15.0
  end

  test "verifies location correctly" do
    # Within geofence
    assert @service.verify_location(40.0001, -74.9999)
    
    # Outside geofence
    assert_not @service.verify_location(41.0, -76.0)
    
    # Missing coordinates
    assert_not @service.verify_location(nil, nil)
  end

  test "parses fraud risk factors from JSON" do
    @round.update!(fraud_risk_factors: '["Test factor", "Another factor"]')
    
    factors = @service.fraud_risk_factors_list
    
    assert_equal 2, factors.length
    assert_includes factors, "Test factor"
    assert_includes factors, "Another factor"
  end

  test "handles invalid JSON in fraud risk factors" do
    @round.update!(fraud_risk_factors: 'invalid json')
    
    factors = @service.fraud_risk_factors_list
    
    assert_equal [], factors
  end

  test "flags new users with excellent scores" do
    # User with very few rounds
    @user.update!(created_at: 1.week.ago)
    @user.rounds.where.not(id: @round.id).destroy_all
    
    @round.update!(total_strokes: 75)
    
    score = @service.calculate_fraud_risk_score
    
    # Should flag new user with good score
    assert score > 10.0
  end

  test "returns empty factors list when none present" do
    @round.update!(fraud_risk_factors: nil)
    
    factors = @service.fraud_risk_factors_list
    
    assert_equal [], factors
  end
end