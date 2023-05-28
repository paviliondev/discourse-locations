import { geoLocationSearch, providerDetails } from "../lib/location-utilities";
import { ajax } from "discourse/lib/ajax";
import { action, set } from "@ember/object";
import { equal } from "@ember/object/computed";
import { A } from "@ember/array";
import { inject as service } from "@ember/service";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import I18n from "I18n";

export default class LocationForm extends Component {
  @service siteSettings;
  @service site;
  @tracked geoLocationOptions = A();
  @tracked internalInputFields = [
    "street",
    "postalcode",
    "city",
    "countrycode",
  ];
  @tracked provider = "";
  @tracked hasSearched = false;
  @tracked searchDisabled = false;
  @tracked showProvider = false;
  @tracked showGeoLocation = true;
  @tracked countrycodes = [];
  @tracked loadingLocations = false;
  @tracked showLocationResults = false;
  @tracked formStreet;
  @tracked formNeighbourhood;
  @tracked formPostalcode;
  @tracked formCity;
  @tracked formState;
  @tracked formCountrycode;
  context = null;

  showTitle = equal("appType", "discourse");

  get showInputFields() {
    if (this.args.inputFieldsEnabled === false) {
      return false;
    }
    return (
      this.args.inputFieldsEnabled ||
      this.siteSettings.location_input_fields_enabled
    );
  }

  get showAddress() {
    return (
      !this.showInputFields ||
      (this.showInputFields &&
        this.internalInputFields.filter((f) => f !== "coordinates").length > 0)
    );
  }

  constructor() {
    super(...arguments);

    if (this.showInputFields) {
      this.internalInputFields = this.args.inputFields;

      this.searchDisabled = true;

      this.internalInputFields.forEach((f) => {
        this[
          `show${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`
        ] = true;
        this[`form${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`] =
          this.args[f];

        if (["street", "neighbourhood", "postalcode", "city"].includes(f)) {
          this.searchDisabled = false;
        }
      });

      if (this.args.disabledFields) {
        this.args.disabledFields.forEach((f) => {
          this.set(`${f}Disabled`, true);
        });
      }

      const geocoding = this.siteSettings.location_geocoding;
      this.showGeoLocation = geocoding !== "none";
      this.showLocationResults = geocoding === "required";

      if (this.searchOnInit) {
        this.send("locationSearch");
      }
    }

    const siteCodes = this.site.country_codes;
    if (siteCodes) {
      this.countrycodes = siteCodes;
    } else {
      ajax({
        url: "/location/countries",
        type: "GET",
      }).then((result) => {
        this.countrycodes = result.geo;
      });
    }
  }

  get providerDetails() {
    return providerDetails[
      this.provider || this.siteSettings.location_geocoding_provider
    ];
  }

  keyDown(e) {
    if (this.showGeoLocation && e.keyCode === 13) {
      this.send("locationSearch");
    }
  }

  get searchLabel() {
    return I18n.t(`location.geo.btn.${this.siteSettings.location_geocoding}`);
  }

  @action
  updateGeoLocation(gl) {
    gl["zoomTo"] = true;

    if (gl.address.indexOf(gl.city) > 0) {
      gl.street = gl.address
        .slice(0, gl.address.indexOf(gl.city))
        .replace(/,(\s+)?$/, "");
    }

    this.internalInputFields.forEach((f) => {
      this[`form${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`] =
        gl[f];
    });
    this.args.setGeoLocation(gl);
    this.geoLocationOptions.forEach((o) => {
      set(o, "selected", o["address"] === gl["address"]);
    });
  }

  @action
  clearSearch() {
    this.geoLocationOptions.clear();
    this.args.geoLocation = null;
  }

  @action
  locationSearch() {
    let request = {};

    const searchInputFields = this.internalInputFields.concat([
      "countrycode",
      "context",
    ]);
    searchInputFields.map((f) => {
      request[f] =
        this[`form${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`];
    });

    if ($.isEmptyObject(request)) {
      return;
    }

    this.showLocationResults = true;
    this.loadingLocations = true;
    this.hasSearched = true;
    this.showProvider = false;

    geoLocationSearch(request, this.siteSettings.location_geocoding_debounce)
      .then((result) => {
        if (this._state === "destroying") {
          return;
        }

        if (result.provider) {
          this.provider = result.provider;
        }

        this.showProvider = result.locations.length > 0;

        this.geoLocationOptions.setObjects(result.locations);

        if (this.geoLocation) {
          this.updateGeoLocation(this.geoLocation);
        }

        this.loadingLocations = false;
      })
      .catch((error) => {
        this.args.searchError(error);
      });
  }
}
