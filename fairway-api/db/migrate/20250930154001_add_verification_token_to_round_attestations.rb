class AddVerificationTokenToRoundAttestations < ActiveRecord::Migration[8.0]
  def change
    add_column :round_attestations, :verification_token, :string
    add_column :round_attestations, :verifier_phone, :string
    add_column :round_attestations, :verifier_name, :string
    add_column :round_attestations, :token_expires_at, :datetime
    add_column :round_attestations, :verified_via_link, :boolean, default: false
    add_column :round_attestations, :link_clicked_at, :datetime
    add_column :round_attestations, :link_click_count, :integer, default: 0

    add_index :round_attestations, :verification_token, unique: true
    add_index :round_attestations, :token_expires_at
    add_index :round_attestations, :verifier_phone
  end
end
