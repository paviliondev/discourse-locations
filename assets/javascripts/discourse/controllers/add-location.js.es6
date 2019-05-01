import { default as computed } from 'ember-addons/ember-computed-decorators';
import ModalFunctionality from 'discourse/mixins/modal-functionality';

export default Ember.Controller.extend(ModalFunctionality, {
  title: 'composer.location.title',
  searchOnInit: false,
  name: null,
  street: null,
  postalcode: null,
  city: null,
  countrycode: Discourse.SiteSettings.location_country_default,
  geoLocation: { lat: '', lon: '' },
  rawLocation: null,

  setup() {
    const location = this.get('model.location');

    if (location) {
      this.setProperties({
        name: location.name,
        street: location.street,
        neighbourhood: location.neighbourhood,
        postalcode: location.postalcode,
        city: location.city,
        state: location.state,
        countrycode: location.countrycode,
        geoLocation: location.geo_location,
        rawLocation: location.raw,
      });
    }
  },

  @computed()
  inputFields() {
    return this.siteSettings.location_input_fields.split('|');
  },

  @computed('geoLocation')
  submitDisabled(geoLocation) {
    return this.siteSettings.location_geocoding === 'required' && !geoLocation;
  },

  clearModal() {
    this.setProperties({
      name: null,
      street: null,
      neighbourhood: null,
      postalcode: null,
      city: null,
      state: null,
      countrycode: null,
      geoLocation: { lat: '', lon: '' },
      rawLocation: null,
    });
    $('.location-form .ac-wrap .item a.remove').click();
  },

  actions: {
    clear() {
      this.clearModal();
      this.get('model.update')(null);
      this.send('closeModal');
    },

    submit() {
      if (this.get('submitDisabled')) return;

      let location = {};

      const geocodingEnabled = this.siteSettings.location_geocoding !== 'none';
      const inputFieldsEnabled = this.siteSettings.location_input_fields_enabled;
      const inputFields = this.get('inputFields');
      const hasCoordinates = inputFields.indexOf('coordinates') > -1;

      if (!geocodingEnabled && !inputFieldsEnabled) {
        location['raw'] = this.get('rawLocation');
      }

      if (inputFieldsEnabled) {
        const nonGeoProps = inputFields.filter((f) => f !== 'coordinates');
        location = this.getProperties(nonGeoProps);
      }

      if (geocodingEnabled || hasCoordinates) {
        const geoLocation = this.get('geoLocation');
        if (geoLocation && geoLocation.lat && geoLocation.lon) {
          location['geo_location'] = geoLocation;
        }
      }

      let name = this.get('name');
      if (name) location['name'] = name;

      Object.keys(location).forEach((k) => {
        if (location[k] == null || location[k] === '' || location[k] === {}) {
          delete location[k];
        }
      });

      if (Object.keys(location).length === 0) {
        location = null;
      }

      this.get('model.update')(location);
      this.clearModal();
      this.send('closeModal');
    },

    searchError(error) {
      this.flash(error, 'error');
    }
  }

});
