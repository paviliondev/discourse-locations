import showModal from 'discourse/lib/show-modal';
import { locationFormat } from '../lib/location-utilities';
import { default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Component.extend({
  classNames: ['location-label'],

  didInsertElement() {
    $('.title-and-category').toggleClass('location-add-no-text', this.get("iconOnly"));
  },

  @computed()
  iconOnly() {
    return this.site.mobileView || Discourse.SiteSettings.location_add_no_text;
  },

  @computed()
  valueClasses() {
    let classes = "add-location-btn";
    if (this.site.isMobileDevice) classes += " btn-primary";
    return classes;
  },

  @computed('location')
  valueLabel(location) {
    let opts = {};

    if (Discourse.SiteSettings.location_input_fields_enabled) {
      opts['attrs'] = Discourse.SiteSettings.location_input_fields.split('|');
    };

    return this.site.isMobileDevice ? '' : locationFormat(location, opts);
  },

  @computed()
  addLabel() {
    return this.site.isMobileDevice ? '' : 'composer.location.btn';
  },

  actions: {
    showAddLocation() {
      let controller = showModal('add-location', { model: {
        location: this.get('location'),
        categoryId: this.get('category.id'),
        update: (location) => {
          if (this._state !== 'destroying') {
            this.set('location', location);
          }
        }
      }});

      controller.setup();
    },

    removeLocation() {
      this.set('location', null);
    }
  }
});
