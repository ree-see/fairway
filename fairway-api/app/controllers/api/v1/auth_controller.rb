class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login, :register]

  def login
    user = User.find_by(email: login_params[:email].downcase.strip)
    
    if user&.authenticate(login_params[:password])
      token = generate_jwt_token(user)
      render_success({
        user: user_response(user),
        token: token
      }, "Login successful")
    else
      render_error("Invalid credentials", :unauthorized)
    end
  end

  def register
    user = User.new(register_params)
    user.email = user.email.downcase.strip if user.email
    
    if user.save
      token = generate_jwt_token(user)
      render_success({
        user: user_response(user),
        token: token
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

  def logout
    # Since we're using JWT tokens, logout is handled client-side by removing the token
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

  def stats
    stats_data = {
      rounds_played: current_user.rounds_played,
      verified_rounds: current_user.verified_rounds,
      handicap_index: current_user.handicap_index,
      verified_handicap: current_user.verified_handicap,
      average_score: current_user.average_score,
      recent_rounds: current_user.recent_rounds(5).map { |round|
        {
          id: round.id,
          course_name: round.course.name,
          total_strokes: round.total_strokes,
          started_at: round.started_at,
          is_verified: round.is_verified
        }
      }
    }
    
    render_success({ stats: stats_data })
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