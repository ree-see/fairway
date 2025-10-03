require 'rails_helper'

RSpec.describe Round, type: :model do
  describe '#played_par' do
    let(:user) { create(:user) }
    let(:course) do
      course = create(:course, par: 72)
      # Create 18 holes manually
      (1..18).each do |n|
        Hole.create!(
          course: course,
          number: n,
          par: (n % 3) + 3, # Alternates between 3, 4, 5
          handicap: ((n - 1) % 18) + 1,
          yardage_white: 400,
          distance: 400
        )
      end
      course.update!(par: course.holes.sum(:par))
      course
    end
    let(:round) { create(:round, user: user, course: course) }

    context 'when no holes are scored' do
      it 'returns 0' do
        expect(round.played_par).to eq(0)
      end
    end

    context 'when front 9 holes are scored' do
      before do
        # Create hole scores for front 9 (holes 1-9)
        course.holes.front_nine.each do |hole|
          HoleScore.create!(round: round, hole: hole, strokes: hole.par, putts: 2, penalties: 0, hole_number: hole.number)
        end
      end

      it 'returns sum of par for front 9 holes' do
        expected_par = course.holes.front_nine.sum(:par)
        expect(round.played_par).to eq(expected_par)
        expect(expected_par).to be > 0
      end
    end

    context 'when back 9 holes are scored' do
      before do
        # Create hole scores for back 9 (holes 10-18)
        course.holes.back_nine.each do |hole|
          HoleScore.create!(round: round, hole: hole, strokes: hole.par, putts: 2, penalties: 0, hole_number: hole.number)
        end
      end

      it 'returns sum of par for back 9 holes' do
        expected_par = course.holes.back_nine.sum(:par)
        expect(round.played_par).to eq(expected_par)
        expect(expected_par).to be > 0
      end
    end

    context 'when all 18 holes are scored' do
      before do
        # Create hole scores for all 18 holes
        course.holes.each do |hole|
          HoleScore.create!(round: round, hole: hole, strokes: hole.par, putts: 2, penalties: 0, hole_number: hole.number)
        end
      end

      it 'returns sum of par for all 18 holes' do
        expected_par = course.holes.sum(:par)
        expect(round.played_par).to eq(expected_par)
        expect(round.played_par).to eq(course.par)
      end
    end

    context 'when mixed holes are scored' do
      before do
        # Score specific holes: 1, 2, 10, 11, 18
        [1, 2, 10, 11, 18].each do |hole_number|
          hole = course.holes.find_by(number: hole_number)
          HoleScore.create!(round: round, hole: hole, strokes: hole.par, putts: 2, penalties: 0, hole_number: hole.number)
        end
      end

      it 'returns sum of par for only the holes played' do
        expected_par = course.holes.where(number: [1, 2, 10, 11, 18]).sum(:par)
        expect(round.played_par).to eq(expected_par)
        expect(expected_par).to be > 0
      end
    end
  end
end
