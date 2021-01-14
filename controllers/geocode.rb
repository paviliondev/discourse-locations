class Locations::GeoController < ::ApplicationController
  def search
    params.require(:request)

    rate_limit = SiteSetting.location_geocoding_rate_limit
    RateLimiter.new(current_user, 'geocode_search', rate_limit, 1.minute).performed!
    
    error = nil
    
    begin
      result = Locations::Geocode.search(current_user, params[:request])
    rescue => error
      error = error
    end
    
    if error
      render json: failed_json.merge(message: error.message)
    else
      render_json_dump(
        locations: serialize_data(result[:locations], Locations::GeoLocationSerializer),
        provider: result[:provider]
      )
    end
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

  def countries
    render json: Locations::Country.codes
  end
end
