import { action } from "@ember/object";
import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import I18n from "I18n";
import DButton from "discourse/components/d-button";
import icon from "discourse-common/helpers/d-icon";
import { geoLocationFormat } from "../lib/location-utilities";
import LocationsMap from "./locations-map";

export default class LocationMapComponent extends Component {
  @service siteSettings;
  @service site;
  @tracked showMap = false;

  get mapButtonLabel() {
    return `location.geo.${this.showMap ? "hide" : "show"}_map`
  }

  get showMapButtonLabel() {
    return this.args.formFactor !== "card" && !this.site.mobileView;
  }

  get userLocation() {
    let locationText = "";
    if (this.args.user && this.args.user.geo_location) {
      let format = this.siteSettings.location_user_profile_format.split("|");
      let opts = {};

      if (format.length && format[0]) {
        opts["geoAttrs"] = format;
        locationText = geoLocationFormat(
          this.args.user.geo_location,
          this.site.country_codes,
          opts
        );
      } else {
        locationText = this.args.user.geo_location.address;
      }
    }
    return locationText;
  }

  get canShowMap() {
    return !document.querySelector(".leaflet-container");
  }

  @action
  toggleMap() {
    this.showMap = !this.showMap;
  }

  <template>
    <div class="user-location-widget">
      {{icon "map-marker-alt"}}
      <div class="location-label">
        {{this.userLocation}}
      </div>
      {{#if this.canShowMap}}
        <div class="map-wrapper">
          <DButton
            class="widget-button btn btn-default btn-show-map btn-small btn-icon-text"
            @action={{this.toggleMap}}
            @icon="far-map"
            @label={{if this.showMapButtonLabel this.mapButtonLabel}}
          />
          {{#if this.showMap}}
            <div class="map-container small">
              <LocationsMap @mapType="user" @user={{@user}} />
            </div>
          {{/if}}
        </div>
      {{/if}}
    </div>
  </template>
}
