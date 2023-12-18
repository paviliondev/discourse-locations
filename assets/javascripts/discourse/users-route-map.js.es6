export default function () {
  this.route("discourse-locations", { path: "/discourse-locations" }, function () {
    this.route("users-map", { path: "/users_map" });
  });
}
