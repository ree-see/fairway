class SmsService
  class << self
    def send_verification_link(to:, player_name:, course_name:, score:, verification_url:)
      message_body = build_verification_message(player_name, course_name, score, verification_url)

      send_sms(
        to: to,
        body: message_body
      )
    end

    def send_sms(to:, body:)
      return mock_send_sms(to, body) if Rails.env.development? && !twilio_configured?

      client = Twilio::REST::Client.new(twilio_account_sid, twilio_auth_token)

      message = client.messages.create(
        from: twilio_phone_number,
        to: to,
        body: body
      )

      {
        success: true,
        message_sid: message.sid,
        status: message.status
      }
    rescue Twilio::REST::RestError => e
      Rails.logger.error "Twilio SMS Error: #{e.message}"
      {
        success: false,
        error: e.message,
        error_code: e.code
      }
    rescue => e
      Rails.logger.error "SMS Service Error: #{e.message}"
      {
        success: false,
        error: e.message
      }
    end

    private

    def build_verification_message(player_name, course_name, score, url)
      <<~MESSAGE.squish
        #{player_name} played golf at #{course_name} and scored #{score}.
        Can you verify their round? #{url}
        Tap to verify (no app required)
      MESSAGE
    end

    def twilio_configured?
      twilio_account_sid.present? && twilio_auth_token.present? && twilio_phone_number.present?
    end

    def twilio_account_sid
      Rails.application.credentials.dig(:twilio, :account_sid)
    end

    def twilio_auth_token
      Rails.application.credentials.dig(:twilio, :auth_token)
    end

    def twilio_phone_number
      Rails.application.credentials.dig(:twilio, :phone_number)
    end

    def mock_send_sms(to, body)
      Rails.logger.info "=== MOCK SMS ==="
      Rails.logger.info "To: #{to}"
      Rails.logger.info "Body: #{body}"
      Rails.logger.info "================"

      {
        success: true,
        message_sid: "MOCK_#{SecureRandom.hex(8)}",
        status: 'sent',
        mock: true
      }
    end
  end
end