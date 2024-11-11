import $ from "jquery";
import TextField from "discourse/components/text-field";
import { findRawTemplate } from "discourse-common/lib/raw-templates";
import { observes } from "discourse-common/utils/decorators";
import {
  geoLocationFormat,
  geoLocationSearch,
  providerDetails,
} from "../lib/location-utilities";

export default TextField.extend({
  autocorrect: false,
  autocapitalize: false,
  classNames: "location-selector",
  context: null,

  didInsertElement() {
    this._super();
    let self = this;
    const location = this.get("location.address");

    let val = "";
    if (location) {
      val = location;
    }

    $(self.element)
      .val(val)
      .autocomplete({
        template: findRawTemplate("javascripts/location-autocomplete"),
        single: true,
        updateData: false,

        dataSource: function (term) {
          let request = { query: term };

          const context = self.get("context");
          if (context) {
            request["context"] = context;
          }

          self.set("loading", true);

          return geoLocationSearch(
            request,
            self.siteSettings.location_geocoding_debounce
          )
            .then((result) => {
              const defaultProvider =
                self.siteSettings.location_geocoding_provider;
              const geoAttrs = self.get("geoAttrs");
              const showType = self.get("showType");
              let locations = [];

              if (!result.locations || result.locations.length === 0) {
                locations = [
                  {
                    no_results: true,
                  },
                ];
              } else {
                locations = result.locations.map((l) => {
                  if (geoAttrs) {
                    l["geoAttrs"] = geoAttrs;
                  }
                  if (showType !== undefined) {
                    l["showType"] = showType;
                  }
                  return l;
                });
              }

              locations.push({
                provider: providerDetails[result.provider || defaultProvider],
              });

              self.set("loading", false);

              return locations;
            })
            .catch((e) => {
              self.set("loading", false);
              this.searchError(e);
            });
        },

        transformComplete: function (l) {
          if (typeof l === "object") {
            self.set("location", l);
            const geoAttrs = self.get("geoAttrs");
            return geoLocationFormat(l, self.site.country_codes, { geoAttrs });
          } else {
            // hack to get around the split autocomplete performs on strings
            document
              .querySelectorAll(".location-form .ac-wrap .item")
              .forEach((element) => {
                element.remove();
              });
            document
              .querySelectorAll(".user-location-selector .ac-wrap .item")
              .forEach((element) => {
                element.remove();
              });
            return self.element.value;
          }
        },

        onChangeItems: function (items) {
          if (items[0] == null) {
            self.set("location", "{}");
          }
        },
      });
  },

  @observes("loading")
  showLoadingSpinner() {
    const loading = this.get("loading");
    const wrap = this.element.parentNode;
    const spinner = document.createElement("span");
    spinner.className = "ac-loading";
    spinner.innerHTML = "<div class='spinner small'></div>";
    if (loading) {
      wrap.insertBefore(spinner, wrap.firstChild);
    } else {
      const existingSpinner = wrap.querySelectorAll(".ac-loading");
      existingSpinner.forEach((el) => el.remove());
    }
  },

  willDestroyElement() {
    this._super();
    $(this.element).autocomplete("destroy");
  },
});
