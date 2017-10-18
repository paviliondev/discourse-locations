# frozen_string_literal: true

class Locations::GeoController < ::ApplicationController
  def search
    params.require(:request)

    RateLimiter.new(current_user, 'geocode_search', 6, 1.minute).performed!

    query = params[:request]['query']

    results = Locations::Geocode.perform(query, language: current_user.effective_locale)

    render_serialized(results, Locations::GeoSerializer)
  end

  def country_codes
    raw_codes = YAML.safe_load(File.read(File.join(Rails.root, 'plugins', 'discourse-locations', 'config', 'country_codes.yml')))
    formatted_codes = []

    raw_codes.map do |code, name|
      formatted_codes.push(code: code, name: name)
    end

    render json: success_json.merge(country_codes: formatted_codes)
  end
end
