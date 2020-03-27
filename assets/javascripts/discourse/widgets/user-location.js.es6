import { createWidget } from 'discourse/widgets/widget';
import { geoLocationFormat } from '../lib/location-utilities';
import { iconNode } from 'discourse-common/lib/icon-library';
import { h } from 'virtual-dom';

export default createWidget('user-location', {
  tagName: "div.map-location",
  buildKey: () => 'user-location',
  
  defaultState(attrs) {
    return {
      showMap: false
    };
  },
  
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
      
      if (this.siteSettings.location_user_profile_map) {
        contents.push(' ');
        
        let label = '';
        if (!this.site.mobileView) {
          if (state.showMap) {
            label = I18n.t("location.geo.hide_map")
          } else {
            label = I18n.t("location.geo.show_map")
          }
        };
        
        contents.push(
          this.attach('button', { 
            icon: "far-map",
            contents: label,
            className: "btn-default btn-show-map btn-small",
            action: "toggleMap"
          });
        )
      };
      
      if (state.showMap) {
        contents.push( this.attach('map', {user: user}) )
      }
    };
    
    return contents;
  },
  
  toggleMap(e) {
    this.state.showMap = !this.state.showMap;
  }
});