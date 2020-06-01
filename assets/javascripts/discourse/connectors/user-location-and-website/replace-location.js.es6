import { scheduleOnce } from "@ember/runloop";

export default {
  setupComponent(args, component) {

    const enabled = component.siteSettings.location_users_map;

    if (enabled) {
      scheduleOnce('afterRender', () => {
        $('.user-main .location-and-website').addClass('map-location-enabled');
      });

      component.set('showUserLocation', !!args.model.custom_fields.geo_location);
      component.set('linkWebsite', !args.model.isBasic);
    }
  }
};
