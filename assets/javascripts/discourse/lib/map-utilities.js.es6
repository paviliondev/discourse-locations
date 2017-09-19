
let mapStyle = function(feature, highlight) {
  return {
    fillColor: feature.parent_slug ? "transparent" : "transparent",
    weight: highlight ? 2 : 1,
    fillOpacity: feature.parent_slug ? 0.4 : 0,
    color: feature.parent_slug ? "#ff7800" : "#0088cc",
    opacity: 0.6
  };
};

let getGeoJson = function(category, clickable) {
  let geojson = L.geoJson(false, {
    style: mapStyle,
    clickable
  });

  if (category) {
    const categories = Discourse.Category.list();
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].has_geojson) {
        geojson.addData(JSON.parse(categories[i].geojson));
      }
    }
  }

  return geojson;
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

  let geojson = getGeoJson(category, clickable);
  geojson.addTo(map);

  return { element, map, geojson, attribution };
};

let setupMap = function(map, geojson, category, markers) {

  if (geojson) {
    if (category) {
      let slug = category.slug,
          parentSlug = category.parentCategory ? category.parentCategory.slug : null;

      geojson.eachLayer(function (layer) {
        if (layer.feature.slug === slug) {
          let style = mapStyle(layer.feature, true);
          layer.setStyle(style);
          map.fitBounds(layer.getBounds());
        } else if (layer.feature.slug === parentSlug) {
          layer.setStyle({
            fillOpacity: 0
          });
        } else {
          geojson.resetStyle(layer);
        }
      });
    } else {
      geojson.eachLayer(function (layer) {
        geojson.resetStyle(layer);
      });
    }
  }

  if (markers) {
    map.fitBounds(markers.getBounds());
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

let providerDetails = {
  nominatim: `<a href='https://www.openstreetmap.org' target='_blank'>OpenStreetMap</a>`,
  mapzen: `<a href='https://mapzen.com/' target='_blank'>Mapzen</a>`,
  location_iq: `<a href='https://locationiq.org/' target='_blank'>LocationIQ</a>`,
  opencagedata: `<a href='https://opencagedata.com' target='_blank'>OpenCage Data</a>`,
  mapbox: `<a href='https://www.mapbox.com/' target='_blank'>Mapbox</a>`,
  mapquest: `<a href='https://developer.mapquest.com' target='_blank'>Mapquest</a>`
};

export { generateMap, setupMap, addMarkersToMap, providerDetails };
