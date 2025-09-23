class CreateRounds < ActiveRecord::Migration[8.0]
  def change
    create_table :rounds, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :course, null: false, foreign_key: true, type: :uuid
      
      # Round timing
      t.datetime :started_at,     null: false
      t.datetime :completed_at
      t.datetime :submitted_at
      
      # Round details
      t.string :tee_color,        null: false, default: 'white'
      t.decimal :course_rating,   precision: 4, scale: 1
      t.integer :slope_rating
      t.integer :total_strokes
      t.integer :total_putts
      t.decimal :score_differential, precision: 4, scale: 1
      
      # Weather conditions
      t.string :weather_conditions
      t.integer :temperature
      t.integer :wind_speed
      t.string :wind_direction
      
      # Verification status
      t.boolean :is_verified,     default: false
      t.boolean :is_provisional,  default: true
      t.integer :verification_count, default: 0
      
      # Fraud detection
      t.decimal :fraud_risk_score, precision: 5, scale: 2, default: 0.0
      t.text :fraud_risk_factors
      
      # Location verification
      t.boolean :location_verified, default: false
      t.decimal :start_latitude,  precision: 10, scale: 6
      t.decimal :start_longitude, precision: 10, scale: 6
      
      # Performance tracking
      t.integer :fairways_hit,    default: 0
      t.integer :greens_in_regulation, default: 0
      t.integer :total_penalties, default: 0
      
      t.timestamps null: false
    end

    add_index :rounds, [:user_id, :started_at]
    add_index :rounds, [:course_id, :started_at]
    add_index :rounds, :is_verified
    add_index :rounds, :fraud_risk_score
    add_index :rounds, :started_at
  end
end