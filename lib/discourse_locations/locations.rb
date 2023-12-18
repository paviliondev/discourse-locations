# frozen_string_literal: true

module ::Locations
  class Helper
    def self.parse_location(location)
      location.is_a?(String) ? ::JSON.parse(location) : location
    end
  end
end
