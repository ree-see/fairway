require 'minitest/autorun'
require_relative '../../app/services/geolocation_service'

class SimpleGeolocationTest < Minitest::Test
  def setup
    @philly_lat = 39.9526
    @philly_lon = -75.1652
    @nyc_lat = 40.7128
    @nyc_lon = -74.0060
  end

  def test_calculates_distance_between_two_points
    # Distance between Philadelphia and NYC (approximately 130 km)
    distance = GeolocationService.distance_between(@philly_lat, @philly_lon, @nyc_lat, @nyc_lon)
    
    assert distance > 120_000, "Expected distance > 120km, got #{distance}"
    assert distance < 140_000, "Expected distance < 140km, got #{distance}"
  end

  def test_returns_nil_for_missing_coordinates
    distance = GeolocationService.distance_between(nil, @philly_lon, @nyc_lat, @nyc_lon)
    assert_nil distance
  end

  def test_checks_if_point_is_within_radius
    # Points 1 km apart
    close_lat = @philly_lat + 0.009 # Approximately 1 km north
    
    assert GeolocationService.within_radius?(@philly_lat, @philly_lon, close_lat, @philly_lon, 2000) # 2 km radius
    refute GeolocationService.within_radius?(@philly_lat, @philly_lon, close_lat, @philly_lon, 500) # 500 m radius
  end

  def test_instance_methods_work_correctly
    philly_service = GeolocationService.new(latitude: @philly_lat, longitude: @philly_lon)
    nyc_location = { latitude: @nyc_lat, longitude: @nyc_lon }
    
    distance = philly_service.distance_to(nyc_location)
    assert distance > 120_000, "Expected distance > 120km, got #{distance}"
    
    refute philly_service.within_radius_of?(nyc_location, 100_000), "Should not be within 100km"
    assert philly_service.within_radius_of?(nyc_location, 200_000), "Should be within 200km"
  end
end