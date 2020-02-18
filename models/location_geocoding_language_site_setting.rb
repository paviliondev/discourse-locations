require_dependency 'enum_site_setting'

class LocationGeocodingLanguageSiteSetting < EnumSiteSetting
  def self.valid_value?(val)
    values.any? { |v| v[:value].to_s == val.to_s }
  end

  def self.values
    @values ||= ['default', 'user'].map do |v|
      {
        name: I18n.t("site_settings.location_geocoding_language_#{v}"),
        value: v
      }
    end
  end
end