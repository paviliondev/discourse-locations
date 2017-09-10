class Locations::GeoController < ::ApplicationController
  def search
    params.require(:request)

    query = params[:request]['query']

    results = Locations::Geocode.perform(query)

    render_serialized(results, Locations::GeoSerializer)
  end

  def country_codes
    raw_codes = YAML.load(File.read(File.join(Rails.root, 'plugins', 'discourse-locations', 'config', 'country_codes.yml')))
    formatted_codes = []

    raw_codes.map do |code, name|
      formatted_codes.push({code: code, name: name})
    end

    render json: success_json.merge(country_codes: formatted_codes)
  end
end
