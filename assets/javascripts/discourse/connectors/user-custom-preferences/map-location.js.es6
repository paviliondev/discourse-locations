import { scheduleOnce } from "@ember/runloop";

export default {
  setupComponent(attrs, component) {

    const enabled = component.siteSettings.location_users_map;

    if (enabled) {
      scheduleOnce('afterRender', () => {
        const $existingLocationInput = $('.control-group.pref-location');
        $('.control-group', component.element).insertAfter($existingLocationInput);
        $existingLocationInput.hide();
      });
    }
  },
  
  actions: {
    searchError(error) {
      this.set('error', error);
    }
  }
};
