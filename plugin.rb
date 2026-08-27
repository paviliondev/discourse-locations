# frozen_string_literal: true
# name: discourse-locations
# about: Tools for handling locations in Discourse
# version: 7.3.13
# authors: Robert Barrow, Angus McLeod
# contact_emails: merefield@gmail.com
# url: https://github.com/merefield/discourse-locations

enabled_site_setting :location_enabled

module ::Locations
  PLUGIN_NAME = "discourse-locations"
  EXTENSION_API_VERSION = 1
end

require_relative "lib/locations/engine"

register_asset "stylesheets/common/locations.scss"
register_asset "stylesheets/desktop/locations.scss", :desktop
register_asset "stylesheets/mobile/locations.scss", :mobile
register_asset "lib/leaflet/leaflet.css"
register_asset "lib/leaflet/leaflet.js"
register_asset "lib/leaflet/leaflet.markercluster.js"
register_asset "lib/leaflet/MarkerCluster.css"
register_asset "lib/leaflet/MarkerCluster.Default.css"

Discourse.top_menu_items.push(:map)
Discourse.anonymous_top_menu_items.push(:map)
Discourse.filters.push(:map)
Discourse.anonymous_filters.push(:map)

gem "geocoder", "1.8.6"

if respond_to?(:register_svg_icon)
  register_svg_icon "far-map"
  register_svg_icon "info"
  register_svg_icon "expand"
end

