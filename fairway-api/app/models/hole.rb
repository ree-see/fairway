class Hole < ApplicationRecord
  # Associations
  belongs_to :course
  has_many :hole_scores, dependent: :destroy

  # Validations
  validates :number, presence: true, uniqueness: { scope: :course_id }
  validates :number, numericality: { greater_than: 0, less_than_or_equal_to: 18 }
  validates :par, presence: true, inclusion: { in: [3, 4, 5] }
  validates :handicap, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 18 }
  validates :handicap, uniqueness: { scope: :course_id }

  # Distance and yardage validations
  validates :distance, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true
  validates :yardage_black, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true
  validates :yardage_blue, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true
  validates :yardage_white, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true
  validates :yardage_red, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true
  validates :yardage_gold, numericality: { greater_than: 0, less_than: 1000 }, allow_nil: true

  # GPS coordinate validations
  validates :tee_latitude, numericality: { 
    greater_than_or_equal_to: -90.0, 
    less_than_or_equal_to: 90.0 
  }, allow_nil: true
  
  validates :tee_longitude, numericality: { 
    greater_than_or_equal_to: -180.0, 
    less_than_or_equal_to: 180.0 
  }, allow_nil: true

  validates :green_latitude, numericality: { 
    greater_than_or_equal_to: -90.0, 
    less_than_or_equal_to: 90.0 
  }, allow_nil: true
  
  validates :green_longitude, numericality: { 
    greater_than_or_equal_to: -180.0, 
    less_than_or_equal_to: 180.0 
  }, allow_nil: true

  # Scopes
  scope :par_3s, -> { where(par: 3) }
  scope :par_4s, -> { where(par: 4) }
  scope :par_5s, -> { where(par: 5) }
  scope :by_number, -> { order(:number) }
  scope :front_nine, -> { where(number: 1..9) }
  scope :back_nine, -> { where(number: 10..18) }

  # Callbacks
  before_save :ensure_distance_field

  def yardage_for_tee(tee_color)
    case tee_color.to_s.downcase
    when 'black'
      yardage_black
    when 'blue'
      yardage_blue
    when 'white'
      yardage_white
    when 'red'
      yardage_red
    when 'gold'
      yardage_gold
    else
      yardage_white # default
    end
  end

  # Returns the best available distance for general display
  # Priority: distance field, white tees, blue tees, any available tee
  def display_distance
    distance || yardage_white || yardage_blue || yardage_black || yardage_red || yardage_gold
  end

  # Get all available tee distances as a hash
  def all_tee_distances
    {
      black: yardage_black,
      blue: yardage_blue, 
      white: yardage_white,
      red: yardage_red,
      gold: yardage_gold
    }.compact
  end

  def distance_from_tee_to_green
    return nil unless tee_coordinates? && green_coordinates?
    
    calculate_distance(tee_latitude, tee_longitude, green_latitude, green_longitude)
  end

  def distance_to_green_from(latitude, longitude)
    return nil unless green_coordinates?
    
    calculate_distance(latitude, longitude, green_latitude, green_longitude)
  end

  def front_middle_back_distances(latitude, longitude)
    return nil unless green_coordinates?
    
    base_distance = distance_to_green_from(latitude, longitude)
    return nil unless base_distance

    # Approximate front/back distances (assuming 30-yard deep green)
    {
      front: (base_distance - 15).round,
      middle: base_distance.round,
      back: (base_distance + 15).round
    }
  end

  def tee_coordinates?
    tee_latitude.present? && tee_longitude.present?
  end

  def green_coordinates?
    green_latitude.present? && green_longitude.present?
  end

  def difficulty_rating
    # Simple difficulty based on par and yardage
    yardage = yardage_for_tee('white') || 300
    
    case par
    when 3
      yardage > 180 ? 'Hard' : (yardage > 150 ? 'Medium' : 'Easy')
    when 4
      yardage > 420 ? 'Hard' : (yardage > 380 ? 'Medium' : 'Easy')
    when 5
      yardage > 550 ? 'Hard' : (yardage > 500 ? 'Medium' : 'Easy')
    end
  end

  def shape_description
    return 'Straight' unless shape.present?
    shape.humanize
  end

  private

  # Ensure distance field is populated if not set
  def ensure_distance_field
    if distance.blank?
      self.distance = yardage_white || yardage_blue || yardage_black || yardage_red || yardage_gold
    end
  end

  def calculate_distance(lat1, lon1, lat2, lon2)
    # Haversine formula to calculate distance in yards
    rad_per_deg = Math::PI / 180
    rkm = 6371 # Earth radius in kilometers
    ryards = rkm * 1093.61 # Earth radius in yards

    dlat_rad = (lat2 - lat1) * rad_per_deg
    dlon_rad = (lon2 - lon1) * rad_per_deg

    lat1_rad = lat1 * rad_per_deg
    lat2_rad = lat2 * rad_per_deg

    a = Math.sin(dlat_rad/2)**2 + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(dlon_rad/2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    ryards * c # Distance in yards
  end
end