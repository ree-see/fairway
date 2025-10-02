module Types
  class YardagesType < Types::BaseObject
    description "Yardages for different tee boxes on a hole"

    field :black, Integer, null: true, description: "Yardage from black tees"
    field :blue, Integer, null: true, description: "Yardage from blue tees"
    field :white, Integer, null: true, description: "Yardage from white tees"
    field :red, Integer, null: true, description: "Yardage from red tees"
    field :gold, Integer, null: true, description: "Yardage from gold tees"
  end
end
