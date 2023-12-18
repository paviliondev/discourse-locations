import DiscourseRoute from "discourse/routes/discourse";

export default DiscourseRoute.extend({
  templateName: "locations/users-map",
  // redirect() {
  //   if (!this.siteSettings.location_users_map) {
  //     this.replaceWith("/u");
  //   }
  // },
  after_model() {
    debugger;
  }

  // model() {
  //   let params = { period: "location" };
  //   return this.store.find("directoryItem", params);
  // },

  // setupController(controller, model) {
  //   controller.set("userList", model.content);
  // },

  // renderTemplate() {
  //   this.render("users/user-map", { into: "application" });
  // },
});
