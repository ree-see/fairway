require 'test_helper'

class HandicapCalculatorServiceTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @course = courses(:one)
    @service = HandicapCalculatorService.new(@user)
    
    # Set up course ratings
    @course.update!(
      course_rating: 72.5,
      slope_rating: 130,
      par: 72
    )
    
    # Clean slate for tests
    @user.rounds.destroy_all
  end

  test "calculate_score_differential returns correct value" do
    round = create_round(
      total_strokes: 85,
      course_rating: 72.5,
      slope_rating: 130
    )

    differential = @service.calculate_score_differential(round)
    expected = ((85 - 72.5) * 113 / 130).round(1)
    
    assert_equal expected, differential
  end

  test "calculate_score_differential returns nil for incomplete round" do
    round = create_round(total_strokes: nil)
    
    differential = @service.calculate_score_differential(round)
    assert_nil differential
  end

  test "calculate_handicap_index returns nil with insufficient rounds" do
    create_rounds(4) # Less than minimum 5 rounds
    
    handicap = @service.calculate_handicap_index
    assert_nil handicap
  end

  test "calculate_handicap_index with exactly 5 rounds uses 1 lowest" do
    # Create 5 rounds with known differentials
    differentials = [15.0, 12.0, 10.0, 8.0, 6.0]
    create_rounds_with_differentials(differentials)
    
    handicap = @service.calculate_handicap_index
    expected = 6.0 * 0.96 # Lowest 1 differential * 96%
    
    assert_in_delta expected, handicap, 0.1
  end

  test "calculate_handicap_index with 8 rounds uses 2 lowest" do
    differentials = [20.0, 18.0, 15.0, 12.0, 10.0, 8.0, 6.0, 4.0]
    create_rounds_with_differentials(differentials)
    
    handicap = @service.calculate_handicap_index
    expected = ((4.0 + 6.0) / 2.0) * 0.96 # Average of 2 lowest * 96%
    
    assert_in_delta expected, handicap, 0.1
  end

  test "calculate_handicap_index caps at maximum value" do
    # Create rounds with very high differentials
    differentials = [60.0, 58.0, 55.0, 53.0, 50.0]
    create_rounds_with_differentials(differentials)
    
    handicap = @service.calculate_handicap_index
    assert_equal HandicapCalculatorService::MAX_HANDICAP_INDEX, handicap
  end

  test "calculate_handicap_index caps at minimum value" do
    # Create rounds with very low differentials
    differentials = [-15.0, -13.0, -12.0, -11.0, -10.0]
    create_rounds_with_differentials(differentials)
    
    handicap = @service.calculate_handicap_index
    assert_equal HandicapCalculatorService::MIN_HANDICAP_INDEX, handicap
  end

  test "calculate_verified_handicap requires verified rounds" do
    create_rounds(10, verified: false)
    
    verified_handicap = @service.calculate_verified_handicap
    assert_nil verified_handicap
  end

  test "calculate_verified_handicap with sufficient verified rounds" do
    differentials = [15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0, 14.0, 11.0, 9.0]
    create_rounds_with_differentials(differentials, verified: true)
    
    verified_handicap = @service.calculate_verified_handicap
    assert_not_nil verified_handicap
    assert_kind_of Numeric, verified_handicap
  end

  test "get_recent_trend with insufficient data" do
    create_rounds(4)
    
    trend = @service.get_recent_trend
    assert_nil trend
  end

  test "get_recent_trend identifies improving trend" do
    # Recent scores better than older scores
    older_differentials = [15.0, 14.0, 13.0]
    recent_differentials = [8.0, 7.0]
    
    all_differentials = older_differentials + recent_differentials
    create_rounds_with_differentials(all_differentials)
    
    trend = @service.get_recent_trend
    assert_equal "improving", trend
  end

  test "get_recent_trend identifies declining trend" do
    # Recent scores worse than older scores
    older_differentials = [8.0, 7.0, 6.0]
    recent_differentials = [15.0, 14.0]
    
    all_differentials = older_differentials + recent_differentials
    create_rounds_with_differentials(all_differentials)
    
    trend = @service.get_recent_trend
    assert_equal "declining", trend
  end

  test "get_recent_trend identifies stable trend" do
    # Similar scores throughout
    differentials = [10.0, 10.5, 9.5, 10.2, 9.8]
    create_rounds_with_differentials(differentials)
    
    trend = @service.get_recent_trend
    assert_equal "stable", trend
  end

  test "get_performance_stats returns comprehensive statistics" do
    # Create mix of regular and verified rounds
    create_rounds(5, verified: false)
    create_rounds(3, verified: true)
    
    stats = @service.get_performance_stats
    
    assert_equal 8, stats[:total_rounds]
    assert_equal 3, stats[:verified_rounds]
    assert_not_nil stats[:average_score]
    assert_not_nil stats[:average_differential]
    assert_equal 1, stats[:courses_played] # All rounds on same course
  end

  test "get_performance_stats with no rounds" do
    stats = @service.get_performance_stats
    assert_equal({}, stats)
  end

  test "calculate_playing_handicap with course handicap" do
    @user.update!(handicap_index: 15.0)
    service = HandicapCalculatorService.new(@user)
    
    playing_handicap = service.calculate_playing_handicap(15, 130)
    expected = 15 * (130 / 113.0)
    
    assert_in_delta expected.round, playing_handicap, 1
  end

  test "calculate_playing_handicap without user handicap" do
    @user.update!(handicap_index: nil)
    service = HandicapCalculatorService.new(@user)
    
    playing_handicap = service.calculate_playing_handicap(15, 130)
    assert_nil playing_handicap
  end

  test "exceptional_score_reduction applied correctly" do
    # Create rounds where 3+ scores are 7+ strokes better than handicap
    @user.update!(handicap_index: 15.0)
    service = HandicapCalculatorService.new(@user)
    
    # Create differentials: 3 very low scores (8 strokes below handicap) + 2 normal
    differentials = [7.0, 6.0, 5.0, 14.0, 13.0] # 7.0, 6.0, 5.0 are exceptional
    create_rounds_with_differentials(differentials)
    
    handicap = service.calculate_handicap_index
    # Should apply exceptional score reduction
    assert handicap < 15.0
  end

  private

  def create_round(attrs = {})
    default_attrs = {
      user: @user,
      course: @course,
      started_at: 2.hours.ago,
      completed_at: 1.hour.ago,
      total_strokes: 85,
      course_rating: 72.5,
      slope_rating: 130,
      is_verified: false
    }
    
    Round.create!(default_attrs.merge(attrs))
  end

  def create_rounds(count, verified: false)
    count.times do |i|
      create_round(
        total_strokes: 80 + i,
        completed_at: (count - i).days.ago,
        is_verified: verified
      )
    end
  end

  def create_rounds_with_differentials(differentials, verified: false)
    differentials.each_with_index do |differential, i|
      # Reverse calculate total strokes from differential
      # differential = (total_strokes - course_rating) * 113 / slope_rating
      # total_strokes = (differential * slope_rating / 113) + course_rating
      total_strokes = (differential * 130 / 113.0) + 72.5
      
      round = create_round(
        total_strokes: total_strokes.round,
        completed_at: (differentials.count - i).days.ago,
        is_verified: verified
      )
      
      # Set the score differential directly to ensure accuracy
      round.update_column(:score_differential, differential)
    end
  end
end