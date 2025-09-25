class Round < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :course
  has_many :hole_scores, dependent: :destroy
  has_many :round_attestations, dependent: :destroy
  has_many :attesters, through: :round_attestations, source: :attester

  # Validations
  validates :started_at, presence: true
  validates :tee_color, presence: true, inclusion: { in: %w[black blue white red gold] }
  validates :total_strokes, numericality: { greater_than: 0, less_than: 200 }, allow_nil: true
  validates :total_putts, numericality: { greater_than: 0, less_than: 100 }, allow_nil: true
  validates :verification_count, numericality: { greater_than_or_equal_to: 0 }
  validates :fraud_risk_score, numericality: { greater_than_or_equal_to: 0.0, less_than_or_equal_to: 100.0 }

  # Validations for location
  validates :start_latitude, numericality: { 
    greater_than_or_equal_to: -90.0, 
    less_than_or_equal_to: 90.0 
  }, allow_nil: true
  
  validates :start_longitude, numericality: { 
    greater_than_or_equal_to: -180.0, 
    less_than_or_equal_to: 180.0 
  }, allow_nil: true

  # Scopes
  scope :completed, -> { where.not(completed_at: nil) }
  scope :in_progress, -> { where(completed_at: nil) }
  scope :verified, -> { where(is_verified: true) }
  scope :unverified, -> { where(is_verified: false) }
  scope :provisional, -> { where(is_provisional: true) }
  scope :low_fraud_risk, -> { where('fraud_risk_score < ?', 25.0) }
  scope :high_fraud_risk, -> { where('fraud_risk_score > ?', 75.0) }
  scope :recent, -> { order(started_at: :desc) }

  # Callbacks
  before_save :calculate_totals
  before_save :calculate_score_differential
  before_save :verify_location
  after_save :update_user_stats
  after_create :calculate_fraud_risk_score

  def completed?
    completed_at.present?
  end

  def in_progress?
    !completed?
  end

  def verified?
    is_verified
  end

  def duration_minutes
    scoring_service.duration_minutes
  end

  def holes_completed
    hole_scores.count
  end

  def completion_percentage
    scoring_service.completion_percentage
  end

  # Calculate score differential using scoring service
  def calculate_score_differential
    scoring_service.calculate_score_differential
  end

  # Maximum score per hole for handicap calculation (Net Double Bogey)
  def maximum_hole_scores
    scoring_service.maximum_hole_scores
  end

  def handicap_strokes_for_hole(hole)
    scoring_service.handicap_strokes_for_hole(hole)
  end

  def request_attestation(attester)
    attestation_service.request_attestation(attester)
  end

  def add_attestation(attester, approved:, comments: nil)
    attestation_service.add_attestation(attester, approved: approved, comments: comments)
  end

  def fraud_risk_factors_list
    fraud_detection_service.fraud_risk_factors_list
  end

  def calculate_score_differential
    return nil unless total_strokes && course_rating && slope_rating
    self.score_differential = scoring_service.calculate_score_differential
  end

  private

  def calculate_totals
    return unless hole_scores.any?
    
    totals = scoring_service.calculate_totals
    assign_attributes(totals)
  end

  def verify_location
    if start_latitude.present? && start_longitude.present?
      self.location_verified = fraud_detection_service.verify_location(start_latitude, start_longitude)
    end
  end

  def update_user_stats
    if saved_change_to_completed_at? && completed?
      user.increment!(:rounds_played)
      user.increment!(:verified_rounds) if is_verified
    end
  end

  def calculate_fraud_risk_score
    return if fraud_risk_score.present?
    
    score = fraud_detection_service.calculate_fraud_risk_score
    self.update_column(:fraud_risk_score, score)
  end

  private

  def scoring_service
    @scoring_service ||= RoundScoringService.new(self)
  end

  def attestation_service
    @attestation_service ||= RoundAttestationService.new(self)
  end

  def fraud_detection_service
    @fraud_detection_service ||= FraudDetectionService.new(self)
  end
end