after_initialize do
  # This legacy patch is outside the namespaced paths Zeitwerk autoloads.
  require_relative "lib/users_map"

  reloadable_patch { TopicQuery.prepend(Locations::TopicQueryExtension) }
  reloadable_patch do
    User.singleton_class.prepend(Locations::UserCustomFieldPreloader)
  end

  def Locations.parse_geo_location(val)
    Locations::Payload.parse(val)
  end

  Category.register_custom_field_type("location", :json)
  Category.register_custom_field_type("location_enabled", :boolean)
  Category.register_custom_field_type("location_topic_status", :boolean)
  Category.register_custom_field_type("location_map_filter_closed", :boolean)

  add_to_class(:category, :location) do
    if self.custom_fields["location"]
      if self.custom_fields["location"].is_a?(String)
        begin
          JSON.parse(self.custom_fields["location"])
        rescue JSON::ParserError => e
          puts e.message
        end
      elsif self.custom_fields["location"].is_a?(Hash)
        self.custom_fields["location"]
      else
        nil
      end
    else
      nil
    end
  end

  module LocationsSiteSettingExtension
    def type_hash(name)
      if name == :top_menu
        @choices[name].push("map") if @choices[name].exclude?("map")
      end
      super(name)
    end
  end

  require_dependency "site_settings/type_supervisor"
  class SiteSettings::TypeSupervisor
    prepend LocationsSiteSettingExtension
  end

  %w[
    location
    location_enabled
    location_topic_status
    location_map_filter_closed
  ].each do |key|
    if Site.respond_to? :preloaded_category_custom_fields
      Site.preloaded_category_custom_fields << key
    end
  end

  Topic.register_custom_field_type("location", :json)
  add_to_class(:topic, :location) { Locations::TopicLocationStore.fetch(self) }
  add_preloaded_topic_list_custom_field("location")

  add_to_serializer(
    :topic_view,
    :location,
    include_condition: -> { object.topic.location.present? }
  ) { object.topic.location }

  add_to_serializer(
    :topic_list_item,
    :location,
    include_condition: -> { object.location.present? }
  ) { object.location }

  if defined?(register_editable_user_custom_field)
    register_editable_user_custom_field("geo_location")
  end

  add_to_serializer(:user, :geo_location) do
    Locations::UserLocationStore.fetch(object)
  end

  add_to_serializer(:current_user, :geo_location) do
    Locations::UserLocationStore.fetch(object)
  end

  add_to_serializer(
    :user_card,
    :geo_location,
    include_condition: -> do
      Locations::UserLocationStore.fetch(object).present?
    end
  ) { Locations::UserLocationStore.fetch(object) }

  add_to_serializer(
    :post,
    :user_geo_location,
    include_condition: -> do
      SiteSetting.location_user_post &&
        Locations::UserLocationStore.fetch(object.user).present?
    end
  ) { Locations::UserLocationStore.fetch(object.user) }

  PostRevisor.track_topic_field(:location) do |tc, location|
    category_supports_locations =
      tc.topic.category&.custom_fields&.[]("location_enabled")

    raw_location =
      location.respond_to?(:to_unsafe_hash) ? location.to_unsafe_hash : location

    if location.present? && category_supports_locations &&
         location = Locations::Payload.parse(raw_location)
      tc.record_change(
        "location",
        Locations::TopicLocationStore.fetch(tc.topic),
        location
      )
      Locations::TopicLocationStore.assign(topic: tc.topic, location:)
    elsif location.blank?
      Locations::TopicLocationStore.assign(topic: tc.topic, location: nil)
    end
  end

  on(:post_created) do |post, opts, user|
    if post.is_first_post? && opts[:location].present? &&
         post.topic.category&.custom_fields&.[]("location_enabled") &&
         location = Locations::Payload.parse(opts[:location])
      topic = post.topic
      Locations::TopicLocationStore.assign(topic:, location:)
      topic.save!
    end
  end

  # check latitude and longitude are included when updating users location or raise an error
  register_modifier(
    :users_controller_update_user_params
  ) do |result, current_user, params|
    raw = params.dig(:custom_fields, :geo_location)
    next result if raw.nil?

    # Clear
    if raw.blank? || raw == {} || raw == "{}"
      result[:custom_fields] ||= {}
      result[:custom_fields][:geo_location] = ""
      next result
    end

    location = Locations::Payload.parse(raw)
    if !Locations::Payload.geocoded?(location)
      raise Discourse::InvalidParameters.new, I18n.t("location.errors.invalid")
    end

    result[:custom_fields] ||= {}
    result[:custom_fields][:geo_location] = location.to_json

    result
  end

  on(:user_updated) { |*params| Locations::UserLocationStore.sync(params[0]) }

  on(:user_destroyed) do |*params|
    Locations::UserLocationStore.delete(params[0])
  end

  on(:topic_created) { |topic| Locations::TopicLocationStore.sync(topic) }

  on(:topic_destroyed) { |topic| Locations::TopicLocationStore.delete(topic) }

  class ::Jobs::AnonymizeUser
    module LocationsEdits
      def make_anonymous
        super
        ::Locations::UserLocationStore.delete(@user_id)
      end
    end
    prepend LocationsEdits
  end

  unless Rails.env.test?
    begin
      Locations::Geocode.set_config
    rescue StandardError
      Locations::Geocode.revert_to_default_provider
    end

    # To be removed
    if SiteSetting.location_geocoding_provider == "mapzen"
      Locations::Geocode.revert_to_default_provider
    end
  end

  add_model_callback(SiteSetting, :before_save) do
    if name == "location_geocoding_provider"
      Locations::Geocode.set_config(provider: value)
    end
    if name == "location_geocoding_timeout"
      Locations::Geocode.set_config(timeout: value)
    end
  end

  add_to_class(:site, :country_codes) do
    @country_codes ||= Locations::Country.codes
  end

  add_to_serializer(:site, :country_codes, respect_plugin_enabled: false) do
    object.country_codes
  end

  Locations::Map.add_list_filter do |topics, options|
    category = Category.find(options[:category_id]) if options[:category_id]

    if SiteSetting.location_map_filter_closed ||
         (
           options[:category_id] &&
             category.custom_fields["location_map_filter_closed"]
         )
      topics = topics.where(closed: false)
    end

    topics
  end

  DiscourseEvent.trigger(:locations_ready)
end

on(:custom_wizard_ready) do
  if defined?(CustomWizard) == "constant" && CustomWizard.class == Module
    CustomWizard::Field.register("location", "discourse-locations")
    CustomWizard::Action.register_callback(
      :before_create_topic
    ) do |params, wizard, action, submission|
      if action["add_location"]
        location =
          CustomWizard::Mapper.new(
            inputs: action["add_location"],
            data: submission&.fields_and_meta,
            user: wizard.user
          ).perform

        if location.present?
          location = Locations::Helper.parse_location(location)

          params[:topic_opts] ||= {}
          params[:topic_opts][:custom_fields] ||= {}
          params[:topic_opts][:custom_fields]["location"] = location
        end
      end

      params
    end
  end
end
