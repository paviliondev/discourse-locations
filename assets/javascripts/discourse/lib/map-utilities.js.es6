
let mapStyle = function(feature, highlight) {
  return {
    fillColor: feature.parent_slug ? "transparent" : "transparent",
    weight: highlight ? 2 : 1,
    fillOpacity: feature.parent_slug ? 0.4 : 0,
    color: feature.parent_slug ? "#ff7800" : "#0088cc",
    opacity: 0.6
  };
};

let generateMap = function(category, clickable) {
  let element = document.createElement('div');

  let map = L.map(element, {
    zoomControl: false,
    attributionControl: false
  }).fitWorld();

  let options = {
    attribution: Discourse.SiteSettings.location_map_attribution,
    maxZoom: 19
  };

  const subdomains = Discourse.SiteSettings.location_map_tile_layer_subdomains;
  if (subdomains) {
    options['subdomains'] = subdomains;
  }

  L.tileLayer(Discourse.SiteSettings.location_map_tile_layer, options).addTo(map);

  L.Icon.Default.imagePath = '/plugins/discourse-locations/leaflet/images/';

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  let attribution = L.control.attribution({ position: 'bottomright', prefix: ''});

  return { element, map, attribution };
};

let setupMap = function(map, markers, boundingbox) {

  if (boundingbox) {
    let b = boundingbox;
    // fitBounds needs: south lat, west lon, north lat, east lon
    map.fitBounds([[b[0], b[2]],[b[1], b[3]]]);
  }

  if (markers) {
    const maxZoom = Discourse.SiteSettings.location_map_marker_zoom;
    map.fitBounds(markers.getBounds(), { maxZoom });
  }
};

var buildMarker = function(rawMarker) {
  const marker = L.marker({
    lat: rawMarker.lat,
    lon: rawMarker.lon
  }, rawMarker.options);

  if (rawMarker.onClick) {
    marker.on('click', rawMarker.onClick);
  }

  if (rawMarker.options && rawMarker.options.title) {
    marker.bindTooltip(rawMarker.options.title,
      {
        permanent: true,
        direction: 'top'
      }
    ).openTooltip();
  }

  return marker;
};

var addMarkersToMap = function(rawMarkers, map) {
  let markers = L.markerClusterGroup({
    spiderfyDistanceMultiplier: 6
  });

  rawMarkers.forEach((raw) => {
    markers.addLayer(buildMarker(raw, map));
  });

  map.addLayer(markers);

  return markers;
};

export { generateMap, setupMap, addMarkersToMap };
