FactoryBot.define do
  factory :hole_score do
    association :round
    association :hole
    strokes { 4 }
    putts { 2 }
    penalties { 0 }
    fairway_hit { true }
    green_in_regulation { true }
    started_at { Time.current }
    completed_at { Time.current + 10.minutes }

    trait :with_penalty do
      penalties { 1 }
      strokes { 5 }
    end

    trait :missed_fairway do
      fairway_hit { false }
      fairway_miss_type { 'rough' }
      fairway_miss_direction { 'left' }
    end

    trait :missed_green do
      green_in_regulation { false }
      up_and_down { false }
    end
  end
end
