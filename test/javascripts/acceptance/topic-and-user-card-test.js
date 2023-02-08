import {
  acceptance,
  exists,
  query,
} from "discourse/tests/helpers/qunit-helpers";
import { click, visit } from "@ember/test-helpers";
import { test } from "qunit";
import userFixtures from "../fixtures/user-fixtures";
import topicFixtures from "../fixtures/topic-fixtures";
import siteFixtures from "../fixtures/site-fixtures";
import { cloneJSON } from "discourse-common/lib/object";

acceptance("Topic & User Card - Show Correct User Location Format", function (needs) {
  needs.user();
  needs.settings({
    location_enabled: true,
    location_user_profile_format: "city|countrycode",
    location_user_post_format: "city|countrycode",
    location_user_post: true,
    location_users_map: true,
    hide_user_profiles_from_public: false,
  });
  needs.site(cloneJSON(siteFixtures["site.json"]));
  needs.pretender((server, helper) => {
    const cardResponse = cloneJSON(userFixtures["/u/merefield/card.json"]);
    server.get("/u/merefield/card.json", () => helper.response(cardResponse));
    const topicResponse = cloneJSON(topicFixtures["/t/51/1.json"]);
    server.get("/t/51/1.json", () => helper.response(topicResponse));
  });

  test("topic title location, post user & user card location - shows correct format", async function (assert) {
    await visit("/t/online-learning/51/1");
    assert.equal(
      query("span.location-text").innerText,
      "Pompidou, Paris, France"
    );
    assert.equal(
      query(".small-action-desc.timegap").innerText,
      "2 years later"
    );
    assert.equal(
      query("#post_3 .user-location").innerText,
      "Paris, France"
    );
    assert.equal(
      query('a[data-user-card="merefield"]').innerText,
      ""
    );
    await click('a[data-user-card="merefield"]');
    assert.equal(
      query(".user-card .location-label").innerText,
      "London, United Kingdom"
    );
  });
});
