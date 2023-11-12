import { action, computed } from "@ember/object";
import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import {
  addCircleMarkersToMap,
  addMarkersToMap,
  generateMap,
  setupMap,
} from "../lib/map-utilities";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";
import {findOrResetCachedTopicList} from 'discourse/lib/cached-topic-list';

export default class LocationMapComponent extends Component {
  @service siteSettings;
  @service currentUser;
  @service store;

  @tracked mapToggle = "expand";
  @tracked expanded = false;
  @tracked showExpand = !this.args.disableExpand;
  @tracked showAttribution = false;
  @tracked runSetup = true;
  @tracked showSearch = false;
  @tracked locations = this.args.locations || [];
  @tracked mapType = "category";
  @tracked topic = {};
  @tracked topicList = {};
  @tracked user = {};
  @tracked userList = {};
  @tracked mapObjs = {};
  @tracked markers = null;

  @action
  setup() {
    this.getLocationData().then(() => {
      if (!Object.keys(this.mapObjs).length) {
        this.mapObjs = this.initializeMap();
      } else {
        if (this.markers) {
          this.markers.clearLayers();
          this.markers = null;
        }
      }
      this.onMapLoad();

      this.gatherLocations();

      this.setupLocationMap();

      // TODO handle sidebar
      // triggered in sidebar-container component in layouts plugin
      // this.appEvents.on("sidebars:after-render", () => {
      //   state.runSetup = true;
      //   state.showSearch = false;
      //   this.scheduleRerender();
      // });
    });
  }

  async getLocationData() {
    let filter = "";
    let category = this.args.category;

    if (this.args.mapType === "topicList") {
      if (category) {
        filter = `c/${category.slug}/${category.id}/l/map`;

        // let filter = `tag/${settings.topic_list_featured_images_tag}`;
        // let lastTopicList = findOrResetCachedTopicList (this.session, filter);
        // list = await findOrResetCachedTopicList(this.session, filter) || this.store.findFiltered ('topicList', {filter} )
        // const filter = "c/" + categoryId;
        // this.category = Category.findById(categoryId);

        this.topicList =
          (await findOrResetCachedTopicList(this.session, filter)) ||
          this.store.findFiltered("topicList", { filter });
      } else {
        let result = await ajax("map.json");
        this.topicList = result.topic_list;
      }
    }

    if (this.args.mapType === "userList") {
      let params = { period: "location" };
      this.userList = await this.store.find("directoryItem", params);
    }
  }

  gatherLocations() {
    // gather map data and prepare raw marker data

    this.locations = [];
    this.mapType = this.args.mapType;
    this.topic = this.args.topic;
    this.user = this.args.user;

    if (
      this.args.locations &&
      this.locations.length !== this.args.locations.length
    ) {
      this.args.locations.forEach((l) => {
        if (l && this.validGeoLocation(l)) {
          this.locations.push(l);
        }
      });
    }

    if (this.addTopicMarker(this.topic, this.locations)) {
      this.locations.push(this.topicMarker(this.topic));
    }

    if (
      this.mapType === "topicList" &&
      this.topicList &&
      this.topicList.topics
    ) {
      this.topicList.topics.forEach((t) => {
        if (this.addTopicMarker(t, this.locations)) {
          this.locations.push(this.topicMarker(t));
        }
      });
    }

    if (
      this.mapType === "user" &&
      this.addUserMarker(this.user, this.locations)
    ) {
      this.locations.push(this.userMarker(this.user));
    }

    if (this.mapType === "userList" && this.userList) {
      this.userList.forEach((u) => {
        if (this.addUserMarker(u.user, this.locations)) {
          this.locations.push(this.userMarker(u.user));
        }
      });
    }
  }

  addTopicMarker(topic, locations) {
    // confirm if topic marker to the data should be added
    if (
      !topic ||
      !topic.location ||
      !topic.location.geo_location ||
      !this.validGeoLocation(topic.location.geo_location) ||
      topic.location.hide_marker ||
      locations.find((l) => l["topic_id"] === topic.id)
    ) {
      return false;
    }
    // confirmed
    return true;
  }

  addUserMarker(user, locations) {
    if (
      !user ||
      !this.validGeoLocation(user.geo_location) ||
      locations.find((l) => l["user_id"] === user.id)
    ) {
      return false;
    }
    return true;
  }

  validGeoLocation(geoLocation) {
    return geoLocation && geoLocation.lat && geoLocation.lon;
  }

  topicMarker(topic) {
    let location = topic.location;

    if (!location["marker"] && !location["circle_marker"]) {
      location["marker"] = {
        title: topic.fancy_title,
        routeTo: topic.url,
      };
    }

    if (
      this.siteSettings.location_map_marker_category_color &&
      topic.category &&
      topic.category.color
    ) {
      location["marker"]["color"] = topic.category.color;
      location["marker"]["class"] = topic.category.slug;
    }

    location["topic_id"] = topic.id;

    return location;
  }

  userMarker(user) {
    let location = {};

    location["marker"] = {
      title: user.username,
      avatar: user.avatar_template,
      routeTo: "/u/" + user.username,
    };

    location["user_id"] = user.id;

    location["geo_location"] = user.geo_location;

    return location;
  }

  locationPresent(locations, location) {
    return (
      locations.filter((l) => {
        if (location.geo_location) {
          return false;
        }
        if (location.geo_location.lat && location.geo_location.lon) {
          return (
            l.geo_location.lat === location.geo_location.lat &&
            l.geo_location.lon === location.geo_location.lon
          );
        } else if (location.geo_location.boundingbox) {
          return (
            l.geo_location.boundingbox === location.geo_location.boundingbox
          );
        }
      }).length > 0
    );
  }

