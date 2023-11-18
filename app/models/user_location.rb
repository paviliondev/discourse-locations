# frozen_string_literal: true

module ::Locations
  class UserLocation < ActiveRecord::Base
    self.table_name = 'locations_user'

    validates :user_id, presence: true, uniqueness: true
    validates :coords, presence: true
  end
end
