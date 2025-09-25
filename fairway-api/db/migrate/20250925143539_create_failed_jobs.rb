class CreateFailedJobs < ActiveRecord::Migration[8.0]
  def change
    create_table :failed_jobs do |t|
      t.string :job_class, null: false
      t.string :job_id, null: false
      t.text :arguments
      t.string :error_class, null: false
      t.text :error_message, null: false
      t.text :error_backtrace
      t.datetime :failed_at, null: false
      t.integer :executions, null: false, default: 0
      t.datetime :retried_at

      t.timestamps

      t.index :job_id, unique: true
      t.index :job_class
      t.index :error_class
      t.index :failed_at
      t.index :retried_at
    end
  end
end
