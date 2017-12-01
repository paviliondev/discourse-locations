import DiscourseURL from 'discourse/lib/url';

const mapStyle = function(feature, highlight) {
  return {
    fillColor: feature.parent_slug ? "transparent" : "transparent",
    weight: highlight ? 2 : 1,
    fillOpacity: feature.parent_slug ? 0.4 : 0,
    color: feature.parent_slug ? "#ff7800" : "#0088cc",
    opacity: 0.6
  };
};

const zoomSize = {
  small: 0,
  medium: 1,
  large: 2
};

const generateMap = function(opts) {
  const element = document.createElement('div');
  let attrs = {
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0.1
  };
  if (opts['zoom']) attrs['zoom'] = opts['zoom'];
  if (opts['center']) attrs['center'] = opts['center'];

  const map = L.map(element, attrs);

  if (!opts['center']) map.fitWorld();

  let tileOpts = {
    attribution: Discourse.SiteSettings.location_map_attribution,
    maxZoom: 19
  };

  const subdomains = Discourse.SiteSettings.location_map_tile_layer_subdomains;
  if (subdomains) {
    tileOpts['subdomains'] = subdomains;
  }

  L.tileLayer(Discourse.SiteSettings.location_map_tile_layer, tileOpts).addTo(map);

  L.Icon.Default.imagePath = '/plugins/discourse-locations/leaflet/images/';

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  let attribution = L.control.attribution({ position: 'bottomright', prefix: ''});

  return { element, map, attribution };
};

const setupMap = function(map, markers, boundingbox) {

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

const buildMarker = function(rawMarker) {
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
        direction: 'top',
        className: 'topic-title-map-tooltip'
      }
    ).openTooltip();
  }

  return marker;
};

const addCircleMarkersToMap = function(rawCircleMarkers, map) {
  rawCircleMarkers.forEach((cm) => {
    const marker = L.circleMarker({
      lat: cm.lat,
      lon: cm.lon
    }, cm.options);

    if (cm.options.routeTo) {
      marker.on('click', () => DiscourseURL.routeTo(cm.options.routeTo));
    }

    marker.addTo(map);
  });
};

const addMarkersToMap = function(rawMarkers, map) {
  let markers = L.markerClusterGroup({
    spiderfyDistanceMultiplier: 6
  });

  rawMarkers.forEach((raw) => {
    markers.addLayer(buildMarker(raw, map));
  });

  map.addLayer(markers);

  return markers;
};

export { generateMap, setupMap, zoomSize, addMarkersToMap, addCircleMarkersToMap };
