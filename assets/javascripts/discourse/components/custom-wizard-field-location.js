import Component from "@glimmer/component";
import I18n from "I18n";
import { action, computed } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";

export default class CustomWizardFieldLocationComponent extends Component {
  @service siteSettings;

  @tracked name = null;
  @tracked street = null;
  @tracked postalcode = null;
  @tracked city = null;
  @tracked countrycode = null;
  @tracked geoLocation = { lat: "", lon: "" };
  @tracked rawLocation = null;
  context = this.args.wizard.id;
  includeGeoLocation = true;
  inputFieldsEnabled = true;
  layoutName = "javascripts/wizard/templates/components/wizard-field-location";
  showType = true;

  constructor() {
    super(...arguments);
    const existing = this.args.field.value || {};
    const inputFields = this.inputFields;

    inputFields.forEach((f) => {
      if (existing[f]) {
        this[f] = existing[f];
      }
    });

    this.geoLocation = existing["geo_location"] || {};
    this.args.field.customCheck = this.customCheck.bind(this);
  }

  customCheck() {
    const required = this.required;
    const hasInput = this.inputFields.some((f) => this[f]);

    if (required || hasInput) {
      return this.handleValidation();
    } else {
      return true;
    }
  }

  @computed
  get inputFields() {
    return this.siteSettings.location_input_fields.split("|");
  }

  handleValidation() {
    let location = {};

    if (
      this.inputFieldsEnabled &&
      this.inputFields.indexOf("coordinates") > -1 &&
      (this.geoLocation.lat || this.geoLocation.lon)
    ) {
      return this.setValidation(
        this.geoLocation.lat && this.geoLocation.lon,
        "coordinates"
      );
    }

    if (this.inputFieldsEnabled) {
      let validationType = null;

      this.inputFields.some((field) => {
        const input = this[`${field}`];
        if (!input || input.length < 2) {
          validationType = field;
          return true;
        } else {
          location[field] = input;
        }
      });

      if (validationType) {
        return this.setValidation(false, validationType);
      }
    }

    if (this.includeGeoLocation) {
      let valid =
        this.geoLocation && this.geoLocation.lat && this.geoLocation.lon;
      let message;

      if (valid) {
        location["geo_location"] = this.geoLocation;
        this.args.field.value = location;
      } else {
        message = "geo_location";
      }

      return this.setValidation(valid, message);
    } else {
      this.args.field.value = location;
      return this.setValidation(true);
    }
  }

  setValidation(valid, type) {
    const message = type ? I18n.t(`location.validation.${type}`) : "";
    this.args.field.setValid(valid, message);
    return valid;
  }

  @action
  setGeoLocation(gl) {
    this.name = gl.name;
    this.street = gl.street;
    this.neighbourhood = gl.neighbourhood;
    this.postalcode = gl.postalcode;
    this.city = gl.city;
    this.state = gl.state;
    this.geoLocation = { lat: gl.lat, lon: gl.lon };
    this.countrycode = gl.countrycode;
    this.rawLocation = gl.address;
  }

  @action
  searchError(error) {
    this.flash = error;
  }
}
