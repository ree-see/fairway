class AddFairwayMissDetailsToHoleScores < ActiveRecord::Migration[8.0]
  def change
    add_column :hole_scores, :fairway_miss_type, :string
    add_column :hole_scores, :fairway_miss_direction, :string
  end
end
