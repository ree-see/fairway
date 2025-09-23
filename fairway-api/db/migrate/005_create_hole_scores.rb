class CreateHoleScores < ActiveRecord::Migration[8.0]
  def change
    create_table :hole_scores, id: :uuid do |t|
      t.references :round, null: false, foreign_key: true, type: :uuid
      t.references :hole, null: false, foreign_key: true, type: :uuid
      
      t.integer :hole_number,     null: false, limit: 2
      t.integer :strokes,         null: false, limit: 2
      t.integer :putts,           limit: 2
      
      # Shot tracking
      t.boolean :fairway_hit
      t.boolean :green_in_regulation
      t.integer :penalties,       default: 0, limit: 1
      
      # Distance tracking
      t.integer :drive_distance
      t.integer :approach_distance
      
      # GPS tracking for shots
      t.json :shot_coordinates # Array of {lat, lng, club, distance}
      
      # Strokes Gained data
      t.decimal :strokes_gained_total,    precision: 4, scale: 2
      t.decimal :strokes_gained_driving,  precision: 4, scale: 2
      t.decimal :strokes_gained_approach, precision: 4, scale: 2
      t.decimal :strokes_gained_short,    precision: 4, scale: 2
      t.decimal :strokes_gained_putting,  precision: 4, scale: 2
      
      # Timing for fraud detection
      t.datetime :started_at
      t.datetime :completed_at
      
      t.timestamps null: false
    end

    add_index :hole_scores, [:round_id, :hole_number], unique: true
    add_index :hole_scores, :strokes
    add_index :hole_scores, :fairway_hit
    add_index :hole_scores, :green_in_regulation
  end
end