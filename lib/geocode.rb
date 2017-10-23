# frozen_string_literal: true

class GeocoderError < StandardError; end

class Locations::Geocode
  def self.set_provider(provider)
    provider = provider.to_sym
    api_key = SiteSetting.location_geocoding_api_key
    timeout = SiteSetting.location_geocoding_timeout

    Geocoder.configure(
      lookup: provider,
      api_key: api_key,
      timeout: timeout,
      cache: $redis,
      cache_prefix: 'geocode',
      always_raise: :all,
      use_https: true
    )

    ## test to see that the provider requirements are met
    perform('10 Downing Street')
  end

  def self.perform(query, options = {})
    begin
      Geocoder.search(query, options)
    rescue SocketError
      raise GeocoderError.new I18n.t('location.errors.socket')
    rescue Timeout::Error
      raise GeocoderError.new I18n.t('location.errors.timeout')
    rescue Geocoder::OverQueryLimitError
      raise GeocoderError.new I18n.t('location.errors.query_limit')
    rescue Geocoder::RequestDenied
      raise GeocoderError.new I18n.t('location.errors.request_denied')
    rescue Geocoder::InvalidRequest
      raise GeocoderError.new I18n.t('location.errors.request_invalid')
    rescue Geocoder::InvalidApiKey
      raise GeocoderError.new I18n.t('location.errors.api_key')
    rescue Geocoder::ServiceUnavailable
      raise GeocoderError.new I18n.t('location.errors.service_unavailable')
    end
  end

  def self.sorted_validators
    @sorted_validators ||= []
  end

  def self.validators
    sorted_validators.map { |h| { context: h[:context], block: h[:block] } }
  end

  def self.add_validator(priority = 0, context, &block)
    sorted_validators << { priority: priority, context: context, block: block }
    @sorted_validators.sort_by! { |h| -h[:priority] }
  end
end
