class AddPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    # Composite indexes for common query patterns
    
    # Users - frequently queried by email and authentication status
    add_index :users, [:email, :email_verified], name: 'index_users_on_email_and_verified'
    add_index :users, [:handicap_index, :verified_handicap], name: 'index_users_on_handicaps'
    
    # Courses - location-based queries and active status
    add_index :courses, [:latitude, :longitude, :active], name: 'index_courses_on_location_and_active'
    add_index :courses, [:name, :active], name: 'index_courses_on_name_and_active'
    add_index :courses, [:course_rating, :slope_rating], name: 'index_courses_on_ratings'
    
    # Rounds - user queries and verification status
    add_index :rounds, [:user_id, :started_at, :is_verified], name: 'index_rounds_on_user_date_verified'
    add_index :rounds, [:course_id, :started_at, :is_verified], name: 'index_rounds_on_course_date_verified'
    add_index :rounds, [:is_verified, :fraud_risk_score], name: 'index_rounds_on_verification_and_fraud'
    add_index :rounds, [:user_id, :completed_at], name: 'index_rounds_on_user_completed', where: 'completed_at IS NOT NULL'
    
    # Round attestations - verification queries
    add_index :round_attestations, [:attester_id, :attested_at], name: 'index_attestations_on_attester_and_date'
    add_index :round_attestations, [:round_id, :is_approved], name: 'index_attestations_on_round_and_approval'
    add_index :round_attestations, [:requested_at, :attested_at], name: 'index_attestations_on_request_response_time'
    
    # Hole scores - round and hole lookups
    add_index :hole_scores, [:round_id, :hole_number], name: 'index_hole_scores_on_round_and_number', unique: true
    add_index :hole_scores, [:strokes, :fairway_hit, :green_in_regulation], name: 'index_hole_scores_on_performance'
    
    # Holes - course and hole number lookups
    add_index :holes, [:course_id, :par], name: 'index_holes_on_course_and_par'
    add_index :holes, [:course_id, :handicap], name: 'index_holes_on_course_and_handicap'
    
    # Performance indexes for specific golf queries
    
    # Find recent rounds for handicap calculation
    add_index :rounds, [:user_id, :completed_at, :score_differential], 
              name: 'index_rounds_for_handicap_calc',
              where: 'completed_at IS NOT NULL AND score_differential IS NOT NULL'
    
    # Find verified rounds for verified handicap
    add_index :rounds, [:user_id, :completed_at, :is_verified, :score_differential],
              name: 'index_rounds_for_verified_handicap',
              where: 'completed_at IS NOT NULL AND is_verified = true AND score_differential IS NOT NULL'
    
    # Location-based course searches (for nearby courses)
    add_index :courses, [:active, :latitude, :longitude],
              name: 'index_courses_for_location_search',
              where: 'active = true'
    
    # High fraud risk rounds for review
    add_index :rounds, [:fraud_risk_score, :completed_at],
              name: 'index_rounds_high_fraud_risk',
              where: 'fraud_risk_score > 50.0 AND completed_at IS NOT NULL'
    
    # Unverified rounds that need attestation
    add_index :rounds, [:completed_at, :is_verified, :verification_count],
              name: 'index_rounds_needing_verification',
              where: 'completed_at IS NOT NULL AND is_verified = false'
  end
end