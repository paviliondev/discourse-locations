# frozen_string_literal: true
module DirectoryItemsControllerExtension
  def index
    if params[:period] === 'location'
      raise Discourse::InvalidAccess.new(:enable_user_directory) unless SiteSetting.enable_user_directory?

      limit = SiteSetting.location_users_map_limit.to_i

      result = DirectoryItem.joins("INNER JOIN locations_user ON directory_items.user_id = locations_user.user_id")
        .where("period_type = 5").includes(:user).limit(limit)

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
