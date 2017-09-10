import { ajax } from 'discourse/lib/ajax';

function locationSearch(request, resultsFn) {
  ajax('/location/search', { data: { request }}).then(function (r) {
    resultsFn(r);
  });
}

var debouncedLocationSearch = _.debounce(locationSearch, 400);

let geoLocationSearch = (request, placeSearch) => {
  if (!request) return;

  if (placeSearch) {
    return ajax('/location/place_search', { data: { request }});
  }

  return new Ember.RSVP.Promise(function(resolve) {
    debouncedLocationSearch(request, function(r) { resolve(r); });
  });
}

let geoLocationFormat = function(geoLocation, attrs = {}) {
  if (!geoLocation) { return; }
  let display = '';

  if (Object.keys(attrs).length > 0 && attrs.constructor === Object) {
    let attrs = ['house_number', 'road', 'town', 'city', 'state', 'countrycode', 'postalcode'];
    let address = geoLocation.address;
    attrs.forEach(function(p) {
      if (address[p]) {
        if (display.length > 0) {
          display += ', ';
        }
        display += address[p];
      }
    })
  } else {
    display = geoLocation.address;
  }

  return display;
}

let locationFormat = function(location) {
  if (!location) return;

  let display = location.name;

  if (Discourse.SiteSettings.location_input_fields_enabled) {
    let attrs = ['street', 'city', 'postalcode'];

    attrs.forEach(function(p) {
      if (location[p]) {
        if (display.length > 0) {
          display += ', ';
        }

        display += location[p];
      }
    })
  } else if (location.geo_location) {
    if (location.name) {
      display += ", "
    };

    display += geoLocationFormat(location.geo_location);
  }

  return display;
}

export { geoLocationSearch, geoLocationFormat, locationFormat }
