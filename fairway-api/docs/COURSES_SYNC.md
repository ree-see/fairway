# Course Database Synchronization

This document explains how to set up and use the third-party golf course database synchronization system.

## Overview

The Verified Handicap application includes a comprehensive system for populating and maintaining a local course database from third-party APIs. This eliminates the need for real-time API calls during user interactions, improving performance and reducing API costs.

**✅ Current Status: Production Ready**
- Successfully integrated with golfcourseapi.com
- ~30,000 courses available worldwide
- Automatic data cleaning and duplicate prevention
- Comprehensive testing and error handling

## Architecture

### Components

1. **CoursesSyncService** - Main service class for API communication and data transformation
2. **Course Model** - Enhanced with sync-related methods and scopes  
3. **CoursesSyncJob** - Background job for automated synchronization
4. **Rake Tasks** - Command-line tools for manual sync operations
5. **Scheduled Jobs** - Automated daily/weekly sync operations

### Data Flow

```
Third-party API → CoursesSyncService → Local Database → User Search
```

## Setup

### 1. API Key Configuration

Add your golf course API key to Rails credentials:

```bash
# For development
EDITOR=nano rails credentials:edit --environment=development

# For production  
EDITOR=nano rails credentials:edit --environment=production
```

Add the following:

```yaml
golf_course_api_key: your_api_key_here
```

### 2. Database Migration

The required migration should already be applied. Verify with:

```bash
rails db:migrate:status
```

### 3. Background Jobs

Ensure solid_queue is configured and running:

```bash
# Start background job processing
rails solid_queue:start

# Or with Puma plugin (recommended for production)
SOLID_QUEUE_IN_PUMA=true rails server
```

### 4. Automated Scheduling Options

Choose one of the following methods for automated course synchronization:

#### Option A: Cron Jobs (Recommended)

Most reliable method using system cron:

```bash
# Edit your crontab
crontab -e

# Add these entries:
# Daily sync at 2 AM
0 2 * * * cd /path/to/your/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update >> log/sync.log 2>&1

# Weekly comprehensive sync on Sundays at 3 AM
0 3 * * 0 cd /path/to/your/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update >> log/sync.log 2>&1
```

#### Option B: Background Job Scheduling

If your solid_queue version supports recurring jobs, you can use the provided configuration. Check if `SolidQueue::RecurringJob` is available:

```bash
# Test in Rails console
rails console
> defined?(SolidQueue::RecurringJob)
```

If supported, uncomment the recurring job configuration in `config/initializers/solid_queue.rb`.

#### Option C: External Schedulers

Use external tools like:
- **Whenever gem**: Ruby-based cron management
- **Sidekiq-Cron**: If using Sidekiq instead of solid_queue
- **Kubernetes CronJobs**: For containerized deployments
- **Heroku Scheduler**: For Heroku deployments

## Usage

### Initial Data Population

For first-time setup, populate your database with courses:

```bash
# Import 10 courses for testing
rake courses:sync:initial[10]

# Import from specific starting ID
rake courses:sync:initial[50,5000]  # 50 courses starting from ID 5000

# Import all courses (respects API rate limits)
rake courses:sync:initial
```

**Important Notes:**
- Course IDs start around **5000** (lower IDs may not exist)
- Sequential ID lookup: scans course IDs incrementally
- Stops after 100 consecutive 404s (missing courses)
- With free tier (300 requests/day), full population takes ~100 days
- Pro tier ($6.99/month, 10k requests/day) recommended for initial population

### Ongoing Synchronization

#### Manual Updates

```bash
# Update courses that need refreshing
rake courses:sync:update

# Update specific course by external ID
rake courses:sync:course[12345]
```

#### Automated Updates

**Option 1: Using Cron (Recommended)**

Add to your crontab for automated syncing:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily course sync at 2 AM
0 2 * * * cd /path/to/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update

# Weekly comprehensive sync on Sunday at 3 AM  
0 3 * * 0 cd /path/to/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update
```

**Option 2: Background Jobs (if RecurringJob supported)**

If your solid_queue version supports recurring jobs, scheduled jobs run automatically:
- **Daily at 2 AM**: Update courses needing refresh
- **Weekly on Sunday at 3 AM**: Comprehensive maintenance sync

### Monitoring

#### Check Sync Status

```bash
rake courses:sync:status
```

Shows:
- Total courses in database
- Courses from external API vs manual entries
- Courses needing sync
- Recent sync activity
- Courses requiring attention

#### Data Cleanup Operations

```bash
# Fix existing course name issues (run once after initial setup)
rake courses:sync:expand_abbreviations    # Gc → Golf Course, Cc → Country Club
rake courses:sync:fix_duplicate_names     # "Club - Club" → "Club"  
rake courses:sync:remove_duplicates       # Remove duplicate course entries

