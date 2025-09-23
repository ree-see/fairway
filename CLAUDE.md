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

This is an early-stage project currently in the planning phase. The codebase contains only documentation files (PRD.md and CLAUDE.md). No actual application code has been written yet.

## Development Commands

⚠️ **Note**: No build, test, or development scripts are currently configured. When setting up the project structure, ensure to include:

- Package management setup (for React Native: `npm install` or `yarn install`)
- Rails backend setup commands (`bundle install`, `rails db:create`, `rails db:migrate`)
- Test runners for both frontend and backend
- Linting and formatting tools
- Build and deployment scripts

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