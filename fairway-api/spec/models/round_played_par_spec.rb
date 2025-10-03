require 'rails_helper'

RSpec.describe 'Round#played_par', type: :model do
  it 'returns 0 when no holes are scored' do
    user = User.create!(email: 'test@example.com', password: 'password123', first_name: 'John', last_name: 'Doe')
    course = Course.new(name: 'Test Course', latitude: 37.7749, longitude: -122.4194, par: 72)
    course.skip_default_holes = true
    course.save!
    round = Round.create!(user: user, course: course, started_at: Time.current, tee_color: 'white', course_rating: 72.5, slope_rating: 130)

    expect(round.played_par).to eq(0)
  end

  it 'calculates par for front 9 holes only' do
    user = User.create!(email: 'test2@example.com', password: 'password123', first_name: 'John', last_name: 'Doe')
    course = Course.new(name: 'Test Course 2', latitude: 37.7749, longitude: -122.4194, par: 72)
    course.skip_default_holes = true
    course.save!

    # Create front 9 holes with varying pars
    holes = []
    (1..9).each do |n|
      holes << Hole.create!(
        course: course,
        number: n,
        par: (n % 3) + 3, # 4, 5, 3, 4, 5, 3, 4, 5, 3
        handicap: n,
        yardage_white: 400,
        distance: 400
      )
    end

    round = Round.create!(user: user, course: course, started_at: Time.current, tee_color: 'white', course_rating: 72.5, slope_rating: 130)

    # Score front 9 holes
    holes.each do |hole|
      HoleScore.create!(
        round: round,
        hole: hole,
        hole_number: hole.number,
        strokes: hole.par,
        putts: 2,
        penalties: 0
      )
    end

    expected_par = holes.sum(&:par)
    expect(round.played_par).to eq(expected_par)
    expect(round.played_par).to eq(36) # 4+5+3+4+5+3+4+5+3
  end

  it 'calculates par for back 9 holes only' do
    user = User.create!(email: 'test3@example.com', password: 'password123', first_name: 'John', last_name: 'Doe')
    course = Course.new(name: 'Test Course 3', latitude: 37.7749, longitude: -122.4194, par: 72)
    course.skip_default_holes = true
    course.save!

    # Create all 18 holes but only score back 9
    (1..18).each do |n|
      Hole.create!(
        course: course,
        number: n,
        par: (n % 3) + 3,
        handicap: ((n - 1) % 18) + 1,
        yardage_white: 400,
        distance: 400
      )
    end

    round = Round.create!(user: user, course: course, started_at: Time.current, tee_color: 'white', course_rating: 72.5, slope_rating: 130)

    # Score only back 9 holes (10-18)
    course.holes.where(number: 10..18).each do |hole|
      HoleScore.create!(
        round: round,
        hole: hole,
        hole_number: hole.number,
        strokes: hole.par,
        putts: 2,
        penalties: 0
      )
    end

    expected_par = course.holes.where(number: 10..18).sum(:par)
    expect(round.played_par).to eq(expected_par)
    expect(round.played_par).to eq(36) # Same pattern for back 9
  end

  it 'calculates par for all 18 holes' do
    user = User.create!(email: 'test4@example.com', password: 'password123', first_name: 'John', last_name: 'Doe')
    course = Course.new(name: 'Test Course 4', latitude: 37.7749, longitude: -122.4194, par: 72)
    course.skip_default_holes = true
    course.save!

    # Create all 18 holes
    (1..18).each do |n|
      Hole.create!(
        course: course,
        number: n,
        par: 4, # Simplify: all par 4s
        handicap: ((n - 1) % 18) + 1,
        yardage_white: 400,
        distance: 400
      )
    end

    round = Round.create!(user: user, course: course, started_at: Time.current, tee_color: 'white', course_rating: 72.5, slope_rating: 130)

    # Score all 18 holes
    course.holes.each do |hole|
      HoleScore.create!(
        round: round,
        hole: hole,
        hole_number: hole.number,
        strokes: hole.par,
        putts: 2,
        penalties: 0
      )
    end

    expect(round.played_par).to eq(72) # 18 x 4
    expect(round.played_par).to eq(course.holes.sum(:par))
  end
end
