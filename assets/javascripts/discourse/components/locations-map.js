import MountWidget from "discourse/components/mount-widget";
import { later, scheduleOnce } from "@ember/runloop";
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
import { htmlSafe } from "@ember/template";

export default class LocationMapComponent extends Component {
//export default MountWidget.extend({
  //TODO
  // classNameBindings: [":map-component", ":map-container", "size"],
  // widget: "map",
  // clickable: false,

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
  @tracked locations = [];
  @tracked mapType = "category";
  @tracked topic = {};
  @tracked topicList = {};
  @tracked user = {};
  @tracked userList = {};
  @tracked mapObjs = {};
  @tracked showAttribution = false;
  @tracked markers = null;

  @action 
  setup() {
    //debugger;
    this.getLocationTopics().then(() => {
      //debugger;
      if (!Object.keys(this.mapObjs).length) {
        console.log('init map');
        this.mapObjs = this.initializeMap();
      } else {
        if (this.markers) {
          console.log('map exists, but clear markers');
          this.markers._featureGroup.clearLayers() 
          this.markers = null;
        }
      }

      // find our container
      const locationsMapDiv = document.getElementById("locations-map");

      // check if there's a map in it
      const mapContainerDivs = locationsMapDiv.querySelector('.leaflet-container')
      
      // if not add it
      if (mapContainerDivs === null) {
        locationsMapDiv.appendChild(this.mapObjs.element);
      }
      
      this.gatherLocations();

      const category = this.args.category;
      const user = this.currentUser;

      // if (this.runSetup || this.args.runSetup) {
      //   this.runSetup = false;
        this.setupLocationMap();

        // TODO        
        // // triggered in sidebar-container component in layouts plugin
        // this.appEvents.on("sidebars:after-render", () => {
        //   state.runSetup = true;
        //   state.showSearch = false;
        //   this.scheduleRerender();
        // });
      // }

    })
  }

  async getLocationTopics() {
    let topics = [];
    let filter = "";
    console.log(this.args.category);
    let category = this.args.category;


    if (category) {
      let filter = `c/${category.slug}/${category.id}/l/map`

    // let filter = `tag/${settings.topic_list_featured_images_tag}`;
    // let lastTopicList = findOrResetCachedTopicList (this.session, filter);
    //list = await findOrResetCachedTopicList(this.session, filter) || this.store.findFiltered ('topicList', {filter} )
    // const filter = "c/" + categoryId;
    // this.category = Category.findById(categoryId);

      this.topicList = await this.store.findFiltered ('topicList', {filter} )

    }
    console.log("current topic list:");
    console.log(this.topicList);
      //this.topics = Ember.Object.create(list).topic_list.topics;


  
    // if (this.args.category && settings.topic_list_featured_images_from_current_category_only) {
    //   topics = topics.filter(topic => topic.category_id == this.args.category.id)
    // };
  
    // const reducedTopics = topics ? settings.topic_list_featured_images_count == 0 ? topics : topics.slice(0,settings.topic_list_featured_images_count) : [];

    // if (settings.topic_list_featured_images_created_order) {
    //   reducedTopics.sort((a, b) => {
    //     var keyA = new Date(a.created_at), keyB = new Date(b.created_at);
    //     // Compare the 2 dates
    //     if (keyA < keyB) return 1;
    //     if (keyA > keyB) return -1;
    //     return 0;
    //   });
    // }
    // this.featuredTopics = reducedTopics;
  };


  gatherLocations() {
    // // debugger;
    console.log("gather map data and prepare raw marker data");
    this.locations = [];
    this.mapType = this.args.mapType
    this.topic = this.args.topic;
    // this.topicList = this.args.topicList;
    this.user = this.args.user;
    // this.userList = this.args.userList;
    
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
//// debugger;
    if (this.mapType == "topicList" && this.topicList && this.topicList.topics) {
      this.topicList.topics.forEach((t) => {
        if (this.addTopicMarker(t, this.locations)) {
  //        // debugger;
          this.locations.push(this.topicMarker(t));
        }
      });
    }

    if (this.mapType == "user" && this.addUserMarker(this.user, this.locations)) {
      this.locations.push(this.userMarker(this.user));
    }

    if (this.mapType == "userList" && this.userList) {
      this.userList.forEach((u) => {
        if (this.addUserMarker(u.user, this.locations)) {
          this.locations.push(this.userMarker(u.user));
        }
      });
    }
  };

  addTopicMarker(topic, locations) {
    console.log("confirm if topic marker to the data should be added")
    debugger;
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
    console.log("confirmed")
    return true;
  };

  addUserMarker(user, locations) {
    if (
      !user ||
      !this.validGeoLocation(user.geo_location) ||
      locations.find((l) => l["user_id"] === user.id)
    ) {
      return false;
    }
    return true;
  };

