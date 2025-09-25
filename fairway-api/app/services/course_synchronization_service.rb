class CourseSynchronizationService
  def initialize(course)
    @course = course
  end

  def update_from_external_data!(data)
    @course.transaction do
      update_basic_information(data)
      update_coordinates(data)
      update_course_ratings(data)
      finalize_sync(data)
    end
  end

  def needs_sync?
    return false unless @course.sync_enabled?
    @course.last_synced_at.nil? || @course.last_synced_at < 1.week.ago
  end

  def mark_as_synced!
    @course.update!(last_synced_at: Time.current)
  end

  def external_data_hash
    return {} if @course.external_data.blank?
    @course.external_data.is_a?(Hash) ? @course.external_data : {}
  end

  private

  def update_basic_information(data)
    @course.name = data['name'] if data['name'].present?
    @course.address = data['address'] if data['address'].present?
    @course.city = data['city'] if data['city'].present?
    @course.state = data['state'] if data['state'].present?
    @course.country = data['country'] if data['country'].present?
    @course.postal_code = data['postal_code'] if data['postal_code'].present?
    @course.phone = data['phone'] if data['phone'].present?
    @course.website = data['website'] if data['website'].present?
  end

  def update_coordinates(data)
    if data['latitude'].present? && data['longitude'].present?
      @course.latitude = data['latitude'].to_f
      @course.longitude = data['longitude'].to_f
    end
  end

  def update_course_ratings(data)
    @course.course_rating = data['course_rating'].to_f if data['course_rating'].present?
    @course.slope_rating = data['slope_rating'].to_i if data['slope_rating'].present?
    @course.par = data['par'].to_i if data['par'].present?
    @course.total_yardage = data['total_yardage'].to_i if data['total_yardage'].present?
  end

  def finalize_sync(data)
    @course.external_data = data
    @course.last_synced_at = Time.current
    @course.save!
  end
end