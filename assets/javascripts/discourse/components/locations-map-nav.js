import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action, computed } from "@ember/object";
import DiscourseURL from "discourse/lib/url";

export default class LocationForm extends Component {
  @service locationsMapHelper;

  @computed("args.category")
  get href() {
    debugger;
    return this.locationsMapHelper.hrefForCategory(this.args.category);
  };

  @computed("filterMode", "locationsMapHelper.active")
  get active() {
    console.log(this.args.filterMode);
    return this.args.filterMode.split("/").pop() === "latest" && this.locationsMapHelper.active;
  };

  @action
  click(event) {
    event.preventDefault();
    debugger;
    DiscourseURL.routeTo(`${this.href}`);
  };
}