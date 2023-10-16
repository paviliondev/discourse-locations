import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed } from "@ember/object";
import { inject as service } from "@ember/service";
import I18n from "I18n";

export default class AddLocationComponent extends Component {
  @service siteSettings;
  @tracked flash = this.args.model?.flash;
  @tracked searchOnInit = false;
  @tracked name = null;
  @tracked street = null;
  @tracked postalcode = null;
  @tracked city = null;
  @tracked countrycode = null;
  @tracked geoLocation = { lat: "", lon: "" };
  @tracked rawLocation = null;
  title = I18n.t("composer.location.title");

  constructor() {
    super(...arguments);
    const location = this.args.model.location;

    this.countrycode = this.siteSettings.location_country_default;

    if (location) {
      this.name = location.name;
      this.street = location.street;
      this.neighbourhood = location.neighbourhood;
      this.postalcode = location.postalcode;
      this.city = location.city;
      this.state = location.state;
      this.countrycode = location.countrycode;
      this.geoLocation = location.geo_location;
      this.rawLocation = location.raw;
    }
  }

  @computed()
  get inputFields() {
    return this.siteSettings.location_input_fields.split("|");
  }

  @computed("geoLocation")
  get submitDisabled() {
    return (
      this.siteSettings.location_geocoding === "required" && !this.geoLocation
    );
  }

  @action
  clearModal() {
    this.name = null;
    this.street = null;
    this.neighbourhood = null;
    this.postalcode = null;
    this.city = null;
    this.state = null;
    this.countrycode = null;
    this.geoLocation = { lat: "", lon: "" };
    this.rawLocation = null;
  }

  @action
  clear() {
    this.clearModal();
    this.args.model.update(null);
    this.args.closeModal();
  }

  @action
  submit() {
    if (this.submitDisabled) {
      return;
    }

    let location = {};

    const geocodingEnabled = this.siteSettings.location_geocoding !== "none";
    const inputFieldsEnabled = this.siteSettings.location_input_fields_enabled;
    const inputFields = this.inputFields;
    const hasCoordinates = inputFields.indexOf("coordinates") > -1;

    if (!geocodingEnabled && !inputFieldsEnabled) {
      location["raw"] = this.rawLocation;
    }

    if (inputFieldsEnabled) {
      const nonGeoProps = inputFields.filter((f) => f !== "coordinates");

      nonGeoProps.forEach((f) => {
        location[f] = this[f];
      });
    }

    if (geocodingEnabled || hasCoordinates) {
      const geoLocation = this.geoLocation;
      if (geoLocation && geoLocation.lat && geoLocation.lon) {
        location["geo_location"] = geoLocation;
      }
    }

    let name = this.name;

    if (name) {
      location["name"] = name;
    }

    Object.keys(location).forEach((k) => {
      if (location[k] == null || location[k] === "" || location[k] === {}) {
        delete location[k];
      }
    });

    if (Object.keys(location).length === 0) {
      location = null;
    }

    this.args.model.update(location);
    this.clearModal();
    this.args.closeModal();
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
