# Twilio SMS Setup

This guide shows you how to set up Twilio for SMS verification in development and production.

## Quick Setup (Development)

1. **Install gems**:
   ```bash
   bundle install
   ```

2. **Copy the example env file**:
   ```bash
   cp .env.example .env
   ```

3. **Get your Twilio test credentials**:
   - Go to https://console.twilio.com
   - Find your **Test Credentials** section (usually on the main dashboard)
   - Copy your Test Account SID and Test Auth Token

4. **Update `.env` with your test credentials**:
   ```bash
   TWILIO_ACCOUNT_SID=your_test_account_sid
   TWILIO_AUTH_TOKEN=your_test_auth_token
   TWILIO_PHONE_NUMBER=+15005550006
   ```

5. **Restart your Rails server**:
   ```bash
   rails server
   ```

## Test Phone Numbers

When using Twilio test credentials, you can use these magic numbers:

- **Valid number**: `+15005550006` - Will succeed
- **Invalid number**: `+15005550001` - Will fail (for testing error handling)
- **Full list**: https://www.twilio.com/docs/iam/test-credentials#test-sms-messages

## Production Setup

1. **Upgrade to paid Twilio account** (if needed)

2. **Get a real Twilio phone number**:
   - In Twilio Console, go to Phone Numbers → Buy a Number
   - Choose a number with SMS capabilities

3. **Update production credentials**:

   **Option A: Environment Variables (Recommended for deployment)**
   ```bash
   # On your production server or in your deployment config
   export TWILIO_ACCOUNT_SID=your_live_account_sid
   export TWILIO_AUTH_TOKEN=your_live_auth_token
   export TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

   **Option B: Rails Credentials**
   ```bash
   EDITOR="nano" rails credentials:edit --environment production
   ```
   Add:
   ```yaml
   twilio:
     account_sid: your_live_account_sid
     auth_token: your_live_auth_token
     phone_number: your_twilio_phone_number
   ```

## Switching Between Test and Production

The app checks for credentials in this order:
1. Environment variables (`ENV['TWILIO_ACCOUNT_SID']`)
2. Rails credentials (`Rails.application.credentials.twilio.account_sid`)

**For local development**: Use `.env` file (environment variables)
**For production**: Use environment variables set in your deployment platform

## Testing Without Twilio

If you don't have Twilio credentials configured, the app will automatically use **mock mode** in development:
- SMS won't actually send
- You'll see mock SMS messages in the Rails logs
- The API will still return success responses

Check the logs for:
```
=== MOCK SMS ===
To: +15551234567
Body: Your verification message...
================
```

## Troubleshooting

**Error: "ApiService.default.post is not a function"**
- This error means the credentials aren't configured yet
- Make sure you've created a `.env` file and added your credentials
- Restart your Rails server after adding credentials

**SMS not sending in development**
- Check that you're using test credentials (starts with AC...)
- Verify the `.env` file exists and has the correct values
- Check Rails logs for error messages

**SMS not sending in production**
- Make sure you've set environment variables on your production server
- Verify you're using live credentials (not test credentials)
- Check that your Twilio account is paid/upgraded if needed
- Verify your phone number has SMS capabilities
