import {
  acceptance,
  exists,
  query,
  visible,
} from "discourse/tests/helpers/qunit-helpers";
import { click, fillIn, visit } from "@ember/test-helpers";
import { test } from "qunit";
import topicFixtures from "../fixtures/topic-fixtures";
import siteFixtures from "../fixtures/site-fixtures";
import locationFixtures from "../fixtures/location-fixtures";
import { cloneJSON } from "discourse-common/lib/object";
import selectKit from "discourse/tests/helpers/select-kit-helper";

acceptance(
  "Topic - Show Correct Location after entering location with Input Fields Enabled",
  function (needs) {
    needs.user({
      username: "demetria_gutmann",
      id: 134,
    });
    needs.settings({
      location_enabled: true,
      location_input_fields_enabled: true,
      location_input_fields: "street|postalcode|city|countrycode|coordinates",
      location_auto_infer_street_from_address_data: true,
    });
    needs.site(cloneJSON(siteFixtures["site.json"]));
    needs.pretender((server, helper) => {
      const topicResponse = cloneJSON(topicFixtures["/t/51/1.json"]);
      server.get("/t/51/1.json", () => helper.response(topicResponse));
      const locationResponse = cloneJSON(locationFixtures["location.json"]);
      server.get("/locations/search", () => helper.response(locationResponse));
    });

    test("enter Topic location via dialogue", async function (assert) {
      await visit("/t/online-learning/51/1");
      await click("a.edit-topic");
      await click("button.add-location-btn");
      assert.ok(visible(".add-location-modal"), "add location modal is shown");
      await selectKit(".input-location.country-code").expand();
      assert.ok(exists(".input-location.country-code .select-kit-collection"));
      assert.ok(exists(".select-kit-row.is-highlighted.is-selected"));
      assert.equal(
        query(".select-kit-row.is-highlighted.is-selected").innerText,
        "France",
        "France exists in the drop down and is selected"
      );

      await fillIn(".input-large:first-child", "liver building");
      await click("button.location-search");
      await click("li.location-form-result:first-child label");
      assert.equal(
        query(
          ".add-location div.location-form div.coordinates .input-location.lat"
        ).value,
        "53.4058473",
        "Correct latitude is populated"
      );

      await click("#save-location");
      assert.equal(
        query("button.add-location-btn span.d-button-label").innerText,
        "Royal Liver Building, Water Street, Ropewalks, L3 1EG, Liverpool, United Kingdom"
      );
    });

    test("enter Topic location via dialogue using coordinates", async function (assert) {
      await visit("/t/online-learning/51/1");
      await click("a.edit-topic");
      await click("button.add-location-btn");
      assert.ok(visible(".add-location-modal"), "add location modal is shown");
      await fillIn(
        ".add-location div.location-form div.coordinates .input-location.lat",
        "22"
      );
      await fillIn(
        ".add-location div.location-form div.coordinates .input-location.lon",
        "33"
      );

      await click("#save-location");
      await click("button.add-location-btn");
      assert.equal(
        query(
          ".add-location div.location-form div.coordinates .input-location.lat"
        ).value,
        "22",
        "Correct latitude is populated"
      );
      assert.equal(
        query(
          ".add-location div.location-form div.coordinates .input-location.lon"
        ).value,
        "33",
        "Correct latitude is populated"
      );
    });
  }
);
