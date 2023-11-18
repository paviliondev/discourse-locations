# frozen_string_literal: true

class CreateLocationsUserTable < ActiveRecord::Migration[7.0]
  def change
    create_table :locations_user do |t|
      t.integer :user_id, null: false, index: { unique: true }, foreign_key: true
      t.column :coords, "vector(2)", null: false
      t.string :address, null: true
      t.string :street, null: true
      t.string :city, null: true
      t.string :state, null: true
      t.string :postalcode, null: true 
      t.string :country, null: true 
      t.string :countrycode, null: true
      t.string :locationtype, null: true
      t.integer :boundingbox, array: true, null: true
      t.timestamps
    end
  end
end
