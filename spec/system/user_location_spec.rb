# frozen_string_literal: true
require "rails_helper"

RSpec.describe "User can manage their location" do
  fab!(:user)
  fab!(:topic) { Fabricate(:topic, user: user) }
  fab!(:post) { Fabricate(:post, topic: topic, user: user) }
  let(:user_preferences_profile_page) do
    PageObjects::Pages::UserPreferencesProfile.new
  end
  let(:topic_page) { PageObjects::Pages::Topic.new }
  let(:location_selector) do
    PageObjects::Components::LocationSelector.new ".location-selector-wrapper"
  end
  let(:post_location) { PageObjects::Components::PostLocation.new(post) }
  fab!(:address_string) do
    "Hope Street, Canning / Georgian Quarter, Toxteth, Liverpool, Liverpool City Region, England, L1 9BW, United Kingdom"
  end
  let(:location) do
    {
      "place_id" => 256_934_900,
      "licence" =>
        "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
      "osm_type" => "way",
      "osm_id" => 4_086_265,
      "lat" => "53.4011822",
      "lon" => "-2.9706263",
      "class" => "highway",
      "type" => "tertiary",
      "place_rank" => 26,
      "importance" => 0.30430544025715084,
      "addresstype" => "road",
      "name" => "Hope Street",
      "country" => "United Kingdom",
      "countrycode" => "gb",
      "city" => "Liverpool",
      "address" => address_string,
      "boundingbox" => %w[53.3986907 53.4034963 -2.9714089 -2.9693595]
    }
  end

  context "when browsing the users preferences" do
    before(:each) do
      SiteSetting.location_enabled = true
      SiteSetting.location_users_map = true
      SiteSetting.location_user_post_format = "city|countrycode"
      SiteSetting.location_user_post = true
      sign_in(user)
      UserCustomField.create!(
        user_id: user.id,
        name: "geo_location",
        value: location.to_json
      )
    end

    it "allows user to view and update their location preferences" do
      user_preferences_profile_page.visit(user)
      expect(page).to have_css(".location-selector-wrapper")
      expect(location_selector).to have_selected_location_with_string(
        address_string
      )

      topic_page.visit_topic(topic)
      expect(page).to have_css(
        ".user-location",
        text: "Liverpool, United Kingdom"
      )

      user_preferences_profile_page.visit(user)
      location_selector.remove_location(address_string)
      expect(location_selector).to have_no_selected_locations
      user_preferences_profile_page.save
      page.refresh
      expect(location_selector).to have_no_selected_locations
    end

    it "keeps the post location readable beside the avatar on narrow screens" do
      SiteSetting.location_user_country_flag = true
      SiteSetting.location_user_post_format = "countrycode"
      page.current_window.resize_to(160, 800)

      topic_page.visit_topic(topic)
      expect(post_location).to have_location("United Kingdom")

      bounds = post_location.bounds
      expect(bounds[:location]["x"]).to be >=
        bounds[:avatar]["x"] + bounds[:avatar]["width"]
      expect(bounds[:flag]["x"] + bounds[:flag]["width"]).to be <=
        bounds[:summary]["x"] + bounds[:summary]["width"]
    end
  end
end
