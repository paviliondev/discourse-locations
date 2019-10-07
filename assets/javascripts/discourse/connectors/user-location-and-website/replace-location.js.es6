export default {
  setupComponent(args, component) {
    const enabled = Discourse.SiteSettings.location_users_map;
    if (enabled) {
      Ember.run.scheduleOnce('afterRender', () => {
        $('.user-main .location-and-website').addClass('map-location-enabled');
      });

      component.set('showUserLocation', !!args.model.custom_fields.geo_location);
    }
  }
};
