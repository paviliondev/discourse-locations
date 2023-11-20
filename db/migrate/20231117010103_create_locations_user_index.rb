class CreateLocationsUserIndex < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL
      CREATE INDEX gist_index_on_locations_user ON locations_user USING gist(coords)
    SQL
  end

  def down
    execute <<-SQL
      DROP INDEX IF EXISTS gist_index_on_locations_user;
    SQL
  end
end
