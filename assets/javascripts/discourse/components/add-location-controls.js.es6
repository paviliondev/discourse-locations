import { locationFormat } from "../lib/location-utilities";
import { default as computed } from "discourse-common/utils/decorators";
import Component from "@ember/component";
import { inject as service } from "@ember/service";
import AddLocationComponent from "../components/modal/add-location";

export default Component.extend({
  modal: service(),
  classNames: ["location-label"],

  didInsertElement() {
    $(".title-and-category").toggleClass(
      "location-add-no-text",
      this.get("iconOnly")
    );
  },

  @computed("noText")
  iconOnly(noText) {
    return noText || this.siteSettings.location_add_no_text;
  },

  @computed("noText")
  valueClasses(noText) {
    let classes = "add-location-btn";
    if (noText) {
      classes += " btn-primary";
    }
    return classes;
  },

  @computed("location", "noText")
  valueLabel(location, noText) {
    return noText
      ? ""
      : locationFormat(
          location,
          this.site.country_codes,
          this.siteSettings.location_input_fields_enabled,
          this.siteSettings.location_input_fields
        );
  },

  @computed("noText")
  addLabel(noText) {
    return noText ? "" : "composer.location.btn";
  },

  actions: {
    showAddLocation() {
      return this.modal.show(AddLocationComponent, {
        model: {
          location: this.get("location"),
          categoryId: this.get("category.id"),
          update: (location) => {
            if (this._state !== "destroying") {
              this.set("location", location);
            }
          },
        },
      });
    },

    removeLocation() {
      this.set("location", null);
    },
  },
});
