class AddUpAndDownToHoleScores < ActiveRecord::Migration[8.0]
  def change
    add_column :hole_scores, :up_and_down, :boolean
    add_index :hole_scores, :up_and_down
  end
end