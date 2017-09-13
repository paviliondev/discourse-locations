import Category from 'discourse/models/category';
import { default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Controller.extend({
  title: 'composer.location.title',
  searchOnInit: false,
  name: null,
  street: null,
  postalcode: null,
  city: null,
  countrycode: null,
  geoLocation: null,
  rawLocation: null,

  setup() {
    const location = this.get('model.location');

    if (location) {
      this.setProperties({
        name: location.name,
        street: location.street,
        postalcode: location.postalcode,
        city: location.city,
        countrycode: location.countrycode,
        geoLocation: location.geo_location,
        rawLocation: location.raw,
      })
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
      postalcode: null,
      city: null,
      countrycode: null,
      geoLocation: null,
      rawLocation: null,
    });
    $('.location-form .ac-wrap .item a.remove').click();
  },

  actions: {
    clear() {
      this.clearModal();
      this.get('model.update')(null);
    },

    submit() {
      if (this.get('submitDisabled')) return;

      let location = {};

      const geocodingEnabled = this.siteSettings.location_geocoding !== 'none';
      const inputFieldsEnabled = this.siteSettings.location_input_fields_enabled;

      if (!geocodingEnabled && !inputFieldsEnabled) {
        location['raw'] = this.get('rawLocation');
      }

      if (inputFieldsEnabled) {
        const inputFields = this.siteSettings.location_input_fields.split('|');
        location = this.getProperties(inputFields);
      }

      let geoLocation = this.get('geoLocation');
      if (geocodingEnabled && geoLocation) {
        location['geo_location'] = geoLocation;
      }

      let name = this.get('name');
      if (name) location['name'] = name;

      Object.keys(location).forEach((k) => {
        if (location[k] == null || location[k] == '' || location[k] == {}) {
          delete location[k]
        }
      });

      if (Object.keys(location).length == 0) {
        location = null;
      }

      this.get('model.update')(location);
      this.clearModal();
      this.send('closeModal');
    }
  }

});
