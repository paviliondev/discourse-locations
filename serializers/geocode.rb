class Locations::GeoSerializer < ApplicationSerializer
  attributes :lat, :lon, :address, :city, :state, :postalcode, :countrycode

  def lat
    object.latitude
  end

  def lon
    object.longitude
  end

  def address
    object.address
  end

  def city
    object.city
  end

  def state
    object.state
  end

  def postalcode
    object.postal_code
  end

  def countrycode
    object.country_code
  end
end
