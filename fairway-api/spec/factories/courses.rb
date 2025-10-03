FactoryBot.define do
  factory :course do
    sequence(:name) { |n| "Golf Course #{n}" }
    address { '123 Golf Lane' }
    city { 'Golftown' }
    state { 'CA' }
    postal_code { '12345' }
    country { 'USA' }
    par { 72 }
    course_rating { 72.5 }
    slope_rating { 130 }
    latitude { 37.7749 }
    longitude { -122.4194 }

    # Skip default hole creation in tests
    skip_default_holes { true }

    factory :course_with_holes do
      transient do
        holes_count { 18 }
      end

      after(:create) do |course, evaluator|
        # Create front 9 holes
        (1..9).each do |hole_number|
          Hole.create!(
            course: course,
            number: hole_number,
            par: [3, 4, 5].sample,
            handicap: hole_number,
            yardage_white: 400,
            distance: 400
          )
        end

        # Create back 9 holes
        (10..18).each do |hole_number|
          Hole.create!(
            course: course,
            number: hole_number,
            par: [3, 4, 5].sample,
            handicap: hole_number - 9,
            yardage_white: 400,
            distance: 400
          )
        end

        # Update course par based on holes
        course.update!(par: course.holes.sum(:par))
      end
    end
  end
end
