import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { Input } from "@ember/component";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { action, set } from "@ember/object";
import { equal } from "@ember/object/computed";
import { inject as service } from "@ember/service";
import { htmlSafe } from "@ember/template";
import $ from "jquery";
import { hash } from "rsvp";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import { ajax } from "discourse/lib/ajax";
import i18n from "discourse-common/helpers/i18n";
import I18n from "I18n";
import ComboBox from "select-kit/components/combo-box";
import { geoLocationSearch, providerDetails } from "../lib/location-utilities";
import GeoLocationResult from "./geo-location-result";
import LocationSelector from "./location-selector";

export default class LocationForm extends Component {
  @service siteSettings;
  @service site;
  @tracked geoLocationOptions = A();
  @tracked internalInputFields = [];
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
  @tracked formLatitude;
  @tracked formLongitude;
  @tracked geoLocation = {};
  context = null;

  showTitle = equal("appType", "discourse");

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

      const hasCoordinates =
        this.internalInputFields.indexOf("coordinates") > -1;

      if (hasCoordinates && this.args.geoLocation) {
        this.formLatitude = this.args.geoLocation.lat;
        this.formLongitude = this.args.geoLocation.lon;
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
        url: "/locations/countries",
        type: "GET",
      }).then((result) => {
        this.countrycodes = result.geo;
      });
    }
  }

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
  updateGeoLocation(gl, force_coords) {
    if (!this.showInputFields) {
      gl = this.geoLocation;
    }

    gl["zoomTo"] = true;

    if (force_coords) {
      gl.lat = this.formLatitude;
      gl.lon = this.formLongitude;
    } else {
      this.formLatitude = gl.lat;
      this.formLongitude = gl.lon;
    }

    if (
      gl.address &&
      this.siteSettings.location_auto_infer_street_from_address_data &&
      gl.address.indexOf(gl.city) > 0
    ) {
      gl.street = gl.address
        .slice(0, gl.address.indexOf(gl.city))
        .replace(/,(\s+)?$/, "");
    }

    this.internalInputFields.forEach((f) => {
      if (f === "coordinates") {
        this.formLatitude = gl.lat;
        this.formLongitude = gl.lon;
      } else {
        this[`form${f.charAt(0).toUpperCase() + f.substr(1).toLowerCase()}`] =
          gl[f];
      }
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
      if (f === "coordinates") {
        request["lat"] = this.formLatitude;
        request["lon"] = this.formLongitude;
      }
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

        if (result.error) {
          throw new Error(result.error);
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
  <template>
    <div class="location-form">
      {{#if this.showAddress}}
        <div class="address">
          {{#if this.showInputFields}}
            {{#if this.showTitle}}
              <div class="title">
                {{i18n "location.address"}}
              </div>
            {{/if}}
            {{#if this.showStreet}}
              <div class="control-group">
                <label class="control-label">{{i18n
                    "location.street.title"
                  }}</label>
                <div class="controls">
                  <Input
                    @type="text"
                    @value={{this.formStreet}}
                    class="input-large input-location"
                    @disabled={{this.streetDisabled}}
                  />
                </div>
                <div class="instructions">{{i18n "location.street.desc"}}</div>
              </div>
            {{/if}}
            {{#if this.showNeighbourhood}}
              <div class="control-group">
                <label class="control-label">{{i18n
                    "location.neighbourhood.title"
                  }}</label>
                <div class="controls">
                  <Input
                    @value={{this.formNeighbourhood}}
                    class="input-large input-location"
                    @disabled={{this.neighbourhoodDisabled}}
                  />
                </div>
                <div class="instructions">{{i18n
                    "location.neighbourhood.desc"
                  }}</div>
              </div>
            {{/if}}
            {{#if this.showPostalcode}}
              <div class="control-group">
                <label class="control-label">{{i18n
                    "location.postalcode.title"
                  }}</label>
                <div class="controls">
                  <Input
                    @type="text"
                    @value={{this.formPostalcode}}
                    class="input-small input-location"
                    @disabled={{this.postalcodeDisabled}}
                  />
                </div>
                <div class="instructions">{{i18n "location.postalcode.desc"}}</div>
              </div>
            {{/if}}
            {{#if this.showCity}}
              <div class="control-group">
                <label class="control-label">{{i18n "location.city.title"}}</label>
                <div class="controls">
                  <Input
                    @type="text"
                    @value={{this.formCity}}
                    class="input-large input-location"
                    @disabled={{this.cityDisabled}}
                  />
                </div>
                <div class="instructions">{{i18n "location.city.desc"}}</div>
              </div>
            {{/if}}
            {{#if this.showState}}
              <div class="control-group">
                <label class="control-label">{{i18n "location.state.title"}}</label>
                <div class="controls">
                  <Input
                    @value={{@state}}
                    class="input-large input-location"
                    @disabled={{this.stateDisabled}}
                  />
                </div>
                <div class="instructions">{{i18n "location.state.desc"}}</div>
              </div>
            {{/if}}
            {{#if this.showCountrycode}}
              <div class="control-group">
                <label class="control-label">{{i18n
                    "location.country_code.title"
                  }}</label>
                <div class="controls">
                  <ComboBox
                    @valueProperty="code"
                    @nameProperty="name"
                    @content={{this.countrycodes}}
                    @value={{this.formCountrycode}}
                    class="input-location country-code"
                    @onChange={{fn (mut this.formCountrycode)}}
                    @options={{hash
                      filterable="true"
                      disabled=this.countryDisabled
                      none="location.country_code.placeholder"
                    }}
                  />
                </div>
              </div>
            {{/if}}
          {{else}}
            <div class="control-group">
              <label class="control-label">{{i18n "location.query.title"}}</label>
              <div class="controls location-selector-container">
                {{#if this.showGeoLocation}}
                  <LocationSelector
                    @location={{this.geoLocation}}
                    @onChange={{action this.updateGeoLocation}}
                    @class="input-xxlarge location-selector"
                    {{on "searchError" @searchError}}
                    @context={{this.context}}
                  />
                {{else}}
                  <Input
                    @type="text"
                    @value={{this.rawLocation}}
                    class="input-xxlarge input-location"
                  />
                {{/if}}
              </div>
              <div class="instructions">
                {{i18n "location.query.desc"}}
              </div>
            </div>
          {{/if}}
          {{#if this.showGeoLocation}}
            {{#if this.showInputFields}}
              <button
                class="btn btn-default wizard-btn location-search"
                onclick={{this.locationSearch}}
                disabled={{this.searchDisabled}}
                type="button"
              >
                {{i18n "location.geo.btn.label"}}
              </button>
              {{#if this.showLocationResults}}
                <div class="location-results">
                  <h4>{{i18n "location.geo.results"}}</h4>
                  <ul>
                    {{#if this.hasSearched}}
                      <ConditionalLoadingSpinner @condition={{this.loadingLocations}}>
                        {{log this.geoLocationOptions}}
                        {{#each this.geoLocationOptions as |l|}}
                          <GeoLocationResult
                            @updateGeoLocation={{this.updateGeoLocation}}
                            @location={{l}}
                            @geoAttrs={{this.geoAttrs}}
                          />
                        {{else}}
                          <li class="no-results">{{i18n
                              "location.geo.no_results"
                            }}</li>
                        {{/each}}
                      </ConditionalLoadingSpinner>
                    {{/if}}
                  </ul>
                </div>
                {{#if this.showProvider}}
                  <div class="location-form-instructions">{{htmlSafe
                      (i18n "location.geo.desc" provider=this.providerDetails)
                    }}</div>
                {{/if}}
              {{/if}}
            {{/if}}
          {{/if}}
        </div>
      {{/if}}

      {{#if this.showCoordinates}}
        <div class="coordinates">
          <div class="title">
            {{i18n "location.coordinates"}}
          </div>
          <div class="control-group">
            <label class="control-label">{{i18n "location.lat.title"}}</label>
            <div class="controls">
              <Input
                @type="number"
                @value={{this.formLatitude}}
                {{on "change" (fn this.updateGeoLocation this.geoLocation true)}}
                {{on "onKepyUp" (fn this.updateGeoLocation this.geoLocation true)}}
                @step="any"
                class="input-small input-location lat"
              />
              <div class="icon">
                <img src="/plugins/discourse-locations/images/latitude.png" />
              </div>
            </div>
            <div class="instructions">
              {{i18n "location.lat.desc"}}
            </div>
          </div>
          <div class="control-group">
            <label class="control-label">{{i18n "location.lon.title"}}</label>
            <div class="controls">
              <Input
                @type="number"
                @value={{this.formLongitude}}
                {{on "change" (fn this.updateGeoLocation this.geoLocation true)}}
                {{on "onKepyUp" (fn this.updateGeoLocation this.geoLocation true)}}
                @step="any"
                class="input-small input-location lon"
              />
              <div class="icon">
                <img src="/plugins/discourse-locations/images/longitude.png" />
              </div>
            </div>
            <div class="instructions">
              {{i18n "location.lon.desc"}}
            </div>
          </div>
        </div>
      {{/if}}
    </div>
  </template>
}
