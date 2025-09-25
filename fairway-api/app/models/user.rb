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

  # Calculate handicap using the dedicated service
  def calculate_provisional_handicap
    handicap_calculator.calculate_handicap_index
  end

  # Calculate verified handicap using the dedicated service  
  def calculate_verified_handicap_value
    handicap_calculator.calculate_verified_handicap
  end

  def recent_rounds(limit = 10)
    rounds.completed.includes(:course).order(started_at: :desc).limit(limit)
  end

  def average_score
    performance_stats = handicap_calculator.get_performance_stats
    performance_stats[:average_score]
  end

  # Get recent performance trend
  def recent_trend
    handicap_calculator.get_recent_trend
  end

  # Get comprehensive performance statistics
  def performance_statistics
    handicap_calculator.get_performance_stats
  end

  # Calculate playing handicap for a specific course
  def playing_handicap_for_course(course_handicap = nil, slope_rating = nil)
    handicap_calculator.calculate_playing_handicap(course_handicap, slope_rating)
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end

  def calculate_handicaps
    self.handicap_index = calculate_provisional_handicap
    self.verified_handicap = calculate_verified_handicap_value
  end

  def handicap_calculator
    @handicap_calculator ||= HandicapCalculatorService.new(self)
  end
end