  validGeoLocation(geoLocation) {
    return geoLocation && geoLocation.lat && geoLocation.lon;
  };

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
  };

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
  };

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
  };

  addMarkers() {
    //remove
    // return;
    const map = this.mapObjs.map;
   // // debugger;
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
    //// debugger;
      markers = addMarkersToMap(
        rawMarkers,
        map,
        settings.location_map_maker_cluster_enabled,
        settings.location_map_marker_cluster_multiplier,
        settings.location_user_avatar,
        settings.location_hide_labels
      );
    }
   // // debugger;
    return markers;
  };

  setupLocationMap() {
    console.log('setup map');
    //this.gatherLocations();
    // return;

    const mapObjs = this.mapObjs;
   // // debugger;
    const map = mapObjs.map;
    this.markers = this.addMarkers();
    const topic = this.topic;
    const category = this.args.category;
    const zoom = this.zoom;
    const center = this.args.center;
    let boundingbox = null;

   // // debugger;
    
    if (
      category &&
      category.custom_fields.location &&
      category.custom_fields.location.geo_location &&
      category.custom_fields.location.geo_location.boundingbox
    ) {
      //// debugger;
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
   //// debugger;
    setupMap(map, this.markers, boundingbox, zoom, center, this.siteSettings);
    //// debugger;
    map.invalidateSize();
    //// debugger;
  };

  @action
  toggleAttribution() {
    //// debugger;
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
  };

  @computed("args.category")
  get showEditButton() {
    return false;
    // TODO
    //return this.args.category && this.args.category.can_edit;
  };

  @action
  toggleSearch() {
    // scheduleOnce("afterRender", this, () => {
    //   // resetinng the val puts the cursor at the end of the text on focus
    //   const $input = $("#map-search-input");
    //   const val = $input.val();
    //   $input.focus();
    //   $input.val("");
    //   $input.val(val);
    // });
    this.showSearch = !this.showSearch;
  };

  @action
  toggleExpand() {
    const map = this.mapObjs.map;
    // const $map = $(".locations-map");

    // $map.toggleClass("expanded");
    this.expanded = !this.expanded;
    map.invalidateSize();

    if (this.expanded) {
      this.mapToggle = "compress";
      map.setZoom(this.siteSettings.location_map_expanded_zoom);
    } else {
      this.mapToggle = "expand";
      this.setupLocationMap();
    }
  };

  // TODO
  // @action
  // editCategory() {
  //   const appRoute = this.register.lookup("route:application");
  //   appRoute.send("editCategory", this.category);
  // };

  initializeMap() {
    console.log('initialise map');
    // const currentDiv = document.getElementById("locations-map");
    // debugger;
    // this.mapObjs.map = document.firstChild;
    // debugger;
    // this.mapObjs.map.clearLayers();

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
    //// debugger;
    return generateMap(this.siteSettings, opts);
  };

  get mapHTML() {
   //return htmlSafe(this.mapObjs.element)
   // debugger;
   if (this.mapObjs && this.mapObjs.element) {
    console.log(this.mapObjs.element);
    console.log(this.mapObjs.element.outerHTML);
    return this.mapObjs.element.outerHTML
   } else {
    return "";
   }

  };

  // html(attrs, state) {

  constructor() {
    super(...arguments);


  };

    //DONE
    // let contents = [new RawHtml({ html: state.mapObjs.element })];

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

    //DONE
    // if (state.showExpand) {
    //   contents.push(
    //     this.attach("button", {
    //       className: `btn btn-map map-expand`,
    //       action: "toggleExpand",
    //       actionParam: category,
    //       icon: state.mapToggle,
    //     })
    //   );
    // }

    //DONE
    // contents.push(
    //   this.attach("button", {
    //     className: "btn btn-map map-attribution",
    //     action: "toggleAttribution",
    //     icon: "info",
    //   })
    // );

    //DONE
    // if (category && category.can_edit) {
    //   contents.push(
    //     this.attach("button", {
    //       className: "btn btn-map category-edit",
    //       action: "editCategory",
    //       icon: "wrench",
    //     })
    //   );
    // }

   //TODO
    // if (attrs.extraWidgets) {
    //   const extraWidgets = attrs.extraWidgets.map((w) => {
    //     return this.attach(w.widget, w.attrs);
    //   });
    //   contents.push(...extraWidgets);
    // }

  //   return contents;
  // };







//TODO
  // buildArgs() {
  //   let args = this.getProperties(
  //     "category",
  //     "topic",
  //     "user",
  //     "locations",
  //     "clickable",
  //     "topicList",
  //     "userList",
  //     "search",
  //     "showAvatar",
  //     "size",
  //     "center",
  //     "zoom"
  //   );


  //   // debugger;
  //   if (this.get("geoLocation")) {
  //     if (!args["locations"]) {
  //       args["locations"] = [];
  //     }
  //     args["locations"].push({ geo_location: this.get("geoLocation") });
  //   }

  //   return args;
  // },

  // @on("didInsertElement")
  // setupOnRender() {
  //   this.scheduleSetup();
  // },

  // @observes(
  //   "topicList.[]",
  //   "category",
  //   "geoLocation",
  //   "geoLocations.[]",
  //   "userList.[]"
  // )
  // refreshMap() {
  //   this.queueRerender();
  //   this.scheduleSetup();
  // },

  // scheduleSetup() {
  //   scheduleOnce("afterRender", () => this.appEvents.trigger("dom:clean"));
  //   later(() => this.appEvents.trigger("sidebars:after-render"));
  // },
};
