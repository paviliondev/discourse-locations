import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

createWidget('map-search-item', {
  tagName: 'li',

  html(attrs) {
    const name = attrs.location.geo_location.name;
    const address = attrs.location.geo_location.address;
    return name ? name : address;
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
      const name = l.name;
      const geoName = l.geo_location.name;
      const geoAddress = l.geo_location.address;

      if (name) {
        return name.toLowerCase().indexOf(input) > -1;
      } else if (geoName) {
        return geoName.toLowerCase().indexOf(input) > -1;
      } else if (geoAddress) {
        return geoAddress.toLowerCase().indexOf(input) > -1;
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
          return this.attach('map-search-item', { location });
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

  goToLocation(location) {
    this.state.current = location;
    const node = document.getElementById('#map-search-input');
    if (node) {
      node.value = location.name || location.geo_location.name || location.geo_location.address;
    }
    DiscourseURL.routeTo(location.circle_marker.routeTo);
  }
});
