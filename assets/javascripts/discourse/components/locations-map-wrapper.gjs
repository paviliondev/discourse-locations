import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import LocationsMap from "./locations-map";

export default class LocationMapWrapperComponent extends Component {
  @tracked mapType = "";

  constructor() {
    super(...arguments);
    this.mapType = this.args.params.mapType;
  }

  <template>
    <LocationsMap @mapType={{this.mapType}} />
  </template>
}
