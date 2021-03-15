import { registerUnbound } from 'discourse-common/lib/helpers';
import { geoLocationFormat, locationFormat } from '../lib/location-utilities';
import Site from "discourse/models/site";

registerUnbound('geo-location-format', function(geoLocation, opts) {
  return new Handlebars.SafeString(geoLocationFormat(geoLocation, Site.currentProp('country_codes'), opts));
});

registerUnbound('location-format', function(location, opts) {
  return new Handlebars.SafeString(locationFormat(location, Site.currentProp('country_codes'), Discourse.SiteSettings.location_input_fields_enabled, Discourse.SiteSettings.location_input_fields, $.extend({}, opts)));
});
