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

  @computed()
  inputFields() {
    return this.siteSettings.location_input_fields.split('|');
  },

  @computed('name', 'street', 'postalcode', 'city', 'countrycode', 'geoLocation', 'rawLocation')
  submitDisabled(name, street, postalcode, city, countrycode, geoLocation, rawLocation) {
    if (this.siteSettings.location_geocoding === 'required' && !geoLocation) return true;

    if (this.siteSettings.location_input_fields_enabled) {
      const inputFields = this.get('inputFields');
      let disabled = false;

      inputFields.forEach((f) => {
        let field = this.get(f);
        if (!field || field.length < 2) {
          disabled = true;
        }
      })

      return disabled;

    } else {
      return !name && !geoLocation && !rawLocation;
    }
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
      this.set('model.location', null);
    },

    submit() {
      if (this.get('submitDisabled')) return;

      const geocodingEnabled = this.siteSettings.location_geocoding !== 'none';
      const inputFieldsEnabled = this.siteSettings.location_input_fields_enabled;
      let location = {};

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

      this.set('model.location', location);
      this.clearModal();
      this.send('closeModal');
    }
  }

});
