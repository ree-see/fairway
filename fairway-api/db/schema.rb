# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_24_181103) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "courses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.text "address"
    t.string "city"
    t.string "state"
    t.string "country", default: "US"
    t.string "postal_code"
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.decimal "course_rating", precision: 4, scale: 1
    t.integer "slope_rating"
    t.integer "par"
    t.integer "total_yardage"
    t.string "phone"
    t.string "website"
    t.text "description"
    t.boolean "private_course", default: false
    t.boolean "active", default: true
    t.integer "geofence_radius", default: 500
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "external_id"
    t.string "external_source"
    t.datetime "last_synced_at"
    t.boolean "sync_enabled"
    t.text "external_data"
    t.index ["active", "latitude", "longitude"], name: "index_courses_for_location_search", where: "(active = true)"
    t.index ["active"], name: "index_courses_on_active"
    t.index ["city"], name: "index_courses_on_city"
    t.index ["course_rating", "slope_rating"], name: "index_courses_on_ratings"
    t.index ["latitude", "longitude", "active"], name: "index_courses_on_location_and_active"
    t.index ["latitude", "longitude"], name: "index_courses_on_latitude_and_longitude"
    t.index ["name", "active"], name: "index_courses_on_name_and_active"
    t.index ["name"], name: "index_courses_on_name"
  end

  create_table "hole_scores", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "round_id", null: false
    t.uuid "hole_id", null: false
    t.integer "hole_number", limit: 2, null: false
    t.integer "strokes", limit: 2, null: false
    t.integer "putts", limit: 2
    t.boolean "fairway_hit"
    t.boolean "green_in_regulation"
    t.integer "penalties", limit: 2, default: 0
    t.integer "drive_distance"
    t.integer "approach_distance"
    t.json "shot_coordinates"
    t.decimal "strokes_gained_total", precision: 4, scale: 2
    t.decimal "strokes_gained_driving", precision: 4, scale: 2
    t.decimal "strokes_gained_approach", precision: 4, scale: 2
    t.decimal "strokes_gained_short", precision: 4, scale: 2
    t.decimal "strokes_gained_putting", precision: 4, scale: 2
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "up_and_down"
    t.index ["fairway_hit"], name: "index_hole_scores_on_fairway_hit"
    t.index ["green_in_regulation"], name: "index_hole_scores_on_green_in_regulation"
    t.index ["hole_id"], name: "index_hole_scores_on_hole_id"
    t.index ["round_id", "hole_number"], name: "index_hole_scores_on_round_and_number", unique: true
    t.index ["round_id", "hole_number"], name: "index_hole_scores_on_round_id_and_hole_number", unique: true
    t.index ["round_id"], name: "index_hole_scores_on_round_id"
    t.index ["strokes", "fairway_hit", "green_in_regulation"], name: "index_hole_scores_on_performance"
    t.index ["strokes"], name: "index_hole_scores_on_strokes"
    t.index ["up_and_down"], name: "index_hole_scores_on_up_and_down"
  end

  create_table "holes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "course_id", null: false
    t.integer "number", limit: 2, null: false
    t.integer "par", limit: 2, null: false
    t.integer "handicap", limit: 2, null: false
    t.integer "yardage_black"
    t.integer "yardage_blue"
    t.integer "yardage_white"
    t.integer "yardage_red"
    t.integer "yardage_gold"
    t.decimal "tee_latitude", precision: 10, scale: 6
    t.decimal "tee_longitude", precision: 10, scale: 6
    t.decimal "green_latitude", precision: 10, scale: 6
    t.decimal "green_longitude", precision: 10, scale: 6
    t.text "description"
    t.string "shape"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "distance"
    t.index ["course_id", "handicap"], name: "index_holes_on_course_and_handicap"
    t.index ["course_id", "number"], name: "index_holes_on_course_id_and_number", unique: true
    t.index ["course_id", "par"], name: "index_holes_on_course_and_par"
    t.index ["course_id"], name: "index_holes_on_course_id"
    t.index ["distance"], name: "index_holes_on_distance"
    t.index ["handicap"], name: "index_holes_on_handicap"
    t.index ["par"], name: "index_holes_on_par"
  end

  create_table "round_attestations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "round_id", null: false
    t.uuid "attester_id", null: false
    t.boolean "is_approved", null: false
    t.text "comments"
    t.datetime "attested_at", null: false
    t.uuid "attester_round_id"
    t.datetime "requested_at", null: false
    t.string "request_method", default: "push_notification"
    t.decimal "attester_latitude", precision: 10, scale: 6
    t.decimal "attester_longitude", precision: 10, scale: 6
    t.boolean "location_verified", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["attested_at"], name: "index_round_attestations_on_attested_at"
    t.index ["attester_id", "attested_at"], name: "index_attestations_on_attester_and_date"
    t.index ["attester_id"], name: "index_round_attestations_on_attester_id"
    t.index ["attester_round_id"], name: "index_round_attestations_on_attester_round_id"
    t.index ["is_approved"], name: "index_round_attestations_on_is_approved"
    t.index ["requested_at", "attested_at"], name: "index_attestations_on_request_response_time"
    t.index ["requested_at"], name: "index_round_attestations_on_requested_at"
    t.index ["round_id", "attester_id"], name: "index_round_attestations_on_round_id_and_attester_id", unique: true
    t.index ["round_id", "is_approved"], name: "index_attestations_on_round_and_approval"
    t.index ["round_id"], name: "index_round_attestations_on_round_id"
  end

  create_table "rounds", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "course_id", null: false
    t.datetime "started_at", null: false
    t.datetime "completed_at"
    t.datetime "submitted_at"
    t.string "tee_color", default: "white", null: false
    t.decimal "course_rating", precision: 4, scale: 1
    t.integer "slope_rating"
    t.integer "total_strokes"
    t.integer "total_putts"
    t.decimal "score_differential", precision: 4, scale: 1
    t.string "weather_conditions"
    t.integer "temperature"
    t.integer "wind_speed"
    t.string "wind_direction"
    t.boolean "is_verified", default: false
    t.boolean "is_provisional", default: true
    t.integer "verification_count", default: 0
    t.decimal "fraud_risk_score", precision: 5, scale: 2, default: "0.0"
    t.text "fraud_risk_factors"
    t.boolean "location_verified", default: false
    t.decimal "start_latitude", precision: 10, scale: 6
    t.decimal "start_longitude", precision: 10, scale: 6
    t.integer "fairways_hit", default: 0
    t.integer "greens_in_regulation", default: 0
    t.integer "total_penalties", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["completed_at", "is_verified", "verification_count"], name: "index_rounds_needing_verification", where: "((completed_at IS NOT NULL) AND (is_verified = false))"
    t.index ["course_id", "started_at", "is_verified"], name: "index_rounds_on_course_date_verified"
    t.index ["course_id", "started_at"], name: "index_rounds_on_course_id_and_started_at"
    t.index ["course_id"], name: "index_rounds_on_course_id"
    t.index ["fraud_risk_score", "completed_at"], name: "index_rounds_high_fraud_risk", where: "((fraud_risk_score > 50.0) AND (completed_at IS NOT NULL))"
    t.index ["fraud_risk_score"], name: "index_rounds_on_fraud_risk_score"
    t.index ["is_verified", "fraud_risk_score"], name: "index_rounds_on_verification_and_fraud"
    t.index ["is_verified"], name: "index_rounds_on_is_verified"
    t.index ["started_at"], name: "index_rounds_on_started_at"
    t.index ["user_id", "completed_at", "is_verified", "score_differential"], name: "index_rounds_for_verified_handicap", where: "((completed_at IS NOT NULL) AND (is_verified = true) AND (score_differential IS NOT NULL))"
    t.index ["user_id", "completed_at", "score_differential"], name: "index_rounds_for_handicap_calc", where: "((completed_at IS NOT NULL) AND (score_differential IS NOT NULL))"
    t.index ["user_id", "completed_at"], name: "index_rounds_on_user_completed", where: "(completed_at IS NOT NULL)"
    t.index ["user_id", "started_at", "is_verified"], name: "index_rounds_on_user_date_verified"
    t.index ["user_id", "started_at"], name: "index_rounds_on_user_id_and_started_at"
    t.index ["user_id"], name: "index_rounds_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "password_digest", null: false
    t.decimal "handicap_index", precision: 4, scale: 1
    t.decimal "verified_handicap", precision: 4, scale: 1
    t.string "phone"
    t.date "date_of_birth"
    t.string "preferred_tees"
    t.boolean "email_verified", default: false
    t.datetime "email_verified_at"
    t.integer "rounds_played", default: 0
    t.integer "verified_rounds", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_users_on_created_at"
    t.index ["email", "email_verified"], name: "index_users_on_email_and_verified"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["handicap_index", "verified_handicap"], name: "index_users_on_handicaps"
    t.index ["handicap_index"], name: "index_users_on_handicap_index"
    t.index ["verified_handicap"], name: "index_users_on_verified_handicap"
  end

  add_foreign_key "hole_scores", "holes"
  add_foreign_key "hole_scores", "rounds"
  add_foreign_key "holes", "courses"
  add_foreign_key "round_attestations", "rounds"
  add_foreign_key "round_attestations", "rounds", column: "attester_round_id"
  add_foreign_key "round_attestations", "users", column: "attester_id"
  add_foreign_key "rounds", "courses"
  add_foreign_key "rounds", "users"
end
