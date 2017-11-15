import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import RawHtml from 'discourse/widgets/raw-html';
import { avatarImg } from 'discourse/widgets/post';
import { generateMap, setupMap, addMarkersToMap, addCircleMarkersToMap } from '../lib/map-utilities';
import DiscourseURL from 'discourse/lib/url';

export default createWidget('map', {
  tagName: 'div.map',
  buildKey: () => 'map',

  defaultState() {
    return {
      mapToggle: 'expand',
      expanded: false,
      showAttribution: false,
      runSetup: true,
      showSearch: false
    };
  },

  addMarkers() {
    const topic = this.attrs.topic;
    const topicList = this.attrs.topicList;
    const map = this.state.mapObjs.map;
    let locations = this.attrs.locations || [];
    let rawMarkers = [];
    let rawCircleMarkers = [];

    if (topic && topic.location && topic.location && !topic.location.hide_marker) {
      locations.push(topic.location);
    };

    if (locations) {
      locations.forEach((l) => {
        if (l.geo_location) {
          let marker = {
            lat: l.geo_location.lat,
            lon: l.geo_location.lon
          };
          if (l.circle_marker) {
            marker['options'] = l.circle_marker;
            rawCircleMarkers.push(marker);
          } else {
            rawMarkers.push(marker);
          };
        }
      });
    }

    if (topicList) {
      topicList.forEach((t) => {
        if (t.location && t.location.geo_location) {
          rawMarkers.push({
            lat: t.location.geo_location.lat,
            lon: t.location.geo_location.lon,
            options: {
              title: t.fancy_title
            },
            onClick: () => DiscourseURL.routeTo("t/" + t.slug)
          });
        }
      });
    }

    let markers = null;

    if (rawCircleMarkers && rawCircleMarkers.length > 0) {
      addCircleMarkersToMap(rawCircleMarkers, map);
    }

    if (rawMarkers && rawMarkers.length > 0) {
      markers = addMarkersToMap(rawMarkers, map);
    }

    return markers;
  },

  setupMap() {
    const mapObjs = this.state.mapObjs;
    const map = mapObjs.map;
    const markers = this.addMarkers();
    const topic = this.attrs.topic;
    const category = this.attrs.navCategory;
    let boundingbox = null;

    if (category && category.location && category.location.geo_location
        && category.location.geo_location.boundingbox) {
      boundingbox = category.location.geo_location.boundingbox;
    }

    if (topic && topic.location && topic.location.geo_location
        && topic.location.geo_location.boundingbox) {
      boundingbox = topic.location.geo_location.boundingbox;
    }

    map.invalidateSize(false);

    setupMap(map, markers, boundingbox);
  },

  toggleAttribution() {
    const map = this.state.mapObjs.map;
    const attribution = this.state.mapObjs.attribution;

    if (!this.state.showAttribution) {
      map.addControl(attribution);
    } else {
      if ($('.map .leaflet-control-attribution').is(':visible')) {
        map.removeControl(attribution);
      }
    }

    this.state.showAttribution = !this.state.showAttribution;
  },

  toggleSearch() {
    this.state.showSearch = !this.state.showSearch;
  },

  toggleExpand() {
    const map = this.state.mapObjs.map,
          $map = $('.map');

    $map.toggleClass('expanded');

    if ($map.hasClass('expanded')) {
      this.state.mapToggle = "compress";
      this.state.expanded = true;
    } else {
      this.state.mapToggle = "expand";
      this.state.expanded = false;
      this.setupMap();
    }

    map.invalidateSize();
  },

  editCategory() {
    const appRoute = this.register.lookup('route:application');
    appRoute.send('editCategory', this.attrs.navCategory);
  },

  html(attrs, state) {
    const category = this.attrs.navCategory;
    const clickable = attrs.clickable;
    const user = this.currentUser;

    if (!state.mapObjs) {
      state.mapObjs = generateMap(category, clickable);
    }

    if (state.runSetup) {
      state.runSetup = false;

      Ember.run.scheduleOnce('afterRender', this, () => {
        this.setupMap();
      });

      // triggered in sidebar-container component in layouts plugin
      this.appEvents.on('sidebars:rerender', () => {
        state.runSetup = true;
        state.showSearch = false;
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

    if (attrs.categorySearch) {
      if (state.showSearch) {
        contents.push(
          this.attach('map-search', {category}),
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

    contents.push(
      this.attach('button', {
        className: `btn btn-map map-expand`,
        action: 'toggleExpand',
        actionParam: category,
        icon: state.mapToggle
      }),
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
