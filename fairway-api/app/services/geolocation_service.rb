class GeolocationService
  EARTH_RADIUS_KM = 6371
  EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000
  RAD_PER_DEG = Math::PI / 180

  class << self
    def distance_between(lat1, lon1, lat2, lon2)
      return nil unless lat1 && lon1 && lat2 && lon2
      
      # Haversine formula to calculate distance in meters
      dlat_rad = (lat2 - lat1) * RAD_PER_DEG
      dlon_rad = (lon2 - lon1) * RAD_PER_DEG

      lat1_rad = lat1 * RAD_PER_DEG
      lat2_rad = lat2 * RAD_PER_DEG

      a = Math.sin(dlat_rad/2)**2 + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(dlon_rad/2)**2
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      EARTH_RADIUS_M * c # Distance in meters
    end

    def within_radius?(center_lat, center_lon, point_lat, point_lon, radius_meters)
      return false unless center_lat && center_lon && point_lat && point_lon
      
      distance = distance_between(center_lat, center_lon, point_lat, point_lon)
      return false unless distance
      
      distance <= radius_meters
    end

    # Scope for finding nearby locations
    def nearby_query_clause(latitude, longitude, radius_km = 50)
      [
        "#{EARTH_RADIUS_KM} * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))) < ?",
        latitude, longitude, latitude, radius_km
      ]
    end
  end

  def initialize(location)
    @latitude = location.respond_to?(:latitude) ? location.latitude : location[:latitude]
    @longitude = location.respond_to?(:longitude) ? location.longitude : location[:longitude]
  end

  def distance_to(other_location)
    other_lat = other_location.respond_to?(:latitude) ? other_location.latitude : other_location[:latitude]
    other_lon = other_location.respond_to?(:longitude) ? other_location.longitude : other_location[:longitude]
    
    self.class.distance_between(@latitude, @longitude, other_lat, other_lon)
  end

  def within_radius_of?(other_location, radius_meters)
    other_lat = other_location.respond_to?(:latitude) ? other_location.latitude : other_location[:latitude]
    other_lon = other_location.respond_to?(:longitude) ? other_location.longitude : other_location[:longitude]
    
    self.class.within_radius?(@latitude, @longitude, other_lat, other_lon, radius_meters)
  end
end