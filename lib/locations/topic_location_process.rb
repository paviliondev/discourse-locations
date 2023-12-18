# frozen_string_literal: true

module ::Locations
  class TopicLocationProcess

    def self.upsert(topic_id)
      topic = Topic.find_by(id: topic_id)

      return if topic.nil? || !topic.custom_fields['location'].present? ||
        topic.custom_fields['location']['geo_location'].blank? || !topic.custom_fields['location']['geo_location']['lat'].present? ||
        !topic.custom_fields['location']['geo_location']['lon'].present?

      ::Locations::TopicLocation.upsert({
          topic_id: topic_id,
          latitude: topic.custom_fields['location']['geo_location']['lat'],
          longitude: topic.custom_fields['location']['geo_location']['lon'],
          name: topic.custom_fields['location']['name'] || nil,
          street: topic.custom_fields['location']['street'] || nil,
          district: topic.custom_fields['location']['district'] || nil,
          city: topic.custom_fields['location']['city'] || nil,
          state: topic.custom_fields['location']['state'] || nil,
          postalcode: topic.custom_fields['location']['postalcode'] || nil,
          country: topic.custom_fields['location']['country'] || nil,
          countrycode: topic.custom_fields['location']['countrycode'] || nil,
          international_code: topic.custom_fields['location']['international_code'] || nil,
          locationtype: topic.custom_fields['location']['type'] || nil,
          boundingbox: topic.custom_fields['location']['boundingbox'] || nil,
        },
        on_duplicate: :update, unique_by: :topic_id
      )
    end

    def self.delete(topic_id)
      location = ::Locations::TopicLocation.find_by(topic_id: topic_id)
      location.delete if location
    end

    def self.search_topics_from_topic_location(topic_id, distance)
      topic_location = TopicLocation.find_by(topic_id: topic_id)

      return [] if !topic_location || !topic_location.geocoded?

      topic_location.nearbys(distance, units: :km, select_distance: false, select_bearing: false).joins(:topic).pluck(:topic_id)
    end

    def self.search_topics_from_location(lat, lon, distance)

      return [] if lat.nil? || lon.nil?

      TopicLocation.near([lat.to_f, lon.to_f], distance, units: :km).joins(:topic).pluck(:topic_id)
    end

    def self.get_topic_distance_from_location(topic_id, lat, lon)
      topic_location = TopicLocation.find_by(topic_id: topic_id)

      return nil if !topic_location || !topic_location.geocoded?

      topic_location.distance_to([lat, lon], units: :km)
    end
  end
end
