require 'test_helper'

class CourseTest < ActiveSupport::TestCase
  def setup
    @course = Course.new(
      name: 'Test Golf Course',
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      state: 'NY'
    )
  end

  # Test basic validations
  test "should be valid with valid attributes" do
    assert @course.valid?
  end

  test "should require name" do
    @course.name = nil
    assert_not @course.valid?
    assert_includes @course.errors[:name], "can't be blank"
  end

  test "should require latitude and longitude" do
    @course.latitude = nil
    @course.longitude = nil
    assert_not @course.valid?
    assert_includes @course.errors[:latitude], "can't be blank"
    assert_includes @course.errors[:longitude], "can't be blank"
  end

  # Test scopes
  test "sync_enabled scope returns only sync enabled courses" do
    course1 = Course.create!(name: 'Course 1', latitude: 40.0, longitude: -75.0, sync_enabled: true)
    course2 = Course.create!(name: 'Course 2', latitude: 40.1, longitude: -75.1, sync_enabled: false)
    
    sync_enabled_courses = Course.sync_enabled
    assert_includes sync_enabled_courses, course1
    assert_not_includes sync_enabled_courses, course2
  end

  test "from_external_source scope filters by source" do
    course1 = Course.create!(name: 'Course 1', latitude: 40.0, longitude: -75.0, external_source: 'golfcourseapi')
    course2 = Course.create!(name: 'Course 2', latitude: 40.1, longitude: -75.1, external_source: 'manual')
    course3 = Course.create!(name: 'Course 3', latitude: 40.2, longitude: -75.2) # no external source
    
    api_courses = Course.from_external_source('golfcourseapi')
    assert_includes api_courses, course1
    assert_not_includes api_courses, course2
    assert_not_includes api_courses, course3
  end

  test "needs_sync scope returns courses that need syncing" do
    course1 = Course.create!(name: 'Course 1', latitude: 40.0, longitude: -75.0, sync_enabled: true, last_synced_at: nil)
    course2 = Course.create!(name: 'Course 2', latitude: 40.1, longitude: -75.1, sync_enabled: true, last_synced_at: 2.weeks.ago)
    course3 = Course.create!(name: 'Course 3', latitude: 40.2, longitude: -75.2, sync_enabled: true, last_synced_at: 1.day.ago)
    course4 = Course.create!(name: 'Course 4', latitude: 40.3, longitude: -75.3, sync_enabled: false, last_synced_at: nil)
    
    courses_needing_sync = Course.needs_sync
    assert_includes courses_needing_sync, course1 # never synced
    assert_includes courses_needing_sync, course2 # old sync
    assert_not_includes courses_needing_sync, course3 # recent sync
    assert_not_includes courses_needing_sync, course4 # sync disabled
  end

  # Test sync-related methods
  test "from_external_api? returns true when external_source is present" do
    @course.external_source = 'golfcourseapi'
    assert @course.from_external_api?
    
    @course.external_source = nil
    assert_not @course.from_external_api?
  end

  test "needs_sync? returns correct boolean" do
    @course.sync_enabled = true
    
    # Never synced
    @course.last_synced_at = nil
    assert @course.needs_sync?
    
    # Old sync
    @course.last_synced_at = 2.weeks.ago
    assert @course.needs_sync?
    
    # Recent sync
    @course.last_synced_at = 1.day.ago
    assert_not @course.needs_sync?
    
    # Sync disabled
    @course.sync_enabled = false
    @course.last_synced_at = nil
    assert_not @course.needs_sync?
  end

  test "mark_as_synced! updates last_synced_at" do
    @course.save!
    assert_nil @course.last_synced_at
    
    @course.mark_as_synced!
    @course.reload
    
    assert_not_nil @course.last_synced_at
    assert_in_delta Time.current, @course.last_synced_at, 5.seconds
  end

  test "external_data_hash returns hash from external_data" do
    @course.external_data = { 'api_id' => '123', 'rating' => 72.5 }
    hash = @course.external_data_hash
    
    assert_equal '123', hash['api_id']
    assert_equal 72.5, hash['rating']
    
    # Test with nil external_data
    @course.external_data = nil
    assert_equal({}, @course.external_data_hash)
  end

  test "update_from_external_data! updates course attributes" do
    @course.save!
    
    external_data = {
      'name' => 'Updated Course Name',
      'address' => '456 New Address',
      'city' => 'Updated City',
      'state' => 'CA',
      'country' => 'US',
      'postal_code' => '90210',
      'phone' => '(555) 123-4567',
      'website' => 'https://updated.example.com',
      'latitude' => 34.0522,
      'longitude' => -118.2437,
      'course_rating' => 73.2,
      'slope_rating' => 131,
      'par' => 72,
      'total_yardage' => 6800
    }
    
    @course.update_from_external_data!(external_data)
    @course.reload
    
    assert_equal 'Updated Course Name', @course.name
    assert_equal '456 New Address', @course.address
    assert_equal 'Updated City', @course.city
    assert_equal 'CA', @course.state
    assert_equal 'US', @course.country
    assert_equal '90210', @course.postal_code
    assert_equal '(555) 123-4567', @course.phone
    assert_equal 'https://updated.example.com', @course.website
    assert_equal 34.0522, @course.latitude.to_f
    assert_equal(-118.2437, @course.longitude.to_f)
    assert_equal 73.2, @course.course_rating.to_f
    assert_equal 131, @course.slope_rating
    assert_equal 72, @course.par
    assert_equal 6800, @course.total_yardage
    assert_equal external_data, @course.external_data
    assert_not_nil @course.last_synced_at
  end

  test "update_from_external_data! only updates provided fields" do
    @course.save!
    original_name = @course.name
    
    partial_data = {
      'city' => 'New City',
      'course_rating' => 74.0
    }
    
    @course.update_from_external_data!(partial_data)
    @course.reload
    
    assert_equal original_name, @course.name # unchanged
    assert_equal 'New City', @course.city # updated
    assert_equal 74.0, @course.course_rating.to_f # updated
  end

  test "validates external_source inclusion" do
    @course.external_source = 'golfcourseapi'
    assert @course.valid?
    
    @course.external_source = 'manual'
    assert @course.valid?
    
    @course.external_source = nil
    assert @course.valid?
    
    @course.external_source = 'invalid_source'
    assert_not @course.valid?
    assert_includes @course.errors[:external_source], "is not included in the list"
  end
end