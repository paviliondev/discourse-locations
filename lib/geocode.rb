# frozen_string_literal: true

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
    Geocoder.search(query, options)
  end
end
