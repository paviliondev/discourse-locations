export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: [':location-form-result', 'location.selected:selected'],

  didInsertElement() {
    console.log(this)
  },

  click() {
    this.sendAction('updateGeoLocation', this.get('location'));
  }
})
