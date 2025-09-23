require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @course = courses(:pebble_beach)
  end

  test "should be valid" do
    assert @user.valid?
  end

  test "email should be present" do
    @user.email = "     "
    assert_not @user.valid?
  end

  test "email should not be too long" do
    @user.email = "a" * 244 + "@example.com"
    assert_not @user.valid?
  end

  test "email validation should accept valid addresses" do
    valid_addresses = %w[user@example.com USER@foo.COM A_US-ER@foo.bar.org first.last@foo.jp alice+bob@baz.cn]
    valid_addresses.each do |valid_address|
      @user.email = valid_address
      assert @user.valid?, "#{valid_address.inspect} should be valid"
    end
  end

  test "email validation should reject invalid addresses" do
    invalid_addresses = %w[user@example,com user_at_foo.org user.name@example. foo@bar_baz.com foo@bar+baz.com]
    invalid_addresses.each do |invalid_address|
      @user.email = invalid_address
      assert_not @user.valid?, "#{invalid_address.inspect} should be invalid"
    end
  end

  test "email addresses should be unique" do
    duplicate_user = @user.dup
    duplicate_user.email = @user.email.upcase
    @user.save
    assert_not duplicate_user.valid?
  end

  test "password should have a minimum length" do
    @user.password = @user.password_confirmation = "a" * 7
    assert_not @user.valid?
  end

  # Handicap calculation tests
  test "calculate_provisional_handicap with insufficient rounds" do
    @user.rounds.delete_all
    assert_nil @user.calculate_provisional_handicap
  end

  test "calculate_provisional_handicap with exactly 5 rounds" do
    create_completed_rounds(@user, 5, [80, 85, 90, 82, 88])
    handicap = @user.calculate_provisional_handicap
    
    # Should calculate based on best rounds
    assert_not_nil handicap
    assert handicap >= 0
    assert handicap <= 54.0
  end

  test "calculate_provisional_handicap uses best 8 of 20 rounds" do
    # Create 20 rounds with known score differentials
    scores = [70, 75, 80, 85, 90, 95, 100, 105, 82, 87, 92, 77, 83, 88, 93, 78, 84, 89, 94, 76]
    create_completed_rounds(@user, 20, scores)
    
    handicap = @user.calculate_provisional_handicap
    assert_not_nil handicap
    
    # Verify it's using best 8 scores (should be lower than average)
    average_differential = calculate_average_differential(scores)
    best_8_average = calculate_best_8_average(scores)
    
    assert handicap < average_differential * 0.96
    assert_in_delta best_8_average * 0.96, handicap, 0.1
  end

  test "calculate_verified_handicap requires verified rounds" do
    create_completed_rounds(@user, 10, [80, 85, 90, 82, 88, 83, 87, 91, 79, 86], verified: false)
    assert_nil @user.calculate_verified_handicap
  end

  test "calculate_verified_handicap with verified rounds" do
    create_completed_rounds(@user, 8, [80, 85, 90, 82, 88, 83, 87, 91], verified: true)
    
    handicap = @user.calculate_verified_handicap
    assert_not_nil handicap
    assert handicap >= 0
    assert handicap <= 54.0
  end

  test "handicap updates are calculated on save" do
    create_completed_rounds(@user, 10, [80, 85, 90, 82, 88, 83, 87, 91, 79, 86])
    
    original_handicap = @user.handicap_index
    @user.save
    @user.reload
    
    # Handicap should be calculated
    assert_not_nil @user.handicap_index
  end

  test "handicap validation ranges" do
    @user.handicap_index = -15.0
    assert_not @user.valid?
    
    @user.handicap_index = 60.0
    assert_not @user.valid?
    
    @user.handicap_index = 15.5
    assert @user.valid?
  end

  test "full_name concatenation" do
    @user.first_name = "John"
    @user.last_name = "Doe"
    assert_equal "John Doe", @user.full_name
  end

  test "has_handicap?" do
    @user.handicap_index = nil
    assert_not @user.has_handicap?
    
    @user.handicap_index = 15.5
    assert @user.has_handicap?
  end

  test "recent_rounds returns correct count and order" do
    create_completed_rounds(@user, 15, Array.new(15, 85))
    
    recent = @user.recent_rounds(10)
    assert_equal 10, recent.count
    
    # Should be ordered by most recent first
    assert recent.first.started_at >= recent.last.started_at
  end

  test "average_score calculation" do
    scores = [80, 85, 90, 82, 88]
    create_completed_rounds(@user, 5, scores)
    
    expected_average = scores.sum / scores.length.to_f
    assert_in_delta expected_average, @user.average_score, 0.1
  end

  private

  def create_completed_rounds(user, count, scores, verified: false)
    count.times do |i|
      round = user.rounds.create!(
        course: @course,
        started_at: i.days.ago,
        completed_at: i.days.ago + 4.hours,
        tee_color: 'white',
        total_strokes: scores[i] || 85,
        course_rating: @course.course_rating || 72.0,
        slope_rating: @course.slope_rating || 113,
        is_verified: verified
      )
      
      # Calculate score differential
      round.calculate_score_differential
      round.save!
    end
  end

  def calculate_average_differential(scores)
    course_rating = @course.course_rating || 72.0
    slope_rating = @course.slope_rating || 113
    
    differentials = scores.map do |score|
      (113.0 / slope_rating) * (score - course_rating)
    end
    
    differentials.sum / differentials.length.to_f
  end

  def calculate_best_8_average(scores)
    course_rating = @course.course_rating || 72.0
    slope_rating = @course.slope_rating || 113
    
    differentials = scores.map do |score|
      (113.0 / slope_rating) * (score - course_rating)
    end
    
    best_8 = differentials.sort.first(8)
    best_8.sum / best_8.length.to_f
  end
end