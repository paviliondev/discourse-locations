import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import icon from "discourse-common/helpers/d-icon";
import UserLocation from "./user-location";

export default class ReplaceLocationComponent extends Component {
  @service siteSettings;

  get showUserLocation() {
    return !!this.args.model.custom_fields?.geo_location &&
          this.args.model.custom_fields?.geo_location !== "{}"
  }

  get linkWebsite() {
    return !this.args.model.isBasic;
  }

  get removeNoFollow() {
    return this.args.model.trust_level > 2 && !this.siteSettings.tl3_links_no_follow;
  }

  @action
  addClass() {
    $(".user-main .location-and-website").addClass("map-location-enabled");
  }

  <template>
    {{#if this.showUserLocation}}
      <div {{didInsert this.addClass}} class="user-profile-location">
        <UserLocation @user={{@model}} @formFactor="profile" />
      </div>
    {{/if}}
    {{#if @model.website_name}}
      <div class="user-profile-website">
        {{icon "globe"}}
        {{#if this.linkWebsite}}
          <a
            href={{@model.website}}
            rel={{unless this.removeNoFollow "nofollow ugc noopener"}}
            target="_blank"
          >
            {{@model.website_name}}
          </a>
        {{else}}
          <span title={{@model.website}}>{{@model.website_name}}</span>
        {{/if}}
      </div>
    {{/if}}
  </template>
}
