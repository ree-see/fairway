require 'test_helper'

class UserAuthenticationFlowTest < ActionDispatch::IntegrationTest
  def setup
    @user_params = {
      email: 'golfer@example.com',
      password: 'SecurePassword123!',
      first_name: 'Test',
      last_name: 'Golfer'
    }
  end

  test "complete user registration and authentication flow" do
    # Test user registration
    post '/api/v1/auth/register', 
         params: { user: @user_params },
         headers: { 'Content-Type' => 'application/json' }

    assert_response :created
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_present response_data['data']['user']
    assert_present response_data['data']['access_token']
    assert_present response_data['data']['refresh_token']

    user_id = response_data['data']['user']['id']
    access_token = response_data['data']['access_token']
    refresh_token = response_data['data']['refresh_token']

    # Test authenticated request
    get '/api/v1/users/profile',
        headers: { 'Authorization' => "Bearer #{access_token}" }

    assert_response :success
    profile_data = JSON.parse(response.body)
    assert_equal @user_params[:email], profile_data['data']['user']['email']

    # Test token refresh
    post '/api/v1/auth/refresh',
         params: { refresh_token: refresh_token },
         headers: { 'Content-Type' => 'application/json' }

    assert_response :success
    refresh_data = JSON.parse(response.body)
    assert_present refresh_data['data']['access_token']
    new_access_token = refresh_data['data']['access_token']

    # Test with new access token
    get '/api/v1/users/profile',
        headers: { 'Authorization' => "Bearer #{new_access_token}" }

    assert_response :success

    # Test logout
    post '/api/v1/auth/logout',
         headers: { 'Authorization' => "Bearer #{new_access_token}" }

    assert_response :success

    # Test that old token is now invalid
    get '/api/v1/users/profile',
        headers: { 'Authorization' => "Bearer #{new_access_token}" }

    assert_response :unauthorized
  end

  test "login with existing user" do
    user = User.create!(@user_params)

    post '/api/v1/auth/login',
         params: { 
           email: @user_params[:email],
           password: @user_params[:password]
         },
         headers: { 'Content-Type' => 'application/json' }

    assert_response :success
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_present response_data['data']['access_token']
    assert_present response_data['data']['refresh_token']
  end

  test "login with invalid credentials" do
    user = User.create!(@user_params)

    post '/api/v1/auth/login',
         params: { 
           email: @user_params[:email],
           password: 'WrongPassword'
         },
         headers: { 'Content-Type' => 'application/json' }

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
  end

  test "rate limiting prevents brute force attacks" do
    user = User.create!(@user_params)

    # Make multiple failed login attempts (should hit rate limit)
    6.times do
      post '/api/v1/auth/login',
           params: { 
             email: @user_params[:email],
             password: 'WrongPassword'
           },
           headers: { 'Content-Type' => 'application/json' }
    end

    # Last request should be rate limited
    assert_response :too_many_requests
    response_data = JSON.parse(response.body)
    assert_includes response_data['error'], 'Rate limit exceeded'
  end

  test "invalid JWT token returns unauthorized" do
    get '/api/v1/users/profile',
        headers: { 'Authorization' => 'Bearer invalid.jwt.token' }

    assert_response :unauthorized
  end

  test "expired JWT token returns unauthorized" do
    user = User.create!(@user_params)
    
    # Create an expired token
    expired_payload = {
      user_id: user.id,
      exp: 1.hour.ago.to_i
    }
    expired_token = JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')

    get '/api/v1/users/profile',
        headers: { 'Authorization' => "Bearer #{expired_token}" }

    assert_response :unauthorized
  end

  test "user can change password with valid authentication" do
    user = User.create!(@user_params)
    
    # Login to get token
    post '/api/v1/auth/login',
         params: { 
           email: @user_params[:email],
           password: @user_params[:password]
         },
         headers: { 'Content-Type' => 'application/json' }

    access_token = JSON.parse(response.body)['data']['access_token']

    # Change password
    patch '/api/v1/auth/change_password',
          params: {
            current_password: @user_params[:password],
            new_password: 'NewSecurePassword123!'
          },
          headers: { 
            'Authorization' => "Bearer #{access_token}",
            'Content-Type' => 'application/json'
          }

    assert_response :success

    # Test login with new password
    post '/api/v1/auth/login',
         params: { 
           email: @user_params[:email],
           password: 'NewSecurePassword123!'
         },
         headers: { 'Content-Type' => 'application/json' }

    assert_response :success
  end

  private

  def assert_present(value)
    assert_not_nil value
    assert_not value.to_s.empty?
  end
end