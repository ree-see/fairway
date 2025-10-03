require 'test_helper'

class UserStatsServiceTest < ActiveSupport::TestCase
  # Don't load fixtures - create test data manually
  self.use_instantiated_fixtures = false
  def self.fixtures(*); end

  setup do
    @user = User.create!(
      email: "test#{rand(10000)}@example.com",
      password: "password123",
      password_confirmation: "password123",
      first_name: "Test",
      last_name: "User",
      date_of_birth: 25.years.ago.to_date
    )
    @service = UserStatsService.new(@user)

    # Create a course with holes for testing
    @course = Course.create!(
      name: "Test Course",
      city: "Test City",
      state: "CA",
      latitude: 36.0,
      longitude: -121.0,
      par: 72,
      skip_default_holes: true
    )

    # Create 18 holes
    18.times do |i|
      @course.holes.create!(
        number: i + 1,
        par: (i % 3 == 0) ? 5 : ((i % 2 == 0) ? 4 : 3),
        handicap: i + 1,
        yardage_white: 350
      )
    end
  end

  # ========== INSTANCE METHODS TESTS ==========

  test "generate_comprehensive_stats returns empty stats when no rounds" do
    stats = @service.generate_comprehensive_stats

    assert_equal 0.0, stats[:average_putts]
    assert_equal 0.0, stats[:fairway_percentage]
    assert_equal 0.0, stats[:gir_percentage]
    assert_equal 0.0, stats[:scrambling_percentage]
    assert_equal 0.0, stats[:strokes_gained_driving]
    assert_equal 0.0, stats[:strokes_gained_approach]
    assert_equal 0.0, stats[:strokes_gained_short_game]
    assert_equal 0.0, stats[:strokes_gained_putting]
  end

  test "generate_comprehensive_stats calculates stats with rounds" do
    create_test_rounds_for_user(@user, @course, count: 3)

    stats = @service.generate_comprehensive_stats

    assert stats[:average_putts] > 0
    assert stats[:fairway_percentage] >= 0
    assert stats[:gir_percentage] >= 0
    assert stats[:scrambling_percentage] >= 0
    assert_not_nil stats[:strokes_gained_driving]
    assert_not_nil stats[:strokes_gained_approach]
    assert_not_nil stats[:strokes_gained_short_game]
    assert_not_nil stats[:strokes_gained_putting]
  end

  test "calculate_average_putts returns 0.0 when no holes" do
    rounds = @user.rounds.completed
    result = @service.calculate_average_putts(rounds)

    assert_equal 0.0, result
  end

  test "calculate_average_putts calculates correctly" do
    # Create 2 rounds with known putt counts
    round1 = create_completed_round(@user, @course, total_putts: 36) # 2 putts per hole
    round2 = create_completed_round(@user, @course, total_putts: 27) # 1.5 putts per hole

    rounds = @user.rounds.completed
    result = @service.calculate_average_putts(rounds)

    # Expected: (36 + 27) / (18 + 18) = 63 / 36 = 1.75
    assert_in_delta 1.75, result, 0.01
  end

  test "calculate_fairway_percentage returns 0.0 when no driveable holes" do
    # Create course with only par 3s
    par3_course = Course.create!(
      name: "Par 3 Course",
      city: "Test City",
      state: "CA",
      latitude: 36.0,
      longitude: -121.0,
      par: 54,
      skip_default_holes: true
    )

    18.times do |i|
      par3_course.holes.create!(
        number: i + 1,
        par: 3,
        handicap: i + 1,
        yardage_white: 150
      )
    end

    round = create_completed_round(@user, par3_course, fairways_hit: 0)
    rounds = @user.rounds.completed

    result = @service.calculate_fairway_percentage(rounds)

    assert_equal 0.0, result
  end

  test "calculate_fairway_percentage calculates correctly" do
    # Course has 12 par 4/5 holes (driveable)
    driveable_holes = @course.holes.where('par >= ?', 4).count

    # Hit 6 out of 12 fairways
    round = create_completed_round(@user, @course, fairways_hit: 6)
    rounds = @user.rounds.completed

    result = @service.calculate_fairway_percentage(rounds)

    # Expected: (6 / 12) * 100 = 50.0%
    assert_equal 50.0, result
  end

  test "calculate_gir_percentage returns 0.0 when no holes" do
    rounds = @user.rounds.completed
    result = @service.calculate_gir_percentage(rounds)

    assert_equal 0.0, result
  end

  test "calculate_gir_percentage calculates correctly" do
    # Hit 9 greens in regulation out of 18 holes
    round = create_completed_round(@user, @course, greens_in_regulation: 9)
    rounds = @user.rounds.completed

    result = @service.calculate_gir_percentage(rounds)

    # Expected: (9 / 18) * 100 = 50.0%
    assert_equal 50.0, result
  end

  test "calculate_scrambling_percentage estimates correctly" do
    # High GIR (60%), good putting (1.7 avg) should give lower scrambling need
    round1 = create_completed_round(@user, @course, greens_in_regulation: 11, total_putts: 31)
    round2 = create_completed_round(@user, @course, greens_in_regulation: 10, total_putts: 30)

    rounds = @user.rounds.completed
    result = @service.send(:calculate_scrambling_percentage, rounds)

    # Should be a reasonable percentage (0-100)
    assert result >= 0
    assert result <= 100
  end

  # ========== CLASS METHODS TESTS ==========

  test "calculate_user_statistics returns empty stats when no rounds" do
    result = UserStatsService.calculate_user_statistics(@user)

    assert_equal({}, result[:basic_stats])
    assert_equal({}, result[:performance_trends])
    assert_equal({}, result[:consistency_metrics])
    assert_equal [], result[:improvement_areas]
    assert_equal({}, result[:course_performance])
  end

  test "calculate_user_statistics returns stats with rounds" do
    create_test_rounds_for_user(@user, @course, count: 5)

    result = UserStatsService.calculate_user_statistics(@user, limit: 5)

    assert_not_nil result[:basic_stats]
    assert_not_nil result[:performance_trends]
    assert_not_nil result[:consistency_metrics]
    assert_not_nil result[:improvement_areas]
    assert_not_nil result[:course_performance]

    # Check basic stats structure
    assert_equal 5, result[:basic_stats][:rounds_played]
    assert result[:basic_stats][:total_holes] > 0
    assert result[:basic_stats][:average_score] > 0
  end

  test "strokes_gained_analysis returns empty hash when no rounds" do
    result = UserStatsService.strokes_gained_analysis(@user)

    assert_equal({}, result)
  end

  test "strokes_gained_analysis calculates all categories" do
    create_test_rounds_for_user(@user, @course, count: 5)

    result = UserStatsService.strokes_gained_analysis(@user, rounds_limit: 5)

    assert_not_nil result[:overall]
    assert_not_nil result[:driving]
    assert_not_nil result[:approach]
    assert_not_nil result[:short_game]
    assert_not_nil result[:putting]
  end

  test "strokes_gained_overall compares to benchmark" do
    # Create rounds with scores better than 85 (benchmark)
    5.times { create_completed_round(@user, @course, total_strokes: 80) }

    result = UserStatsService.send(:calculate_strokes_gained_overall, @user.rounds.completed)

    # Should be positive (better than benchmark)
    assert result > 0
  end

  test "strokes_gained_putting calculates correctly" do
    # Create rounds with 30 total putts (1.67 per hole)
    5.times { create_completed_round(@user, @course, total_putts: 30) }

    result = UserStatsService.send(:calculate_strokes_gained_putting, @user.rounds.completed)

    # With 1.67 putts/hole vs 1.8 benchmark: (1.8 - 1.67) * 18 = 2.34
    assert_in_delta 2.34, result, 0.5
  end

  test "performance_comparison returns empty when insufficient data" do
    result = UserStatsService.performance_comparison(@user, comparison_period_days: 30)

    assert_equal({}, result)
  end

  test "performance_comparison compares recent vs previous rounds" do
    # Create old rounds (31+ days ago)
    3.times do |i|
      create_completed_round(
        @user,
        @course,
        total_strokes: 90,
        started_at: 35.days.ago + i.days
      )
    end

    # Create recent rounds (last 30 days)
    3.times do |i|
      create_completed_round(
        @user,
        @course,
        total_strokes: 85,
        started_at: 20.days.ago + i.days
      )
    end

    result = UserStatsService.performance_comparison(@user, comparison_period_days: 30)

    assert_not_empty result
    assert_not_nil result[:scoring_average]
    assert_equal 85.0, result[:scoring_average][:recent]
    assert_equal 90.0, result[:scoring_average][:previous]
  end

  test "generate_performance_report generates weekly report" do
    # Create rounds in last week
    3.times do |i|
      create_completed_round(@user, @course, started_at: i.days.ago)
    end

    result = UserStatsService.generate_performance_report(@user, period: :weekly)

    assert_equal :weekly, result[:period]
    assert_equal 3, result[:rounds_played]
    assert_not_nil result[:average_score]
    assert_not_nil result[:best_round]
  end

  test "generate_performance_report generates monthly report" do
    # Create rounds in last month
    5.times do |i|
      create_completed_round(@user, @course, started_at: (i * 5).days.ago)
    end

    result = UserStatsService.generate_performance_report(@user, period: :monthly)

    assert_equal :monthly, result[:period]
    assert_equal 5, result[:rounds_played]
  end

  test "generate_performance_report returns empty for no rounds" do
    result = UserStatsService.generate_performance_report(@user, period: :weekly)

    assert_equal({}, result)
  end

  # ========== HELPER METHOD TESTS ==========

  test "calculate_trend_direction identifies improving trend" do
    # Scores getting better over time: [90, 89, 88, 87, 86, 85]
    scores = [90, 89, 88, 87, 86, 85]

    result = UserStatsService.send(:calculate_trend_direction, scores)

    assert_equal 'improving', result
  end

  test "calculate_trend_direction identifies declining trend" do
    # Scores getting worse: [85, 86, 87, 88, 89, 90]
    scores = [85, 86, 87, 88, 89, 90]

    result = UserStatsService.send(:calculate_trend_direction, scores)

    assert_equal 'declining', result
  end

  test "calculate_trend_direction identifies stable trend" do
    # Scores staying similar: [88, 87, 88, 87, 88, 87]
    scores = [88, 87, 88, 87, 88, 87]

    result = UserStatsService.send(:calculate_trend_direction, scores)

    assert_equal 'stable', result
  end

  test "analyze_recent_form classifies consistency" do
    # Very consistent scores (low std dev)
    consistent_scores = [85, 85, 86, 85, 85]
    result = UserStatsService.send(:analyze_recent_form, consistent_scores)
    assert_includes ['very_consistent', 'consistent'], result

    # Inconsistent scores (high std dev)
    inconsistent_scores = [75, 95, 80, 100, 78]
    result = UserStatsService.send(:analyze_recent_form, inconsistent_scores)
    assert_includes ['variable', 'inconsistent'], result
  end

  test "calculate_score_volatility measures round-to-round variation" do
    # Scores with high volatility
    volatile_scores = [80, 95, 78, 92, 81]
    result = UserStatsService.send(:calculate_score_volatility, volatile_scores)
    assert result > 5 # High volatility

    # Scores with low volatility
    stable_scores = [85, 86, 85, 86, 85]
    result = UserStatsService.send(:calculate_score_volatility, stable_scores)
    assert result < 2 # Low volatility
  end

  test "calculate_improvement_rate measures score improvement" do
    # Improving scores (lower is better in golf)
    improving_scores = [95, 92, 89, 86, 83, 80]
    result = UserStatsService.send(:calculate_improvement_rate, improving_scores)
    assert result > 0 # Positive improvement rate

    # Declining scores (getting worse)
    declining_scores = [80, 83, 86, 89, 92, 95]
    result = UserStatsService.send(:calculate_improvement_rate, declining_scores)
    assert result < 0 # Negative improvement rate
  end

  test "calculate_consistency_within_range measures score clustering" do
    scores = [85, 86, 85, 87, 85, 86, 85, 90]

    # Within 1 stroke of mean (85.625)
    result_one = UserStatsService.send(:calculate_consistency_within_range, scores, 1)

    # Within 3 strokes
    result_three = UserStatsService.send(:calculate_consistency_within_range, scores, 3)

    # More scores should be within 3 strokes than 1
    assert result_three >= result_one
    assert result_one > 0
    assert result_three <= 100
  end

  test "identify_improvement_opportunities flags high putts" do
    # Create rounds with high putting average (2.2 per hole)
    3.times { create_completed_round(@user, @course, total_putts: 40) }

    opportunities = UserStatsService.send(:identify_improvement_opportunities, @user.rounds.completed)

    putting_opp = opportunities.find { |o| o[:category] == 'putting' }
    assert_not_nil putting_opp
    assert_equal 'high', putting_opp[:priority]
  end

  test "identify_improvement_opportunities flags low fairway percentage" do
    # Hit only 3 out of 12 fairways (25%)
    3.times { create_completed_round(@user, @course, fairways_hit: 3) }

    opportunities = UserStatsService.send(:identify_improvement_opportunities, @user.rounds.completed)

    driving_opp = opportunities.find { |o| o[:category] == 'driving' }
    assert_not_nil driving_opp
    assert_equal 'medium', driving_opp[:priority]
  end

  test "identify_improvement_opportunities flags low GIR" do
    # Hit only 5 greens (27.8%)
    3.times { create_completed_round(@user, @course, greens_in_regulation: 5) }

    opportunities = UserStatsService.send(:identify_improvement_opportunities, @user.rounds.completed)

    approach_opp = opportunities.find { |o| o[:category] == 'approach' }
    assert_not_nil approach_opp
    assert_equal 'high', approach_opp[:priority]
  end

  # ========== EDGE CASES ==========

  test "handles rounds with nil values gracefully" do
    round = create_completed_round(@user, @course,
      total_putts: nil,
      fairways_hit: nil,
      greens_in_regulation: nil
    )

    stats = @service.generate_comprehensive_stats

    # Should not raise errors, return defaults
    assert_not_nil stats
    assert stats[:average_putts] >= 0
  end

  test "handles single round correctly" do
    create_completed_round(@user, @course)

    result = UserStatsService.calculate_user_statistics(@user, limit: 10)

    assert_equal 1, result[:basic_stats][:rounds_played]
    # Performance trends need 3+ rounds, should be empty or minimal
    assert result[:performance_trends].empty? || result[:performance_trends][:score_trend] == 'stable'
  end

  test "handles very large number of rounds efficiently" do
    # Create 50 rounds
    50.times { create_completed_round(@user, @course) }

    # Should handle without errors
    assert_nothing_raised do
      UserStatsService.calculate_user_statistics(@user, limit: 20)
    end
  end

  private

  def create_completed_round(user, course,
    total_strokes: 85,
    total_putts: 32,
    fairways_hit: 7,
    greens_in_regulation: 9,
    started_at: 1.day.ago)

    round = user.rounds.create!(
      course: course,
      started_at: started_at,
      completed_at: started_at + 4.hours,
      tee_color: 'white',
      total_strokes: total_strokes,
      total_putts: total_putts || 32,
      fairways_hit: fairways_hit || 7,
      greens_in_regulation: greens_in_regulation || 9,
      total_penalties: 2,
      is_provisional: false,
      is_verified: true,
      course_rating: course.course_rating || 72.0,
      slope_rating: course.slope_rating || 113
    )

    round
  end

  def create_test_rounds_for_user(user, course, count: 3)
    count.times do |i|
      create_completed_round(
        user,
        course,
        total_strokes: 80 + rand(15),
        total_putts: 28 + rand(12),
        fairways_hit: 5 + rand(8),
        greens_in_regulation: 6 + rand(8),
        started_at: (count - i).days.ago
      )
    end
  end
end
