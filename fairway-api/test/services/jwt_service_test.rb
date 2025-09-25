require 'test_helper'

class JwtServiceTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @payload = { user_id: @user.id }
  end

  test "encode returns a valid JWT token" do
    token = JwtService.encode(@payload)
    
    assert_not_nil token
    assert_kind_of String, token
    assert token.split('.').length == 3, "JWT should have 3 parts separated by dots"
  end

  test "decode returns original payload" do
    token = JwtService.encode(@payload)
    decoded = JwtService.decode(token)
    
    assert_not_nil decoded
    assert_equal @user.id, decoded[:user_id]
  end

  test "decode handles expired tokens" do
    # Create an expired token
    expired_payload = @payload.merge(exp: 1.hour.ago.to_i)
    token = JWT.encode(expired_payload, Rails.application.credentials.secret_key_base)
    
    decoded = JwtService.decode(token)
    assert_nil decoded
  end

  test "decode handles invalid tokens" do
    invalid_token = "invalid.token.here"
    decoded = JwtService.decode(invalid_token)
    
    assert_nil decoded
  end

  test "decode handles nil token" do
    decoded = JwtService.decode(nil)
    assert_nil decoded
  end

  test "decode handles empty token" do
    decoded = JwtService.decode("")
    assert_nil decoded
  end

  test "tokens include expiration" do
    token = JwtService.encode(@payload)
    decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
    
    assert_not_nil decoded['exp']
    assert decoded['exp'] > Time.current.to_i
  end

  test "tokens expire after 24 hours by default" do
    token = JwtService.encode(@payload)
    decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
    
    expiration_time = Time.at(decoded['exp'])
    expected_expiration = Time.current + 24.hours
    
    # Allow 1 minute tolerance for test execution time
    assert_in_delta expected_expiration.to_i, expiration_time.to_i, 60
  end

  test "custom expiration can be set" do
    custom_exp = 2.hours.from_now
    payload_with_exp = @payload.merge(exp: custom_exp.to_i)
    token = JwtService.encode(payload_with_exp)
    decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
    
    assert_equal custom_exp.to_i, decoded['exp']
  end

  test "decode handles tampered tokens" do
    token = JwtService.encode(@payload)
    # Tamper with the token by changing a character
    tampered_token = token[0...-1] + 'X'
    
    decoded = JwtService.decode(tampered_token)
    assert_nil decoded
  end

  test "decode handles tokens with wrong signature" do
    # Create token with different secret
    wrong_secret_token = JWT.encode(@payload, 'wrong_secret')
    
    decoded = JwtService.decode(wrong_secret_token)
    assert_nil decoded
  end

  test "payload data types are preserved" do
    complex_payload = {
      user_id: @user.id,
      admin: true,
      roles: ['user', 'moderator'],
      metadata: { last_login: Time.current.to_i }
    }
    
    token = JwtService.encode(complex_payload)
    decoded = JwtService.decode(token)
    
    assert_equal complex_payload[:user_id], decoded[:user_id]
    assert_equal complex_payload[:admin], decoded[:admin]
    assert_equal complex_payload[:roles], decoded[:roles]
    assert_equal complex_payload[:metadata][:last_login], decoded[:metadata][:last_login]
  end
end