import DiscourseURL from 'discourse/lib/url';

export default {
  name: 'location-map-url-redirects',
  after: 'url-redirects',
  initialize() {
    DiscourseURL.rewrite(/^\/u\/user\-map\/summary/, "/u/user-map");
    DiscourseURL.rewrite(/^\/users\/user\-map\/summary/, "/users/user-map");
  }
};
