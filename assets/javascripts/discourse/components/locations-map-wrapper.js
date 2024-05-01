import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export default class LocationMapWrapperComponent extends Component {
  @tracked mapType = "";

  constructor() {
    super(...arguments);
    this.mapType = this.args.params.mapType;
  }
}
