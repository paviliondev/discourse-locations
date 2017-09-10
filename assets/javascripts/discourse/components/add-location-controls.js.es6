import { getOwner } from 'discourse-common/lib/get-owner';
import showModal from 'discourse/lib/show-modal';

export default Ember.Component.extend({
  classNames: ['location-label-container'],

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
