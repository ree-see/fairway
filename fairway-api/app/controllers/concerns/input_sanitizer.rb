module InputSanitizer
  extend ActiveSupport::Concern

  private

  def sanitize_string(value)
    return nil if value.blank?
    
    # Remove potential XSS and SQL injection patterns
    sanitized = value.to_s.strip
    
    # Remove dangerous characters and patterns
    sanitized = sanitized.gsub(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi, '')
    sanitized = sanitized.gsub(/javascript:/i, '')
    sanitized = sanitized.gsub(/on\w+\s*=/i, '')
    sanitized = sanitized.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, '')
    
    # Limit length to prevent buffer overflow attacks
    sanitized.truncate(1000)
  end

  def sanitize_email(email)
    return nil if email.blank?
    
    email = email.to_s.strip.downcase
    
    # Basic email format validation
    return nil unless email.match?(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
    
    # Limit length
    email.truncate(254)
  end

  def sanitize_numeric(value, min: nil, max: nil)
    return nil if value.blank?
    
    numeric_value = value.to_f
    
    # Apply bounds if specified
    numeric_value = [numeric_value, min].max if min
    numeric_value = [numeric_value, max].min if max
    
    numeric_value
  end

  def sanitize_coordinate(value)
    return nil if value.blank?
    
    coord = value.to_f
    
    # Ensure reasonable GPS coordinate bounds
    coord = [coord, -180.0].max
    coord = [coord, 180.0].min
    
    coord
  end

  def validate_required_params(params, required_fields)
    missing_fields = required_fields.select { |field| params[field].blank? }
    
    unless missing_fields.empty?
      render_error("Missing required fields: #{missing_fields.join(', ')}", :bad_request)
      return false
    end
    
    true
  end

  def validate_golf_score(strokes)
    return false unless strokes.is_a?(Numeric)
    return false if strokes < 1 || strokes > 15
    
    true
  end

  def validate_handicap(handicap)
    return false unless handicap.is_a?(Numeric)
    return false if handicap < -10.0 || handicap > 54.0
    
    true
  end

  def validate_course_rating(rating)
    return false unless rating.is_a?(Numeric)
    return false if rating < 60.0 || rating > 85.0
    
    true
  end

  def validate_slope_rating(slope)
    return false unless slope.is_a?(Numeric)
    return false if slope < 55 || slope > 155
    
    true
  end
end