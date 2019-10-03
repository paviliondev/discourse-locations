require_dependency 'enum_site_setting'

class LocationCountryDefaultSiteSetting < ::EnumSiteSetting
  def self.valid_value?(val)
    return true if val == ""
    values.any? { |v| v[:value].to_s == val.to_s }
  end

  def self.values
    @values ||= Locations::Country.codes.map do |c|
      {
        name: c[:name],
        value: c[:code]
      }
    end
  end
end
