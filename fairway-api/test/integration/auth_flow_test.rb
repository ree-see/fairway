require "test_helper"

class AuthFlowTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:one)
    @valid_credentials = { email: @user.email, password: 'password123' }
    @registration_data = {
      email: 'newuser@example.com',
      password: 'password123',
      first_name: 'New',
      last_name: 'User'
    }
  end

  # Registration Tests
  test "successful user registration" do
    assert_difference 'User.count', 1 do
      post "/api/v1/auth/register", params: @registration_data
    end

    assert_response :created
    
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_present response_data['data']['access_token']
    assert_present response_data['data']['refresh_token']
    assert_present response_data['data']['user']['id']
    assert_equal @registration_data[:email], response_data['data']['user']['email']
  end

  test "registration with invalid email" do
    @registration_data[:email] = 'invalid-email'
    
    assert_no_difference 'User.count' do
      post "/api/v1/auth/register", params: @registration_data
    end

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Invalid email format'
  end

  test "registration with short password" do
    @registration_data[:password] = '123'
    
    assert_no_difference 'User.count' do
      post "/api/v1/auth/register", params: @registration_data
    end

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Password must be at least 8 characters'
  end

  test "registration with missing required fields" do
    @registration_data.delete(:first_name)
    
    assert_no_difference 'User.count' do
      post "/api/v1/auth/register", params: @registration_data
    end

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Missing required fields'
  end

  test "registration with duplicate email" do
    @registration_data[:email] = @user.email
    
    assert_no_difference 'User.count' do
      post "/api/v1/auth/register", params: @registration_data
    end

    assert_response :unprocessable_entity
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
  end

  # Login Tests
  test "successful login with valid credentials" do
    post "/api/v1/auth/login", params: @valid_credentials

    assert_response :ok
    
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_present response_data['data']['access_token']
    assert_present response_data['data']['refresh_token']
    assert_present response_data['data']['expires_in']
    assert_equal @user.id, response_data['data']['user']['id']
  end

  test "login with invalid email" do
    post "/api/v1/auth/login", params: { email: 'wrong@example.com', password: 'password123' }

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_equal 'Invalid credentials', response_data['error']
  end

  test "login with invalid password" do
    post "/api/v1/auth/login", params: { email: @user.email, password: 'wrongpassword' }

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_equal 'Invalid credentials', response_data['error']
  end

  test "login with malformed email" do
    post "/api/v1/auth/login", params: { email: 'not-an-email', password: 'password123' }

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Invalid email format'
  end

  test "login with short password" do
    post "/api/v1/auth/login", params: { email: @user.email, password: '123' }

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Password too short'
  end

  # Token Refresh Tests
  test "successful token refresh" do
    # First login to get tokens
    post "/api/v1/auth/login", params: @valid_credentials
    login_response = JSON.parse(response.body)
    refresh_token = login_response['data']['refresh_token']

    # Use refresh token to get new access token
    post "/api/v1/auth/refresh", params: { refresh_token: refresh_token }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_present response_data['data']['access_token']
    assert_present response_data['data']['expires_in']
    assert_not_equal login_response['data']['access_token'], response_data['data']['access_token']
  end

  test "token refresh with invalid token" do
    post "/api/v1/auth/refresh", params: { refresh_token: 'invalid-token' }

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Invalid or expired refresh token'
  end

  test "token refresh without token" do
    post "/api/v1/auth/refresh", params: {}

    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_includes response_data['error'], 'Refresh token required'
  end

  # Authentication Required Tests
  test "accessing protected route without token" do
    get "/api/v1/auth/profile"

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_equal 'Unauthorized', response_data['error']
  end

  test "accessing protected route with valid token" do
    tokens = JwtService.generate_tokens(@user)
    
    get "/api/v1/auth/profile", headers: { 'Authorization' => "Bearer #{tokens[:access_token]}" }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_equal @user.id, response_data['data']['user']['id']
  end

  test "accessing protected route with expired token" do
    # Create an expired token
    expired_payload = {
      user_id: @user.id,
      type: 'access',
      exp: 1.hour.ago.to_i,
      iat: 2.hours.ago.to_i
    }
    expired_token = JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
    
    get "/api/v1/auth/profile", headers: { 'Authorization' => "Bearer #{expired_token}" }

    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
    assert_equal 'Unauthorized', response_data['error']
  end

  # Logout Tests
  test "successful logout with refresh token" do
    # Login first
    post "/api/v1/auth/login", params: @valid_credentials
    login_response = JSON.parse(response.body)
    refresh_token = login_response['data']['refresh_token']

    # Logout
    post "/api/v1/auth/logout", params: { refresh_token: refresh_token }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']

    # Try to use the refresh token - should fail
    post "/api/v1/auth/refresh", params: { refresh_token: refresh_token }
    assert_response :unauthorized
  end

  test "logout without refresh token" do
    post "/api/v1/auth/logout", params: {}

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    assert_equal 'Logout successful', response_data['message']
  end

  # Profile Management Tests
  test "get user profile with authentication" do
    tokens = JwtService.generate_tokens(@user)
    
    get "/api/v1/auth/profile", headers: { 'Authorization' => "Bearer #{tokens[:access_token]}" }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    
    user_data = response_data['data']['user']
    assert_equal @user.id, user_data['id']
    assert_equal @user.email, user_data['email']
    assert_equal @user.first_name, user_data['first_name']
    assert_equal @user.handicap_index, user_data['handicap_index']
  end

  test "update profile with valid data" do
    tokens = JwtService.generate_tokens(@user)
    update_data = {
      user: {
        first_name: 'Updated',
        last_name: 'Name',
        preferred_tees: 'blue'
      }
    }
    
    patch "/api/v1/auth/profile", 
          params: update_data,
          headers: { 'Authorization' => "Bearer #{tokens[:access_token]}" }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    
    user_data = response_data['data']['user']
    assert_equal 'Updated', user_data['first_name']
    assert_equal 'Name', user_data['last_name']
    assert_equal 'blue', user_data['preferred_tees']
  end

  # User Stats Tests
  test "get user stats with authentication" do
    tokens = JwtService.generate_tokens(@user)
    
    get "/api/v1/auth/stats", headers: { 'Authorization' => "Bearer #{tokens[:access_token]}" }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data['success']
    
    stats = response_data['data']['stats']
    assert_present stats['rounds_played']
    assert_present stats['verified_rounds']
    assert_kind_of Array, stats['recent_rounds']
  end

  # Security Tests
  test "XSS protection in registration" do
    malicious_data = @registration_data.dup
    malicious_data[:first_name] = '<script>alert("xss")</script>'
    
    post "/api/v1/auth/register", params: malicious_data
    
    if response.status == 201
      response_data = JSON.parse(response.body)
      user_name = response_data['data']['user']['first_name']
      assert_not_includes user_name, '<script>'
    end
  end

  test "SQL injection protection in login" do
    malicious_email = "' OR '1'='1' --"
    
    post "/api/v1/auth/login", params: { email: malicious_email, password: 'anything' }
    
    assert_response :bad_request
    response_data = JSON.parse(response.body)
    assert_not response_data['success']
  end

  private

  def auth_headers(user = @user)
    tokens = JwtService.generate_tokens(user)
    { 'Authorization' => "Bearer #{tokens[:access_token]}" }
  end
end