# frozen_string_literal: true

class Locations::GeoController < ::ApplicationController
  def search
    params.require(:request)

    RateLimiter.new(current_user, 'geocode_search', 6, 1.minute).performed!

    result = Locations::Geocode.search(current_user, params[:request])

    render_json_dump locations: serialize_data(result[:locations], Locations::GeoLocationSerializer),
                     provider: result[:provider]
  end

  def country_codes
    render json: success_json.merge(country_codes: Locations::Country.codes)
  end

  def validate
    params.require(:geo_location)
    params.permit(:context)

    messages = []
    geo_location = params[:geo_location]
    context = params[:context] || nil

    Locations::Geocode.validators.each do |validator|
      if response = validator[:block].call(geo_location, context)
        geo_location = response['geo_location'] if response['geo_location']
        messages.push(response['message']) if response['message']
      end
    end

    render json: success_json.merge(messages: messages, geo_location: geo_location)
  end
end
