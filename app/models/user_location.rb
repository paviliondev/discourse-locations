# frozen_string_literal: true

class ::Locations::UserLocation < ActiveRecord::Base
  self.table_name = 'locations_user_location'

  validates :user_id, presence: true, uniqueness: true
  validates :geo_location, presence: true
end
