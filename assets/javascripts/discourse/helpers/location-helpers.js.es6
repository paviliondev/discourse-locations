import { registerUnbound } from 'discourse-common/lib/helpers';
import { geoLocationFormat, locationFormat } from '../lib/location-utilities';

registerUnbound('geo-location-format', function(geoLocation, opts) {
  return new Handlebars.SafeString(geoLocationFormat(geoLocation, Discourse.Site.currentProp('country_codes'), opts));
});

registerUnbound('location-format', function(location, opts) {
  return new Handlebars.SafeString(locationFormat(location, Discourse.Site.currentProp('country_codes'), Discourse.SiteSettings.location_input_fields_enabled, Discourse.SiteSettings.location_input_fields, $.extend({}, opts)));
});
