module DirectoryItemsControllerExtension
  def index
    if params[:period] === 'location'
      raise Discourse::InvalidAccess.new(:enable_user_directory) unless SiteSetting.enable_user_directory?

      limit = SiteSetting.location_users_map_limit.to_i

      result = DirectoryItem.where("
        user_id in (
          SELECT user_id FROM user_custom_fields WHERE name = 'geo_location'
        )
        AND period_type = 5
      ").includes(:user).limit(limit)

      serializer_opts = {}
      serializer_opts[:attributes] = []

      serialized = serialize_data(result, DirectoryItemSerializer, serializer_opts)
      render_json_dump(directory_items: serialized,
                       meta: {}
                      )
    else
      super
    end
  end
end

require_dependency 'directory_items_controller'
class ::DirectoryItemsController
  prepend DirectoryItemsControllerExtension
end

module UsersControllerLocationsExtension
  def modify_user_params(attrs)
    super(attrs)

    if attrs &&
      attrs[:custom_fields] &&
      attrs[:custom_fields][:geo_location] &&
      attrs[:custom_fields][:geo_location] != "{}" &&
      (!attrs[:custom_fields][:geo_location]['lat'] ||
       !attrs[:custom_fields][:geo_location]['lon'])
      raise Discourse::InvalidParameters.new, I18n.t('location.errors.invalid')
    end

    attrs
  end
end

require_dependency 'users_controller'
class ::UsersController
  prepend UsersControllerLocationsExtension
end
