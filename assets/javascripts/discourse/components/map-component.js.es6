import MountWidget from 'discourse/components/mount-widget';
import { observes, on } from 'ember-addons/ember-computed-decorators';

export default MountWidget.extend({
  classNames: 'map-component',
  widget: 'map',
  clickable: false,

  buildArgs() {
    let args = this.getProperties(
      'navCategory',
      'topic',
      'geoLocations',
      'clickable',
      'hideTitle',
      'hideControls',
      'topicList',
      'showAvatar'
    );

    if (this.get('geoLocation')) {
      args['geoLocations'] = [ this.get('geoLocation') ];
    }

    return args;
  },

  @on('didInsertElement')
  setupOnRender() {
    this.scheduleSetup();
  },

  @observes('navCategory','geoLocation','geoLocations.[]')
  refreshMap() {
    this.queueRerender();
    this.scheduleSetup();
  },

  scheduleSetup() {
    Ember.run.scheduleOnce('afterRender', () => {
      this.appEvents.trigger('dom:clean');
    })
  }
})
