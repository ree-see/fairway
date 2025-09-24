class AddDistanceToHoles < ActiveRecord::Migration[8.0]
  def change
    add_column :holes, :distance, :integer
    add_index :holes, :distance
    
    # Populate distance field with white tee yardage (most common for regular play)
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE holes 
          SET distance = COALESCE(yardage_white, yardage_blue, yardage_black, yardage_red, yardage_gold)
          WHERE distance IS NULL;
        SQL
      end
    end
  end
end