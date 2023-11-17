# frozen_string_literal: true

class CreateLocationsUserLocationTable < ActiveRecord::Migration[7.0]
  def change
    create_table :locations_user_location do |t|
      t.integer :user_id, null: false, index: { unique: true }, foreign_key: true
        t.column :geo_location, "vector(2)", null: false
        t.timestamps
    end
  end
end
