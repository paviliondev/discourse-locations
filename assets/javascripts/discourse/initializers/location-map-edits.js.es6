import { withPluginApi } from 'discourse/lib/plugin-api';
import { or } from "@ember/object/computed";

export default {
  name:'location-map-renderer',
  initialize(){
    withPluginApi('0.8.12', api => {

      if (Discourse.SiteSettings.location_hamburger_menu_map_link) {
        api.decorateWidget('hamburger-menu:generalLinks', () => {
          return { route: 'discovery.map', label: 'filters.map.title' };
        });
      }

      api.modifyClass('route:users', {
        refreshQueryWithoutTransition: false,

        beforeModel(transition) {
          this.handleMapTransition(transition);
          this._super(transition);
        },

        handleMapTransition(transition) {
          const intent = transition.intent;

          if (intent.url == "/u" && !intent.name && Discourse.SiteSettings.location_users_map_default) {
            return this.replaceWith('users.user-map');
          }

          if (intent.name === 'users.user-map') {
            if (!intent.queryParams.period || intent.queryParams.period !== 'location') {
              this.changePeriod(transition, 'location');
            }
          } else if (intent.name === 'users.index') {
            if (intent.queryParams.period === 'location') {
              this.changePeriod(transition, 'weekly');
            }
          }
        },

        changePeriod(transition, period) {
          // abort is necessary here because of https://github.com/emberjs/ember.js/issues/12169
          transition.abort();

          return this.replaceWith(transition.intent.name, { queryParams: { period }});
        },

        renderTemplate() {
          this.render('users');
        },

        actions: {
          willTransition(transition) {
            this.handleMapTransition(transition);
            this._super(transition);
          }
        }
      });

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
