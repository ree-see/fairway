class VerificationLinkService
  TOKEN_EXPIRY_DAYS = 7
  MAX_VERIFICATIONS_PER_DAY = 5

  def initialize(round, phone_number, verifier_name: nil)
    @round = round
    @phone_number = normalize_phone_number(phone_number)
    @verifier_name = verifier_name
  end

  def create_and_send_link
    # Check rate limits
    return error_result('Daily verification limit reached') unless within_rate_limit?

    # Check if round is completed
    return error_result('Round must be completed before requesting verification') unless @round.completed?

    # Generate secure token
    token = generate_unique_token

    # Create attestation record
    attestation = create_attestation(token)
    return error_result('Failed to create attestation', attestation.errors.full_messages) unless attestation.persisted?

    # Send SMS with verification link
    sms_result = send_verification_sms(attestation)
    return error_result('Failed to send SMS', sms_result[:error]) unless sms_result[:success]

    success_result(attestation, sms_result[:message_sid])
  end

  def self.verify_from_link(token, verified:, verifier_name: nil)
    attestation = RoundAttestation.find_by(verification_token: token)

    return error_result('Invalid or expired verification link') unless attestation
    return error_result('Verification link has expired') if attestation.token_expired?
    return error_result('This round has already been verified') if attestation.attested_at.present?

    # Track link click
    attestation.increment!(:link_click_count)
    attestation.update!(link_clicked_at: Time.current) if attestation.link_clicked_at.nil?

    # Update attestation with verification
    attestation.update!(
      is_approved: verified,
      attested_at: Time.current,
      verified_via_link: true,
      verifier_name: verifier_name || attestation.verifier_name
    )

    success_result(attestation)
  end

  def self.get_attestation_by_token(token)
    attestation = RoundAttestation.includes(round: [:user, :course]).find_by(verification_token: token)
    return error_result('Invalid verification link') unless attestation
    return error_result('Verification link has expired') if attestation.token_expired?

    success_result(attestation)
  end

  private

  def generate_unique_token
    loop do
      token = SecureRandom.urlsafe_base64(32)
      break token unless RoundAttestation.exists?(verification_token: token)
    end
  end

  def create_attestation(token)
    # Try to find existing user by phone number first
    attester = User.find_by(phone: @phone_number) || find_or_create_system_user

    # Find existing attestation or create new one
    attestation = @round.round_attestations.find_or_initialize_by(
      attester_id: attester.id
    )

    # Update attributes
    attestation.verification_token = token
    attestation.verifier_phone = @phone_number
    attestation.verifier_name = @verifier_name
    attestation.token_expires_at = TOKEN_EXPIRY_DAYS.days.from_now
    attestation.requested_at = Time.current
    attestation.request_method = 'sms'
    attestation.is_approved = false

    # Skip validation on update since we're just refreshing the token
    if attestation.persisted?
      attestation.save!(validate: false)
    else
      attestation.save!
    end

    attestation
  end

  def find_or_create_system_user
    # Create a system user for link-based verifications
    # This user represents non-app users who verify via SMS link
    User.find_or_create_by!(email: 'system+verifications@fairway.app') do |user|
      user.first_name = 'System'
      user.last_name = 'Verifier'
      user.password = SecureRandom.hex(32)
      user.phone = nil
    end
  end

  def send_verification_sms(attestation)
    SmsService.send_verification_link(
      to: @phone_number,
      player_name: @round.user.full_name,
      course_name: @round.course.name,
      score: @round.total_strokes,
      verification_url: verification_url(attestation.verification_token)
    )
  rescue => e
    { success: false, error: e.message }
  end

  def verification_url(token)
    "#{Rails.application.config.app_url}/verify/#{token}"
  end

  def normalize_phone_number(phone)
    # Remove all non-digit characters
    digits = phone.to_s.gsub(/\D/, '')

    # Add +1 for US numbers if not present
    digits = "1#{digits}" if digits.length == 10

    "+#{digits}"
  end

  def within_rate_limit?
    recent_requests = @round.round_attestations
      .where('requested_at > ?', 1.day.ago)
      .where(request_method: 'sms')
      .count

    recent_requests < MAX_VERIFICATIONS_PER_DAY
  end

  def self.error_result(message, details = nil)
    { success: false, error: message, details: details }
  end

  def error_result(message, details = nil)
    self.class.error_result(message, details)
  end

  def self.success_result(attestation, message_sid = nil)
    { success: true, attestation: attestation, message_sid: message_sid }
  end

  def success_result(attestation, message_sid = nil)
    self.class.success_result(attestation, message_sid)
  end
end