# frozen_string_literal: true

module Locations
  class UserVectorProcess

    def self.upsert(user_id)
      user = User.find_by(id: user_id)

      return if user.nil? || !user.custom_fields['geo_location'].present? ||
        user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
        !user.custom_fields['geo_location']['lon'].present?

      ::Locations::UserLocation.upsert({
          user_id: user_id,
          coords: "[#{user.custom_fields['geo_location']['lat']},#{user.custom_fields['geo_location']['lon']}]",
          address: user.custom_fields['geo_location']['address'] || nil,
          street: user.custom_fields['geo_location']['street'] || nil,
          city: user.custom_fields['geo_location']['city'] || nil,
          state: user.custom_fields['geo_location']['state'] || nil,
          postalcode: user.custom_fields['geo_location']['postalcode'] || nil,
          country: user.custom_fields['geo_location']['country'] || nil,
          countrycode: user.custom_fields['geo_location']['countrycode'] || nil,
          locationtype: user.custom_fields['geo_location']['type'] || nil,
          boundingbox: user.custom_fields['geo_location']['boundingbox'] || nil,
        },
        on_duplicate: :update, unique_by: :user_id
      )
    end

    def self.user_search_from_user(user_id)
      user = User.find_by(id: user_id)

      return [] if user.nil? || !user.custom_fields['geo_location'].present? ||
      user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
      !user.custom_fields['geo_location']['lon'].present?

      query_vector = [user.custom_fields['geo_location']['lat'].to_i, user.custom_fields['geo_location']['lon'].to_i]

      begin
        search_result_users =
          DB.query(<<~SQL, query_vector: query_vector, user_id: user_id, limit: 16).map(
            SELECT
              user_id, u.username
            FROM
              locations_user
            INNER JOIN
              users u
            ON u.id = user_id
            WHERE user_id <> :user_id
            ORDER BY
              coords <-> '[:query_vector]'
            LIMIT :limit
          SQL
          )
      rescue PG::Error => e
        Rails.logger.error(
          "Error #{e} querying user locations for search #{query}",
        )
        raise MissingEmbeddingError
      end
      search_result_users
    end

    def self.user_search_from_location(lat, lon)

      return [] if lon.nil? || lat.nil?

      query_vector = [lat.to_i, lon.to_i]

      begin
        search_result_users =
          DB.query(<<~SQL, query_vector: query_vector, limit: 16).map(
            SELECT
              user_id, u.username
            FROM
              locations_user
            INNER JOIN
              users u
            ON u.id = user_id
            ORDER BY
              coords <-> '[:query_vector]'
            LIMIT :limit
          SQL
          )
      rescue PG::Error => e
        Rails.logger.error(
          "Error #{e} querying user locations for search #{query}",
        )
        raise MissingEmbeddingError
      end
      search_result_users
    end
  end
end
