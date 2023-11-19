class CreateLocationsTopicIndex < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL
      CREATE INDEX pgv_hnsw_index_on_locations_topic ON locations_topic USING hnsw (coords vector_l2_ops)
      WITH (m = 16, ef_construction = 32);
    SQL
  end

  def down
    execute <<-SQL
      DROP INDEX IF EXISTS pgv_hnsw_index_on_locations_topic;
    SQL
  end
end
