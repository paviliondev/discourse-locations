import { ajax } from './ajax';

function locationSearch(request, resultsFn) {
  ajax({
    url: '/location/search',
    data: { request }
  }).then(function (r) {
    resultsFn(r);
  }).catch(function (e) {
    let message = I18n.t('location.errors.search');

    if (e.responseJSON && e.responseJSON.errors) {
      message = e.responseJSON.errors[0];
    } else if (e.responseText) {
      const responseText = e.responseText;
      message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
    };

    resultsFn({ error: true, message });
  });
}

const settings = Discourse.SiteSettings || Wizard.SiteSettings;

var debouncedLocationSearch = _.debounce(locationSearch, settings.location_geocoding_debounce);

let geoLocationSearch = (request) => {
  if (!request) return;

  return new Ember.RSVP.Promise(function(resolve, reject) {
    debouncedLocationSearch(request, function(r) {
      if (r.error) {
        reject(r.message);
      } else {
        resolve(r);
      };
    });
  });
};

let formatLocation = function(location, attrs = []) {
  let result = '';

  attrs.forEach(function(p, i) {
    if (location[p]) {
      let part = location[p];

      if (p === 'countrycode') {
        const countryCodes = Discourse.Site.currentProp('country_codes');
        let country = countryCodes.find(c => c.code === part);

        if (country) part = country.name;
      }

      result += part;

      if (i < attrs.length - 1) {
        result += ', ';
      }
    }
  });

  return result;
}

let geoLocationFormat = function(geoLocation, opts = {}) {
  if (!geoLocation) return;
  let result;

  if (opts.geoAttrs && opts.geoAttrs.length > 0) {
    result = formatLocation(geoLocation, opts.geoAttrs);
  } else {
    result = geoLocation.address;
  }

  return result;
};

let locationFormat = function(location, opts = {}) {
  if (!location) return '';

  const settings = Discourse.SiteSettings;
  let display = '';

  if (location.name) {
    display += location.name + ', ';
  };

  console.log(opts);

  if (settings.location_input_fields_enabled && (!opts.attrs || !opts.attrs.length)) {
    opts['attrs'] = settings.location_input_fields.split('|');
  };

  if (opts.attrs && opts.attrs.length) {
    display += formatLocation(location, opts.attrs);
  } else if (location.geo_location) {
    display += geoLocationFormat(location.geo_location, opts);
  } else if (location.raw) {
    if (location.name) display += ', ';
    display += location.raw;
  }

  return display;
};

let providerDetails = {
  nominatim: `<a href='https://www.openstreetmap.org' target='_blank'>OpenStreetMap</a>`,
  location_iq: `<a href='https://locationiq.org/' target='_blank'>LocationIQ</a>`,
  opencagedata: `<a href='https://opencagedata.com' target='_blank'>OpenCage Data</a>`,
  mapbox: `<a href='https://www.mapbox.com/' target='_blank'>Mapbox</a>`,
  mapquest: `<a href='https://developer.mapquest.com' target='_blank'>Mapquest</a>`
};

export { geoLocationSearch, geoLocationFormat, locationFormat, formatLocation, providerDetails };
