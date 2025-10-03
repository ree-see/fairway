FactoryBot.define do
  factory :hole do
    association :course
    number { 1 }
    par { 4 }
    handicap { 1 }
    yardage_white { 400 }
    yardage_blue { 420 }
    distance { 400 }
  end
end
