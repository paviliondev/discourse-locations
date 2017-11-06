class Locations::Country
  def self.codes
    raw_codes = YAML.safe_load(File.read(File.join(Rails.root, 'plugins', 'discourse-locations', 'config', 'country_codes.yml')))
    formatted_codes = []

    raw_codes.map do |code, name|
      formatted_codes.push(code: code, name: name)
    end

    formatted_codes
  end

  def self.bounding_boxes
    YAML.safe_load(File.read(File.join(Rails.root, 'plugins', 'discourse-locations', 'config', 'country_bounding_boxes.yml')))
  end
end
