export default {
  setupComponent(args, component) {
    const enabled = Discourse.SiteSettings.location_users_map;
    if (enabled) {
      Ember.run.scheduleOnce('afterRender', () => {
        component.$('span.map-location').prependTo($('.user-main .location-and-website'));
        $('.user-main .location-and-website > .d-icon-map-marker').remove();
        $('.user-main .location-and-website').contents().filter((_, el) => el.nodeType === 3).remove();
      });

      component.set('showUserLocation', !!args.model.custom_fields.geo_location);
    }
  }
};
