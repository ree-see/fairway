class CreateHoles < ActiveRecord::Migration[8.0]
  def change
    create_table :holes, id: :uuid do |t|
      t.references :course, null: false, foreign_key: true, type: :uuid
      
      t.integer :number,        null: false, limit: 2
      t.integer :par,           null: false, limit: 1
      t.integer :handicap,      null: false, limit: 2
      
      # Yardages for different tees
      t.integer :yardage_black
      t.integer :yardage_blue
      t.integer :yardage_white
      t.integer :yardage_red
      t.integer :yardage_gold
      
      # GPS coordinates for pin location
      t.decimal :tee_latitude,    precision: 10, scale: 6
      t.decimal :tee_longitude,   precision: 10, scale: 6
      t.decimal :green_latitude,  precision: 10, scale: 6
      t.decimal :green_longitude, precision: 10, scale: 6
      
      # Additional hole information
      t.text :description
      t.string :shape # 'dogleg_left', 'dogleg_right', 'straight'
      
      t.timestamps null: false
    end

    add_index :holes, [:course_id, :number], unique: true
    add_index :holes, :par
    add_index :holes, :handicap
  end
end