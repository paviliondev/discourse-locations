# frozen_string_literal: true
require 'rails_helper'

RSpec.describe UsersController do
  fab!(:user) { Fabricate(:user) }
  before do
    sign_in(user)
    SiteSetting.location_enabled = true
    SiteSetting.location_users_map = true
  end

  context "locations plugin checks for valid geolocation parameters which at minimum need to include both latitude and longitude" do
    it "allows user to upload valid geolocation to their profile" do
      put "/u/#{user.username}.json",
      params: {
        custom_fields: {
          geo_location: { lat: 10, lon: 12 },
        },
      }

      expect(response.status).to eq(200)
      result = response.parsed_body
      expect(result["success"]).to eq("OK")
      expect(user.custom_fields["geo_location"]["lat"]).to eq("10")
      expect(user.custom_fields["geo_location"]["lon"]).to eq("12")
    end

    it "doesn't allow user to upload invalid geolocation to their profile" do
      put "/u/#{user.username}.json",
      params: {
        custom_fields: {
          geo_location: { lat: 10 },
        },
      }

      expect(response.status).to eq(400)
      result = response.parsed_body
      expect(result["error_type"]).to eq("invalid_parameters")
    end
  end
end
