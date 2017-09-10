import { registerUnbound } from 'discourse-common/lib/helpers';
import { geoLocationFormat, locationFormat } from '../lib/location-utilities';

registerUnbound('geo-location-format', function(geoLocation, attrs) {
  return new Handlebars.SafeString(geoLocationFormat(geoLocation, attrs));
});

registerUnbound('location-format', function(location) {
  return new Handlebars.SafeString(locationFormat(location));
});
