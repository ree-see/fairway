require 'test_helper'

# Override the global fixtures setting just for this test
class WorkingRoundScoringTest < ActiveSupport::TestCase
  # Don't use fixtures at all
  self.fixture_paths = []
  
  # Override fixture loading
  def self.fixtures(*fixture_names)
    # Do nothing - disable fixture loading
  end
  
  def setup
    # Manually clean up and create test data
    ActiveRecord::Base.connection.execute("TRUNCATE users, courses, rounds, holes, hole_scores RESTART IDENTITY CASCADE")
    
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

  test "calculates duration in minutes" do
    @round.update!(
      started_at: 2.hours.ago,
      completed_at: 30.minutes.ago
    )

    assert_equal 90, @service.duration_minutes
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
end