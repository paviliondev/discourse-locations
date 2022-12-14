import { createWidget } from 'discourse/widgets/widget';
import { geoLocationFormat } from '../lib/location-utilities';
import { iconNode } from 'discourse-common/lib/icon-library';
import { h } from 'virtual-dom';
import I18n from "I18n";

export default createWidget('user-location', {
  tagName: "div.user-location-widget",
  buildKey: () => 'user-location',
  
  defaultState(attrs) {
    return {
      showMap: false
    };
  },
  
  html(attrs, state) {
    const { user } = attrs; 
    let contents = [];
    
    if (user && user.geo_location) {
      contents.push(iconNode('map-marker-alt'));
      
      let format = this.siteSettings.location_user_profile_format.split('|');
      let opts = {};
      let userLocation;
      
      if (format.length && format[0]) {
        opts['geoAttrs'] = format;
        userLocation = geoLocationFormat(user.geo_location, this.site.country_codes, opts);
      } else {
        userLocation = user.geo_location.address;
      };
      
      contents.push(h('div.location-label', userLocation));
      
      if (this.siteSettings.location_user_profile_map) {
        let mapContents = [];
        
        let btnParams = { 
          icon: "far-map",
          className: "btn-default btn-show-map btn-small",
          action: "toggleMap"
        }
        
        if (!this.site.mobileView && attrs.formFactor !== 'card') {
          btnParams.contents = I18n.t(
            `location.geo.${state.showMap ? 'hide' : 'show'}_map`
          );
        };
        
        mapContents.push(this.attach('button', btnParams));
        
        if (state.showMap) {
          mapContents.push(
            h('div.map-container.small', 
              this.attach('map', {
                user,
                disableExpand: attrs.formFactor == 'card'
              })
            )
          )
        }
        
        contents.push(h('div.map-wrapper', mapContents));
      }
    };
    
    return contents;
  },
  
  toggleMap(e) {
    this.state.showMap = !this.state.showMap;
  }
});