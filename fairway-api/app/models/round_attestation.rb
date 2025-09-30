class RoundAttestation < ApplicationRecord
  # Associations
  belongs_to :round
  belongs_to :attester, class_name: 'User'
  belongs_to :attester_round, class_name: 'Round', optional: true

  # Validations
  validates :is_approved, inclusion: { in: [true, false] }
  validates :attested_at, presence: true, if: :is_approved?
  validates :requested_at, presence: true
  validates :request_method, inclusion: { in: %w[push_notification email sms] }
  validates :attester_id, uniqueness: { scope: :round_id }, on: :create
  
  # GPS coordinate validations
  validates :attester_latitude, numericality: { 
    greater_than_or_equal_to: -90.0, 
    less_than_or_equal_to: 90.0 
  }, allow_nil: true
  
  validates :attester_longitude, numericality: { 
    greater_than_or_equal_to: -180.0, 
    less_than_or_equal_to: 180.0 
  }, allow_nil: true

  # Custom validations
  validate :attester_cannot_be_round_owner
  validate :attestation_timing_is_reasonable

  # Scopes
  scope :approved, -> { where(is_approved: true) }
  scope :rejected, -> { where(is_approved: false) }
  scope :recent, -> { order(attested_at: :desc) }
  scope :pending_response, -> { where(attested_at: nil) }
  scope :location_verified, -> { where(location_verified: true) }
  scope :via_link, -> { where(verified_via_link: true) }
  scope :via_app, -> { where(verified_via_link: false) }
  scope :token_not_expired, -> { where('token_expires_at > ?', Time.current) }

  # Callbacks
  before_save :verify_attester_location
  after_save :update_round_verification_status

  def approved?
    is_approved
  end

  def rejected?
    !is_approved
  end

  def response_time_minutes
    return nil unless requested_at && attested_at
    ((attested_at - requested_at) / 60).round
  end

  def same_group?
    attester_round.present? && 
    attester_round.course == round.course &&
    (attester_round.started_at - round.started_at).abs < 2.hours
  end

  def attester_distance_from_course
    return nil unless attester_coordinates? && round.course
    
    round.course.distance_from(attester_latitude, attester_longitude)
  end

  def attester_coordinates?
    attester_latitude.present? && attester_longitude.present?
  end

  def trustworthy?
    # Factors that make an attestation more trustworthy
    factors = []
    
    factors << location_verified
    factors << same_group?
    factors << (response_time_minutes && response_time_minutes < 180) # responded within 3 hours
    factors << attester.verified?
    factors << (attester.rounds_played >= 5)
    
    factors.count(true) >= 3
  end

  def fraud_risk_indicators
    indicators = []

    indicators << 'Attester not at course' unless location_verified
    indicators << 'Very quick response' if response_time_minutes && response_time_minutes < 5
    indicators << 'Very slow response' if response_time_minutes && response_time_minutes > 1440 # 24 hours
    indicators << 'Attester not in same group' unless same_group?
    indicators << 'Unverified attester' unless attester.verified?
    indicators << 'New attester account' if attester.rounds_played < 3

    indicators
  end

  def token_expired?
    token_expires_at.present? && token_expires_at < Time.current
  end

  def token_valid?
    verification_token.present? && !token_expired?
  end

  def verified_via_link?
    verified_via_link
  end

  def pending_verification?
    attested_at.nil? && token_valid?
  end

  private

  def verify_attester_location
    if attester_coordinates? && round.course
      distance = attester_distance_from_course
      self.location_verified = distance && distance <= round.course.geofence_radius * 2 # Allow 2x geofence for attestation
    end
  end

  def update_round_verification_status
    return unless saved_change_to_is_approved?
    
    # Recalculate round verification
    approved_count = round.round_attestations.approved.count
    round.update!(
      verification_count: approved_count,
      is_verified: approved_count >= 1 && round.fraud_risk_score < 50.0,
      is_provisional: !(approved_count >= 1 && round.fraud_risk_score < 50.0)
    )
  end

  def attester_cannot_be_round_owner
    if attester_id == round.user_id
      errors.add(:attester, "cannot attest to their own round")
    end
  end

  def attestation_timing_is_reasonable
    return unless requested_at && attested_at
    
    time_diff = attested_at - requested_at
    
    if time_diff < 0
      errors.add(:attested_at, "cannot be before requested_at")
    elsif time_diff > 7.days
      errors.add(:attested_at, "response too late (more than 7 days)")
    end
  end
end