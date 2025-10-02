module Types
  class HoleType < Types::BaseObject
    description "A hole on a golf course"

    field :id, ID, null: false
    field :number, Integer, null: false, description: "Hole number (1-18)"
    field :par, Integer, null: false, description: "Par for the hole"
    field :handicap, Integer, null: false, description: "Handicap rating (1-18)"
    field :distance, Integer, null: true, description: "Default distance for display"
    field :description, String, null: true
    field :shape, String, null: true
    field :difficulty_rating, String, null: true

    field :yardages, Types::YardagesType, null: false, description: "Yardages from different tees"

    def yardages
      {
        black: object.yardage_black,
        blue: object.yardage_blue,
        white: object.yardage_white,
        red: object.yardage_red,
        gold: object.yardage_gold
      }
    end
  end
end
