ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require 'minitest/mock'
require 'webmock/minitest'

# Configure WebMock
WebMock.disable_net_connect!(allow_localhost: true)

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Authentication helper methods
    def login_user(user)
      tokens = JwtService.generate_tokens(user)
      @current_user = user
      @auth_headers = { 'Authorization' => "Bearer #{tokens[:access_token]}" }
      tokens
    end

    def auth_headers
      @auth_headers || {}
    end

    def current_user
      @current_user
    end

    # Factory methods for test data
    def create_test_user(attributes = {})
      User.create!({
        email: "test#{rand(1000)}@example.com",
        password: "password123",
        first_name: "Test",
        last_name: "User",
        date_of_birth: 25.years.ago.to_date,
        phone_number: "555-0123"
      }.merge(attributes))
    end

    def create_test_course(attributes = {})
      Course.create!({
        name: "Test Golf Course",
        address: "123 Golf Lane",
        city: "Test City",
        state: "CA",
        zip_code: "90210",
        country: "USA",
        phone_number: "555-0124",
        email: "info@testcourse.com",
        latitude: 34.0522,
        longitude: -118.2437,
        par: 72,
        course_rating: 71.2,
        slope_rating: 125,
        yardage: 6500
      }.merge(attributes))
    end

    def create_test_round(user: nil, course: nil, attributes: {})
      user ||= create_test_user
      course ||= create_test_course
      
      Round.create!({
        user: user,
        course: course,
        started_at: 2.hours.ago,
        tee_color: 'blue',
        course_rating: course.course_rating,
        slope_rating: course.slope_rating
      }.merge(attributes))
    end

    def create_completed_round(user: nil, course: nil, total_strokes: 85)
      round = create_test_round(user: user, course: course, attributes: {
        completed_at: 1.hour.ago,
        total_strokes: total_strokes,
        total_putts: 32,
        fairways_hit: 8,
        greens_in_regulation: 9,
        total_penalties: 1
      })
      
      # Create some hole scores
      (1..18).each do |hole_num|
        round.hole_scores.create!(
          hole_number: hole_num,
          strokes: [3, 4, 5, 6].sample,
          putts: [1, 2, 3].sample,
          fairway_hit: [true, false].sample,
          green_in_regulation: [true, false].sample,
          penalties: rand(0..1)
        )
      end
      
      round.reload
    end

    # Assertion helpers
    def assert_valid_jwt(token)
      decoded = JwtService.decode_token(token)
      assert decoded.is_a?(Hash)
      assert decoded['user_id'].present?
      assert decoded['exp'].present?
    end

    def assert_error_response(response, expected_code)
      assert_not response.successful?, "Expected error response but got success"
      error = JSON.parse(response.body)['error']
      assert_equal expected_code, error['code']
    end

    def assert_successful_response(response)
      assert response.successful?, "Expected success but got: #{response.body}"
    end

    def assert_json_response(response, expected_keys = [])
      assert_successful_response(response)
      json = JSON.parse(response.body)
      expected_keys.each do |key|
        assert json.key?(key.to_s), "Response missing key: #{key}"
      end
      json
    end

    # Time helpers
    def travel_to_time(time)
      travel_to(time) { yield }
    end

    def with_frozen_time(&block)
      freeze_time(&block)
    end

    # Database helpers
    def assert_database_change(model, attribute, change, &block)
      initial_value = model.reload.send(attribute)
      yield
      final_value = model.reload.send(attribute)
      assert_equal initial_value + change, final_value
    end

    def assert_no_database_change(model, attribute, &block)
      assert_database_change(model, attribute, 0, &block)
    end

    # Mock external services
    def mock_course_api_success
      stub_request(:get, /course-api\.example\.com/)
        .to_return(
          status: 200,
          body: {
            courses: [
              {
                id: "ext_123",
                name: "External Course",
                location: { lat: 34.0522, lng: -118.2437 }
              }
            ]
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    def mock_weather_api_success
      stub_request(:get, /weather-api\.example\.com/)
        .to_return(
          status: 200,
          body: {
            current: {
              temperature: 75,
              conditions: "sunny",
              wind_speed: 5
            }
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    # Performance testing helpers
    def assert_performance(max_time_ms = 1000, &block)
      start_time = Time.current
      yield
      execution_time = (Time.current - start_time) * 1000
      assert execution_time <= max_time_ms, 
             "Expected execution time <= #{max_time_ms}ms, got #{execution_time}ms"
    end

    def assert_query_count(expected_count, &block)
      query_count = 0
      counter = ->(name, start, finish, id, payload) do
        query_count += 1 unless ['CACHE', 'SCHEMA'].include?(payload[:name])
      end
      
      ActiveSupport::Notifications.subscribed(counter, 'sql.active_record') do
        yield
      end
      
      assert_equal expected_count, query_count, 
                   "Expected #{expected_count} queries, got #{query_count}"
    end
  end
end

# Configure ActionController test helpers
class ActionController::TestCase
  include ActiveSupport::Testing::TimeHelpers
  
  def json_response
    JSON.parse(response.body)
  end
  
  def assert_json_response_has_keys(*keys)
    json = json_response
    keys.each do |key|
      assert json.key?(key.to_s), "Response missing key: #{key}"
    end
    json
  end
end
