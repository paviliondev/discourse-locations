import { createWidget } from 'discourse/widgets/widget';
import Category from 'discourse/models/category';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

createWidget('category-item', {
  tagName: 'li',

  html(attrs) {
    return attrs.category.name;
  },

  click() {
    this.sendWidgetAction('goToCategory', this.attrs.category);
  }
});

createWidget('category-input', {
  tagName: 'input',
  buildId: () => 'category-input',
  buildKey: () => 'category-input',

  defaultState(attrs) {
    return {
      category: attrs.category
    };
  },

  buildAttributes(attrs) {
    return {
      type: 'text',
      value: attrs.category.name || '',
      placeholder: I18n.t('map.search_placeholder')
    };
  },

  click() {
    this.sendWidgetAction('toggleList', true);
  },

  keyDown(e) {
    this.sendWidgetAction('toggleList', true);
    if (e.which === 9) {
      return this.sendWidgetAction('autoComplete');
    }
  },

  clickOutside() {
    this.sendWidgetAction('toggleList', false);
  },

  keyUp(e) {
    if (e.which === 13) {
      let category = this.state.category;

      if (this.attrs.topResult) {
        category = this.attrs.topResult;
      }

      this.sendWidgetAction('toggleList', false);
      return this.sendWidgetAction('goToCategory', category);
    }

    this.sendWidgetAction('inputChanged', e.target.value);
  }
});

export default createWidget('map-search', {
  tagName: 'div.map-search',
  buildKey: () => 'map-search',

  defaultState(attrs) {
    let filter = attrs.category ? attrs.category.name : '';
    return {
      category: attrs.category,
      categories: this.filteredCategories(filter),
      listVisible: false
    };
  },

  filteredCategories(filterBy) {
    const categories = Category.list();

    let val = filterBy ? filterBy.toLowerCase() : '';
    return categories.filter((c) => {
      const name = c.get('name').toLowerCase();
      return name.indexOf(val) > -1;
    }).slice(0,8);
  },

  getCategoryList() {
    let options = [];
    this.state.categories.forEach((c) => {
      options.push(this.attach('category-item', {
        category: c
      }));
    });
    return options;
  },

  html(attrs, state) {
    const category = state.category || attrs.category || {};

    let contents = [
      h('i.fa.fa-place'),
      this.attach('category-input', {
        category: category,
        topResult: state.categories[0] || false
      })
    ];

    if (state.listVisible) {
      contents.push(
        h('ul.nav-category-list', this.getCategoryList())
      );
    }

    return contents;
  },

  inputChanged(value) {
    this.state.categories = this.filteredCategories(value);
  },

  autoComplete() {
    this.goToCategory(this.state.categories[0]);
  },

  toggleList(visible) {
    this.state.listVisible = visible;
  },

  goToCategory(category) {
    this.state.category = category;
    const node = document.getElementById('category-input');
    if (node) {
      node.value = category.name;
    }
    DiscourseURL.routeTo(category.get('url'));
  }
});
