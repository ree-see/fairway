module ApiValidation
  extend ActiveSupport::Concern

  included do
    before_action :validate_content_type, only: [:create, :update]
    before_action :validate_pagination_params, only: [:index]
  end

  private

  def validate_content_type
    unless request.content_type == 'application/json' || request.content_type.include?('application/json')
      render_error('Content-Type must be application/json', :unsupported_media_type)
    end
  end

  def validate_pagination_params
    if params[:limit].present?
      limit = params[:limit].to_i
      if limit < 1 || limit > 100
        return render_error('Limit must be between 1 and 100', :bad_request)
      end
    end

    if params[:offset].present?
      offset = params[:offset].to_i
      if offset < 0
        return render_error('Offset must be non-negative', :bad_request)
      end
    end

    if params[:page].present?
      page = params[:page].to_i
      if page < 1
        return render_error('Page must be greater than 0', :bad_request)
      end
    end
  end

  def validate_email(email)
    return false if email.blank?
    email_regex = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
    email_regex.match?(email)
  end

  def validate_phone(phone)
    return true if phone.blank? # Phone is optional
    phone_regex = /\A\+?[0-9]{10,15}\z/
    phone_regex.match?(phone.gsub(/[\s\-\(\)]/, ''))
  end

  def validate_coordinates(latitude, longitude)
    return false if latitude.blank? || longitude.blank?
    
    lat = latitude.to_f
    lon = longitude.to_f
    
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
  end

  def validate_date_range(start_date, end_date)
    return false if start_date.blank? || end_date.blank?
    
    begin
      start_date = Date.parse(start_date) if start_date.is_a?(String)
      end_date = Date.parse(end_date) if end_date.is_a?(String)
      start_date <= end_date
    rescue
      false
    end
  end

  def validate_uuid(uuid)
    return false if uuid.blank?
    uuid_regex = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i
    uuid_regex.match?(uuid)
  end

  def sanitize_string(str, max_length: 255)
    return nil if str.blank?
    str.to_s.strip.slice(0, max_length)
  end

  def sanitize_text(text, max_length: 5000)
    return nil if text.blank?
    text.to_s.strip.slice(0, max_length)
  end

  def sanitize_integer(value, min: nil, max: nil)
    return nil if value.blank?
    
    int_value = value.to_i
    int_value = [int_value, min].max if min
    int_value = [int_value, max].min if max
    int_value
  end

  def sanitize_float(value, min: nil, max: nil, precision: 2)
    return nil if value.blank?
    
    float_value = value.to_f.round(precision)
    float_value = [float_value, min].max if min
    float_value = [float_value, max].min if max
    float_value
  end

  # Validate and sanitize common golf-specific inputs
  def validate_handicap(handicap)
    return false if handicap.blank?
    h = handicap.to_f
    h >= -10.0 && h <= 54.0
  end

  def validate_score(score, par = nil)
    return false if score.blank?
    s = score.to_i
    return false if s < 1
    
    if par
      # Score should be reasonable relative to par
      s <= (par * 3) # Triple the par is a reasonable maximum
    else
      s <= 200 # Absolute maximum for any round
    end
  end

  def validate_hole_number(hole_number)
    return false if hole_number.blank?
    h = hole_number.to_i
    h >= 1 && h <= 18
  end

  def validate_tee_color(tee_color)
    valid_tees = %w[black blue white gold red green]
    valid_tees.include?(tee_color.to_s.downcase)
  end

  # Strong parameters with validation for common models
  def validated_user_params
    params.require(:user).permit(:email, :password, :first_name, :last_name, :phone).tap do |p|
      unless validate_email(p[:email])
        raise ActionController::ParameterMissing, "Valid email is required"
      end
      
      p[:first_name] = sanitize_string(p[:first_name], max_length: 50)
      p[:last_name] = sanitize_string(p[:last_name], max_length: 50)
      
      if p[:phone].present? && !validate_phone(p[:phone])
        raise ActionController::ParameterMissing, "Invalid phone number format"
      end
    end
  end

  def validated_round_params
    params.require(:round).permit(
      :course_id, :tee_color, :started_at, :is_provisional,
      :start_latitude, :start_longitude, :weather_conditions,
      :temperature, :wind_speed, :wind_direction
    ).tap do |p|
      if p[:course_id].present? && !validate_uuid(p[:course_id])
        raise ActionController::ParameterMissing, "Valid course_id is required"
      end
      
      if p[:tee_color].present? && !validate_tee_color(p[:tee_color])
        raise ActionController::ParameterMissing, "Invalid tee color"
      end
      
      if p[:start_latitude].present? || p[:start_longitude].present?
        unless validate_coordinates(p[:start_latitude], p[:start_longitude])
          raise ActionController::ParameterMissing, "Invalid GPS coordinates"
        end
      end
      
      p[:temperature] = sanitize_integer(p[:temperature], min: -50, max: 150) if p[:temperature]
      p[:wind_speed] = sanitize_integer(p[:wind_speed], min: 0, max: 100) if p[:wind_speed]
    end
  end

  def validated_hole_score_params
    params.require(:hole_score).permit(
      :hole_number, :strokes, :putts, :fairway_hit,
      :green_in_regulation, :up_and_down, :penalties,
      :drive_distance, :approach_distance
    ).tap do |p|
      unless validate_hole_number(p[:hole_number])
        raise ActionController::ParameterMissing, "Valid hole number (1-18) is required"
      end
      
      unless validate_score(p[:strokes], 6) # Max par is usually 5, allow up to triple
        raise ActionController::ParameterMissing, "Invalid stroke count"
      end
      
      if p[:putts].present?
        p[:putts] = sanitize_integer(p[:putts], min: 0, max: 10)
      end
      
      if p[:penalties].present?
        p[:penalties] = sanitize_integer(p[:penalties], min: 0, max: 10)
      end
      
      if p[:drive_distance].present?
        p[:drive_distance] = sanitize_integer(p[:drive_distance], min: 0, max: 500)
      end
      
      if p[:approach_distance].present?
        p[:approach_distance] = sanitize_integer(p[:approach_distance], min: 0, max: 300)
      end
    end
  end
end