import discourseComputed, { on } from 'discourse-common/utils/decorators';
import { ajax } from 'discourse/lib/ajax';
import Component from '@ember/component';
import { alias } from "@ember/object/computed";
import I18n from "I18n";

export default Component.extend({
  includeGeoLocation: true,
  showType: true,
  layoutName: 'javascripts/wizard/templates/components/wizard-field-location',
  context: alias('wizard.id'),
  inputFieldsEnabled: true,

  @on('init')
  setup() {
    const existing = this.get('field.value') || {};
    const inputFields = this.get('inputFields');

    inputFields.forEach((f) => {
      if (existing[f]) this.set(f, existing[f]);
    });

    this.set('geoLocation', existing['geo_location'] || {});
    this.set('field.customCheck', this.customCheck.bind(this));
  },

  customCheck() {
    const required = this.required;
    const hasInput = this.inputFields.some((f) => this.get(f));

    if (required || hasInput) {
      return this.handleValidation();
    } else {
      return true;
    }
  },

  @discourseComputed()
  inputFields() {
    return this.siteSettings.location_input_fields.split('|');
  },

  handleValidation() {
    const inputFields = this.get('inputFields');
    const inputFieldsEnabled = this.inputFieldsEnabled;
    const includeGeoLocation = this.get('includeGeoLocation');
    const geoLocation = this.get('geoLocation');

    let location = {};

    if (inputFieldsEnabled &&
        inputFields.indexOf('coordinates') > -1 &&
        (geoLocation.lat || geoLocation.lon)) {

      return this.setValidation(geoLocation.lat && geoLocation.lon, 'coordinates');
    }

    if (inputFieldsEnabled) {
      let validationType = null;

      inputFields.some((field) => {
        const input = this.get(field);
        if (!input || input.length < 2) {
          validationType = field;
          return true;
        } else {
          location[field] = input;
        };
      });

      if (validationType) {
        return this.setValidation(false, validationType);
      }
    }

    if (includeGeoLocation) {
      let valid = geoLocation && geoLocation.address;
      let message;

      if (valid) {
        location['geo_location'] = geoLocation;
        this.set("field.value", location);
      } else {
        message = 'geo_location';
      }

      return this.setValidation(valid, message);
    } else {
      this.set("field.value", location);
      return this.setValidation(true);
    }
  },

  setValidation(valid, type) {
    const message = type ? I18n.t(`location.validation.${type}`) : '';
    this.field.setValid(valid, message);
    return valid;
  }
});
