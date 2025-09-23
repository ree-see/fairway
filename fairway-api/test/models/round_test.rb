require "test_helper"

class RoundTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @course = courses(:pebble_beach)
    @round = rounds(:current_round)
  end

  test "should be valid" do
    assert @round.valid?
  end

  test "should require user" do
    @round.user = nil
    assert_not @round.valid?
  end

  test "should require course" do
    @round.course = nil
    assert_not @round.valid?
  end

  test "should require started_at" do
    @round.started_at = nil
    assert_not @round.valid?
  end

  test "tee color validation" do
    valid_tees = %w[black blue white red gold]
    valid_tees.each do |tee|
      @round.tee_color = tee
      assert @round.valid?, "#{tee} should be valid"
    end

    @round.tee_color = "purple"
    assert_not @round.valid?
  end

  test "total strokes validation" do
    @round.total_strokes = 0
    assert_not @round.valid?

    @round.total_strokes = 200
    assert_not @round.valid?

    @round.total_strokes = 85
    assert @round.valid?
  end

  # Score differential calculation tests
  test "calculate_score_differential with valid data" do
    @round.total_strokes = 85
    @round.course_rating = 72.0
    @round.slope_rating = 113
    
    expected_differential = (113.0 / 113) * (85 - 72.0 - 0) # PCC = 0
    @round.calculate_score_differential
    
    assert_in_delta expected_differential, @round.score_differential, 0.1
  end

  test "calculate_score_differential with different slope" do
    @round.total_strokes = 90
    @round.course_rating = 75.0
    @round.slope_rating = 130
    
    expected_differential = (113.0 / 130) * (90 - 75.0 - 0)
    @round.calculate_score_differential
    
    assert_in_delta expected_differential, @round.score_differential, 0.1
  end

  test "calculate_score_differential rounds to one decimal" do
    @round.total_strokes = 87
    @round.course_rating = 72.3
    @round.slope_rating = 125
    
    @round.calculate_score_differential
    
    # Should be rounded to 1 decimal place
    assert_equal @round.score_differential, @round.score_differential.round(1)
  end

  # Maximum hole scores calculation
  test "maximum_hole_scores with standard par" do
    create_standard_18_holes(@course)
    @round.course = @course
    
    # For a scratch golfer (handicap 0), max score is par + 2
    max_score = @round.maximum_hole_scores
    expected_max = @course.holes.sum { |hole| hole.par + 2 }
    
    assert_equal expected_max, max_score
  end

  test "handicap_strokes_for_hole calculation" do
    hole = @course.holes.create!(number: 1, par: 4, handicap: 10, yardage_white: 400)
    @user.update!(handicap_index: 18.0)
    @round.slope_rating = 113
    
    strokes = @round.handicap_strokes_for_hole(hole)
    expected_strokes = 1 # 18 handicap should get 1 stroke on handicap 10 hole
    
    assert_equal expected_strokes, strokes
  end

  # Completion and duration tests
  test "completed? method" do
    @round.completed_at = nil
    assert_not @round.completed?
    
    @round.completed_at = Time.current
    assert @round.completed?
  end

  test "duration_minutes calculation" do
    @round.started_at = Time.current
    @round.completed_at = Time.current + 4.hours
    
    assert_equal 240, @round.duration_minutes
  end

  test "holes_completed count" do
    # Create some hole scores
    3.times do |i|
      @round.hole_scores.create!(
        hole: @course.holes.create!(number: i + 1, par: 4, handicap: i + 1, yardage_white: 400),
        hole_number: i + 1,
        strokes: 4
      )
    end
    
    assert_equal 3, @round.holes_completed
  end

  test "completion_percentage calculation" do
    create_standard_18_holes(@course)
    
    # Complete 9 holes
    9.times do |i|
      hole = @course.holes.find_by(number: i + 1)
      @round.hole_scores.create!(
        hole: hole,
        hole_number: i + 1,
        strokes: 4
      )
    end
    
    assert_equal 50.0, @round.completion_percentage
  end

  # Attestation tests
  test "request_attestation creates attestation record" do
    attester = users(:two)
    
    assert_difference '@round.round_attestations.count', 1 do
      @round.request_attestation(attester)
    end
    
    attestation = @round.round_attestations.last
    assert_equal attester, attestation.attester
    assert_equal false, attestation.is_approved
  end

  test "request_attestation prevents duplicate requests" do
    attester = users(:two)
    @round.request_attestation(attester)
    
    assert_no_difference '@round.round_attestations.count' do
      result = @round.request_attestation(attester)
      assert_not result
    end
  end

  test "request_attestation prevents self-attestation" do
    assert_no_difference '@round.round_attestations.count' do
      result = @round.request_attestation(@round.user)
      assert_not result
    end
  end

  test "add_attestation updates verification status" do
    attester = users(:two)
    @round.update!(fraud_risk_score: 25.0) # Low fraud risk
    
    @round.add_attestation(attester, approved: true)
    @round.reload
    
    assert_equal 1, @round.verification_count
    assert @round.is_verified
    assert_not @round.is_provisional
  end

  test "add_attestation with high fraud risk prevents verification" do
    attester = users(:two)
    @round.update!(fraud_risk_score: 75.0) # High fraud risk
    
    @round.add_attestation(attester, approved: true)
    @round.reload
    
    assert_equal 1, @round.verification_count
    assert_not @round.is_verified # Should remain unverified due to high fraud risk
  end

  # Location verification tests
  test "verify_location within geofence" do
    @course.update!(latitude: 36.5681, longitude: -121.9494, geofence_radius: 500)
    @round.start_latitude = 36.5685 # Very close to course
    @round.start_longitude = -121.9490
    
    @round.send(:verify_location)
    assert @round.location_verified
  end

  test "verify_location outside geofence" do
    @course.update!(latitude: 36.5681, longitude: -121.9494, geofence_radius: 500)
    @round.start_latitude = 37.0000 # Far from course
    @round.start_longitude = -122.0000
    
    @round.send(:verify_location)
    assert_not @round.location_verified
  end

  # Fraud risk factors
  test "fraud_risk_factors_list parsing" do
    @round.fraud_risk_factors = '["quick_round", "unrealistic_score"]'
    factors = @round.fraud_risk_factors_list
    
    assert_equal ["quick_round", "unrealistic_score"], factors
  end

  test "fraud_risk_factors_list with invalid json" do
    @round.fraud_risk_factors = 'invalid json'
    factors = @round.fraud_risk_factors_list
    
    assert_equal [], factors
  end

  private

  def create_standard_18_holes(course)
    pars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5]
    handicaps = (1..18).to_a
    
    18.times do |i|
      course.holes.create!(
        number: i + 1,
        par: pars[i],
        handicap: handicaps[i],
        yardage_white: pars[i] == 3 ? 150 : (pars[i] == 4 ? 350 : 500)
      )
    end
  end
end