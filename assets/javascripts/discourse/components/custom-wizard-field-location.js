import Component from "@glimmer/component";
// import { alias } from "@ember/object/computed";
import I18n from "I18n";
import { action, computed } from "@ember/object";
import { inject as service } from "@ember/service";

// {{component
//   inputComponentName
//   field=field
//   step=step
//   fieldClass=fieldClass
//   wizard=wizard
//   autocomplete=validators.autocomplete
// }}

export default class CustomWizardFieldLocationComponent extends Component {
  @service siteSettings;
  includeGeoLocation = true;
  showType = true;
  layoutName = "javascripts/wizard/templates/components/wizard-field-location";
  context = this.args.wizard.id;
  inputFieldsEnabled = true;

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
    //this.args.field.customCheck = this.customCheck.bind(this);
    this.args.field.customCheck = this.customCheck;
  };

  @computed
  get customCheck() {
    const required = this.required;
    const hasInput = this.inputFields.some((f) => this[f]);

    if (required || hasInput) {
      return this.handleValidation();
    } else {
      return true;
    }
  };

  @computed
  get inputFields() {
    return this.siteSettings.location_input_fields.split("|");
  };

  handleValidation() {
    const inputFields = this.inputFields;
    const inputFieldsEnabled = this.inputFieldsEnabled;
    const includeGeoLocation = this.includeGeoLocation;
    const geoLocation = this.geoLocation;

    let location = {};

    if (
      inputFieldsEnabled &&
      inputFields.indexOf("coordinates") > -1 &&
      (geoLocation.lat || geoLocation.lon)
    ) {
      return this.setValidation(
        geoLocation.lat && geoLocation.lon,
        "coordinates"
      );
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
        }
      });

      if (validationType) {
        return this.setValidation(false, validationType);
      }
    }

    if (includeGeoLocation) {
      let valid = geoLocation && geoLocation.address;
      let message;

      if (valid) {
        location["geo_location"] = geoLocation;
        this.set("field.value", location);
      } else {
        message = "geo_location";
      }

      return this.setValidation(valid, message);
    } else {
      this.set("field.value", location);
      return this.setValidation(true);
    }
  };

  setValidation(valid, type) {
    const message = type ? I18n.t(`location.validation.${type}`) : "";
    this.field.setValid(valid, message);
    return valid;
  };

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
  };

  @action
  searchError(error) {
    this.flash = error;
  };
};
