import { default as computed } from "discourse-common/utils/decorators";
import Component from "@glimmer/component";
import { action } from "@ember/object";
import { bind } from "@ember/runloop";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import DButton from "discourse/components/d-button";
import icon from "discourse-common/helpers/d-icon";
import locationFormat from "../helpers/location-format";
import i18n from "discourse-common/helpers/i18n";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import willDestroy from "@ember/render-modifiers/modifiers/will-destroy";
import LocationsMap from "./locations-map";

export default class LocationLableContainerComponent extends Component {
  @service siteSettings;
  @service site;
  @tracked locationAttrs = [];
  @tracked geoAttrs = [];
  @tracked showMap = false;

  get mapButtonLabel() {
    return `location.geo.${this.showMap ? "hide" : "show"}_map`
  }

  get showMapButtonLabel() {
    return !this.site.mobileView;
  }

  get showMapToggle() {
    return this.args.topic.location.geo_location && this.siteSettings.location_topic_map;
  }

  get opts() {
    let opts = {};
    if (this.locationAttrs) {
      opts["attrs"] = this.locationAttrs;
    }
    if (this.geoAttrs) {
      opts["geoAttrs"] = this.geoAttrs;
    }
    return opts;
  }

  @action
  bindClick() {
    $(document).on("click", bind(this, this.outsideClick));
  }

  @action
  unbindClick() {
    $(document).off("click", bind(this, this.outsideClick));
  }

  outsideClick = (e) => {
    if (
      !this.isDestroying &&
      !(
        $(e.target).closest(".map-expand").length ||
        $(e.target).closest(".map-attribution").length ||
        $(e.target).closest(".location-topic-map").length ||
        $(e.target).closest("#locations-map").length
      )
    ) {
      this.showMap = false;
    }
  }

  @action
  toggleMap() {
    this.showMap = !this.showMap;
  }
  
  <template>
    <div {{didInsert this.bindClick}} {{willDestroy this.unbindClick}} class="location-label-container">
      <div class="location-label" title={{i18n "location.label.title"}}>
        {{icon "map-marker-alt"}}
        <span class="location-text">
          {{locationFormat this.args.topic.location this.opts}}
        </span>
      </div>

      {{#if this.showMapToggle}}
        <div class="location-topic-map">
          <DButton
            @action={{this.toggleMap}}
            class="btn btn-small btn-default"
            @icon="far-map"
            @label={{if this.showMapButtonLabel this.mapButtonLabel}}
          />
        </div>
        {{#if this.showMap}}
          <div class="map-component map-container small">
            <LocationsMap @topic={{this.args.topic}} @mapType="topic" />
          </div>
        {{/if}}
      {{/if}}
    </div>
  </template>
};
