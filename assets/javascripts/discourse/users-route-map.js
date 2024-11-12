export default function () {
  this.route("locations", function () {
    this.route("users-map", { path: "/users_map" });
  });
}
