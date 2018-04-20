export default Discourse.Route.extend({
  renderTemplate() {
    this.render('users/user-map', { into: 'application' });
  }
});
