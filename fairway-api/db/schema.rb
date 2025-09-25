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

ActiveRecord::Schema[8.0].define(version: 2025_09_25_153047) do
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

  create_table "failed_jobs", force: :cascade do |t|
    t.string "job_class", null: false
    t.string "job_id", null: false
    t.text "arguments"
    t.string "error_class", null: false
    t.text "error_message", null: false
    t.text "error_backtrace"
    t.datetime "failed_at", null: false
    t.integer "executions", default: 0, null: false
    t.datetime "retried_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["error_class"], name: "index_failed_jobs_on_error_class"
    t.index ["failed_at"], name: "index_failed_jobs_on_failed_at"
    t.index ["job_class"], name: "index_failed_jobs_on_job_class"
    t.index ["job_id"], name: "index_failed_jobs_on_job_id", unique: true
    t.index ["retried_at"], name: "index_failed_jobs_on_retried_at"
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

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
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
    t.integer "sign_in_count"
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
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
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
end
