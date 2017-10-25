class Locations::GeoLocationSerializer < ApplicationSerializer
  attributes :lat,
             :lon,
             :address,
             :countrycode,
             :city,
             :state,
             :country,
             :postalcode,
             :boundingbox,
             :type,
             :name

  def lat
    object.latitude
  end

  def lon
    object.longitude
  end

  def address
    object.address
  end

  def countrycode
    object.country_code
  end

  def city
    object.city
  end

  def include_city?
    object.respond_to?(:city)
  end

  def state
    object.state
  end

  def include_state?
    object.respond_to?(:state)
  end

  def country
    object.country
  end

  def include_country?
    object.respond_to?(:country)
  end

  def postalcode
    object.postal_code
  end

  def include_postalcode?
    object.respond_to?(:postal_code)
  end

  def boundingbox
    object.boundingbox
  end

  def include_boundingbox?
    object.respond_to?(:boundingbox)
  end

  def type
    object.type
  end

  def include_type?
    object.respond_to?(:type)
  end

  def name
    object.name
  end

  def include_name?
    object.respond_to?(:name)
  end
end
