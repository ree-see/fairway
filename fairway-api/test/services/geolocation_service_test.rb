require_relative '../service_test_base'

class GeolocationServiceTest < ServiceTestBase
  def setup
    @philly_lat = 39.9526
    @philly_lon = -75.1652
    @nyc_lat = 40.7128
    @nyc_lon = -74.0060
  end

  test "calculates distance between two points" do
    # Distance between Philadelphia and NYC (approximately 130 km)
    distance = GeolocationService.distance_between(@philly_lat, @philly_lon, @nyc_lat, @nyc_lon)
    
    assert distance > 120_000 # > 120 km in meters
    assert distance < 140_000 # < 140 km in meters
  end

  test "returns nil for missing coordinates" do
    distance = GeolocationService.distance_between(nil, @philly_lon, @nyc_lat, @nyc_lon)
    assert_nil distance
  end

  test "checks if point is within radius" do
    # Points 1 km apart
    close_lat = @philly_lat + 0.009 # Approximately 1 km north
    
    assert GeolocationService.within_radius?(@philly_lat, @philly_lon, close_lat, @philly_lon, 2000) # 2 km radius
    assert_not GeolocationService.within_radius?(@philly_lat, @philly_lon, close_lat, @philly_lon, 500) # 500 m radius
  end

  test "generates correct nearby query clause" do
    clause_args = GeolocationService.nearby_query_clause(@philly_lat, @philly_lon, 50)
    
    assert_equal 4, clause_args.length
    assert clause_args[0].include?('acos')
    assert clause_args[0].include?('radians')
    assert_equal @philly_lat, clause_args[1]
    assert_equal @philly_lon, clause_args[2]
    assert_equal @philly_lat, clause_args[3]
  end

  test "instance methods work correctly" do
    philly_service = GeolocationService.new(latitude: @philly_lat, longitude: @philly_lon)
    nyc_location = { latitude: @nyc_lat, longitude: @nyc_lon }
    
    distance = philly_service.distance_to(nyc_location)
    assert distance > 120_000
    
    assert_not philly_service.within_radius_of?(nyc_location, 100_000) # 100 km
    assert philly_service.within_radius_of?(nyc_location, 200_000) # 200 km
  end

  test "handles object with latitude/longitude methods" do
    location_obj = OpenStruct.new(latitude: @philly_lat, longitude: @philly_lon)
    service = GeolocationService.new(location_obj)
    
    distance = service.distance_to(latitude: @nyc_lat, longitude: @nyc_lon)
    assert distance > 120_000
  end
end