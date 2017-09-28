import TextField from 'discourse/components/text-field';
import { geoLocationSearch } from '../lib/location-utilities';
import { findRawTemplate } from 'discourse/lib/raw-templates';

export default TextField.extend({
  autocorrect: false,
  autocapitalize: false,
  name: 'location-selector',

  didInsertElement() {
    this._super();
    let self = this;
    const location = this.get('location.address');

    let val = '';
    if (location) {
      val = location;
    }

    this.$().val(val).autocomplete({
      template: findRawTemplate('location-autocomplete'),
      single: true,
      updateData: false,

      dataSource: function(term) {
        let results = geoLocationSearch({
          query: term
        }).catch((e) => {
          self.sendAction('searchError', e);
        });

        return results;
      },

      transformComplete: function(l) {
        if (typeof l === 'object') {
          self.set('location', l);
          return l.address;
        } else {
          // hack to get around the split autocomplete performs on strings
          $('.location-form .ac-wrap .item').remove();
          return self.$().val();
        }
      },

      onChangeItems: function(items) {
        if (items[0] == null) {
          self.set('location', null);
        }
      }
    });
  },

  willDestroyElement() {
    this._super();
    this.$().autocomplete('destroy');
  }
});
