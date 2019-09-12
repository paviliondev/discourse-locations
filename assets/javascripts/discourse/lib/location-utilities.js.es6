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

  attrs.forEach(function(a, i) {
    let attr = a.split(/:(.+)/).filter(at => at !== '');
    let key = attr[0];
    let value = location[key];
    let index = attr.length > 1 ? attr[1] : null;

    if (value) {
      let part = value;

      if (key === 'countrycode') {
        const countryCodes = Discourse.Site.currentProp('country_codes');
        let country = countryCodes.find(c => c.code === value);

        if (country) part = country.name;
      }

      if (index) {
        let formatArr = part.split(',');
        part = formatArr[index];
      }

      result += part;

      if (i < attrs.length - 1) {
        result += ', ';
      }
    }
  });

  return result;
};

let geoLocationFormat = function(geoLocation, opts = {}) {
  if (!geoLocation) return;
  let result;
  
  console.log('opts: ', opts);

  if (opts.geoAttrs && opts.geoAttrs.length > 0) {
    result = formatLocation(geoLocation, opts.geoAttrs);
  } else if (geoLocation.address) {
    result = geoLocation.address;
  }

  return result;
};

let locationFormat = function(location, opts = {}) {
  if (!location) return '';

  let display = '';

  if (location.name) {
    display += location.name;
  };

  if (settings.location_input_fields_enabled && (!opts.attrs || !opts.attrs.length)) {
    let possibleFields = settings.location_input_fields.split('|');
    let attrs = possibleFields.filter(f => location[f]);

    if (attrs.length) {
      opts['attrs'] = attrs;
    }
  };

  let address;

  if (opts.attrs && opts.attrs.length) {
    address = formatLocation(location, opts.attrs);
  } else if (location.geo_location) {
    address = geoLocationFormat(location.geo_location, opts);
  } else if (location.raw) {
    address = location.raw;
  }

  if (address) {
    if (location.name) display += ', ';
    display += address;
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
