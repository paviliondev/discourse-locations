# frozen_string_literal: true

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

# == Schema Information
#
# Table name: locations_user
#
#  id                 :bigint           not null, primary key
#  user_id            :integer          not null
#  latitude           :float            not null
#  longitude          :float            not null
#  street             :string
#  district           :string
#  city               :string
#  state              :string
#  postalcode         :string
#  country            :string
#  countrycode        :string
#  international_code :string
#  locationtype       :string
#  boundingbox        :float            is an Array
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_locations_user_on_user_id  (user_id) UNIQUE
#
