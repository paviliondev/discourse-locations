class GeocoderError < StandardError; end

REQUEST_PARTS = [
  'street',
  'neighbourhood',
  'postalcode',
  'city',
  'state'
]

class Locations::Geocode
  def self.set_config(opts = {})
    provider = opts[:provider] || SiteSetting.location_geocoding_provider
    api_key = opts[:api_key] || SiteSetting.location_geocoding_api_key
    timeout = opts[:timeout] || SiteSetting.location_geocoding_timeout

    Geocoder.configure(
      lookup: provider.to_sym,
      api_key: api_key,
      timeout: timeout.to_i,
      cache: Discourse.redis,
      cache_prefix: 'geocoder:',
      use_https: true,
      always_raise: [
        SocketError,
        Timeout::Error,
        Geocoder::OverQueryLimitError,
        Geocoder::RequestDenied,
        Geocoder::InvalidRequest,
        Geocoder::InvalidApiKey,
        Geocoder::ServiceUnavailable
      ]
    )

    ## test to see that the config works
    perform('10 Downing Street')
  end

  def self.build_query(request)
    query = request['query']

    if !query
      query = ''

      REQUEST_PARTS.each do |part|
        if request_part = request[part]
          query << "#{request_part}"

          if request_part != 'city'
            query << ', '
          end
        end
      end
    end

    query
  end

  def self.search(user, request)
    query = self.build_query(request)
    countrycode = SiteSetting.location_country_default_apply_to_all_searches && request['countrycode'].blank? ? SiteSetting.location_country_default : request['countrycode']
    context = request['context']

    language = SiteSetting.location_geocoding_language
    if language == 'user' || language == :user
      options = { language: user.effective_locale }
    else
      options = { language: SiteSetting.default_locale }
    end

    custom_options.each do |block|
      if updated_options = block.call(options, context)
        options = updated_options
      end
    end

    provider = nil

    if options[:lookup]
      provider = options[:lookup]
    else
      setting = SiteSetting.location_geocoding_provider.to_sym

      if setting != Geocoder.config[:lookup]
        provider = setting
        options[:lookup] = setting
      else
        provider = Geocoder.config[:lookup]
      end
    end

    # To be removed
    provider = :nominatim if provider == 'mapzen' || provider == :mapzen

    if countrycode
      country_key = nil

      # note: Mapquest does not support country code request resrictions
      case provider
      when :nominatim, :location_iq
        country_key = 'countrycodes'
      when :mapbox
        country_key = 'country'
      when :opencagedata
        country_key = 'countrycode'
      end

      options[:params] = { country_key.to_sym => countrycode } if country_key
    end

    locations = perform(query, options)

    filter_params = options.merge(
      context: context,
      provider: provider,
      request: request
    )

    filters.each do |filter|
      if filtered_locations = filter[:block].call(locations, filter_params)
        locations = filtered_locations
      end
    end

    { locations: locations, provider: provider }
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
    sorted_validators.map { |h| { block: h[:block] } }
  end

  def self.add_validator(priority = 0, &block)
    sorted_validators << { priority: priority, block: block }
    @sorted_validators.sort_by! { |h| -h[:priority] }
  end

  def self.sorted_filters
    @sorted_filters ||= []
  end

  def self.filters
    sorted_filters.map { |h| { block: h[:block] } }
  end

  def self.add_filter(priority = 0, &block)
    sorted_filters << { priority: priority, block: block }
    @sorted_filters.sort_by! { |h| -h[:priority] }
  end

  def self.custom_options
    @custom_options ||= []
  end

  def self.add_options(&block)
    custom_options << block
  end

  def self.revert_to_default_provider
    SiteSetting.location_geocoding_provider = :nominatim
    Locations::Geocode.set_config
  end
end
