import Component from '@ember/component';

export default Component.extend({
  tagName: 'li',
  classNameBindings: [':location-form-result', 'location.selected:selected'],
});
