import { createWidget } from 'discourse/widgets/widget';
import Category from 'discourse/models/category';

export default createWidget('layouts-map', {
  tagName: 'div.widget-container.nav-container',
  buildKey: () => `layouts-map`,

  defaultState() {
    return {
      topicList: null
    };
  },

  getLocations() {
    let filter = 'map';

    const category = this.attrs.category;
    if (category && category.get('custom_fields.location_enabled')) {
      filter = 'c/' + Category.slugFor(category) + '/l/map';
    }

    this.store.findFiltered('topicList', { filter }).then((list) => {
      this.state.topicList = list;
      this.state.runSetup = true;
      this.scheduleRerender();
    });
  },

  html(attrs, state) {
    const topic = attrs.topic;
    const category = attrs.category;
    const search = Discourse.SiteSettings.location_layouts_map_search_enabled;
    const showAvatar = Discourse.SiteSettings.location_layouts_map_show_avatar;

    if (!state.topicList) {
      this.getLocations();
    }

    const mapOpts = {
      topic,
      category,
      showAvatar,
      search,
      topicList: state.topicList,
      runSetup: state.runSetup,
      zoom: 0
    };

    state.runSetup = false;

    return this.attach('map', mapOpts);
  }
});
