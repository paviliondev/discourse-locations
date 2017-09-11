import { getOwner } from 'discourse-common/lib/get-owner';
import showModal from 'discourse/lib/show-modal';
import { locationFormat } from '../lib/location-utilities';
import { default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Component.extend({
  classNames: ['location-label'],

  didInsertElement() {
    if (this.site.isMobileDevice) {
      const $controls = this.$();
      $controls.detach();
      $controls.insertAfter($('#reply-control .title-input input'));
    }
  },

  @computed()
  valueClasses() {
    let classes = "add-location";
    if (this.site.isMobileDevice) classes += " btn-primary";
    return classes;
  },

  @computed('location')
  valueLabel(location) {
    return this.site.isMobileDevice ? '' : locationFormat(location);
  },

  @computed()
  addLabel() {
    return this.site.isMobileDevice ? '' : 'composer.location.btn';
  },

  actions: {
    showAddLocation() {
      let controller = showModal('add-location', { model: {
        location: this.get('location'),
        categoryId: this.get('categoryId')
      }})

      controller.addObserver('model.location', this, (controller, property) => {
        if (this._state == 'destroying') { return }

        this.set('location', controller.get('model.location'))
      })
    },

    removeLocation() {
      this.set('location', null);
    }
  }
})
