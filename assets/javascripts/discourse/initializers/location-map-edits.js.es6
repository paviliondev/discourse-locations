import { withPluginApi } from 'discourse/lib/plugin-api';
import { default as discourseComputed } from 'discourse-common/utils/decorators';
import { or } from "@ember/object/computed";

const PLUGIN_ID = "locations-plugin";

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

      api.modifyClass('route:users', {
        pluginId: PLUGIN_ID,

        refreshQueryWithoutTransition: false,

        beforeModel(transition) {
          this.handleMapTransition(transition);
          this._super(transition);
        },

        handleMapTransition(transition) {
          const intent = transition.intent;
          const name = transition.targetName
          const queryParams = intent.router.activeTransition.to.queryParams

          if (intent.url == "/u" && siteSettings.location_users_map_default) {
            return this.replaceWith('users.user-map');
          }

          if (name === 'users.user-map') {
            if (!queryParams.period || queryParams.period !== 'location') {
              this.changePeriod(transition, 'location');
            }
          } else if (name === 'users.index') {
            if (queryParams.period === 'location') {
              this.changePeriod(transition, 'weekly');
            }
          }
        },

        changePeriod(transition, period) {
          // abort is necessary here because of https://github.com/emberjs/ember.js/issues/12169
          transition.abort();

          return this.replaceWith(transition.targetName, { queryParams: { period }});
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

      api.modifyClass ('component:user-card-contents', {
        pluginId: PLUGIN_ID,
        
        @discourseComputed("user")
        hasLocaleOrWebsite(user) {
          return user.geo_location || user.location || user.website_name || this.userTimezone;
        }
      });
    });
  }
};
