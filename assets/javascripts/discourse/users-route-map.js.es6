export default function () {
  this.route("locations", { path: "/locations" }, function () {
    this.route("users-map", { path: "/users_map" });
  });
}