  addMarkers() {
    const map = this.mapObjs.map;
    const locations = this.locations;
    const settings = this.siteSettings;

    let rawMarkers = [];
    let rawCircleMarkers = [];

    if (locations && locations.length > 0) {
      locations.forEach((l) => {
        if (l && l.geo_location) {
          let marker = {
            lat: l.geo_location.lat,
            lon: l.geo_location.lon,
            options: {},
          };

          if (l.marker) {
            marker["options"] = l.marker;
            rawMarkers.push(marker);
          }

          if (l.circle_marker) {
            marker["options"] = l.circle_marker;
            rawCircleMarkers.push(marker);
          }
        }
      });
    }

    let markers = null;

    if (rawCircleMarkers && rawCircleMarkers.length > 0) {
      addCircleMarkersToMap(rawCircleMarkers, map, this);
    }

    if (rawMarkers && rawMarkers.length > 0) {
      markers = addMarkersToMap(
        rawMarkers,
        map,
        settings.location_map_maker_cluster_enabled,
        settings.location_map_marker_cluster_multiplier,
        settings.location_user_avatar,
        settings.location_hide_labels
      );
    }

    return markers;
  }

  setupLocationMap() {
    // setup map

    const mapObjs = this.mapObjs;
    const map = mapObjs.map;
    this.markers = this.addMarkers();
    const topic = this.topic;
    const category = this.args.category;
    const zoom = this.zoom;
    const center = this.args.center;
    let boundingbox = null;

    if (
      category &&
      category.custom_fields.location &&
      category.custom_fields.location.geo_location &&
      category.custom_fields.location.geo_location.boundingbox
    ) {
      boundingbox = category.custom_fields.location.geo_location.boundingbox;
    }

    if (
      topic &&
      topic.location &&
      topic.location.geo_location &&
      topic.location.geo_location.boundingbox
    ) {
      boundingbox = topic.location.geo_location.boundingbox;
    }

    map.invalidateSize(false);
    setupMap(map, this.markers, boundingbox, zoom, center, this.siteSettings);
    //map.invalidateSize();
  }

  @action
  toggleAttribution() {
    const map = this.mapObjs.map;
    const attribution = this.mapObjs.attribution;

    if (!this.showAttribution) {
      map.addControl(attribution);
    } else {
      if ($(".locations-map .leaflet-control-attribution").is(":visible")) {
        map.removeControl(attribution);
      }
    }

    this.showAttribution = !this.showAttribution;
  }

  @computed("args.category")
  get showEditButton() {
    return false;
    // TODO
    //return this.args.category && this.args.category.can_edit;
  }

  @action
  toggleSearch() {
    // TODO
    // scheduleOnce("afterRender", this, () => {
    //   // resetinng the val puts the cursor at the end of the text on focus
    //   const $input = $("#map-search-input");
    //   const val = $input.val();
    //   $input.focus();
    //   $input.val("");
    //   $input.val(val);
    // });
    this.showSearch = !this.showSearch;
  }

  @action
  toggleExpand() {
    const map = this.mapObjs.map;
    this.expanded = !this.expanded;
    map.invalidateSize();

    if (this.expanded) {
      this.mapToggle = "compress";
      map.setZoom(this.siteSettings.location_map_expanded_zoom);
    } else {
      this.mapToggle = "expand";
      this.setupLocationMap();
    }
  }

  // TODO
  // @action
  // editCategory() {
  //   const appRoute = this.register.lookup("route:application");
  //   appRoute.send("editCategory", this.category);
  // };

  onMapLoad() {
    // find our container
    const locationsMapDiv = document.getElementById("locations-map");

    // check if there's a map in it
    const mapContainerDivs =
      locationsMapDiv.querySelector(".leaflet-container");

    // if not add it
    if (mapContainerDivs === null) {
      locationsMapDiv.appendChild(this.mapObjs.element);
    }
  }

  initializeMap() {
    // initialise map
    let mapObjs;

    const center = this.args.center;
    const clickable = this.args.clickable;
    const zoom = this.args.zoom;
    let opts = {};
    if (zoom) {
      opts["zoom"] = zoom;
    }
    if (center) {
      opts["center"] = center;
    }
    if (clickable) {
      opts["clickable"] = clickable;
    }

    mapObjs = generateMap(this.siteSettings, opts);

    return mapObjs;
  }

  //TODO
  // if (attrs.showAvatar && user) {
  //   let size = state.expanded ? "large" : "medium";
  //   contents.push(
  //     h(
  //       "a.avatar-wrapper",
  //       {
  //         attributes: { "data-user-card": user.get("username") },
  //       },
  //       avatarImg(size, {
  //         template: user.get("avatar_template"),
  //         username: user.get("username"),
  //       })
  //     )
  //   );
  // }

  //TOOD
  // if (attrs.search) {
  //   if (state.showSearch) {
  //     let locations = state.locations;
  //     let current = null;
  //     if (attrs.category && attrs.category.location) {
  //       current = attrs.category.location;
  //     }
  //     if (attrs.topic && attrs.topic.location) {
  //       current = attrs.topic.location;
  //     }
  //     contents.push(
  //       this.attach("map-search", {
  //         locations,
  //         current,
  //       }),
  //       this.attach("button", {
  //         className: "btn btn-map hide-search",
  //         action: "toggleSearch",
  //         icon: "times",
  //       })
  //     );
  //   } else {
  //     contents.push(
  //       this.attach("link", {
  //         className: "btn btn-map search",
  //         action: "toggleSearch",
  //         icon: "search",
  //       })
  //     );
  //   }
  // }

  //TODO
  // if (attrs.extraWidgets) {
  //   const extraWidgets = attrs.extraWidgets.map((w) => {
  //     return this.attach(w.widget, w.attrs);
  //   });
  //   contents.push(...extraWidgets);
  // }
}
