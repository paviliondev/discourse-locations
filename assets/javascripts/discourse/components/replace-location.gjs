import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import bodyClass from "discourse/helpers/body-class";
import icon from "discourse-common/helpers/d-icon";
import UserLocation from "./user-location";

export default class ReplaceLocationComponent extends Component {
  @service siteSettings;

  get showUserLocation() {
    return (
      !!this.args.model.custom_fields?.geo_location &&
      this.args.model.custom_fields?.geo_location !== "{}"
    );
  }

  get linkWebsite() {
    return !this.args.model.isBasic;
  }

  get removeNoFollow() {
    return (
      this.args.model.trust_level > 2 && !this.siteSettings.tl3_links_no_follow
    );
  }

  <template>
    {{bodyClass "map-location-enabled"}}
    {{#if this.showUserLocation}}
      <div class="user-profile-location">
        <UserLocation @user={{@model}} @formFactor="profile" />
      </div>
    {{/if}}
    {{#if @model.website_name}}
      <div class="user-profile-website">
        {{icon "globe"}}
        {{#if this.linkWebsite}}
          {{! template-lint-disable link-rel-noopener }}
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
