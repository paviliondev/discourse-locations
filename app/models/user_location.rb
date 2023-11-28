# frozen_string_literal: true
require "geocoder"

module ::Locations
  class UserLocation < ActiveRecord::Base
    extend Geocoder::Model::ActiveRecord
    self.table_name = 'locations_user'

    belongs_to :user
    validates :user_id, presence: true, uniqueness: true
    validates :longitude, presence: true
    validates :latitude, presence: true
    geocoded_by :address
    after_validation :geocode
    reverse_geocoded_by :latitude, :longitude
    after_validation :reverse_geocode

    def address
      [street, city, state, postalcode, country].compact.join(', ')
    end
  end
end
