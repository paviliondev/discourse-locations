# frozen_string_literal: true

class Locations::GeoController < ::ApplicationController
  def search
    params.require(:request)

    RateLimiter.new(current_user, 'geocode_search', 6, 1.minute).performed!

    query = params[:request]['query']

    results = Locations::Geocode.perform(query)

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

  def validate
    params.require(:geo_location)
    params.permit(:context)
    
    messages = []
    geo_location = params[:geo_location]

    Locations::Geocode.validators.each do |validator|
      if validator[:context] == params[:context]
        response = validator[:block].call(geo_location)
        geo_location = response['geo_location'] if response['geo_location']
        messages.push(response['message']) if response['message']
      end
    end

    render json: success_json.merge(messages: messages, geo_location: geo_location)
  end
end
