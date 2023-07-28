import { acceptance, query } from "discourse/tests/helpers/qunit-helpers";
import { click, visit } from "@ember/test-helpers";
import { test } from "qunit";
import siteFixtures from "../fixtures/site-fixtures";
import { cloneJSON } from "discourse-common/lib/object";

acceptance(
  "Composer (locations) | don't show default location as user location when behaviour set",
  function (needs) {
    needs.user({
      username: "demetria_gutmann",
      id: 134,
      custom_fields: {
        geo_location: {
          lat: "51.5073219",
          lon: "-0.1276474",
          address: "London, Greater London, England, United Kingdom",
          countrycode: "gb",
          city: "London",
          state: "England",
          country: "United Kingdom",
          postalcode: "",
          boundingbox: ["51.2867601", "51.6918741", "-0.5103751", "0.3340155"],
          type: "city",
        },
      },
    });
    needs.site(cloneJSON(siteFixtures["site.json"]));
    needs.settings({
      location_enabled: true,
      location_users_map: true,
      hide_user_profiles_from_public: false,
      location_topic_default: "none",
      default_composer_category: 11,
    });

    test("composer doesn't contain default location", async function (assert) {
      await visit("/");
      await click("#create-topic");

      assert.equal(
        query(".composer-controls-location span.d-button-label").innerText,
        "Add Location"
      );
    });
  }
);

acceptance(
  "Composer (locations) | - show default location as user location when behaviour set",
  function (needs) {
    needs.user({
      username: "demetria_gutmann",
      id: 134,
      custom_fields: {
        geo_location: {
          lat: "51.5073219",
          lon: "-0.1276474",
          address: "London, Greater London, England, United Kingdom",
          countrycode: "gb",
          city: "London",
          state: "England",
          country: "United Kingdom",
          postalcode: "",
          boundingbox: ["51.2867601", "51.6918741", "-0.5103751", "0.3340155"],
          type: "city",
        },
      },
    });
    needs.site(cloneJSON(siteFixtures["site.json"]));
    needs.settings({
      location_enabled: true,
      location_users_map: true,
      hide_user_profiles_from_public: false,
      location_topic_default: "user",
      default_composer_category: 11,
    });

    test("composer includes default location", async function (assert) {
      await visit("/");
      await click("#create-topic");

      assert.equal(
        query(".composer-controls-location span.d-button-label").innerText,
        "London, Greater London, England, United Kingdom"
      );
    });
  }
);
