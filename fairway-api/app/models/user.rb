class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :rounds, dependent: :destroy
  has_many :round_attestations, foreign_key: 'attester_id', dependent: :destroy
  has_many :attested_rounds, through: :round_attestations, source: :round

  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :last_name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  
  validates :handicap_index, numericality: { 
    greater_than_or_equal_to: -10.0, 
    less_than_or_equal_to: 54.0 
  }, allow_nil: true
  
  validates :verified_handicap, numericality: { 
    greater_than_or_equal_to: -10.0, 
    less_than_or_equal_to: 54.0 
  }, allow_nil: true

  validates :rounds_played, numericality: { greater_than_or_equal_to: 0 }
  validates :verified_rounds, numericality: { greater_than_or_equal_to: 0 }
  
  # Callbacks
  before_save :normalize_email
  before_save :calculate_handicaps

  # Scopes
  scope :verified, -> { where.not(email_verified_at: nil) }
  scope :with_handicap, -> { where.not(handicap_index: nil) }
  scope :with_verified_handicap, -> { where.not(verified_handicap: nil) }

  def full_name
    "#{first_name} #{last_name}"
  end

  def verified?
    email_verified_at.present?
  end

  def has_handicap?
    handicap_index.present?
  end

  def has_verified_handicap?
    verified_handicap.present?
  end

  # Calculate handicap based on best 8 of last 20 rounds
  def calculate_provisional_handicap
    return nil if rounds.completed.count < 5

    recent_rounds = rounds.completed
                          .includes(:hole_scores)
                          .order(started_at: :desc)
                          .limit(20)

    return nil if recent_rounds.count < 5

    # Get score differentials and take best 8
    differentials = recent_rounds.map(&:score_differential).compact.sort
    best_differentials = differentials.take([8, differentials.count].min)
    
    return nil if best_differentials.empty?

    # Calculate handicap index (average of best differentials * 0.96)
    (best_differentials.sum / best_differentials.count * 0.96).round(1)
  end

  # Calculate verified handicap based only on verified rounds
  def calculate_verified_handicap
    return nil if rounds.verified.count < 5

    verified_rounds_data = rounds.verified
                                .includes(:hole_scores)
                                .order(started_at: :desc)
                                .limit(20)

    return nil if verified_rounds_data.count < 5

    # Get score differentials and take best 8
    differentials = verified_rounds_data.map(&:score_differential).compact.sort
    best_differentials = differentials.take([8, differentials.count].min)
    
    return nil if best_differentials.empty?

    # Calculate verified handicap index (average of best differentials * 0.96)
    (best_differentials.sum / best_differentials.count * 0.96).round(1)
  end

  def recent_rounds(limit = 10)
    rounds.completed.includes(:course).order(started_at: :desc).limit(limit)
  end

  def average_score
    return nil if rounds.completed.empty?
    
    rounds.completed.average(:total_strokes)&.round(1)
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end

  def calculate_handicaps
    self.handicap_index = calculate_provisional_handicap
    self.verified_handicap = calculate_verified_handicap
  end
end