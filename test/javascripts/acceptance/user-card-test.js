import {
  acceptance,
  exists,
  query,
} from "discourse/tests/helpers/qunit-helpers";
import { click, visit } from "@ember/test-helpers";
import User from "discourse/models/user";
import { test } from "qunit";
import userFixtures from "../fixtures/user-fixtures";
import { cloneJSON } from "discourse-common/lib/object";

acceptance("User Card - Show Correct User Location Format", function (needs) {
  needs.user();
  needs.settings({
    location_enabled: true,
    location_user_profile_format: "city|countrycode",
  });
  console.log('hello this far!');
  needs.pretender((server, helper) => {
    const cardResponse = cloneJSON(userFixtures["/u/merefield/card.json"]);
    server.get("/u/merefield/card.json", () => helper.response(cardResponse));
  });

  test("user card location - shows correct format", async function (assert) {
    console.log('hello this far!');
    await visit("/t/this-is-a-test-topic/9");
    await click('a[data-user-card="merefield"]');

    assert.equal(
      query(".user-card .location-label").innerText,
      "London, United Kingdom"
    );
  });
});
