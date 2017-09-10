export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: [':location-form-result', 'location.selected:selected'],

  click() {
    this.sendAction('updateGeoLocation', this.get('location'));
  }
})
