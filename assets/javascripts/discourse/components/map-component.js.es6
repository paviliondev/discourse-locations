import MountWidget from 'discourse/components/mount-widget';
import { observes, on } from 'ember-addons/ember-computed-decorators';

export default MountWidget.extend({
  classNames: 'map-component',
  widget: 'map',
  clickable: false,

  buildArgs() {
    let args = this.getProperties(
      'category',
      'topic',
      'locations',
      'clickable',
      'topicList',
      'categorySearch',
      'showAvatar',
      'size',
      'center'
    );

    if (this.get('geoLocation')) {
      if (!args['locations']) args['locations'] = [];
      args['locations'].push({ geo_location: this.get('geoLocation') });
    }

    return args;
  },

  @on('didInsertElement')
  setupOnRender() {
    this.scheduleSetup();
  },

  @observes('category','geoLocation','geoLocations.[]')
  refreshMap() {
    this.queueRerender();
    this.scheduleSetup();
  },

  scheduleSetup() {
    Ember.run.scheduleOnce('afterRender', () => {
      this.appEvents.trigger('dom:clean');
    });
  }
});
