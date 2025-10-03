FactoryBot.define do
  factory :round do
    association :user
    association :course
    started_at { Time.current }
    tee_color { 'white' }
    course_rating { 72.5 }
    slope_rating { 130 }
    start_latitude { 37.7749 }
    start_longitude { -122.4194 }

    trait :completed do
      completed_at { Time.current + 4.hours }
      submitted_at { Time.current + 4.hours }
      total_strokes { 85 }
    end

    trait :verified do
      is_verified { true }
      verification_count { 2 }
    end
  end
end
