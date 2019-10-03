class Locations::GeoLocationSerializer < ::ApplicationSerializer
  attributes :lat,
             :lon,
             :address,
             :countrycode,
             :international_code,
             :city,
             :district,
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

  def international_code
    object.international_code
  end

  def include_international_code?
    object.respond_to?(:international_code)
  end

  def neighbourhood
    object.neighbourhood
  end

  def include_neighbourhood?
    object.respond_to?(:neighbourhood)
  end

  def suburb
    object.suburb
  end

  def include_suburb?
    object.respond_to?(:suburb)
  end

  def village
    object.village
  end

  def include_village?
    object.respond_to?(:village)
  end

  def town
    object.town
  end

  def include_town?
    object.respond_to?(:town)
  end

  def city
    object.city
  end

  def include_city?
    object.respond_to?(:city)
  end

  def city
    object.city
  end

  def include_city?
    object.respond_to?(:city)
  end

  def district
    object.district
  end

  def include_district?
    object.respond_to?(:district)
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
