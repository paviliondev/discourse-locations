import {
  acceptance,
  exists,
  query,
} from "discourse/tests/helpers/qunit-helpers";
import { click, visit } from "@ember/test-helpers";
import { test } from "qunit";
import topicListFixtures from "../fixtures/topic-list-with-location";
import siteFixtures from "../fixtures/site-fixtures";
import { cloneJSON } from "discourse-common/lib/object";

acceptance("Topic List- Show Correct Topic Location Format", function (needs) {
  needs.user();
  needs.settings({
    location_enabled: true,
  });
  needs.site(cloneJSON(siteFixtures["site.json"]));
  needs.pretender((server, helper) => {
    const topicListResponse = cloneJSON(topicListFixtures["/latest.json"]);
    server.get("/latest.json", () => helper.response(topicListResponse));
  });

  test("topic on topic list location - shows correct format", async function (assert) {
    await visit("/latest");
    assert.equal(
      query('tr[data-topic-id="36"] span.location-after-title').innerText,
      "Pompidou, Paris, France"
    );
  });
});
