import { withPluginApi } from 'discourse/lib/plugin-api';
import { or } from "@ember/object/computed";

export default {
  name:'location-map-renderer',
  initialize(container){
    withPluginApi('0.8.12', api => {

      const siteSettings = container.lookup('site-settings:main');

      if (siteSettings.location_hamburger_menu_map_link) {
        api.decorateWidget('hamburger-menu:generalLinks', () => {
          return { route: 'discovery.map', label: 'filters.map.title' };
        });
      };

      api.modifyClass('component:user-card-contents', {
        hasLocationOrWebsite: or(
          "user.location",
          "user.website_name",
          "user.geo_location"
        )
      })
    });
  }
};
