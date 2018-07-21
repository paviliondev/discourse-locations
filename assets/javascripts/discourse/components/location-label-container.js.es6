import { default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Component.extend({
  classNames: ['location-label-container'],
  locationAttrs: [],
  geoAttrs: [],

  @computed('topic.location.geo_location')
  showMapToggle(geoLocation) {
    return geoLocation && this.siteSettings.location_topic_map;
  },

  @computed('locationAttrs', 'geoAttrs')
  opts(locationAttrs, geoAttrs) {
    let opts = {};
    if (locationAttrs) opts['attrs'] = locationAttrs;
    if (geoAttrs) opts['geoAttrs'] = geoAttrs;
    return opts;
  },

  didInsertElement() {
    Ember.$(document).on('click', Ember.run.bind(this, this.outsideClick));
  },

  willDestroyElement() {
    Ember.$(document).off('click', Ember.run.bind(this, this.outsideClick));
  },

  outsideClick(e) {
    if (!this.isDestroying && !$(e.target).closest('.location-topic-map').length) {
      this.set('showMap', false);
    }
  },

  actions: {
    showMap() {
      this.toggleProperty('showMap');
    }
  }
});
