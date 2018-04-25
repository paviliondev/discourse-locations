export default Discourse.Route.extend({
  redirect() {
    if (!Discourse.SiteSettings.location_users_map) {
      this.replaceWith('/u');
    }
  },

  renderTemplate() {
    this.render('users/user-map', { into: 'application' });
  }
});
