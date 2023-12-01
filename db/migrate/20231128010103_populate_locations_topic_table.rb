# frozen_string_literal: true
class PopulateLocationsTopicTable < ActiveRecord::Migration[7.0]
  def up
    DB.exec <<~SQL
      INSERT INTO locations_topic (topic_id, latitude, longitude, name, street, district, city, state, postalcode, country, countrycode, international_code, locationtype, boundingbox, updated_at, created_at) (
        SELECT
        tc.topic_id,
        (tc.value::json->'geo_location'->>'lat')::FLOAT,
        (tc.value::json->'geo_location'->>'lon')::FLOAT,
        tc.value::json->'geo_location'->>'name',
        tc.value::json->'geo_location'->>'street',
        tc.value::json->'geo_location'->>'district',
        tc.value::json->'geo_location'->>'city',
        tc.value::json->'geo_location'->>'state',
        tc.value::json->'geo_location'->>'postalcode',
        tc.value::json->'geo_location'->>'country',
        tc.value::json->'geo_location'->>'countrycode',
        tc.value::json->'geo_location'->>'international_code',
        tc.value::json->'geo_location'->>'type',
        ARRAY[
          (tc.value::json->'geo_location'->'boundingbox'->>0)::FLOAT,
          (tc.value::json->'geo_location'->'boundingbox'->>1)::FLOAT,
          (tc.value::json->'geo_location'->'boundingbox'->>2)::FLOAT,
          (tc.value::json->'geo_location'->'boundingbox'->>3)::FLOAT
        ],
        tc.updated_at,
        tc.created_at
      FROM topic_custom_fields tc
      WHERE tc.name = 'location'
      AND tc.value NOT IN ('"{}"', '{}', '')
      AND tc.value::json->'geo_location'->>'lat' IS NOT NULL
      AND tc.value::json->'geo_location'->>'lon' IS NOT NULL
      )
      ON CONFLICT DO NOTHING
    SQL
  end

  def down
    ::Locations::TopicLocation.delete_all
  end
end