# Enable/disable sync
rake courses:sync:enable_sync             # Enable sync for all external courses
rake courses:sync:disable_sync            # Disable sync for all courses
```

## API Integration Details

### Supported Provider

Currently integrated with **golfcourseapi.com**:
- **Base URL**: `https://api.golfcourseapi.com`
- **Endpoint**: `/v1/courses/{id}` (individual course lookup)
- **Authentication**: `Authorization: Key <your_api_key>`
- **Coverage**: ~30,000 courses worldwide
- **Pricing Tiers**:
  - Free tier: 300 requests/day
  - Pro tier: 10,000 requests/day ($6.99/month)
  - Enterprise tier: 100,000 requests/day ($19.99/month)

### Rate Limiting

The system includes built-in rate limiting:
- 1 second delay between requests
- Exponential backoff on failures
- Batch processing (50 courses at a time)
- Maximum 3 retries per request

### Data Mapping

The service transforms third-party data to match our schema with intelligent cleaning:

| API Field | Course Field | Transformation |
|-----------|-------------|----------------|
| `club_name` + `course_name` | `name` | Smart name combination with abbreviation expansion |
| `location.address` | `address` | Full street address |
| `location.city` | `city` | City name |
| `location.state` | `state` | State/province code |
| `location.country` | `country` | Normalized country code |
| `location.address` | `postal_code` | Extracted via regex |
| `location.latitude` | `latitude` | GPS coordinates |
| `location.longitude` | `longitude` | GPS coordinates |
| `tees[0].course_rating` | `course_rating` | From primary tee set |
| `tees[0].slope_rating` | `slope_rating` | From primary tee set |
| `tees[0].par_total` | `par` | From primary tee set |
| `tees[0].total_yards` | `total_yardage` | From primary tee set |

### Data Cleaning Features

**Automatic Name Cleaning:**
- **Abbreviation Expansion**: "Buninyong Gc" → "Buninyong Golf Course"
- **Duplicate Removal**: "Club Name - Club Name" → "Club Name"
- **Smart Combination**: Avoid redundant club/course names

**Supported Abbreviations:**
- `Gc/GC` → Golf Course/Golf Club
- `Cc/CC` → Country Club  
- `G&CC` → Golf & Country Club
- `RC/Rc` → Resort & Club
- `GL/Gl` → Golf Links
- `GR/Gr` → Golf Resort

**Duplicate Detection:**
- By external ID (most reliable)
- By exact name and location
- By proximity (within 1km) and similar name

## Database Schema

### New Fields Added to `courses` Table

```sql
ALTER TABLE courses ADD COLUMN external_id VARCHAR;
ALTER TABLE courses ADD COLUMN external_source VARCHAR;
ALTER TABLE courses ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE courses ADD COLUMN sync_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN external_data TEXT;
```

### Indexes

```sql
CREATE INDEX idx_courses_external_id ON courses(external_id);
CREATE INDEX idx_courses_external_source ON courses(external_source);
CREATE INDEX idx_courses_last_synced_at ON courses(last_synced_at);
CREATE INDEX idx_courses_sync_enabled ON courses(sync_enabled);
```

## Course Model Enhancements

### New Scopes

```ruby
Course.sync_enabled              # Courses with sync enabled
Course.from_external_source(src) # Courses from specific API
Course.needs_sync               # Courses needing refresh (>1 week old)
Course.synced_recently          # Courses synced in last 24 hours
```

### New Methods

```ruby
course.from_external_api?       # Boolean: has external_source
course.needs_sync?              # Boolean: needs refresh
course.mark_as_synced!          # Update last_synced_at
course.update_from_external_data!(data) # Update from API data
```

## Background Jobs

### CoursesSyncJob

```ruby
# Enqueue initial sync
CoursesSyncJob.perform_later('initial')

# Enqueue update sync  
CoursesSyncJob.perform_later('update')

# Enqueue with options
CoursesSyncJob.perform_later('initial', { 'limit' => 100 })
```

### Scheduled Jobs

#### Method 1: Cron Jobs (Most Reliable)

Add to your system crontab:

```bash
# Daily sync - updates courses needing refresh
0 2 * * * cd /path/to/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update >> log/sync.log 2>&1

# Weekly maintenance - comprehensive sync  
0 3 * * 0 cd /path/to/fairway-api && RAILS_ENV=production bundle exec rake courses:sync:update >> log/sync.log 2>&1
```

