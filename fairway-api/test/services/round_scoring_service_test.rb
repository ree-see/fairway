require_relative '../service_test_base'

class RoundScoringServiceTest < ServiceTestBase
  def setup
    super
    # Create test data directly
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
      course_rating: 72.0,
      slope_rating: 113,
      par: 72,
      geofence_radius: 500
    )
    
    @round = Round.create!(
      user: @user,
      course: @course,
      started_at: 2.hours.ago,
      tee_color: 'white',
      course_rating: @course.course_rating,
      slope_rating: @course.slope_rating
    )
    
    @service = RoundScoringService.new(@round)
  end

  test "calculates totals correctly" do
    # Create hole scores
    3.times do |i|
      hole = @course.holes.create!(number: i + 1, par: 4, handicap: i + 1)
      @round.hole_scores.create!(
        hole: hole,
        hole_number: i + 1,
        strokes: 4 + i,
        putts: 2,
        fairway_hit: i.even?,
        green_in_regulation: i < 2,
        penalties: i == 2 ? 1 : 0
      )
    end

    totals = @service.calculate_totals

    assert_equal 15, totals[:total_strokes] # 4 + 5 + 6
    assert_equal 6, totals[:total_putts]
    assert_equal 2, totals[:fairways_hit]
    assert_equal 2, totals[:greens_in_regulation]
    assert_equal 1, totals[:total_penalties]
  end

  test "calculates completion percentage" do
    # Create 18 holes
    18.times { |i| @course.holes.create!(number: i + 1, par: 4, handicap: i + 1) }
    
    # Add 9 hole scores
    9.times do |i|
      @round.hole_scores.create!(
        hole: @course.holes.find_by(number: i + 1),
        hole_number: i + 1,
        strokes: 4
      )
    end

    assert_equal 50.0, @service.completion_percentage
  end

  test "calculates duration in minutes" do
    @round.update!(
      started_at: 2.hours.ago,
      completed_at: 30.minutes.ago
    )

    assert_equal 90, @service.duration_minutes
  end

  test "calculates maximum hole scores with handicap strokes" do
    @user.update!(handicap_index: 18.0)
    
    # Create a few holes
    hole1 = @course.holes.create!(number: 1, par: 4, handicap: 1)
    hole2 = @course.holes.create!(number: 2, par: 5, handicap: 10)
    
    max_scores = @service.maximum_hole_scores
    
    # Should be sum of (par + 2 + handicap strokes) for each hole
    assert max_scores > 0
  end

  test "calculates handicap strokes for hole" do
    @user.update!(handicap_index: 18.0)
    hole = @course.holes.create!(number: 1, par: 4, handicap: 1)
    
    strokes = @service.handicap_strokes_for_hole(hole)
    
    # 18 handicap player gets a stroke on handicap hole 1
    assert strokes >= 1
  end

  test "returns nil for score differential without required data" do
    @round.update!(total_strokes: nil)
    
    assert_nil @service.calculate_score_differential
  end
end