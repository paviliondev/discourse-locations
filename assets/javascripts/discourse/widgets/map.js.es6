import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import RawHtml from 'discourse/widgets/raw-html';
import { avatarImg } from 'discourse/widgets/post';
import { generateMap, setupMap, addMarkersToMap } from '../lib/map-utilities';
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
    let geoLocations = this.attrs.geoLocations || [];
    let rawMarkers = [];

    if (topic && topic.location && topic.location.geo_location) {
      let marker = {
        lat: topic.location.geo_location.lat,
        lon: topic.location.geo_location.lon,
      };
      rawMarkers.push(marker);
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

    if (geoLocations) {
      geoLocations.forEach((g) => {
        rawMarkers.push({
          lat: g.lat,
          lon: g.lon
        });
      });
    }

    let markers = null;

    if (rawMarkers && rawMarkers.length > 0) {
      markers = addMarkersToMap(rawMarkers, map);
    }

    return markers;
  },

  setupMap(category) {
    const mapObjs = this.state.mapObjs;
    const map = mapObjs.map;
    const markers = this.addMarkers();

    map.invalidateSize(false);

    setupMap(map, mapObjs.geojson, category, markers);
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
        this.setupMap(category);
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

    return contents;
  }
});
