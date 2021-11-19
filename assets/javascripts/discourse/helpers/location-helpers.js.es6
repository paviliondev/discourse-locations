import { registerUnbound } from 'discourse-common/lib/helpers';
import { geoLocationFormat, locationFormat } from '../lib/location-utilities';
import Site from "discourse/models/site";
import { helperContext } from "discourse-common/lib/helpers";
import Handlebars from "handlebars";

registerUnbound('geo-location-format', function(geoLocation, opts) {
  return new Handlebars.SafeString(geoLocationFormat(geoLocation, Site.currentProp('country_codes'), opts));
});

registerUnbound('location-format', function(location, opts) {
  let siteSettings = helperContext().siteSettings;
  return new Handlebars.SafeString(locationFormat(location, Site.currentProp('country_codes'), siteSettings.location_input_fields_enabled, siteSettings.location_input_fields, $.extend({}, opts)));
});
