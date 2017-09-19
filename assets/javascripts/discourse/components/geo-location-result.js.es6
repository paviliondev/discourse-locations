import { default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: [':location-form-result', 'location.selected:selected'],

  click() {
    this.sendAction('updateGeoLocation', this.get('location'));
  },

  @computed('placeSearch')
  displayAttrs(placeSearch) {
    if (placeSearch) {
      return ['display_name'];
    }

    return null;
  }
});
