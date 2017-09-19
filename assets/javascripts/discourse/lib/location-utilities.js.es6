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
    return ajax('/place/search', { data: { request }});
  }

  return new Ember.RSVP.Promise(function(resolve) {
    debouncedLocationSearch(request, function(r) { resolve(r); });
  });
};

let geoLocationFormat = function(geoLocation, params = {}) {
  if (!geoLocation) return;
  let display = '';

  if (params['displayAttrs'] && params['displayAttrs'].length > 0) {
    params['displayAttrs'].forEach(function(a) {
      if (geoLocation[a]) {
        if (display.length > 0) {
          display += ', ';
        }
        display += geoLocation[a];
      }
    });
  } else {
    display = geoLocation.address;
  }

  return display;
};

let locationFormat = function(location) {
  if (!location) return '';

  let display = '';

  if (location.name) {
    display += location.name;
  };

  if (Discourse.SiteSettings.location_input_fields_enabled) {
    let attrs = Discourse.SiteSettings.location_input_fields.split('|');

    attrs.forEach(function(p) {
      if (location[p]) {
        if (display.length > 0 || location.name) {
          display += ', ';
        }

        display += location[p];
      }
    });
  } else if (location.geo_location) {
    if (location.name) display += ', ';
    display += geoLocationFormat(location.geo_location);
  } else if (location.raw) {
    if (location.name) display += ', ';
    display += location.raw;
  }

  return display;
};

export { geoLocationSearch, geoLocationFormat, locationFormat };
