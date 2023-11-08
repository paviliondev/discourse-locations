import Service, { inject as service } from "@ember/service";
// import discourseComputed, { observes } from "discourse-common/utils/decorators";
import Category from "discourse/models/category";
// import Site from "discourse/models/site";
import { action, computed } from "@ember/object";

export default Service.extend({
  router: service(),

  hrefForCategory(category) {
    let destinationURL = "/latest";
    if (category) {
      const slug = Category.slugFor(category);
      destinationURL = `/c/${slug}/l/latest`;
    }
    return destinationURL;
  },

//   updateCurrentDiscoveryModel(model) {
//     if (model) {
//       this.set("discoveryParams", model.params);
//       this.set("discoveryTopTags", model.get("topic_list.top_tags"));
//     }
//   },

//   updateCurrentCategory(category) {
//     this.set("discoveryCategory", category);
//   },

//   @discourseComputed("discoveryParams.board", "router.currentRouteName")
  @computed ("router.currentRouteName")
  get active() {
    return true //board !== undefined && routeName.startsWith("discovery.latest");
  },

//   @observes("active")
//   updateClasses() {
//     if (this.active) {
//       document.body.classList.add("kanban-active");
//     } else {
//       document.body.classList.remove("kanban-active");
//       document.body.classList.remove("kanban-fullscreen");
//     }
//   },

//   setFullscreen(fullscreen) {
//     if (fullscreen) {
//       document.body.classList.add("kanban-fullscreen");
//     } else {
//       document.body.classList.remove("kanban-fullscreen");
//     }
//   },

//   @discourseComputed("discoveryParams.board", "discoveryTopTags")
//   currentDescriptor(board) {
//     return board;
//   },

//   @discourseComputed("currentDescriptor", "category")
//   listDefinitions(descriptor) {
//     const definition = this.findDefinition(descriptor);
//     if (definition) {
//       return definition.lists;
//     }
//   },

//   @discourseComputed()
//   definitionBuilders() {
//     return {
//       tags: (param) => {
//         const lists = [];

//         let tags = [];
//         if (param) {
//           tags.push(...param.split(","));
//         } else if (this.discoveryTopTags) {
//           tags.push(...this.discoveryTopTags);
//         }

//         lists.push(
//           ...tags.map((tag) => {
//             if (tag === "@untagged") {
//               return {
//                 title: "Untagged",
//                 params: {
//                   no_tags: true,
//                 },
//               };
//             } else {
//               return {
//                 title: `#${tag}`,
//                 params: {
//                   tags: tag,
//                 },
//               };
//             }
//           })
//         );

//         return { lists };
//       },

//       categories: (param) => {
//         const lists = [];

//         if (param) {
//           let categories = param
//             .split(",")
//             .map((c) => Category.findBySlug(...c.split("/").reverse()));
//           categories.filter((c) => c !== undefined);

//           lists.push(
//             ...categories.map((category) => {
//               return {
//                 title: `${category.name}`,
//                 params: {
//                   category: category.id,
//                 },
//               };
//             })
//           );
//         } else if (this.discoveryCategory) {
//           lists.push({
//             title: `${this.discoveryCategory.name}`,
//             params: {
//               category: this.discoveryCategory.id,
//               no_subcategories: true,
//             },
//           });

//           if (this.discoveryCategory.subcategories) {
//             lists.push(
//               ...this.discoveryCategory.subcategories.map((category) => {
//                 return {
//                   title: `${this.discoveryCategory.name} / ${category.name}`,
//                   params: {
//                     category: category.id,
//                   },
//                 };
//               })
//             );
//           }
//         } else {
//           const categories = Site.currentProp("categoriesList").filter(
//             (c) => !c.parent_category_id
//           );

//           lists.push(
//             ...categories.map((category) => {
//               return {
//                 title: `${category.name}`,
//                 params: {
//                   category: category.id,
//                 },
//               };
//             })
//           );
//         }

//         return { lists };
//       },

//       assigned: (param) => {
//         const lists = [];

//         lists.push({
//           title: "Unassigned",
//           icon: "user-minus",
//           params: {
//             assigned: "nobody",
//             status: "open",
//           },
//         });

//         if (param) {
//           lists.push(
//             ...param.split(",").map((u) => {
//               return {
//                 title: u,
//                 icon: "user-plus",
//                 params: {
//                   assigned: u,
//                   status: "open",
//                 },
//               };
//             })
//           );
//         } else {
//           lists.push({
//             title: "Assigned",
//             icon: "user-plus",
//             params: {
//               assigned: "*",
//               status: "open",
//             },
//           });
//         }
//         lists.push({
//           title: "Closed",
//           icon: "lock",
//           params: {
//             status: "closed",
//           },
//         });

//         return { lists };
//       },
//     };
//   },

//   findDefinition(descriptor) {
//     if (typeof descriptor !== "string") {
//       return;
//     }

//     const setDefaults = settings.default_modes
//       .split("|")
//       .map((m) => m.split(":"));

//     const lookup = this.get("discoveryCategory.slug") || "@";
//     const defaultMode = setDefaults.find((m) => m[0] === lookup);
//     if (defaultMode && descriptor === "default") {
//       defaultMode.shift();
//       descriptor = defaultMode.join(":");
//     }

//     if (descriptor === "default") {
//       if (!this.discoveryCategory) {
//         descriptor = "categories";
//       } else if (
//         this.discoveryCategory.subcategories &&
//         this.discoveryCategory.subcategories.length > 0
//       ) {
//         descriptor = "categories";
//       } else {
//         descriptor = "tags";
//       }
//     }

//     const parts = descriptor.split(":");
//     const type = parts[0];
//     const param = parts[1];

//     if (this.definitionBuilders[type]) {
//       return this.definitionBuilders[type](param);
//     } else {
//     }
//   },
});