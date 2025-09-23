class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses, id: :uuid do |t|
      t.string :name,           null: false
      t.text :address
      t.string :city
      t.string :state
      t.string :country,        default: 'US'
      t.string :postal_code
      
      # GPS coordinates for geo-fencing
      t.decimal :latitude,      precision: 10, scale: 6, null: false
      t.decimal :longitude,     precision: 10, scale: 6, null: false
      
      # Course ratings and difficulty
      t.decimal :course_rating, precision: 4, scale: 1
      t.integer :slope_rating
      t.integer :par
      t.integer :total_yardage
      
      # Course metadata
      t.string :phone
      t.string :website
      t.text :description
      t.boolean :private_course, default: false
      t.boolean :active,         default: true
      
      # Geo-fencing radius in meters
      t.integer :geofence_radius, default: 500
      
      t.timestamps null: false
    end

    add_index :courses, [:latitude, :longitude]
    add_index :courses, :name
    add_index :courses, :city
    add_index :courses, :active
  end
end