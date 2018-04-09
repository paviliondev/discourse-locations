export default Discourse.Route.extend({
  renderTemplate() {
    this.render('users', { into: 'application' });
  }
});
