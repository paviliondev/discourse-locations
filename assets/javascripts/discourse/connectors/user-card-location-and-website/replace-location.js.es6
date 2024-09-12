import { scheduleOnce } from "@ember/runloop";

export default {
  setupComponent(args, component) {
    const enabled = component.siteSettings.location_users_map;

    if (enabled) {
      scheduleOnce("afterRender", () => {
        const parentElement = $(component.element)
          .parents(".location-and-website, .d-user-card__meta-data")
          .first();

        if (parentElement.length > 0) {
          parentElement.addClass("map-location-enabled");
        }
      });
      component.set("showUserLocation", !!args.user.geo_location);
      component.set("linkWebsite", !args.user.isBasic);
    }
  },
};
