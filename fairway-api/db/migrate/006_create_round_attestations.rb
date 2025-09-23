class CreateRoundAttestations < ActiveRecord::Migration[8.0]
  def change
    create_table :round_attestations, id: :uuid do |t|
      t.references :round, null: false, foreign_key: true, type: :uuid
      t.references :attester, null: false, foreign_key: { to_table: :users }, type: :uuid
      
      # Attestation details
      t.boolean :is_approved,     null: false
      t.text :comments
      t.datetime :attested_at,    null: false
      
      # Attester's round (if they played in same group)
      t.references :attester_round, foreign_key: { to_table: :rounds }, type: :uuid
      
      # Request details
      t.datetime :requested_at,   null: false
      t.string :request_method,   default: 'push_notification' # 'push_notification', 'email', 'sms'
      
      # Location verification (attester was at course)
      t.decimal :attester_latitude,  precision: 10, scale: 6
      t.decimal :attester_longitude, precision: 10, scale: 6
      t.boolean :location_verified,  default: false
      
      t.timestamps null: false
    end

    add_index :round_attestations, [:round_id, :attester_id], unique: true
    add_index :round_attestations, :is_approved
    add_index :round_attestations, :attested_at
    add_index :round_attestations, :requested_at
  end
end