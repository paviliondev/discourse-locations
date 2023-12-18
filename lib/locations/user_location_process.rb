# frozen_string_literal: true

module ::Locations
  class UserLocationProcess

    def self.upsert(user_id)
      user = User.find_by(id: user_id)

      return if user.nil? || !user.custom_fields['geo_location'].present? ||
        user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
        !user.custom_fields['geo_location']['lon'].present?

      ::Locations::UserLocation.upsert({
          user_id: user_id,
          latitude: user.custom_fields['geo_location']['lat'],
          longitude: user.custom_fields['geo_location']['lon'],
          street: user.custom_fields['geo_location']['street'] || nil,
          district: user.custom_fields['geo_location']['district'] || nil,
          city: user.custom_fields['geo_location']['city'] || nil,
          state: user.custom_fields['geo_location']['state'] || nil,
          postalcode: user.custom_fields['geo_location']['postalcode'] || nil,
          country: user.custom_fields['geo_location']['country'] || nil,
          countrycode: user.custom_fields['geo_location']['countrycode'] || nil,
          international_code: user.custom_fields['geo_location']['international_code'] || nil,
          locationtype: user.custom_fields['geo_location']['type'] || nil,
          boundingbox: user.custom_fields['geo_location']['boundingbox'] || nil,
        },
        on_duplicate: :update, unique_by: :user_id
      )
    end

    def self.delete(user_id)
      location = ::Locations::UserLocation.find_by(user_id: user_id)
      location.delete if location
    end

    def self.search_users_from_user_location(user_id, distance)
      user_location = UserLocation.find_by(user_id: user_id)

      return [] if !user_location || !user_location.geocoded?

      user_location.nearbys(distance, units: :km, select_distance: false, select_bearing: false).joins(:user).pluck(:user_id)
    end

    def self.search_users_from_location(lat, lon, distance)

      return [] if lat.nil? || lon.nil?

      UserLocation.near([lat.to_f, lon.to_f], distance.to_f, units: :km, select_distance: false, select_bearing: false).joins(:user).pluck(:user_id)
    end

    def self.get_user_distance_from_location(user_id, lat, lon)
      user_location = UserLocation.find_by(user_id: user_id)

      return nil if !user_location || !user_location.geocoded?

      user_location.distance_to([lat, lon], :km)
    end

    def self.search_topics_from_user_location(user_id, distance)
      user_location = UserLocation.find_by(user_id: user_id)

      return [] if !user_location || !user_location.geocoded?

      TopicLocation.near([user_location.latitude, user_location.longitude], distance, units: :km, select_distance: false, select_bearing: false).joins(:topic).pluck(:topic_id)
    end

    def self.search_users_from_topic_location(topic_id, distance)
      topic_location = TopicLocation.find_by(user_id: topic_id)

      return [] if !topic_location || !topic_location.geocoded?

      UserLocation.near([topic_location.latitude, topic_location.longitude], distance, units: :km, select_distance: false, select_bearing: false).joins(:user).pluck(:user_id)
    end
  end
end
