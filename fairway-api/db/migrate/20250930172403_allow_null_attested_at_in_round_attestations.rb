class AllowNullAttestedAtInRoundAttestations < ActiveRecord::Migration[8.0]
  def change
    change_column_null :round_attestations, :attested_at, true
  end
end
