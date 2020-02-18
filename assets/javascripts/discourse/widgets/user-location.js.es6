import { createWidget } from 'discourse/widgets/widget';
import { geoLocationFormat } from '../lib/location-utilities';
import { iconNode } from 'discourse-common/lib/icon-library';
import { h } from 'virtual-dom';

export default createWidget('user-location', {
  tagName: "div.map-location",
  buildKey: () => 'user-location',
  
  html(user, state) {
    let contents = [];
    
    if (user && user.geo_location) {
      contents.push( iconNode('map-marker-alt') );
      contents.push(' ');
      
      let format = this.siteSettings.location_user_profile_format.split('|');
      let opts = {};
      let user_location = '';
      if (format.length && format[0]) {
        opts['geoAttrs'] = format;
        user_location = geoLocationFormat(user.geo_location, opts);
      } else {
        user_location = user.geo_location.address
      };
      
      contents.push( h('span', user_location) )
    };
    
    return contents;
  }
});