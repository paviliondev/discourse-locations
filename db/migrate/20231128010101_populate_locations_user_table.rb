# frozen_string_literal: true
class PopulateLocationsUserTable < ActiveRecord::Migration[7.0]
  def up
    DB.exec <<~SQL
      INSERT INTO locations_user (user_id, latitude, longitude, street, district, city, state, postalcode, country, countrycode, international_code, locationtype, boundingbox, updated_at, created_at) (
        SELECT
        uc.user_id,
        (uc.value::json->>'lat')::FLOAT,
        (uc.value::json->>'lon')::FLOAT,
        uc.value::json->>'street',
        uc.value::json->>'district',
        uc.value::json->>'city',
        uc.value::json->>'state',
        uc.value::json->>'postalcode',
        uc.value::json->>'country',
        uc.value::json->>'countrycode',
        uc.value::json->>'international_code',
        uc.value::json->>'type',
        ARRAY[
          (uc.value::json->'boundingbox'->>0)::FLOAT,
          (uc.value::json->'boundingbox'->>1)::FLOAT,
          (uc.value::json->'boundingbox'->>2)::FLOAT,
          (uc.value::json->'boundingbox'->>3)::FLOAT
        ],
        uc.updated_at,
        uc.created_at
      FROM user_custom_fields uc
      WHERE uc.name = 'geo_location'
      AND uc.value NOT IN ('"{}"', '{}', '')
      AND uc.value::json->>'lat' IS NOT NULL
      AND uc.value::json->>'lon' IS NOT NULL
      )
      ON CONFLICT DO NOTHING
    SQL
  end

  def down
    ::Locations::UserLocation.delete_all
  end
end
