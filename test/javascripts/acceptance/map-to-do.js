import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";
import { cloneJSON } from "discourse-common/lib/object";
import altSiteFixtures from "../fixtures/alt-site-fixtures";
import mapFixtures from "../fixtures/map-fixtures";

// TODO This currently won't work because qunit does not currently see the L global variable for Leaflet.  Rename file once resolved.

acceptance("Topic Map - Show Correct Population", function (needs) {
  needs.user();
  needs.settings({
    location_enabled: true,
  });
  needs.site(cloneJSON(altSiteFixtures["site.json"]));
  needs.pretender((server, helper) => {
    const categoryMapResponse = cloneJSON(mapFixtures["/category_map.json"]);
    server.get("/c/general/announcements/24/l/map.json", () =>
      helper.response(categoryMapResponse)
    );
    const mapResponse = cloneJSON(mapFixtures["/map.json"]);
    server.get("/map.json", () => helper.response(mapResponse));
  });

  test("Category map includes the right topics", async function (assert) {
    await visit("/c/general/announcements/24/l/map");

    assert.ok(
      exists(
        'img.leaflet-marker-icon[title="Coolest thing you have seen today"]'
      ),
      "Announcement Topic Location exists"
    );

    assert.false(
      exists('img.leaflet-marker-icon[title="The Room Appreciation Topic"]'),
      "Software and Operating Systems Topic Location does not exist"
    );
  });

  test("General map shows topics from all Categories", async function (assert) {
    await visit("/map");

    assert.ok(
      exists(
        'img.leaflet-marker-icon[title="Coolest thing you have seen today"]'
      ),
      "Announcement Topic Location exists"
    );

    assert.ok(
      exists('img.leaflet-marker-icon[title="The Room Appreciation Topic"]'),
      "Software and Operating Systems Topic Location does exist"
    );
  });
});
