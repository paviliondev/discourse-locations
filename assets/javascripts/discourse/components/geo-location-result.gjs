import Component from "@ember/component";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import geoLocationFormat from "../helpers/geo-location-format";

export default class GeoLocationResultComponent extends Component {
  <template>
    <li class="location-form-result {{if @location.selected 'selected'}}">
      <label {{on "click" (fn @updateGeoLocation @location false)}}>
        {{geoLocationFormat @location @geoAttrs}}
        {{#if this.showType}}
          {{#if @location.type}}
            <div class="location-type">/
              {{@location.type}}
            </div>
          {{/if}}
        {{/if}}
      </label>
    </li>
  </template>
}
