class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid do |t|
      t.string :email,              null: false
      t.string :first_name,         null: false
      t.string :last_name,          null: false
      t.string :password_digest,    null: false
      
      # Handicap information
      t.decimal :handicap_index,    precision: 4, scale: 1
      t.decimal :verified_handicap, precision: 4, scale: 1
      
      # Profile information
      t.string :phone
      t.date :date_of_birth
      t.string :preferred_tees
      
      # Verification status
      t.boolean :email_verified,    default: false
      t.datetime :email_verified_at
      
      # Tracking
      t.integer :rounds_played,     default: 0
      t.integer :verified_rounds,   default: 0
      
      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :handicap_index
    add_index :users, :verified_handicap
    add_index :users, :created_at
  end
end