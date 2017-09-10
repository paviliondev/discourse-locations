export default {
  setupComponent(args, component) {
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (args.model.get('showLocationControls')) {
        $('.composer-controls-location').addClass('show-control');
      }
    })
  }
}
