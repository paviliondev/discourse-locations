export default {
  setupComponent(attrs, component) {
    const enabled = Discourse.SiteSettings.location_users_map;
    if (enabled) {
      Ember.run.scheduleOnce('afterRender', () => {
        const $existingLocationInput = $('.control-group.pref-location');
        component.$('.control-group').insertAfter($existingLocationInput);
        $existingLocationInput.hide();
      });
    }
  }
};
