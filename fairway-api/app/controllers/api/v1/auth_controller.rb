class Api::V1::AuthController < ApplicationController
  include InputSanitizer

  before_action :authenticate_user!, except: [ :login, :register ]

  def login
    return unless validate_required_params(params, [ :email, :password ])

    email = sanitize_email(params[:email])
    password = params[:password]

    return render_error("Invalid email format", :bad_request) unless email
    return render_error("Password too short", :bad_request) if password.length < 8

    user = User.find_by(email: email)

    if user&.authenticate(password)
      tokens = generate_jwt_tokens(user)
      render_success({
        user: user_response(user),
        access_token: tokens[:access_token],
        refresh_token: tokens[:refresh_token],
        expires_in: tokens[:expires_in]
      }, "Login successful")
    else
      render_error("Invalid credentials", :unauthorized)
    end
  end

  def register
    return unless validate_required_params(params, [ :email, :password, :first_name, :last_name ])

    # Sanitize inputs
    sanitized_params = {
      email: sanitize_email(params[:email]),
      password: params[:password],
      first_name: sanitize_string(params[:first_name]),
      last_name: sanitize_string(params[:last_name]),
      phone: sanitize_string(params[:phone])
    }

    # Validate sanitized inputs
    return render_error("Invalid email format", :bad_request) unless sanitized_params[:email]
    return render_error("Password must be at least 8 characters", :bad_request) if sanitized_params[:password].length < 8
    return render_error("First name is required", :bad_request) if sanitized_params[:first_name].blank?
    return render_error("Last name is required", :bad_request) if sanitized_params[:last_name].blank?

    user = User.new(sanitized_params)

    if user.save
      tokens = generate_jwt_tokens(user)
      render_success({
        user: user_response(user),
        access_token: tokens[:access_token],
        refresh_token: tokens[:refresh_token],
        expires_in: tokens[:expires_in]
      }, "Registration successful", :created)
    else
      render_error("Registration failed", :unprocessable_entity, user.errors.full_messages)
    end
  end

  def profile
    render_success({ user: user_response(current_user) })
  end

  def update_profile
    if current_user.update(profile_update_params)
      render_success({ user: user_response(current_user) }, "Profile updated successfully")
    else
      render_error("Profile update failed", :unprocessable_entity, current_user.errors.full_messages)
    end
  end

  def change_password
    unless current_user.authenticate(change_password_params[:current_password])
      return render_error("Current password is incorrect", :unauthorized)
    end

    if current_user.update(password: change_password_params[:new_password])
      render_success(nil, "Password changed successfully")
    else
      render_error("Password change failed", :unprocessable_entity, current_user.errors.full_messages)
    end
  end

  def refresh_token
    refresh_token = params[:refresh_token]
    return render_error("Refresh token required", :bad_request) unless refresh_token

    begin
      tokens = JwtService.refresh_access_token(refresh_token)
      render_success({
        access_token: tokens[:access_token],
        expires_in: tokens[:expires_in]
      }, "Token refreshed successfully")
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::InvalidPayload => e
      render_error("Invalid or expired refresh token", :unauthorized)
    end
  end

  def logout
    # Revoke refresh token if provided
    refresh_token = params[:refresh_token]

    if refresh_token
      begin
        payload = JwtService.decode_token(refresh_token, "refresh")
        JwtService.revoke_refresh_token(payload["user_id"], payload["jti"])
      rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::InvalidPayload
        # Token already invalid, nothing to revoke
      end
    end

    render_success(nil, "Logout successful")
  end

  def verify_email
    # This would typically be called from an email verification link
    if current_user.update(email_verified: true, email_verified_at: Time.current)
      render_success({ user: user_response(current_user) }, "Email verified successfully")
    else
      render_error("Email verification failed")
    end
  end

  def resend_verification
    # In a real implementation, this would send an email
    # For now, we'll just return success
    render_success(nil, "Verification email sent")
  end

  private

  def login_params
    params.require(:auth).permit(:email, :password)
  rescue ActionController::ParameterMissing
    params.permit(:email, :password)
  end

  def register_params
    params.require(:auth).permit(:email, :password, :first_name, :last_name, :phone, :date_of_birth)
  rescue ActionController::ParameterMissing
    params.permit(:email, :password, :first_name, :last_name, :phone, :date_of_birth)
  end

  def profile_update_params
    params.require(:user).permit(:first_name, :last_name, :phone, :date_of_birth, :preferred_tees)
  end

  def change_password_params
    params.require(:password).permit(:current_password, :new_password)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone: user.phone,
      date_of_birth: user.date_of_birth,
      preferred_tees: user.preferred_tees,
      handicap_index: user.handicap_index,
      verified_handicap: user.verified_handicap,
      rounds_played: user.rounds_played,
      verified_rounds: user.verified_rounds,
      email_verified: user.email_verified,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end
