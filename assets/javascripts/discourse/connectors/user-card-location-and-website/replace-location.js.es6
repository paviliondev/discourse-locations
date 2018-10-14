export default {
  setupComponent(args, component) {
    const enabled = Discourse.SiteSettings.location_users_map;
    if (enabled) {
      Ember.run.scheduleOnce('afterRender', () => {
        component.$('span.map-location').prependTo($('#user-card .location-and-website'));
        $('#user-card .location').hide();
      });
    }
  }
};
