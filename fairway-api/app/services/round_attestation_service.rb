class RoundAttestationService
  def initialize(round)
    @round = round
  end

  def request_attestation(attester)
    return false if @round.attesters.include?(attester)
    return false if attester == @round.user
    
    @round.round_attestations.create!(
      attester: attester,
      requested_at: Time.current,
      is_approved: false
    )
  end

  def add_attestation(attester, approved:, comments: nil)
    attestation = @round.round_attestations.find_or_initialize_by(attester: attester)
    
    attestation.update!(
      is_approved: approved,
      comments: comments,
      attested_at: Time.current
    )

    update_verification_status
    attestation
  end

  def calculate_verification_status
    verification_count = @round.round_attestations.where(is_approved: true).count
    is_verified = verification_count >= 1 && @round.fraud_risk_score < 50.0
    is_provisional = !is_verified

    {
      verification_count: verification_count,
      is_verified: is_verified,
      is_provisional: is_provisional
    }
  end

  private

  def update_verification_status
    status = calculate_verification_status
    
    @round.update!(
      verification_count: status[:verification_count],
      is_verified: status[:is_verified],
      is_provisional: status[:is_provisional]
    )
  end
end