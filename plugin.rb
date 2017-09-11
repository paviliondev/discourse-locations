# name: discourse-locations
# about: Tools for handling locations in Discourse
# version: 0.1
# authors: Angus McLeod

register_asset 'stylesheets/common/locations.scss'
register_asset 'stylesheets/mobile/locations.scss', :mobile
register_asset 'lib/leaflet/leaflet.css'
register_asset 'lib/leaflet/leaflet.js'
register_asset 'lib/leaflet/leaflet.markercluster.js'
register_asset 'lib/leaflet/MarkerCluster.css'
register_asset 'lib/leaflet/MarkerCluster.Default.css'

Discourse.top_menu_items.push(:map)
Discourse.anonymous_top_menu_items.push(:map)
Discourse.filters.push(:map)
Discourse.anonymous_filters.push(:map)

gem 'geocoder', '1.4.4'

after_initialize do

  Category.register_custom_field_type('location_enabled', :boolean)
  add_to_serializer(:basic_category, :location_enabled) {object.custom_fields["location_enabled"]}

  Topic.register_custom_field_type('location', :json)
  Topic.register_custom_field_type('has_geo_location', :boolean)

  add_to_serializer(:topic_view, :location) {object.topic.custom_fields["location"]}
  add_to_serializer(:topic_view, :include_location?) {
    location = object.topic.custom_fields['location']
    location && location.length >= 2
  }

  TopicList.preloaded_custom_fields << "location" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "has_geo_location" if TopicList.respond_to? :preloaded_custom_fields
  add_to_serializer(:topic_list_item, :geo_location) {object.custom_fields['location']['geo_location']}
  add_to_serializer(:topic_list_item, :include_geo_location?) {object.custom_fields['has_geo_location']}

  PostRevisor.track_topic_field(:location)

  PostRevisor.class_eval do
    track_topic_field(:location) do |tc, location|
      new_location = location && location.length >= 2 ? location : "{}"
      tc.record_change('location', tc.topic.custom_fields['location'], new_location)
      tc.topic.custom_fields['location'] = new_location
      tc.topic.custom_fields['has_geo_location'] = !!new_location['geo_location']
    end
  end

  DiscourseEvent.on(:post_created) do |post, opts, user|
    location = opts[:location]
    if post.is_first_post? && location
      topic = Topic.find(post.topic_id)
      topic.custom_fields["location"] = location
      topic.custom_fields['has_geo_location'] = !!location['geo_location']
      topic.save!
    end
  end

  require_dependency "application_controller"
  module ::Locations
    class Engine < ::Rails::Engine
      engine_name "locations"
      isolate_namespace Locations
    end
  end

  Locations::Engine.routes.draw do
    get "search" => "geo#search"
    get "country_codes" => "geo#country_codes"
  end

  Discourse::Application.routes.append do
    mount ::Locations::Engine, at: "location"
  end

  load File.expand_path('../controllers/geocode.rb', __FILE__)
  load File.expand_path('../serializers/geocode.rb', __FILE__)
  load File.expand_path('../lib/geocode.rb', __FILE__)

  begin
    Locations::Geocode.set_provider(SiteSetting.location_geocoding_provider)
  rescue
    SiteSetting.location_geocoding_provider = :nominatim
    Locations::Geocode.set_provider(SiteSetting.location_geocoding_provider)
  end

  add_model_callback(SiteSetting, :before_save) do
    if self.name == 'location_geocoding_provider'
      result = Locations::Geocode.set_provider(self.value)
    end
  end

  require_dependency 'topic_query'
  class ::TopicQuery
    def list_map
      topics = create_list(:map) do |topics|
        topics.joins("INNER JOIN topic_custom_fields
                                 ON topic_custom_fields.topic_id = topics.id
                                 AND topic_custom_fields.name = 'has_geo_location'")
      end
    end
  end
end
