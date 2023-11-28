# frozen_string_literal: true
class CreateLocationsUserIndex < ActiveRecord::Migration[7.0]
  def change
    add_index :locations_user, [:latitude, :longitude], name: 'composite_index_on_locations_user'
  end
end