#### Method 2: Recurring Jobs (If Supported)

If `SolidQueue::RecurringJob` is available, configured in `config/recurring_jobs.yml`:

```yaml
courses_daily_sync:
  class: CoursesSyncJob
  args: ['update']
  schedule: "0 2 * * *"  # Daily at 2 AM
  
courses_weekly_maintenance:
  class: CoursesSyncJob
  args: ['update', { comprehensive: true }]
  schedule: "0 3 * * 0"  # Weekly on Sunday at 3 AM
```

#### Method 3: Manual Triggering

```bash
# Enqueue background jobs manually
rails runner "CoursesSyncJob.perform_later('update')"

# Or run directly via rake
bundle exec rake courses:sync:update
```

## Error Handling

### Common Issues

1. **API Rate Limits**
   - Service automatically respects rate limits with delays
   - Upgrade API tier for faster sync

2. **Network Failures**  
   - Automatic retry with exponential backoff
   - Failed syncs logged for manual review

3. **Data Quality**
   - Invalid coordinates are skipped
   - Required fields validated before save
   - Malformed data logged for investigation

### Monitoring

Check logs for sync operations:

```bash
# Development
tail -f log/development.log | grep CoursesSyncService

# Production  
tail -f log/production.log | grep CoursesSyncService
```

## Testing

Run the test suite:

```bash
# All course sync tests
rails test test/services/courses_sync_service_test.rb
rails test test/models/course_test.rb  
rails test test/jobs/courses_sync_job_test.rb

# Integration tests
rails test test/integration/
```

## Performance Considerations

### Initial Sync Strategy

For production deployment:

1. **Development/Testing**: Use free tier with limits
2. **Production Launch**: Upgrade to Pro tier for faster initial sync
3. **Maintenance**: Can downgrade to free tier after initial population

### Database Optimization

- Use database indexes on sync-related fields
- Consider partitioning by `external_source` for large datasets  
- Regular cleanup of outdated `external_data` JSON

### Memory Usage

- Batch processing limits memory usage
- Consider increasing batch size for powerful servers
- Monitor memory usage during initial sync

## Security

### API Key Management

- Store API keys in Rails credentials (encrypted)
- Use different keys for development/production
- Rotate keys periodically
- Monitor API usage for unusual activity

### Data Validation

- All external data validated before database save
- Malicious data filtered out
- Raw API responses stored for audit trail

## Deployment Recommendations

### Development Environment
- Use manual rake tasks or on-demand background jobs
- Test with limited course imports: `rake courses:sync:initial[10]`
- Use free API tier (300 requests/day)

### Staging Environment  
- Set up cron jobs for automated sync testing
- Use Pro API tier if needed for faster testing
- Monitor sync logs regularly

### Production Environment
- **Recommended**: Cron jobs for reliability
- **Alternative**: Recurring background jobs if supported
- Use Pro API tier ($6.99/month) for faster initial population
- Set up log rotation for sync logs
- Monitor API usage and costs

## Troubleshooting

### Common Commands

```bash
# Check if courses need sync
Course.needs_sync.count

# Check last sync times  
Course.order(:last_synced_at).limit(10).pluck(:name, :last_synced_at)

# Manual sync single course
CoursesSyncService.new.sync_course_by_external_id('12345')

# Reset sync status (use carefully)
Course.update_all(last_synced_at: nil, sync_enabled: true)

# Test API connectivity
rails console
> service = CoursesSyncService.new
> service.sync_stats
```

### Debugging Sync Issues

1. **Check API Key**: Verify in Rails credentials
   ```bash
   rails credentials:show
   ```

2. **Test API Connection**: 
   ```bash
   rails console
   > require 'net/http'
   > uri = URI('https://golfcourseapi.com/api/courses')
   > Net::HTTP.get_response(uri)
   ```

3. **Check Logs**:
   ```bash
   tail -f log/production.log | grep CoursesSyncService
   tail -f log/sync.log
   ```

4. **Verify Background Jobs**:
   ```bash
   rails console
   > ActiveJob::Base.queue_adapter
   > SolidQueue::Job.count
   ```

### Support

For issues:
1. Check application logs (`log/production.log`, `log/sync.log`)
2. Verify API key configuration with `rails credentials:show`
3. Test API connectivity manually (see debugging section)
4. Review sync statistics with `rake courses:sync:status`
5. Check cron job execution: `tail -f /var/log/cron.log` (on Linux)
6. Verify database migrations: `rails db:migrate:status`