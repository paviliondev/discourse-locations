import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';
import I18n from "I18n";

createWidget('map-search-item', {
  tagName: 'li',

  html(attrs) {
    return attrs.locationName;
  },

  click() {
    this.sendWidgetAction('goToLocation', this.attrs.location);
  }
});

createWidget('map-search-input', {
  tagName: 'input',
  buildId: () => 'map-search-input',
  buildKey: () => 'map-search-input',

  defaultState() {
    return {
      current: this.attrs.current
    };
  },

  buildClasses(attrs) {
    if (attrs.listVisible) return 'list-visible';
  },

  buildAttributes(attrs) {
    return {
      type: 'text',
      value: attrs.current ? attrs.current.geo_location.name : '',
      placeholder: I18n.t('map.search_placeholder')
    };
  },

  click() {
    this.sendWidgetAction('toggleList', true);
  },

  keyDown(e) {
    this.sendWidgetAction('toggleList', true);
    if (e.which === 9) {
      e.preventDefault();
      return this.sendWidgetAction('autoComplete');
    }
  },

  clickOutside() {
    this.sendWidgetAction('toggleList', false);
  },

  keyUp(e) {
    if (e.which === 13) {
      let location = this.state.current;

      if (this.attrs.topResult) {
        location = this.attrs.topResult;
      }

      this.sendWidgetAction('toggleList', false);
      return this.sendWidgetAction('goToLocation', location);
    }

    this.sendWidgetAction('inputChanged', e.target.value);
  }
});

export default createWidget('map-search', {
  tagName: 'div.map-search',
  buildKey: () => 'map-search',

  defaultState(attrs) {
    const input = attrs.current ? attrs.current.geo_location.name : '';
    return {
      current: attrs.current,
      locations: this.filteredLocations(input),
      listVisible: false
    };
  },

  filteredLocations(input) {
    const locations = this.attrs.locations;
    if (!locations || locations.length < 1) return [];

    input = input ? input.toLowerCase() : '';

    return locations.filter((l) => {
      const name = this.locationName(l);
      if (name) {
        return name.toLowerCase().indexOf(input) > -1;
      } else {
        return null;
      }
    });
  },

  html(attrs, state) {
    let contents = [
      this.attach('map-search-input', {
        current: attrs.current,
        listVisible: state.listVisible,
        topResult: state.locations[0] || false
      })
    ];

    if (state.listVisible) {
      contents.push(
        h('ul.map-search-list', state.locations.map((location) => {
          const locationName = this.locationName(location);
          return this.attach('map-search-item', {
            location,
            locationName
          });
        }))
      );
    }

    return contents;
  },

  inputChanged(value) {
    this.state.locations = this.filteredLocations(value);
  },

  autoComplete() {
    $("#map-search-input").val(this.state.locations[0].geo_location.name);
  },

  toggleList(visible) {
    this.state.listVisible = visible;
  },

  locationName(location) {
    return location.name || location.geo_location.name || location.geo_location.address;
  },

  goToLocation(location) {
    this.state.current = location;

    const node = document.getElementById('#map-search-input');
    if (node) node.value = this.locationName(location);

    let url = '/';
    if (location.route_to) url = location.route_to;
    if (location.marker) url = location.marker.routeTo;
    if (location.circle_marker) url = location.circle_marker.routeTo;

    DiscourseURL.routeTo(url);
  }
});
