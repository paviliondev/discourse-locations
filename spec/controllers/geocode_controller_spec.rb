# frozen_string_literal: true
require 'rails_helper'

describe ::Locations::GeoController do
  routes { ::Locations::Engine.routes }

  let!(:user) { log_in(:user) }
  let(:category) { Fabricate(:category, custom_fields: { location_enabled: true }) }

  describe 'search' do
    it 'works' do
      SiteSetting.location_geocoding_provider = :nominatim

      stub_request(:get, 'https://nominatim.openstreetmap.org/search?accept-language=en&addressdetails=1&format=json&q=10%20Downing%20Street')
        .with(headers: { 'Accept' => '*/*', 'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent' => 'Ruby' })
        .to_return(status: 200, body: '', headers: {})

      get :search, params: { request: '10 Downing Street' }, format: :json
      expect(response).to have_http_status(:successful)
    end

    it 'rate limits geocode searches' do
      RateLimiter.stubs(:disabled?).returns(false)
      RateLimiter.clear_all!

      6.times do
        get :search, params: { request: '10 Downing Street' }, format: :json
        expect(response).to have_http_status(:successful)
      end

      get :search, params: { request: '10 Downing Street' }, format: :json
      expect(response).not_to have_http_status(:successful)
    end
  end

  describe 'country_codes' do
    it 'works' do
      get :countries, format: :json
      expect(response).to have_http_status(:successful)
      json = ::JSON.parse(response.body)
      expect(json['geo'][0]['code']).to eq('af')
    end
  end
end
