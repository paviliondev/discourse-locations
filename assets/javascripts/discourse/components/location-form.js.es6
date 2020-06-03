import { default as discourseComputed, on } from 'discourse-common/utils/decorators';
import { geoLocationSearch, providerDetails } from '../lib/location-utilities';
import { getOwner } from 'discourse-common/lib/get-owner';
import Component from '@ember/component';
import { equal } from "@ember/object/computed";
import { A } from "@ember/array";
import { set } from "@ember/object";
import I18n from "I18n";

export default Component.extend({
  geoLocationOptions: A(),
  classNames: ['location-form'],
  inputFields: ['street', 'postalcode', 'city', 'countrycode'],
  hasSearched: false,
  context: null,
  showProvider: false,
  showGeoLocation: true,
  showTitle: equal('appType', 'discourse'),

  @discourseComputed('inputFieldsEnabled', 'settings')
  showInputFields(inputFieldsEnabled, settings) {
    if (inputFieldsEnabled === false) return false;
    return inputFieldsEnabled || settings.location_input_fields_enabled;
  },

  @discourseComputed('showInputFields', 'inputFields')
  showAddress(showInputFields, inputFields) {
    return !showInputFields || (showInputFields && (inputFields.filter(f => f !== 'coordinates').length > 0));
  },

  @discourseComputed('appType')
  settings(appType) {
    return appType === 'wizard' ? Wizard.SiteSettings : this.siteSettings;
  },

  @on('init')
  setup() {
    const rootElement = getOwner(this).get('rootElement');
    const isWizard = rootElement === '#custom-wizard-main';
    const appType = isWizard ? 'wizard' : 'discourse';

    this.set('appType', appType);

    let showInputFields = this.get("showInputFields");
    if (showInputFields) {
      const inputFields = this.get('inputFields');

      inputFields.forEach((f) => {
        this.set(`show${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`, true);
      });

      const disabledFields = this.get('disabledFields');
      if (disabledFields) {
        disabledFields.forEach((f) => {
          this.set(`${f}Disabled`, true);
        });
      }

      const geocoding = this.get('settings.location_geocoding');
      this.setProperties({
        showGeoLocation: geocoding !== 'none',
        showLocationResults: geocoding === 'required'
      });

      const searchOnInit = this.get('searchOnInit');
      if (searchOnInit) {
        this.send('locationSearch');
      }
    }

    const siteCodes = this.get('site.country_codes');
    if (siteCodes) {
      this.set('countrycodes', siteCodes);
    } else {
      const ajax = requirejs(`${appType}/lib/ajax`).ajax;
      ajax({
        url: '/location/countries',
        type: 'GET'
      }).then((result) => {
        this.set('countrycodes', result.geo);
      });
    }
  },

  @discourseComputed('provider', 'settings.location_geocoding_provider')
  providerDetails(provider, locationGeocodingProvider) {
    return providerDetails[provider || locationGeocodingProvider];
  },

  keyDown(e) {
    if (this.get('showGeoLocation') && e.keyCode === 13) this.send('locationSearch');
  },

  @discourseComputed('street', 'neighbourhood', 'postalcode', 'city')
  searchDisabled(street, neighbourhood, postalcode, city) {
    return !street && !neighbourhood && !postalcode && !city;
  },

  @discourseComputed('settings.location_geocoding')
  searchLabel: (locationGeocoding) => I18n.t(`location.geo.btn.${locationGeocoding}`),

  actions: {
    updateGeoLocation(gl) {
      gl['zoomTo'] = true;
      this.set('geoLocation', gl);
      const options = this.get('geoLocationOptions');
      options.forEach((o) => {
        set(o, 'selected', o['address'] === gl['address']);
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

      geoLocationSearch(request, this.siteSettings.location_geocoding_debounce).then((result) => {
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
