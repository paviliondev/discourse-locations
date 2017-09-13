import { default as computed } from 'ember-addons/ember-computed-decorators';
import DiscourseURL from 'discourse/lib/url';

export default Ember.Component.extend({
  classNames: ['location-label-container'],

  @computed('topic.location.geo_location')
  showMapToggle(geoLocation) {
    return geoLocation && this.siteSettings.location_topic_map;
  },

  didInsertElement() {
    Ember.$(document).on('click', Ember.run.bind(this, this.outsideClick))
  },

  willDestroyElement() {
    Ember.$(document).off('click', Ember.run.bind(this, this.outsideClick))
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
})
