import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import RawHtml from 'discourse/widgets/raw-html';
import { avatarImg } from 'discourse/widgets/post';
import { generateMap, setupMap, addMarkersToMap, addCircleMarkersToMap } from '../lib/map-utilities';
import { scheduleOnce } from "@ember/runloop";

export default createWidget('map', {
  tagName: 'div.locations-map',
  buildKey: () => 'map',

  defaultState(attrs) {
    return {
      mapToggle: 'expand',
      expanded: false,
      showAttribution: false,
      runSetup: true,
      showSearch: false,
      locations: attrs.locations || [],
      showExpand: !attrs.disableExpand
    };
  },

  gatherLocations() {
    const topic = this.attrs.topic;
    const topicList = this.attrs.topicList;
    const user = this.attrs.user;
    const userList = this.attrs.userList;
    let locations = this.state.locations;

    if (this.attrs.locations && locations.length !== this.attrs.locations.length) {
      this.attrs.locations.forEach((l) => {
        if (l && this.validGeoLocation(l)) {
          locations.push(l);
        }
      });
    }

    if (this.addTopicMarker(topic, locations)) {
      locations.push(this.topicMarker(topic));
    };

    if (topicList && topicList.topics) {
      topicList.topics.forEach((t) => {
        if (this.addTopicMarker(t, locations)) {
          locations.push(this.topicMarker(t));
        }
      });
    }

    if (this.addUserMarker(user, locations)) {
      locations.push(this.userMarker(user));
    };

    if (userList) {
      userList.forEach((u) => {
        const user = u.user;
        if (this.addUserMarker(user, locations)) {
          locations.push(this.userMarker(user));
        }
      });
    }

    this.state.locations = locations;
  },

  addTopicMarker(topic, locations) {
    if (!topic ||
      !topic.location ||
      !topic.location.geo_location ||
      !this.validGeoLocation(topic.location.geo_location) ||
      topic.location.hide_marker ||
      locations.find(l => l['topic_id'] === topic.id)) return false;
    return true;
  },

  addUserMarker(user, locations) {
    if (!user ||
      !this.validGeoLocation(user.geo_location) ||
      locations.find(l => l['user_id'] === user.id)) return false;
    return true;
  },

  validGeoLocation(geoLocation) {
    return geoLocation && geoLocation.lat && geoLocation.lon;
  },

  topicMarker(topic) {
    let location = topic.location;

    if (!location['marker'] && !location['circle_marker']) {
      location['marker'] = {
        title: topic.fancy_title,
        routeTo: "/t/" + topic.slug
      };
    }

    if (this.siteSettings.location_map_marker_category_color &&
        topic.category && topic.category.color) {
      location['marker']['color'] = topic.category.color;
      location['marker']['class'] = topic.category.slug;
    }

    location['topic_id'] = topic.id;

    return location;
  },

  userMarker(user) {
    let location = {};

    location['marker'] = {
      title: user.username,
      avatar: user.avatar_template,
      routeTo: "/u/" + user.username
    };

    location['user_id'] = user.id;

    location['geo_location'] = user.geo_location;

    return location;
  },

  locationPresent(locations, location) {
    return locations.filter((l) => {
      if (location.geo_location) return false;
      if (location.geo_location.lat && location.geo_location.lon) {
        return l.geo_location.lat === location.geo_location.lat &&
          l.geo_location.lon === location.geo_location.lon;
      } else if (location.geo_location.boundingbox) {
        return l.geo_location.boundingbox === location.geo_location.boundingbox;
      }
    }).length > 0;
  },

  addMarkers() {
    const map = this.state.mapObjs.map;
    const locations = this.state.locations;
    const settings = this.siteSettings;

    let rawMarkers = [];
    let rawCircleMarkers = [];

    if (locations && locations.length > 0) {
      locations.forEach((l) => {
        if (l && l.geo_location) {
          let marker = {
            lat: l.geo_location.lat,
            lon: l.geo_location.lon,
            options: {}
          };

          if (l.marker) {
            marker['options'] = l.marker;
            rawMarkers.push(marker);
          }

          if (l.circle_marker) {
            marker['options'] = l.circle_marker;
            rawCircleMarkers.push(marker);
          }
        }
      });
    }

    let markers = null;
    const category = this.attrs.category;

    if (rawCircleMarkers && rawCircleMarkers.length > 0) {
      addCircleMarkersToMap(rawCircleMarkers, map, this);
    }

    if (rawMarkers && rawMarkers.length > 0) {
      markers = addMarkersToMap(rawMarkers, map, settings.location_map_maker_cluster_enabled, settings.location_map_marker_cluster_multiplier, settings.location_user_avatar, settings.location_hide_labels);
    }

    return markers;
  },

  setupMap() {
    this.gatherLocations();

    const mapObjs = this.state.mapObjs;
    const map = mapObjs.map;
    const markers = this.addMarkers();
    const topic = this.attrs.topic;
    const category = this.attrs.category;
    const zoom = this.attrs.zoom;
    const center = this.attrs.center;
    let boundingbox = null;

    if (category &&
        category.custom_fields.location &&
        category.custom_fields.location.geo_location &&
        category.custom_fields.location.geo_location.boundingbox) {
      boundingbox = category.custom_fields.location.geo_location.boundingbox;
    }

    if (topic && topic.location && topic.location.geo_location
        && topic.location.geo_location.boundingbox) {
      boundingbox = topic.location.geo_location.boundingbox;
    }

    map.invalidateSize(false);

    setupMap(map, markers, boundingbox, zoom, center, this.siteSettings);
  },

  toggleAttribution() {
    const map = this.state.mapObjs.map;
    const attribution = this.state.mapObjs.attribution;

    if (!this.state.showAttribution) {
      map.addControl(attribution);
    } else {
      if ($('.locations-map .leaflet-control-attribution').is(':visible')) {
        map.removeControl(attribution);
      }
    }

    this.state.showAttribution = !this.state.showAttribution;
  },

  toggleSearch() {
    scheduleOnce('afterRender', this, () => {
      // resetinng the val puts the cursor at the end of the text on focus
      const $input = $('#map-search-input');
      const val = $input.val();
      $input.focus();
      $input.val('');
      $input.val(val);
    });
    this.state.showSearch = !this.state.showSearch;
  },

  toggleExpand() {
    const map = this.state.mapObjs.map;
    const $map = $('.locations-map');

    $map.toggleClass('expanded');
    map.invalidateSize();

    if ($map.hasClass('expanded')) {
      this.state.mapToggle = "compress";
      this.state.expanded = true;
      map.setZoom(this.siteSettings.location_map_expanded_zoom);
    } else {
      this.state.mapToggle = "expand";
      this.state.expanded = false;
      this.setupMap();
    }
  },

  editCategory() {
    const appRoute = this.register.lookup('route:application');
    appRoute.send('editCategory', this.attrs.category);
  },

  initializeMap() {
    const center = this.attrs.center;
    const clickable = this.attrs.clickable;
    const zoom = this.attrs.zoom;
    let opts = {};
    if (zoom) opts['zoom'] = zoom;
    if (center) opts['center'] = center;
    if (clickable) opts['clickable'] = clickable;
    return generateMap(this.siteSettings, opts);
  },

  html(attrs, state) {
    const category = attrs.category;
    const user = this.currentUser;

    if (!state.mapObjs) {
      state.mapObjs = this.initializeMap();
    }

    if (state.runSetup || attrs.runSetup) {
      state.runSetup = false;

      scheduleOnce('afterRender', this, () => {
        this.setupMap();
      });

      // triggered in sidebar-container component in layouts plugin
      this.appEvents.on('sidebars:after-render', () => {
        state.runSetup = true;
        state.showSearch = false;
        this.scheduleRerender();
      });
    }

    let contents = [new RawHtml({ html: state.mapObjs.element })];

    if (attrs.showAvatar && user) {
      let size = state.expanded ? 'large' : 'medium';
      contents.push(h('a.avatar-wrapper', {
        attributes: { 'data-user-card': user.get('username') }
      }, avatarImg(size, {
        template: user.get('avatar_template'),
        username: user.get('username')
      })));
    }

    if (attrs.search) {
      if (state.showSearch) {
        let locations = state.locations;
        let current = null;
        if (attrs.category && attrs.category.location) {
          current = attrs.category.location;
        };
        if (attrs.topic && attrs.topic.location) {
          current = attrs.topic.location;
        }
        contents.push(
          this.attach('map-search', {
            locations,
            current
          }),
          this.attach('button', {
            className: 'btn btn-map hide-search',
            action: 'toggleSearch',
            icon: 'times'
          })
        );
      } else {
        contents.push(
          this.attach('link', {
            className: 'btn btn-map search',
            action: 'toggleSearch',
            icon: 'search'
          })
        );
      }
    }
    
    if (state.showExpand) {
      contents.push(
        this.attach('button', {
          className: `btn btn-map map-expand`,
          action: 'toggleExpand',
          actionParam: category,
          icon: state.mapToggle
        })
      )
    }

    contents.push(
      this.attach('button', {
        className: 'btn btn-map map-attribution',
        action: 'toggleAttribution',
        icon: 'info'
      })
    );

    if (category && category.can_edit) {
      contents.push(this.attach('button', {
        className: 'btn btn-map category-edit',
        action: "editCategory",
        icon: 'wrench'
      }));
    }

    if (attrs.extraWidgets) {
      const extraWidgets = attrs.extraWidgets.map((w) => {
        return this.attach(w.widget, w.attrs);
      });
      contents.push(...extraWidgets);
    };

    return contents;
  }
});
