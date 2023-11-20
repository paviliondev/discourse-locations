# frozen_string_literal: true

module Locations
  class UserLocationProcess

    def self.upsert(user_id)
      user = User.find_by(id: user_id)

      return if user.nil? || !user.custom_fields['geo_location'].present? ||
        user.custom_fields['geo_location'].blank? || !user.custom_fields['geo_location']['lat'].present? ||
        !user.custom_fields['geo_location']['lon'].present?

      ::Locations::UserLocation.upsert({
          user_id: user_id,
          longitude: user.custom_fields['geo_location']['lon'],
          latitude: user.custom_fields['geo_location']['lat'],
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

    def self.search_from_user_location(user_id, distance)
      user_location = UserLocation.find_by(user_id: user_id)

      return [] if !user_location.geocoded?

      user_location.nearbys(distance, select_distance: false, select_bearing: false).pluck(:user_id)
    end

    def self.search_from_location(lat, lon)

      return [] if lon.nil? || lat.nil?

      UserLocation.near([lon.to_f, lat.to_f], 50).pluck(:user_id)
    end
  end
end
