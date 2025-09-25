class AddThirdPartyFieldsToCourses < ActiveRecord::Migration[8.0]
  def change
    add_column :courses, :external_id, :string
    add_column :courses, :external_source, :string
    add_column :courses, :last_synced_at, :datetime
    add_column :courses, :sync_enabled, :boolean
    add_column :courses, :external_data, :text
  end
end
