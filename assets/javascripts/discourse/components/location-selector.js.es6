import { geoLocationSearch, geoLocationFormat, providerDetails } from '../lib/location-utilities';
import { getOwner } from 'discourse-common/lib/get-owner';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';

export default Ember.TextField.extend({
  autocorrect: false,
  autocapitalize: false,
  classNames: 'location-selector',
  context: null,

  @computed()
  global() {
    const rootElement = getOwner(this).get('rootElement');
    return rootElement === '#custom-wizard-main' ? Wizard : Discourse;
  },

  @computed('global')
  settings(global) {
    return global.SiteSettings;
  },

  didInsertElement() {
    this._super();
    let self = this;
    const location = this.get('location.address');

    let val = '';
    if (location) {
      val = location;
    }

    const global = this.get('global');
    let template = global.RAW_TEMPLATES['javascripts/location-autocomplete'];

    this.$().val(val).autocomplete({
      template,
      single: true,
      updateData: false,

      dataSource: function(term) {
        let request = { query: term };

        const context = self.get('context');
        if (context) request['context'] = context;

        self.set('loading', true);

        return geoLocationSearch(request).then((result) => {
          const defaultProvider = self.get('settings.location_geocoding_provider');
          const geoAttrs = self.get('geoAttrs');
          const showType = self.get('showType');
          let locations = [];

          if (result.locations.length === 0) {
            locations = [{
              no_results: true
            }];
          } else {
            locations = result.locations.map((l) => {
              if (geoAttrs) l['geoAttrs'] = geoAttrs;
              if (showType !== undefined) l['showType'] = showType;
              return l;
            });
          }

          locations.push({
            provider: providerDetails[result.provider || defaultProvider]
          });

          self.set('loading', false);

          return locations;
        }).catch((e) => {
          self.set('loading', false);
          self.sendAction('searchError', e);
        });
      },

      transformComplete: function(l) {
        if (typeof l === 'object') {
          self.set('location', l);
          const geoAttrs = self.get('geoAttrs');
          return geoLocationFormat(l, { geoAttrs });
        } else {
          // hack to get around the split autocomplete performs on strings
          $('.location-form .ac-wrap .item').remove();
          $('.user-location-selector .ac-wrap .item').remove();
          return self.$().val();
        }
      },

      onChangeItems: function(items) {
        if (items[0] == null) {
          self.set('location', '{}');
        }
      }
    });
  },

  @observes('loading')
  showLoadingSpinner() {
    const loading = this.get('loading');
    const $wrap = this.$().parent();
    const $spinner = $("<span class='ac-loading'><div class='spinner small'/></span>");
    if (loading) {
      $spinner.prependTo($wrap);
    } else {
      $('.ac-loading').remove();
    }
  },

  willDestroyElement() {
    this._super();
    this.$().autocomplete('destroy');
  }
});
