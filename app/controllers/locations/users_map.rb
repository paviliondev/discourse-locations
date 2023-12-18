# frozen_string_literal: true
module ::Locations
  class UsersMapController < ::ApplicationController
    requires_plugin PLUGIN_NAME
    before_action :ensure_plugin_enabled

    def index
      render json: success_json
    end
  end
end
