import { default as computed, on } from 'ember-addons/ember-computed-decorators';
import { geoLocationSearch, providerDetails } from '../lib/location-utilities';
import { ajax } from '../lib/ajax';

const GLOBAL = typeof Discourse === 'undefined' ? Wizard : Discourse;

export default Ember.Component.extend({
  geoLocationOptions: Ember.A(),
  classNames: ['location-form'],
  inputFields:['street', 'postalcode', 'city', 'countrycode'],
  countries: null,
  hasSearched: false,
  context: null,
  showProvider: false,
  showGeoLocation: true,

  @on('init')
  setup() {
    const showInputFields = this.get("showInputFields");
    if (showInputFields) {
      const inputFields = this.get('inputFields');

      inputFields.forEach((f) => {
        this.set(`show${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`, true);
      });

      if (inputFields.indexOf('countrycode') > -1) {
        ajax({
          url: '/location/country_codes',
          type: 'GET',
        }).then((result) => {
          this.set('countries', result.country_codes);
        });
      }

      if (inputFields.indexOf('coordinates') > -1) {
        this.set('showGeoLocation', false);
      } else {
        const geocoding = GLOBAL['SiteSettings'].location_geocoding;
        this.setProperties({
          showGeoLocation: geocoding !== 'none',
          showLocationResults: geocoding === 'required'
        });
      }

      const searchOnInit = this.get('searchOnInit');
      if (searchOnInit) {
        this.send('locationSearch');
      }
    }
  },

  @computed()
  showInputFields() {
    return this.get('inputFieldsEnabled') || GLOBAL['SiteSettings'].location_input_fields_enabled;
  },

  @computed('provider')
  providerDetails(provider) {
    return providerDetails[provider || GLOBAL['SiteSettings'].location_geocoding_provider];
  },

  buildStructuredRequest() {
    const props = this.getProperties('street', 'postalcode', 'city');

    let query = '';
    Object.keys(props).forEach((p) => {
      if (props[p] && props[p].length > 2) {
        query += `${props[p]}`;

        if (p !== 'city') {
          query += ', ';
        }
      }
    });

    if (query.length < 2) return false;

    let request = { query };

    const countrycode = this.get('countrycode');
    const context = this.get('context');
    if (countrycode) request['countrycode'] = countrycode;
    if (context) request['context'] = context;

    return request;
  },

  keyDown(e) {
    if (this.get('showGeoLocation') && e.keyCode === 13) this.send('locationSearch');
  },

  @computed('street', 'postalcode', 'city', 'countrycode')
  searchDisabled() {
    let disabled = false;
    this.get('inputFields').forEach((f) => {
      if (!this.get(f)) {
        disabled = true;
      }
    });
    return disabled;
  },

  @computed()
  searchLabel() {
    const locationGeocoding = GLOBAL['SiteSettings'].location_geocoding;
    return I18n.t(`location.geo.btn.${locationGeocoding}`);
  },

  actions: {
    updateGeoLocation(gl) {
      gl['zoomTo'] = true;
      this.set('geoLocation', gl);
      const options = this.get('geoLocationOptions');
      options.forEach((o) => {
        Ember.set(o, 'selected', o['address'] === gl['address']);
      });
    },

    clearSearch() {
      this.get('geoLocationOptions').clear();
      this.set('geoLocation', null);
    },

    locationSearch() {
      const request = this.buildStructuredRequest();
      if (!request.query && !request.countrycode) return;

      this.setProperties({
        'showLocationResults': true,
        'loadingLocations': true,
        'hasSearched': true,
        'showProvider': false
      });

      geoLocationSearch(request).then((result) => {
        if (this._state === 'destroying') { return; }

        if (result.provider) {
          this.set('provider', result.provider);
        }

        this.set('showProvider', result.locations.length > 0);

        this.get('geoLocationOptions').setObjects(result.locations);

        if (this.get('geoLocation')) {
          this.send('updateGeoLocation', this.get('geoLocation'));
        }

        this.set('loadingLocations', false);
      }).catch((error) => {
        this.send('searchError', error);
      });
    },

    searchError(error) {
      this.sendAction('searchError', error);
    }
  }
});
