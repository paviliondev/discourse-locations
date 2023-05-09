# frozen_string_literal: true
class Locations::Helper
  def self.parse_location(location)
    location.is_a?(String) ? ::JSON.parse(location) : location
  end
end
