class Api::V1::CoursesController < ApplicationController
  before_action :set_course, only: [:show, :holes]

  def index
    courses = Course.active.includes(:holes)
    
    # Filter by location if provided
    if params[:latitude] && params[:longitude]
      radius_km = params[:radius] || 50
      courses = courses.near(params[:latitude].to_f, params[:longitude].to_f, radius_km.to_f)
    end

    # Search by name if provided
    if params[:search].present?
      courses = courses.where("name ILIKE ?", "%#{params[:search]}%")
    end

    courses = courses.limit(50).order(:name)

    render_success({
      courses: courses.map { |course| course_response(course) }
    })
  end

  def show
    render_success({ course: detailed_course_response(@course) })
  end

  def search
    return render_error("Search query required") unless params[:q].present?

    courses = Course.active
                   .where("name ILIKE ? OR city ILIKE ? OR address ILIKE ?", 
                         "%#{params[:q]}%", "%#{params[:q]}%", "%#{params[:q]}%")
                   .limit(20)
                   .order(:name)

    render_success({
      courses: courses.map { |course| course_response(course) }
    })
  end

  def nearby
    return render_error("Latitude and longitude required") unless params[:latitude] && params[:longitude]

    latitude = params[:latitude].to_f
    longitude = params[:longitude].to_f
    radius_km = (params[:radius] || 25).to_f

    courses = Course.active
                   .near(latitude, longitude, radius_km)
                   .includes(:holes)
                   .limit(20)

    courses_with_distance = courses.map do |course|
      course_data = course_response(course)
      course_data[:distance_meters] = course.distance_from(latitude, longitude)&.round
      course_data
    end

    # Sort by distance
    courses_with_distance.sort_by! { |course| course[:distance_meters] || Float::INFINITY }

    render_success({
      courses: courses_with_distance,
      search_center: {
        latitude: latitude,
        longitude: longitude,
        radius_km: radius_km
      }
    })
  end

  def holes
    holes = @course.holes.by_number
    
    render_success({
      course: course_response(@course),
      holes: holes.map { |hole| hole_response(hole) }
    })
  end

  def verify_location
    return render_error("Course ID, latitude, and longitude required") unless params[:course_id] && params[:latitude] && params[:longitude]

    course = Course.find(params[:course_id])
    latitude = params[:latitude].to_f
    longitude = params[:longitude].to_f

    within_geofence = course.within_geofence?(latitude, longitude)
    distance = course.distance_from(latitude, longitude)

    render_success({
      within_geofence: within_geofence,
      distance_meters: distance&.round,
      geofence_radius: course.geofence_radius,
      course: course_response(course)
    })
  end

  private

  def set_course
    @course = Course.active.find(params[:id])
  end

  def course_response(course)
    {
      id: course.id,
      name: course.name,
      address: course.address,
      city: course.city,
      state: course.state,
      country: course.country,
      postal_code: course.postal_code,
      full_address: course.full_address,
      latitude: course.latitude,
      longitude: course.longitude,
      phone: course.phone,
      website: course.website,
      description: course.description,
      private_course: course.private_course,
      course_rating: course.course_rating,
      slope_rating: course.slope_rating,
      par: course.par,
      total_yardage: course.total_yardage,
      holes_count: course.holes_count,
      geofence_radius: course.geofence_radius
    }
  end

  def detailed_course_response(course)
    base_response = course_response(course)
    base_response.merge({
      holes: course.holes.by_number.map { |hole| hole_response(hole) },
      recent_rounds_count: course.rounds.completed.where('started_at > ?', 30.days.ago).count,
      average_score: course.average_score
    })
  end

  def hole_response(hole)
    {
      id: hole.id,
      number: hole.number,
      par: hole.par,
      handicap: hole.handicap,
      yardages: {
        black: hole.yardage_black,
        blue: hole.yardage_blue,
        white: hole.yardage_white,
        red: hole.yardage_red,
        gold: hole.yardage_gold
      },
      coordinates: {
        tee: hole.tee_coordinates? ? { lat: hole.tee_latitude, lng: hole.tee_longitude } : nil,
        green: hole.green_coordinates? ? { lat: hole.green_latitude, lng: hole.green_longitude } : nil
      },
      description: hole.description,
      shape: hole.shape,
      difficulty_rating: hole.difficulty_rating
    }
  end
end