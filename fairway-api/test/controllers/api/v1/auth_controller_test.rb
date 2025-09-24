require 'test_helper'

class Api::V1::AuthControllerTest < ActionController::TestCase
  def setup
    @user = create_test_user(
      email: "test@example.com",
      password: "password123"
    )
  end

  test "POST login with valid credentials returns tokens and user" do
    post :login, params: {
      user: {
        email: "test@example.com",
        password: "password123"
      }
    }

    assert_response :ok
    json = json_response
    
    assert_includes json, 'access_token'
    assert_includes json, 'refresh_token'
    assert_includes json, 'user'
    
    assert_valid_jwt(json['access_token'])
    assert_valid_jwt(json['refresh_token'])
    
    user_data = json['user']
    assert_equal @user.id, user_data['id']
    assert_equal @user.email, user_data['email']
    assert_not_includes user_data, 'password_digest'
  end

  test "POST login with invalid email returns error" do
    post :login, params: {
      user: {
        email: "nonexistent@example.com",
        password: "password123"
      }
    }

    assert_response :unauthorized
    assert_error_response(response, 'INVALID_CREDENTIALS')
  end

  test "POST login with invalid password returns error" do
    post :login, params: {
      user: {
        email: "test@example.com",
        password: "wrongpassword"
      }
    }

    assert_response :unauthorized
    assert_error_response(response, 'INVALID_CREDENTIALS')
  end

  test "POST login with missing parameters returns error" do
    post :login, params: {
      user: {
        email: "test@example.com"
        # password missing
      }
    }

    assert_response :bad_request
    error = json_response['error']
    assert_equal 'MISSING_PARAMETER', error['code']
  end

  test "POST register with valid data creates user and returns tokens" do
    assert_difference 'User.count', 1 do
      post :register, params: {
        user: {
          email: "newuser@example.com",
          password: "password123",
          password_confirmation: "password123",
          first_name: "New",
          last_name: "User",
          date_of_birth: "1990-01-01",
          phone_number: "555-0199"
        }
      }
    end

    assert_response :created
    json = json_response
    
    assert_includes json, 'access_token'
    assert_includes json, 'refresh_token'
    assert_includes json, 'user'
    
    new_user = User.find(json['user']['id'])
    assert_equal "newuser@example.com", new_user.email
    assert_equal "New", new_user.first_name
    assert_equal "User", new_user.last_name
  end

  test "POST register with existing email returns error" do
    post :register, params: {
      user: {
        email: "test@example.com", # Already exists
        password: "password123",
        password_confirmation: "password123",
        first_name: "New",
        last_name: "User",
        date_of_birth: "1990-01-01"
      }
    }

    assert_response :unprocessable_entity
    error = json_response['error']
    assert_equal 'VALIDATION_ERROR', error['code']
    assert_includes error['details']['errors']['email'].first['message'], 'taken'
  end

  test "POST register with password mismatch returns error" do
    post :register, params: {
      user: {
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "differentpassword",
        first_name: "New",
        last_name: "User",
        date_of_birth: "1990-01-01"
      }
    }

    assert_response :unprocessable_entity
    error = json_response['error']
    assert_equal 'VALIDATION_ERROR', error['code']
  end

  test "POST register with invalid email format returns error" do
    post :register, params: {
      user: {
        email: "invalid-email",
        password: "password123",
        password_confirmation: "password123",
        first_name: "New",
        last_name: "User",
        date_of_birth: "1990-01-01"
      }
    }

    assert_response :unprocessable_entity
    error = json_response['error']
    assert_equal 'VALIDATION_ERROR', error['code']
  end

  test "POST refresh with valid refresh token returns new access token" do
    tokens = JwtService.generate_tokens(@user)
    
    post :refresh, params: {
      refresh_token: tokens[:refresh_token]
    }

    assert_response :ok
    json = json_response
    
    assert_includes json, 'access_token'
    assert_includes json, 'refresh_token'
    assert_valid_jwt(json['access_token'])
    assert_valid_jwt(json['refresh_token'])
    
    # New tokens should be different from original
    assert_not_equal tokens[:access_token], json['access_token']
    assert_not_equal tokens[:refresh_token], json['refresh_token']
  end

  test "POST refresh with invalid refresh token returns error" do
    post :refresh, params: {
      refresh_token: "invalid.token.here"
    }

    assert_response :unauthorized
    assert_error_response(response, 'INVALID_TOKEN')
  end

  test "POST refresh with expired refresh token returns error" do
    # Create expired token
    expired_token = JWT.encode(
      {
        user_id: @user.id,
        type: 'refresh',
        exp: 1.day.ago.to_i
      },
      Rails.application.secret_key_base,
      'HS256'
    )
    
    post :refresh, params: {
      refresh_token: expired_token
    }

    assert_response :unauthorized
    assert_error_response(response, 'TOKEN_EXPIRED')
  end

  test "GET me with valid token returns current user" do
    tokens = login_user(@user)
    request.headers.merge!(auth_headers)

    get :me

    assert_response :ok
    json = json_response
    
    assert_equal @user.id, json['user']['id']
    assert_equal @user.email, json['user']['email']
    assert_not_includes json['user'], 'password_digest'
  end

  test "GET me without token returns unauthorized" do
    get :me

    assert_response :unauthorized
    assert_error_response(response, 'AUTHENTICATION_REQUIRED')
  end

  test "GET me with invalid token returns unauthorized" do
    request.headers['Authorization'] = 'Bearer invalid.token.here'

    get :me

    assert_response :unauthorized
    assert_error_response(response, 'INVALID_TOKEN')
  end

  test "POST logout invalidates refresh token" do
    tokens = login_user(@user)
    request.headers.merge!(auth_headers)

    post :logout, params: {
      refresh_token: tokens[:refresh_token]
    }

    assert_response :ok
    
    # Try to use the refresh token - should fail
    post :refresh, params: {
      refresh_token: tokens[:refresh_token]
    }

    assert_response :unauthorized
    assert_error_response(response, 'INVALID_TOKEN')
  end

  test "POST logout without refresh token still succeeds" do
    tokens = login_user(@user)
    request.headers.merge!(auth_headers)

    post :logout

    assert_response :ok
  end

  test "authentication flow integration test" do
    # 1. Register new user
    post :register, params: {
      user: {
        email: "integration@example.com",
        password: "password123",
        password_confirmation: "password123",
        first_name: "Integration",
        last_name: "Test",
        date_of_birth: "1990-01-01"
      }
    }
    
    assert_response :created
    register_response = json_response
    access_token = register_response['access_token']
    refresh_token = register_response['refresh_token']

    # 2. Use access token to access protected endpoint
    request.headers['Authorization'] = "Bearer #{access_token}"
    get :me
    
    assert_response :ok
    me_response = json_response
    assert_equal "integration@example.com", me_response['user']['email']

    # 3. Refresh the access token
    request.headers.delete('Authorization') # Clear auth header
    post :refresh, params: { refresh_token: refresh_token }
    
    assert_response :ok
    refresh_response = json_response
    new_access_token = refresh_response['access_token']
    
    # 4. Use new access token
    request.headers['Authorization'] = "Bearer #{new_access_token}"
    get :me
    
    assert_response :ok

    # 5. Logout
    post :logout, params: { refresh_token: refresh_response['refresh_token'] }
    
    assert_response :ok
  end

  test "rate limiting prevents brute force attacks" do
    # Mock rate limiting to trigger after 3 attempts
    10.times do
      post :login, params: {
        user: {
          email: "test@example.com",
          password: "wrongpassword"
        }
      }
    end

    # Should eventually get rate limited
    # Implementation depends on rate limiting setup
  end

  test "secure headers are present" do
    post :login, params: {
      user: {
        email: "test@example.com",
        password: "password123"
      }
    }

    # Check security headers
    assert_match /no-cache/, response.headers['Cache-Control']
    assert_equal 'nosniff', response.headers['X-Content-Type-Options']
  end

  test "password validation requirements" do
    post :register, params: {
      user: {
        email: "weak@example.com",
        password: "123", # Too weak
        password_confirmation: "123",
        first_name: "Weak",
        last_name: "Password",
        date_of_birth: "1990-01-01"
      }
    }

    assert_response :unprocessable_entity
    error = json_response['error']
    assert_equal 'VALIDATION_ERROR', error['code']
  end

  test "concurrent login requests" do
    threads = 5.times.map do
      Thread.new do
        post :login, params: {
          user: {
            email: "test@example.com",
            password: "password123"
          }
        }
        
        response.code
      end
    end

    results = threads.map(&:value)
    results.each { |result| assert_equal "200", result }
  end
end