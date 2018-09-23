export default {
  setupComponent(args, component) {
    const enabled = Discourse.SiteSettings.location_users_map;
    if (enabled) {
      Ember.run.scheduleOnce('afterRender', () => {
        const $existingLocation = $('span.location');
        component.$('span.map-location').insertAfter($existingLocation);
        $existingLocation.hide();
        $('span.website-name').css("margin-top","-3%");
      });
    }
  }
};
