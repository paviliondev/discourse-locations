class Locations::Helper
  def self.valid_location?(location)
    JSON.parse(location)
    return true
  rescue JSON::ParserError => e
    return false
  end
end
