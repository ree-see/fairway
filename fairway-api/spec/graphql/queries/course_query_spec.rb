require 'rails_helper'

RSpec.describe 'Course Query', type: :request do
  describe 'course query' do
    let!(:course) do
      Course.create!(
        name: 'Pebble Beach',
        city: 'Pebble Beach',
        state: 'CA',
        latitude: 36.5675,
        longitude: -121.9509,
        par: 72,
        course_rating: 72.8,
        slope_rating: 145,
        skip_default_holes: true
      )
    end

    let!(:holes) do
      [
        { number: 1, par: 4, handicap: 7, yardage_white: 360, yardage_blue: 383 },
        { number: 2, par: 5, handicap: 11, yardage_white: 490, yardage_blue: 513 },
        { number: 3, par: 4, handicap: 15, yardage_white: 360, yardage_blue: 385 }
      ].map do |hole_attrs|
        course.holes.create!(hole_attrs)
      end
    end

    let(:query) do
      <<~GQL
        query($id: ID!) {
          course(id: $id) {
            id
            name
            city
            state
            par
            course_rating
            slope_rating

            holes {
              number
              par
              handicap
              yardages {
                white
                blue
                red
                black
                gold
              }
            }
          }
        }
      GQL
    end

    it 'returns course with holes' do
      post '/graphql',
        params: { query: query, variables: { id: course.id.to_s } },
        as: :json

      expect(response).to have_http_status(:success)

      json = JSON.parse(response.body)
      data = json['data']['course']

      expect(data['id']).to eq(course.id.to_s)
      expect(data['name']).to eq('Pebble Beach')
      expect(data['city']).to eq('Pebble Beach')
      expect(data['state']).to eq('CA')
      expect(data['par']).to eq(72)
      expect(data['course_rating']).to eq(72.8)
      expect(data['slope_rating']).to eq(145)

      expect(data['holes']).to be_an(Array)
      expect(data['holes'].length).to eq(3)

      first_hole = data['holes'].first
      expect(first_hole['number']).to eq(1)
      expect(first_hole['par']).to eq(4)
      expect(first_hole['handicap']).to eq(7)
      expect(first_hole['yardages']['white']).to eq(360)
      expect(first_hole['yardages']['blue']).to eq(383)
    end

    it 'prevents N+1 queries' do
      # This test ensures we use batch loading for holes
      # Note: This requires the rspec-sqlimit gem or similar for query counting
      # For now, we'll skip this test and implement it when we add query counting tools
      skip "Requires query counting gem (rspec-sqlimit or similar)"
    end

    it 'returns only requested fields' do
      minimal_query = <<~GQL
        query($id: ID!) {
          course(id: $id) {
            id
            name
            holes {
              number
              par
            }
          }
        }
      GQL

      post '/graphql',
        params: { query: minimal_query, variables: { id: course.id.to_s } },
        as: :json

      json = JSON.parse(response.body)
      data = json['data']['course']

      # Should only have requested fields
      expect(data.keys).to contain_exactly('id', 'name', 'holes')
      expect(data['holes'].first.keys).to contain_exactly('number', 'par')
    end

    it 'returns error for non-existent course' do
      post '/graphql',
        params: { query: query, variables: { id: '99999' } },
        as: :json

      json = JSON.parse(response.body)
      expect(json['errors']).to be_present
      expect(json['errors'].first['message']).to include('not found')
    end

    it 'handles courses without holes gracefully' do
      empty_course = Course.create!(
        name: 'Empty Course',
        city: 'Test',
        state: 'CA',
        latitude: 36.0,
        longitude: -121.0,
        skip_default_holes: true
      )

      post '/graphql',
        params: { query: query, variables: { id: empty_course.id.to_s } },
        as: :json

      json = JSON.parse(response.body)
      data = json['data']['course']

      expect(data['holes']).to eq([])
    end
  end

  describe 'nearbyCourses query' do
    let!(:nearby_course) do
      Course.create!(
        name: 'Nearby Golf Club',
        city: 'Monterey',
        state: 'CA',
        latitude: 36.6000,
        longitude: -121.8900,
        par: 72
      )
    end

    let!(:far_course) do
      Course.create!(
        name: 'Far Golf Club',
        city: 'Los Angeles',
        state: 'CA',
        latitude: 34.0522,
        longitude: -118.2437,
        par: 70
      )
    end

    let(:query) do
      <<~GQL
        query($latitude: Float!, $longitude: Float!, $radius: Int) {
          nearby_courses(latitude: $latitude, longitude: $longitude, radius: $radius) {
            id
            name
            city
            distance_meters
          }
        }
      GQL
    end

    it 'returns courses within radius' do
      # Search near Pebble Beach (36.5675, -121.9509)
      post '/graphql',
        params: {
          query: query,
          variables: { latitude: 36.5675, longitude: -121.9509, radius: 25 }
        },
        as: :json

      json = JSON.parse(response.body)
      if json['errors']
        puts "GraphQL Errors: #{JSON.pretty_generate(json['errors'])}"
      end
      courses = json['data']['nearby_courses']

      expect(courses.length).to eq(1)
      expect(courses.first['name']).to eq('Nearby Golf Club')
      expect(courses.first['distance_meters']).to be_present
      expect(courses.first['distance_meters']).to be < 25000 # Within 25km
    end

    it 'sorts results by distance' do
      # Create multiple courses at different distances
      course1 = Course.create!(
        name: 'Very Close',
        city: 'Test',
        state: 'CA',
        latitude: 36.5680, # Very close
        longitude: -121.9510,
        par: 72
      )

      course2 = Course.create!(
        name: 'Medium Distance',
        city: 'Test',
        state: 'CA',
        latitude: 36.5800,
        longitude: -121.9000,
        par: 72
      )

      post '/graphql',
        params: {
          query: query,
          variables: { latitude: 36.5675, longitude: -121.9509, radius: 50 }
        },
        as: :json

      json = JSON.parse(response.body)
      courses = json['data']['nearby_courses']

      # Verify sorted by distance (ascending)
      distances = courses.map { |c| c['distance_meters'] }
      expect(distances).to eq(distances.sort)
    end
  end
end
