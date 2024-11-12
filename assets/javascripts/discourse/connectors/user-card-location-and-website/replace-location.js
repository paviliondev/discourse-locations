import { scheduleOnce } from "@ember/runloop";

export default {
  setupComponent(args, component) {
    const enabled = component.siteSettings.location_users_map;

    component.deferredWork = () => {
      let element = component.element;

      // Traverse up the DOM tree to find the closest ancestor with the class "location-and-website"
      while (element && !element.classList.contains("location-and-website")) {
        element = element.parentElement;
      }

      // If a matching parent is found, add the class "map-location-enabled"
      if (element) {
        element.classList.add("map-location-enabled");
      }
    };

    if (enabled) {
      scheduleOnce("afterRender", this, this.deferredWork);
      component.set("showUserLocation", !!args.user.geo_location);
      component.set("linkWebsite", !args.user.isBasic);
    }
  },
};
