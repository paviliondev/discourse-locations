import { default as computed, on } from 'ember-addons/ember-computed-decorators';
import { geoLocationSearch, providerDetails } from '../lib/location-utilities';
import { getOwner } from 'discourse-common/lib/get-owner';

export default Ember.Component.extend({
  geoLocationOptions: Ember.A(),
  classNames: ['location-form'],
  showInputFields: Ember.computed.or('inputFieldsEnabled', 'settings.location_input_fields_enabled'),
  inputFields:['street', 'postalcode', 'city', 'countrycode'],
  hasSearched: false,
  context: null,
  showProvider: false,
  showGeoLocation: true,

  @computed()
  settings() {
    const rootElement = getOwner(this).get('rootElement');
    const wizard = rootElement === '#custom-wizard-main';
    return wizard ? Wizard.SiteSettings : Discourse.SiteSettings;
  },

  @on('init')
  setup() {
    const showInputFields = this.get("showInputFields");
    if (showInputFields) {
      const inputFields = this.get('inputFields');

      inputFields.forEach((f) => {
        this.set(`show${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`, true);
      });

      const disabledFields = this.get('disabledFields');
      if (disabledFields) {
        disabledFields.forEach((f) => {
          this.set(`${f}Disabled`, true);
        })
      }

      if (inputFields.indexOf('coordinates') > -1) {
        this.set('showGeoLocation', false);
      } else {
        const geocoding = this.get('settings.location_geocoding');
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

  @computed
  countries() {
    const site = this.get('site');
    return site.country_codes;
  },

  @computed('provider', 'settings.location_geocoding_provider')
  providerDetails(provider, locationGeocodingProvider) {
    return providerDetails[provider || locationGeocodingProvider];
  },

  keyDown(e) {
    if (this.get('showGeoLocation') && e.keyCode === 13) this.send('locationSearch');
  },

  @computed('street', 'neighbourhood', 'postalcode', 'city', 'state', 'countrycode')
  searchDisabled() {
    let disabled = false;
    this.get('inputFields').forEach((f) => {
      if (!this.get(f)) {
        disabled = true;
      }
    });
    return disabled;
  },

  @computed('settings.location_geocoding')
  searchLabel: (locationGeocoding) => I18n.t(`location.geo.btn.${locationGeocoding}`),

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
      const inputFields = this.get('inputFields');
      const request = this.getProperties(inputFields.concat(['countrycode', 'context']));

      if ($.isEmptyObject(request)) return;

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
