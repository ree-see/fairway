class HoleScore < ApplicationRecord
  # Associations
  belongs_to :round
  belongs_to :hole

  # Validations
  validates :hole_number, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 18 }
  validates :strokes, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 15 }
  validates :putts, numericality: { greater_than: 0, less_than_or_equal_to: 10 }, allow_nil: true
  validates :penalties, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :drive_distance, numericality: { greater_than: 0, less_than: 500 }, allow_nil: true
  validates :approach_distance, numericality: { greater_than: 0, less_than: 300 }, allow_nil: true
  
  # Uniqueness validation
  validates :hole_number, uniqueness: { scope: :round_id }

  # Callbacks
  before_save :calculate_statistics
  before_save :calculate_strokes_gained
  after_save :update_round_totals

  # Scopes
  scope :eagles_or_better, -> { joins(:hole).where('hole_scores.strokes <= holes.par - 2') }
  scope :birdies, -> { joins(:hole).where('hole_scores.strokes = holes.par - 1') }
  scope :pars, -> { joins(:hole).where('hole_scores.strokes = holes.par') }
  scope :bogeys, -> { joins(:hole).where('hole_scores.strokes = holes.par + 1') }
  scope :double_bogeys_or_worse, -> { joins(:hole).where('hole_scores.strokes >= holes.par + 2') }

  def score_relative_to_par
    strokes - hole.par
  end

  def score_name
    relative = score_relative_to_par
    
    case relative
    when -4 then 'Condor'
    when -3 then 'Albatross'
    when -2 then 'Eagle'
    when -1 then 'Birdie'
    when 0 then 'Par'
    when 1 then 'Bogey'
    when 2 then 'Double Bogey'
    when 3 then 'Triple Bogey'
    else "#{relative > 0 ? '+' : ''}#{relative}"
    end
  end

  def eagle_or_better?
    score_relative_to_par <= -2
  end

  def birdie?
    score_relative_to_par == -1
  end

  def par?
    score_relative_to_par == 0
  end

  def bogey?
    score_relative_to_par == 1
  end

  def double_bogey_or_worse?
    score_relative_to_par >= 2
  end

  def net_score
    # Calculate net score considering handicap strokes
    handicap_strokes = round.handicap_strokes_for_hole(hole)
    strokes - handicap_strokes
  end

  def shot_coordinates_data
    return [] unless shot_coordinates.present?
    
    JSON.parse(shot_coordinates)
  rescue JSON::ParserError
    []
  end

  def add_shot_coordinate(latitude, longitude, club: nil, distance: nil)
    coordinates = shot_coordinates_data
    coordinates << {
      lat: latitude,
      lng: longitude,
      club: club,
      distance: distance,
      timestamp: Time.current.iso8601
    }
    
    self.shot_coordinates = coordinates.to_json
  end

  def total_strokes_gained
    [
      strokes_gained_driving,
      strokes_gained_approach, 
      strokes_gained_short,
      strokes_gained_putting
    ].compact.sum
  end

  private

  def calculate_statistics
    # Determine fairway hit for par 4s and 5s
    if hole.par >= 4 && fairway_hit.nil?
      # This would typically be input by user, but we can set defaults
      self.fairway_hit = strokes <= hole.par
    end

    # Determine green in regulation
    if green_in_regulation.nil?
      # GIR = reaching green in par - 2 strokes
      regulation_strokes = hole.par - 2
      self.green_in_regulation = (strokes - penalties) <= regulation_strokes
    end
  end

  def calculate_strokes_gained
    # Simplified strokes gained calculation
    # In a real implementation, this would use PGA Tour data baselines
    
    expected_strokes = baseline_strokes_for_hole
    actual_strokes = strokes.to_f
    
    self.strokes_gained_total = (expected_strokes - actual_strokes).round(2)
    
    # Distribute among categories (simplified)
    if hole.par >= 4
      self.strokes_gained_driving = driving_strokes_gained
      self.strokes_gained_approach = approach_strokes_gained
    end
    
    self.strokes_gained_short = short_game_strokes_gained
    self.strokes_gained_putting = putting_strokes_gained
  end

  def baseline_strokes_for_hole
    # Simplified baseline based on hole par and user handicap
    handicap = round.user.handicap_index || 15.0
    
    case hole.par
    when 3
      3.0 + (handicap / 18.0)
    when 4
      4.0 + (handicap / 18.0)
    when 5
      5.0 + (handicap / 18.0)
    end
  end

  def driving_strokes_gained
    return 0 if hole.par == 3
    
    # Simplified: better than expected if fairway hit
    fairway_hit? ? 0.2 : -0.2
  end

  def approach_strokes_gained
    # Simplified: based on GIR
    green_in_regulation? ? 0.3 : -0.3
  end

  def short_game_strokes_gained
    # Simplified: based on whether got up and down when missed green
    if green_in_regulation?
      0
    else
      # Up and down (approximate): made par or better after missing green
      score_relative_to_par <= 0 ? 0.5 : -0.5
    end
  end

  def putting_strokes_gained
    return 0 unless putts.present?
    
    # Simplified: expected putts based on distance to hole
    expected_putts = green_in_regulation? ? 1.8 : 1.5
    (expected_putts - putts).round(2)
  end

  def update_round_totals
    # Trigger round recalculation
    round.save! if round.persisted?
  end
end