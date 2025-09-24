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
    return nil unless started_at && completed_at
    ((completed_at - started_at) / 60).round
  end

  def holes_completed
    hole_scores.count
  end

  def completion_percentage
    return 0 if course.holes.empty?
    (holes_completed.to_f / course.holes.count * 100).round(1)
  end

  # Calculate score differential using USGA formula
  def calculate_score_differential
    return nil unless total_strokes && course_rating && slope_rating

    # Score Differential = (113 / Slope Rating) x (Adjusted Gross Score - Course Rating - PCC)
    # PCC (Playing Conditions Calculation) is 0 for now
    pcc = 0
    
    adjusted_gross_score = [total_strokes, maximum_hole_scores].min
    
    self.score_differential = (113.0 / slope_rating) * (adjusted_gross_score - course_rating - pcc)
    score_differential.round(1)
  end

  # Maximum score per hole for handicap calculation (Net Double Bogey)
  def maximum_hole_scores
    return total_strokes unless course.holes.any?
    
    course.holes.sum do |hole|
      # Net Double Bogey = Par + 2 + handicap strokes
      hole.par + 2 + handicap_strokes_for_hole(hole)
    end
  end

  def handicap_strokes_for_hole(hole)
    return 0 unless user.handicap_index
    
    # Calculate strokes received on this hole based on handicap
    course_handicap = (user.handicap_index * slope_rating / 113.0).round
    
    if course_handicap >= hole.handicap
      1 + ((course_handicap - hole.handicap) / 18)
    else
      0
    end
  end

  def request_attestation(attester)
    return false if attesters.include?(attester)
    return false if attester == user
    
    round_attestations.create!(
      attester: attester,
      requested_at: Time.current,
      is_approved: false
    )
  end

  def add_attestation(attester, approved:, comments: nil)
    attestation = round_attestations.find_or_initialize_by(attester: attester)
    
    attestation.update!(
      is_approved: approved,
      comments: comments,
      attested_at: Time.current
    )

    # Update verification status
    self.verification_count = round_attestations.where(is_approved: true).count
    self.is_verified = verification_count >= 1 && fraud_risk_score < 50.0
    self.is_provisional = !is_verified
    
    save!
    attestation
  end

  def fraud_risk_factors_list
    return [] unless fraud_risk_factors.present?
    
    JSON.parse(fraud_risk_factors)
  rescue JSON::ParserError
    []
  end

  private

  def calculate_totals
    if hole_scores.any?
      self.total_strokes = hole_scores.sum(:strokes)
      self.total_putts = hole_scores.sum(:putts).presence || 0
      self.fairways_hit = hole_scores.where(fairway_hit: true).count
      self.greens_in_regulation = hole_scores.where(green_in_regulation: true).count
      self.total_penalties = hole_scores.sum(:penalties)
    end
  end

  def verify_location
    if start_latitude.present? && start_longitude.present?
      self.location_verified = course.within_geofence?(start_latitude, start_longitude)
    end
  end

  def update_user_stats
    if saved_change_to_completed_at? && completed?
      user.increment!(:rounds_played)
      user.increment!(:verified_rounds) if is_verified
    end
  end

  def calculate_fraud_risk_score
    # TODO: Implement fraud risk calculation job
    # For now, set a default low risk score for new rounds
    self.update_column(:fraud_risk_score, 0.0) if fraud_risk_score.nil?
  end
end