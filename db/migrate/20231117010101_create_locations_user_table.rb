# frozen_string_literal: true

class CreateLocationsUserTable < ActiveRecord::Migration[7.0]
  def change
    create_table :locations_user do |t|
      t.integer :user_id, null: false, index: { unique: true }, foreign_key: true
      t.float :latitude, null: false
      t.float :longitude, null: false
      t.string :street, null: true
      t.string :district, null: true
      t.string :city, null: true
      t.string :state, null: true
      t.string :postalcode, null: true
      t.string :country, null: true
      t.string :countrycode, null: true
      t.string :international_code, null: true
      t.string :locationtype, null: true
      t.float :boundingbox, array: true, null: true
      t.timestamps
    end
  end
end
