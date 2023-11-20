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
          longitude: user.custom_fields['location']['geo_location']['lon'],
          latitude: user.custom_fields['location']['geo_location']['lat'],
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

    def self.topic_search_from_topic_location(topic_id, distance)
      topic_location = TopicLocation.find_by(topic_id: topic_id)

      return [] if !topic_location.geocoded?

      topic_location.nearbys(distance, units: :km, select_distance: false, select_bearing: false).pluck(:topic_id)
    end

    def self.topic_search_from_location(lat, lon, distance)

      return [] if lon.nil? || lat.nil?

      TopicLocation.near([lon.to_f, lat.to_f], distance, units: :km).pluck(:topic_id)
    end
  end
end
