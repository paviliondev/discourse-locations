# frozen_string_literal: true

class Locations::UserVectorProcess

  def self.upsert(user_id)
    user = User.find_by(user_id)

    return if user.nil? || !user.custom_fields['geo_location'].present? ||
      user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
      !user.custom_fields['geo_location']['lon'].present?

      ::Location::UserLocation.upsert({ user_id: user_id, geo_location: "'[#{user.custom_fields['geo_location']['lat']},#{user.custom_fields['geo_location']['lon']}]'" }, on_duplicate: :update, unique_by: :user_id)
    end
  end

  def self.semantic_search(user_id)

      user = User.find_by(user_id)

      return [] if user.nil? || !user.custom_fields['geo_location'].present? ||
      user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
      !user.custom_fields['geo_location']['lon'].present?

      query_vector = [user.custom_fields['geo_location']['lat'], user.custom_fields['geo_location']['lon']]

      begin
        search_result_user_ids =
          DB.query(<<~SQL, query_vector: query_vector, limit: 16).map(
            SELECT
              post_id
            FROM
              locations_user_location
            ORDER BY
              geo_location <-> '[:query_vector]'
            LIMIT :limit
          SQL
            &:user_id
          )
      rescue PG::Error => e
        Rails.logger.error(
          "Error #{e} querying user locations for search #{query}",
        )
        raise MissingEmbeddingError
      end
      search_result_user_ids
  end
end

