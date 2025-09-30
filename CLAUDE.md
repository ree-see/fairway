# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Verified Handicap is a mobile golf application that addresses the critical trust and integrity gap in amateur golf handicapping. The application introduces a proprietary, technology-enforced verification framework combining real-time peer attestation, GPS tracking, geo-fencing, and machine learning-driven fraud detection.

## Technology Stack

- **Frontend**: React Native (cross-platform mobile development)
- **Backend**: Ruby on Rails (API-only mode)
- **Database**: PostgreSQL
- **Additional Services**: Third-party course database API, payment gateway, push notifications (Firebase)

## Project Status

This project has a complete MVP foundation with both mobile app and API backend implemented. The core features include user authentication, course management, round tracking with GPS verification, and peer attestation system.

## Development Commands

### Backend (Rails API) - `fairway-api/`
```bash
# Install dependencies
bundle install

# Database setup
rails db:create
rails db:migrate
rails db:seed

# Run server (default: localhost:3000)
rails server

# Run tests
rails test
# or with RSpec (when configured)
bundle exec rspec

# Run linter
bundle exec rubocop

# Security scan
bundle exec brakeman
```

### Frontend (React Native) - `fairway-mobile/`
```bash
# Install dependencies
npm install
# or
yarn install

# Start Metro bundler
npm start
# or
yarn start

# Run on iOS simulator
npm run ios
# or
yarn ios

# Run on Android emulator
npm run android
# or
yarn android

# Run tests
npm test
# or
yarn test

# Type checking
npm run typecheck
# or
yarn typecheck

# Lint code
npm run lint
# or
yarn lint
```

### Full Stack Development
```bash
# From project root, start both servers
cd fairway-api && rails server &
cd fairway-mobile && npm start
```

## Core Architecture

### Backend (Rails API)
- User authentication and session management
- Course data integration and management  
- Score processing and handicap calculations
- Real-time data handling with Turbo Streams/WebSockets
- Fraud detection ML model hosting
- Payment processing integration

### Mobile App (React Native)
- Cross-platform iOS/Android compatibility
- GPS module for location services and distance calculations
- Real-time score input and validation
- Push notification handling
- Apple Watch companion app integration
- Offline capability for remote courses

### Database (PostgreSQL)
- User profiles and authentication data
- Course information and ratings database
- Score history and statistical analysis
- League and social relationship management
- Fraud risk scoring and audit trails

## MVP Development Priorities

### Phase 1 (Core MVP)
- User authentication and profile management
- Course database integration with GPS location services
- Digital scorecard with real-time data storage
- Basic GPS rangefinder functionality
- Peer attestation system with push notifications
- Provisional handicap calculation
- Geo-fencing for round registration and score submission

### Phase 2 (Advanced Features)
- Strokes Gained analytics with ML model
- Live leaderboards with real-time data synchronization
- Enhanced social features and league management
- Apple Watch app integration
- Advanced fraud detection algorithms

## Core Verification Framework

The app's unique value proposition centers on a multi-layered verification system:

1. **Geo-fencing & GPS Tracking**: Location-based validation for round registration and score submission
2. **Real-time Peer Attestation**: Digital score verification by playing partners
3. **Fraud Risk Scoring**: ML-driven analysis of scoring patterns and behavioral anomalies

## Legal Considerations

- Use proprietary terminology ("Verified Handicap," "Performance Index") to avoid USGA/R&A trademark issues
- Implement mathematically distinct handicap calculations from the World Handicap System
- Include clear disclaimers regarding non-affiliation with USGA/R&A

## Business Model

**Freemium Strategy:**
- **Free Tier**: Digital scorecard, GPS rangefinder, "Provisional Handicap"
- **Premium Tier**: "Verified Handicap," Strokes Gained analytics, live leaderboards

## Key Technical Requirements

- React Native app with cross-platform compatibility
- Rails API-only backend with WebSocket support for real-time features
- PostgreSQL database for complex relational data
- Third-party integrations: course database API, payment gateway, push notifications (Firebase)
- GPS functionality with geo-fencing capabilities
- Apple Watch companion app support
- make sure to sure utilize git for version control and develop from test driven development framework

## Production Deployment Checklist

### SolidQueue Background Jobs Setup
**IMPORTANT**: When deploying to production, configure SolidQueue properly:

1. **Enable Puma Plugin** (Recommended):
   ```bash
   # Set environment variable for automatic worker startup
   SOLID_QUEUE_IN_PUMA=true rails server
   ```

2. **Alternative: Systemd Service**:
   ```bash
   # Create systemd service for solid_queue worker
   sudo systemctl enable solid_queue
   sudo systemctl start solid_queue
   ```

3. **Verify Recurring Jobs**:
   ```ruby
   # Check that course sync jobs are scheduled
   SolidQueue::RecurringTask.count  # Should show 2 tasks
   # - courses_daily_sync: Daily at 2 AM
   # - courses_weekly_maintenance: Weekly on Sunday at 3 AM
   ```

4. **Monitor Job Processing**:
   ```ruby
   # Check job queue health
   SolidQueue::Job.where(finished_at: nil).count  # Pending jobs
   SolidQueue::Job.failed.count  # Failed jobs
   ```

### Course Database API Setup
- Ensure `golf_course_api_key` is configured in Rails credentials for production
- Consider upgrading to Pro tier ($6.99/month) for faster initial course population
- Set up monitoring for API rate limits and sync failures
- frequently commit changes