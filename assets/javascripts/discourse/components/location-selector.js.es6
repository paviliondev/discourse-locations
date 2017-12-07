import TextField from 'discourse/components/text-field';
import { geoLocationSearch, providerDetails } from '../lib/location-utilities';
import { findRawTemplate } from 'discourse/lib/raw-templates';
import { getOwner } from 'discourse-common/lib/get-owner';
import computed from 'ember-addons/ember-computed-decorators';

export default TextField.extend({
  autocorrect: false,
  autocapitalize: false,
  classNames: 'location-selector',
  context: null,

  @computed()
  settings() {
    const rootElement = getOwner(this).get('rootElement');
    const wizard = rootElement === '#custom-wizard-main';
    return wizard ? Wizard.SiteSettings : Discourse.SiteSettings;
  },

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
        let request = { query: term };

        const context = self.get('context');
        if (context) request['context'] = context;

        return geoLocationSearch(request).then((r) => {
          const defaultProvider = self.get('settings.location_geocoding_provider');
          console.log("results provider: ", r.provider);
          console.log("default provider: ",  defaultProvider);
          r.locations.push({
            provider: providerDetails[r.provider || defaultProvider]
          });
          return r.locations;
        }).catch((e) => {
          self.sendAction('searchError', e);
        });
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
