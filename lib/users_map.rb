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

      render_json_dump(directory_items: serialize_data(result, DirectoryItemSerializer))
    else
      super
    end
  end
end

require_dependency 'directory_items_controller'
class ::DirectoryItemsController
  prepend DirectoryItemsControllerExtension
end
