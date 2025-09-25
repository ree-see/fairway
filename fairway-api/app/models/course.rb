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
    clause_args = GeolocationService.nearby_query_clause(latitude, longitude, radius_km)
    where(clause_args[0], *clause_args[1..-1])
  }

  # Callbacks
  before_save :calculate_course_stats
  after_create :create_default_holes

  def full_address
    [address, city, state, postal_code].compact.join(', ')
  end

  def distance_from(latitude, longitude)
    GeolocationService.distance_between(self.latitude, self.longitude, latitude, longitude)
  end

  def within_geofence?(latitude, longitude)
    GeolocationService.within_radius?(self.latitude, self.longitude, latitude, longitude, geofence_radius)
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
    synchronization_service.needs_sync?
  end

  def mark_as_synced!
    synchronization_service.mark_as_synced!
  end

  def external_data_hash
    synchronization_service.external_data_hash
  end

  def update_from_external_data!(data)
    synchronization_service.update_from_external_data!(data)
  end

  private

  def synchronization_service
    @synchronization_service ||= CourseSynchronizationService.new(self)
  end

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