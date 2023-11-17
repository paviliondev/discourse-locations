class CreateLocationsUserLocationIndex < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL
      CREATE INDEX pgv_hnsw_index_on_locations_user_location ON locations_user_location USING hnsw (geo_location vector_l2_ops)
      WITH (m = 16, ef_construction = 32);
    SQL
  end

  def down
    execute <<-SQL
      DROP INDEX IF EXISTS CREATE INDEX pgv_hnsw_index_on_locations_user_location;
    SQL
  end
end
