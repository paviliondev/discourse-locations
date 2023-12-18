# frozen_string_literal: true

module ::Locations
  class TopicLocation < ActiveRecord::Base
    extend Geocoder::Model::ActiveRecord
    self.table_name = 'locations_topic'

    belongs_to :topic
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
