# frozen_string_literal: true

module Locations
  class TopicLocationProcess

    def self.upsert(topic_id)
      topic = Topic.find_by(id: topic_id)

      return if topic.nil? || !topic.custom_fields['location'].present? ||
        topic.custom_fields['location']['geo_location'].blank? || !topic.custom_fields['location']['geo_location']['lat'].present? ||
        !topic.custom_fields['location']['geo_location']['lon'].present?

      ::Locations::TopicLocation.upsert({
          topic_id: topic_id,
          coords: "[#{topic.custom_fields['location']['geo_location']['lat']},#{topic.custom_fields['location']['geo_location']['lon']}]",
          name: topic.custom_fields['location']['name'] || nil,
          address: topic.custom_fields['location']['address'] || nil,
          street: topic.custom_fields['location']['street'] || nil,
          city: topic.custom_fields['location']['city'] || nil,
          state: topic.custom_fields['location']['state'] || nil,
          postalcode: topic.custom_fields['location']['postalcode'] || nil,
          country: topic.custom_fields['location']['country'] || nil,
          countrycode: topic.custom_fields['location']['countrycode'] || nil,
          locationtype: topic.custom_fields['location']['type'] || nil,
          boundingbox: topic.custom_fields['location']['boundingbox'] || nil,
        },
        on_duplicate: :update, unique_by: :topic_id
      )
    end

    def self.topic_search_from_topic_location(topic_id)
      topic = Topic.find_by(id: topic_id)

      return [] if topic.nil? || !topic.custom_fields['geo_location'].present? ||
      topic.custom_fields['geo_location'].blank? || !topic.custom_fields['geo_location']['lat'].present? ||
      !topic.custom_fields['geo_location']['lon'].present?

      query_vector = [topic.custom_fields['geo_location']['lat'].to_i, topic.custom_fields['geo_location']['lon'].to_i]

      begin
        search_result_topics =
          DB.query(<<~SQL, query_vector: query_vector, topic_id: topic_id, limit: 16).map(
            SELECT
              topic_id, t.title, t.slug, t.excerpt
            FROM
              locations_topic
            INNER JOIN
              topics t
            ON t.id = topic_id
            WHERE topic_id <> :topic_id
            ORDER BY
              coords <-> '[:query_vector]'
            LIMIT :limit
          SQL
          )
      rescue PG::Error => e
        Rails.logger.error(
          "Error #{e} querying topic locations for search #{query}",
        )
        raise MissingEmbeddingError
      end
      search_result_topics
    end

    def self.topic_search_from_location(lat, lon)

      return [] if lon.nil? || lat.nil?

      query_vector = [lat.to_i, lon.to_i]

      begin
        search_result_topics =
          DB.query(<<~SQL, query_vector: query_vector, limit: 16).map(
            SELECT
              topic_id, t.title, t.slug, t.excerpt
            FROM
              locations_topic
            INNER JOIN
              topics t
            ON t.id = topic_id
            ORDER BY
              coords <-> '[:query_vector]'
            LIMIT :limit
          SQL
          )
      rescue PG::Error => e
        Rails.logger.error(
          "Error #{e} querying topic locations for search #{query}",
        )
        raise MissingEmbeddingError
      end
      search_result_topics
    end
  end
end
