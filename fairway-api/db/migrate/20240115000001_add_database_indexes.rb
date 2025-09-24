class AddDatabaseIndexes < ActiveRecord::Migration[7.1]
  def up
    # Skipping this migration to avoid conflicts with existing indexes
    return
    # User indexes for authentication and lookups (email, handicap_index indexes already exist from CreateUsers)
    add_index :users, [:created_at, :id] # For pagination
    add_index :users, [:verified_rounds, :rounds_played] # For stats queries
    
    # Round indexes for performance
    add_index :rounds, [:user_id, :started_at], name: 'index_rounds_user_started'
    add_index :rounds, [:user_id, :completed_at], name: 'index_rounds_user_completed'
    add_index :rounds, [:course_id, :started_at], name: 'index_rounds_course_started'
    add_index :rounds, [:is_verified, :completed_at], name: 'index_rounds_verified_completed'
    add_index :rounds, :fraud_risk_score, where: "fraud_risk_score > 50"
    add_index :rounds, [:user_id, :is_verified, :completed_at], name: 'index_rounds_user_verified_completed'
    
    # Course indexes for location searches
    add_index :courses, [:latitude, :longitude], name: 'index_courses_location'
    add_index :courses, :name # For name searches
    add_index :courses, [:city, :state] # For location searches
    add_index :courses, :slope_rating # For handicap calculations
    
    # Hole scores indexes for statistics
    add_index :hole_scores, [:round_id, :hole_number], unique: true
    add_index :hole_scores, [:round_id, :strokes] # For round totals
    add_index :hole_scores, [:round_id, :putts] # For putting stats
    
    # Holes indexes
    add_index :holes, [:course_id, :hole_number], unique: true
    add_index :holes, [:course_id, :par] # For course statistics
    
    # Round attestations indexes
    add_index :round_attestations, [:round_id, :attester_id], unique: true
    add_index :round_attestations, [:attester_id, :requested_at], name: 'index_attestations_attester_requested'
    add_index :round_attestations, [:round_id, :is_approved], name: 'index_attestations_round_approved'
    add_index :round_attestations, :attested_at, where: "attested_at IS NOT NULL"
    
    # Add composite indexes for common query patterns
    add_index :rounds, [:user_id, :is_verified, :completed_at, :fraud_risk_score], 
              name: 'index_rounds_user_verification_composite'
    
    add_index :users, [:handicap_index, :verified_rounds, :created_at], 
              name: 'index_users_handicap_composite'
  end

  def down
    # Skipping this migration 
    return
    # Remove indexes in reverse order
    remove_index :users, name: 'index_users_handicap_composite'
    remove_index :rounds, name: 'index_rounds_user_verification_composite'
    
    remove_index :round_attestations, :attested_at
    remove_index :round_attestations, name: 'index_attestations_round_approved'
    remove_index :round_attestations, name: 'index_attestations_attester_requested'
    remove_index :round_attestations, [:round_id, :attester_id]
    
    remove_index :holes, [:course_id, :par]
    remove_index :holes, [:course_id, :hole_number]
    
    remove_index :hole_scores, [:round_id, :putts]
    remove_index :hole_scores, [:round_id, :strokes]
    remove_index :hole_scores, [:round_id, :hole_number]
    
    remove_index :courses, :slope_rating
    remove_index :courses, [:city, :state]
    remove_index :courses, :name
    remove_index :courses, name: 'index_courses_location'
    
    remove_index :rounds, name: 'index_rounds_user_verified_completed'
    remove_index :rounds, :fraud_risk_score
    remove_index :rounds, name: 'index_rounds_verified_completed'
    remove_index :rounds, name: 'index_rounds_course_started'
    remove_index :rounds, name: 'index_rounds_user_completed'
    remove_index :rounds, name: 'index_rounds_user_started'
    
    remove_index :users, [:verified_rounds, :rounds_played]
    remove_index :users, [:created_at, :id]
  end
end