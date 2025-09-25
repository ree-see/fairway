class Course < ApplicationRecord
  # Associations
  has_many :holes, dependent: :destroy
  has_many :rounds, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :latitude, presence: true, numericality: { 
    greater_than_or_equal_to: -90.0, 
    less_than_or_equal_to: 90.0 
  }
  validates :longitude, presence: true, numericality: { 
    greater_than_or_equal_to: -180.0, 
    less_than_or_equal_to: 180.0 
  }
  
  validates :course_rating, numericality: { 
    greater_than: 60.0, 
    less_than: 90.0 
  }, allow_nil: true
  
  validates :slope_rating, numericality: { 
    greater_than_or_equal_to: 55, 
    less_than_or_equal_to: 155 
  }, allow_nil: true
  
  validates :par, numericality: { 
    greater_than_or_equal_to: 54, 
    less_than_or_equal_to: 90 
  }, allow_nil: true
  
  validates :geofence_radius, numericality: { 
    greater_than: 0, 
    less_than_or_equal_to: 2000 
  }

  validates :external_source, inclusion: { in: %w[golfcourseapi manual], allow_nil: true }

  # JSON serialization for external_data
  serialize :external_data, coder: JSON

  # Scopes
  scope :active, -> { where(active: true) }
  scope :public_courses, -> { where(private_course: false) }
  scope :private_courses, -> { where(private_course: true) }
  scope :sync_enabled, -> { where(sync_enabled: true) }
  scope :from_external_source, ->(source) { where(external_source: source) }
  scope :needs_sync, -> { where('last_synced_at IS NULL OR last_synced_at < ?', 1.week.ago) }
  scope :synced_recently, -> { where('last_synced_at > ?', 1.day.ago) }
  scope :near, ->(latitude, longitude, radius_km = 50) {
    where(
      "6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))) < ?",
      latitude, longitude, latitude, radius_km
    )
  }

  # Callbacks
  before_save :calculate_course_stats
  after_create :create_default_holes

  def full_address
    [address, city, state, postal_code].compact.join(', ')
  end

  def distance_from(latitude, longitude)
    return nil unless latitude && longitude
    
    # Haversine formula to calculate distance in kilometers
    rad_per_deg = Math::PI / 180
    rkm = 6371 # Earth radius in kilometers
    rm = rkm * 1000 # Earth radius in meters

    dlat_rad = (self.latitude - latitude) * rad_per_deg
    dlon_rad = (self.longitude - longitude) * rad_per_deg

    lat1_rad = latitude * rad_per_deg
    lat2_rad = self.latitude * rad_per_deg

    a = Math.sin(dlat_rad/2)**2 + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(dlon_rad/2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    rm * c # Distance in meters
  end

  def within_geofence?(latitude, longitude)
    return false unless latitude && longitude
    
    distance = distance_from(latitude, longitude)
    return false unless distance
    
    distance <= geofence_radius
  end

  def holes_count
    holes.count
  end

  def average_rating
    return course_rating if course_rating.present?
    
    # Calculate average based on holes if no course rating
    return nil if holes.empty?
    
    holes.sum(:par) + 2.0 # Rough estimation
  end

  def recent_rounds(limit = 20)
    rounds.includes(:user, :hole_scores)
          .order(started_at: :desc)
          .limit(limit)
  end

  def average_score
    return nil if rounds.completed.empty?
    
    rounds.completed.average(:total_strokes)&.round(1)
  end

  # Sync-related methods
  def from_external_api?
    external_source.present?
  end

  def needs_sync?
    return false unless sync_enabled?
    last_synced_at.nil? || last_synced_at < 1.week.ago
  end

  def mark_as_synced!
    update!(last_synced_at: Time.current)
  end

  def external_data_hash
    return {} if external_data.blank?
    external_data.is_a?(Hash) ? external_data : {}
  end

  def update_from_external_data!(data)
    transaction do
      # Update basic course information
      self.name = data['name'] if data['name'].present?
      self.address = data['address'] if data['address'].present?
      self.city = data['city'] if data['city'].present?
      self.state = data['state'] if data['state'].present?
      self.country = data['country'] if data['country'].present?
      self.postal_code = data['postal_code'] if data['postal_code'].present?
      self.phone = data['phone'] if data['phone'].present?
      self.website = data['website'] if data['website'].present?
      
      # Update coordinates if provided
      if data['latitude'].present? && data['longitude'].present?
        self.latitude = data['latitude'].to_f
        self.longitude = data['longitude'].to_f
      end
      
      # Update course ratings if provided
      self.course_rating = data['course_rating'].to_f if data['course_rating'].present?
      self.slope_rating = data['slope_rating'].to_i if data['slope_rating'].present?
      self.par = data['par'].to_i if data['par'].present?
      self.total_yardage = data['total_yardage'].to_i if data['total_yardage'].present?
      
      # Store raw external data for reference
      self.external_data = data
      self.last_synced_at = Time.current
      
      save!
    end
  end

  private

  def calculate_course_stats
    if holes.any?
      self.par = holes.sum(:par) if par.nil?
      # Could calculate total_yardage, course_rating based on holes
    end
  end

  def create_default_holes
    return if holes.any?
    
    # Create 18 default holes with basic par structure
    hole_pars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5]
    
    hole_pars.each_with_index do |par, index|
      holes.create!(
        number: index + 1,
        par: par,
        handicap: index + 1,
        yardage_white: par == 3 ? 150 : (par == 4 ? 350 : 500)
      )
    end
  end
end