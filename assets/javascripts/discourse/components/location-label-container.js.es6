import { default as computed } from "discourse-common/utils/decorators";
import Component from "@ember/component";
import { bind } from "@ember/runloop";

export default Component.extend({
  classNames: ["location-label-container"],
  locationAttrs: [],
  geoAttrs: [],

  @computed("topic.location.geo_location")
  showMapToggle(geoLocation) {
    return geoLocation && this.siteSettings.location_topic_map;
  },

  @computed("locationAttrs", "geoAttrs")
  opts(locationAttrs, geoAttrs) {
    let opts = {};
    if (locationAttrs) opts["attrs"] = locationAttrs;
    if (geoAttrs) opts["geoAttrs"] = geoAttrs;
    return opts;
  },

  didInsertElement() {
    $(document).on("click", bind(this, this.outsideClick));
  },

  willDestroyElement() {
    $(document).off("click", bind(this, this.outsideClick));
  },

  outsideClick(e) {
    if (
      !this.isDestroying &&
      !(
        $(e.target).closest(".map-expand").length ||
        $(e.target).closest(".map-attribution").length ||
        $(e.target).closest(".location-topic-map").length
      )
    ) {
      this.set("showMap", false);
    }
  },

  actions: {
    showMap() {
      this.toggleProperty("showMap");
    },
  },
});
