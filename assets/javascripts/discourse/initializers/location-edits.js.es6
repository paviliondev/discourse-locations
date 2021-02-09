import Composer from 'discourse/models/composer';
import ComposerBody from 'discourse/components/composer-body';
import Topic from 'discourse/models/topic';
import TopicController from 'discourse/controllers/topic';
import NavItem from 'discourse/models/nav-item';
import EditCategorySettings from 'discourse/components/edit-category-settings';
import TopicStatus from 'discourse/raw-views/topic-status';
import { default as discourseComputed, observes, on } from 'discourse-common/utils/decorators';
import { withPluginApi } from 'discourse/lib/plugin-api';
import { geoLocationFormat } from '../lib/location-utilities';
import { scheduleOnce } from "@ember/runloop";
import I18n from "I18n";
import { longDate } from "discourse/lib/formatter";

export default {
  name: 'location-edits',
  initialize(container) {
    const currentUser = container.lookup('current-user:main');
    const siteSettings = container.lookup('site-settings:main');
    const site = container.lookup('site:main');

    withPluginApi('0.8.23', api => {

      api.decorateWidget('post-body:after-meta-data', (helper) => {
        const model = helper.getModel();

        if (siteSettings.location_user_post &&
            currentUser &&
            currentUser.custom_fields.geo_location &&
            currentUser.id === model.user_id) {
          let format = siteSettings.location_user_post_format.split('|');
          let opts = {};
          if (format.length) {
            opts['geoAttrs'] = format;
          }
          return helper.h('div.user-location',
            geoLocationFormat(currentUser.custom_fields.geo_location, site.country_codes, opts)
          );
        }
      });
      api.modifyClass("controller:users", {
        loadUsers(params) {
          if (params.period === "location") {
            return;
          }
          this._super(params);
        },
      });
    });

    TopicStatus.reopen({
      @discourseComputed
      statuses() {
        const topic = this.get("topic");
        const category = this.get('parent.parentView.category');
        let results = this._super(...arguments);

        if ((this.siteSettings.location_topic_status_icon ||
            (category && category.get('custom_fields.location_topic_status'))) &&
            topic.get('location')) {
          const url = topic.get('url');
          results.push({
            icon: 'map-marker-alt',
            title: I18n.t(`topic_statuses.location.help`),
            href: url,
            openTag: 'a href',
            closeTag: 'a'
          });
        }

        return results;
      }
    });

    Composer.reopen({
      @discourseComputed('subtype', 'categoryId', 'topicFirstPost', 'forceLocationControls')
      showLocationControls(subtype, categoryId, topicFirstPost, force) {
        if (!topicFirstPost) return false;
        if (force) return true;
        if (categoryId) {
          const category = this.site.categories.findBy('id', categoryId);
          if (category && category.custom_fields.location_enabled) return true;
        }
        return false;
      },

      clearState() {
        this._super(...arguments);
        this.set('location', null);
      },

      @observes('draftKey')
      _setupDefaultLocation() {
        if (this.draftKey === 'new_topic') {
          const topicDefaultLocation = siteSettings.location_topic_default;
          if (topicDefaultLocation === 'user' && currentUser.custom_fields.geo_location) {
            this.set('location', { geo_location: currentUser.custom_fields.geo_location });
          }
        }
      }
    });

    Composer.serializeOnCreate('location');
    Composer.serializeToTopic('location', 'topic.location');

    ComposerBody.reopen({
      @observes('composer.location')
      resizeWhenLocationAdded: function() {
        this.resize();
      },

      @observes('composer.showLocationControls', 'composer.composeState')
      applyLocationInlineClass() {
        scheduleOnce('afterRender', this, () => {
          const showLocationControls = this.get('composer.showLocationControls');
          const $container = $('.composer-fields .title-and-category');

          $container.toggleClass('show-location-controls', showLocationControls);

          if (showLocationControls) {
            const $anchor = this.site.mobileView ? $container.find('.title-input') : $container;
            $('.composer-controls-location').appendTo($anchor);
          }

          this.resize();
        });
      }
    });

    const subtypeShowLocation = ['event', 'question', 'general'];
    Topic.reopen({
      @discourseComputed('subtype', 'category.custom_fields.location_enabled')
      showLocationControls(subtype, categoryEnabled) {
        return subtypeShowLocation.indexOf(subtype) > -1 || categoryEnabled;
      }
    });

    // necessary because topic-title plugin outlet only recieves model
    TopicController.reopen({
      @observes('editingTopic')
      setEditingTopicOnModel() {
        this.set('model.editingTopic', this.get('editingTopic'));
      }
    });

    NavItem.reopenClass({
      buildList(category, args) {
        let items = this._super(category, args);

        if (category) {
          items = items.reject((item) => item.name === 'map' ); // Don't show Site Level "/map"
          if (category.custom_fields.location_enabled && category.siteSettings.location_category_map_filter) {
            items.push(NavItem.fromText('map', args)); // Show category level "/map" instead
          }
        }

        return items;
      }
    });

    EditCategorySettings.reopen({
      @discourseComputed('category')
      availableViews(category) {
        let views = this._super(...arguments);

        if (category.get('custom_fields.location_enabled') && this.siteSettings.location_category_map_filter) {
          views.push(
            {name: I18n.t('filters.map.title'), value: 'map'}
          );
        }

        return views;
      },
    });

    const mapRoutes = [
      `Map`,
      `MapCategory`,
      `MapCategoryNone`
    ];

    mapRoutes.forEach(function(route){
      var route = container.lookup(`route:discovery.${route}`);
      route.reopen({
        afterModel(model) {
          if (!this.siteSettings.location_category_map_filter) {
            this.replaceWith(`/c/${this.Category.slugFor(model.category)}`);
          }
          return this._super(...arguments);
        },

        renderTemplate(controller, model) {
          let navTemplate = this.routeName.indexOf('Category') > -1 ? 'navigation/category' : 'navigation/default';
          this.render(navTemplate, { outlet: 'navigation-bar' } );
          this.render("discovery/map", { outlet: "list-container", controller: 'discovery/topics' });
        }
      });
    });

    const categoryRoutes = [
      'category',
      'categoryNone'
    ];

    categoryRoutes.forEach(function(route){
      var route = container.lookup(`route:discovery.${route}`);
      route.reopen({
        afterModel(model, transition) {
          if (this.filter(model.category) === 'map' && this.siteSettings.location_category_map_filter) {
            transition.abort();
            return this.replaceWith(`/c/${this.Category.slugFor(model.category)}/l/${this.filter(model.category)}`);
          } else {
            return this._super(...arguments);
          }
        }
      });
    });
  }
};
