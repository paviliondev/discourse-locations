import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';
import { geoLocationSearch } from '../lib/location-utilities';
import { providerDetails } from '../lib/map-utilities';
import { queryRegistry } from 'discourse/widgets/widget';
import { ajax } from 'discourse/lib/ajax';

export default Ember.Component.extend({
  geoLocationOptions: Ember.A(),
  classNames: ['location-form'],
  inputFields:['street', 'postalcode', 'city', 'countrycode'],
  countries: null,
  hasSearched: false,

  @on('init')
  setup() {
    const inputFields = this.get('inputFields');

    inputFields.forEach((f) => {
      this.set(`show${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`, true);
    })

    if (this.get('searchOnInit') && this.get("showInputFields")) {
      this.send('locationSearch');
    }

    if (inputFields.indexOf('countrycode') > -1) {
      ajax('/location/country_codes').then((result) => {
        this.set('countries', result.country_codes)
      })
    }

    if (this.siteSettings.location_geocoding === 'required') {
      this.set('showLocationResults', true);
    }
  },

  @computed()
  showGeoLocation() {
    return this.siteSettings.location_geocoding !== 'none';
  },

  @computed()
  showInputFields() {
    return this.siteSettings.location_input_fields_enabled;
  },

  @computed()
  providerDetails() {
    const provider = this.siteSettings.location_geocoding_provider;
    return providerDetails[provider];
  },

  buildRequest() {
    const props = this.getProperties('street', 'postalcode', 'city');
    const countrycode = this.get('countrycode');

    let query = '';
    Object.keys(props).forEach((p) => {
      if (props[p] && props[p].length > 2) {
        query += `${props[p]}`
      }

      if (p !== 'city') {
        query += ', '
      }
    });

    if (query.length < 2) return false;

    return { query, countrycode };
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
    })
    return disabled;
  },

  @computed()
  searchLabel() {
    const locationGeocoding = this.siteSettings.location_geocoding;
    return I18n.t(`location.geo.btn.${locationGeocoding}`);
  },

  actions: {
    updateGeoLocation(geoLocation) {
      geoLocation['zoomTo'] = true;
      this.set('geoLocation', geoLocation);
      const options = this.get('geoLocationOptions');
      options.forEach((o, i) => {
        Ember.set(o, 'selected', o['place_id'] === geoLocation['place_id']);
      })
    },

    clearSearch() {
      this.get('geoLocationOptions').clear();
      this.set('geoLocation', null);
    },

    locationSearch() {
      const request = this.buildRequest();
      if (!request) return;

      const placeSearch = this.get('placeSearch');
      this.setProperties({
        'showLocationResults': true,
        'loadingLocations': true,
        'hasSearched': true
      });

      geoLocationSearch(request, placeSearch).then((data) => {
        if (this._state == 'destroying') { return }

        this.get('geoLocationOptions').setObjects(data);

        if (this.get('geoLocation')) {
          this.send('updateGeoLocation', this.get('geoLocation'));
        }

        this.set('loadingLocations', false);
      })
    }
  }
})
