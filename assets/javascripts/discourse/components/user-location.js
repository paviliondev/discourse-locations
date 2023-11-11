import { action } from "@ember/object";
import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import I18n from "I18n";

export default class LocationMapComponent extends Component {
  @service siteSettings;
  @service site;
  @tracked showMap = false;

  get mapButtonLabel() {
    return I18n.t(`location.geo.${this.showMap ? "hide" : "show"}_map`);
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

  @action
  toggleMap() {
    this.showMap = !this.showMap;
  }
}
