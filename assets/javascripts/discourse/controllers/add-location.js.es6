import Category from 'discourse/models/category';
import { observes, on, default as computed } from 'ember-addons/ember-computed-decorators';

export default Ember.Controller.extend({
  title: 'composer.location.title',
  searchOnInit: false,

  @on('init')
  @observes('model.categoryId')
  setup(){
    let props = {
      name: null,
      street: null,
      postalcode: null,
      city: null,
      countrycode: null,
      geoLocation: null
    };

    const category = Category.findById(this.get('model.categoryId'));
    if (category && category.is_location) {
      props['countrycode'] = category.get('parentCategory.slug');
      props['city'] = category.get('slug');
    }

    const location = this.get('model.location');
    if (location) {
      Object.assign(props, location);

      if (props['geo_location']) {
        props['geoLocation'] = props['geo_location'];
        delete props['geo_location'];
        this.set('searchOnInit', true);
      }
    }

    this.setProperties(props);
  },

  @computed()
  inputFields() {
    return this.siteSettings.location_input_fields.split('|');
  },

  @computed('name', 'street', 'postalcode', 'city', 'countrycode', 'geoLocation')
  submitDisabled(name, street, postalcode, city, countrycode, geoLocation) {
    if (this.siteSettings.location_geocoding === 'required' && !geoLocation) return true;

    if (!this.siteSettings.location_input_fields_enabled) return false;

    const inputFields = this.get('inputFields');
    let disabled = false;

    inputFields.forEach((f) => {
      let field = this.get(f);
      if (!field || field.length < 2) {
        disabled = true;
      }
    })

    return disabled;
  },

  actions: {
    submit() {
      let location = this.getProperties('name', 'street', 'postalcode', 'city', 'countrycode');

      location['geo_location'] = this.get('geoLocation');
      if (this.get('submitDisabled') && !location['geo_location']) return;

      this.set('model.location', location);
      this.send('closeModal');
    }
  }

});
