# frozen_string_literal: true
module ::Locations
  class Engine < ::Rails::Engine
    engine_name PLUGIN_NAME
    isolate_namespace Locations
    config.autoload_paths << File.join(config.root, "lib")
  end
end
