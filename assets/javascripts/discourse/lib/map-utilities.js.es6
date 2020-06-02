/* global L */

import { emojiUnescape } from 'discourse/lib/text';
import DiscourseURL from 'discourse/lib/url';

const generateMap = function(siteSettings, opts) {
  const element = document.createElement('div');
  let attrs = {
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0.1
  };

  const defaultZoom = siteSettings.location_map_zoom;
  attrs['zoom'] = opts['zoom'] !== undefined ? opts['zoom'] : defaultZoom;

  const defaultLat = siteSettings.location_map_center_lat;
  const defaultLon = siteSettings.location_map_center_lon;
  attrs['center'] = opts['center'] !== undefined ? opts['center'] : [defaultLat, defaultLon];

  const map = L.map(element, attrs);

  let tileOpts = {
    attribution: siteSettings.location_map_attribution,
    maxZoom: 19
  };

  const subdomains = siteSettings.location_map_tile_layer_subdomains;
  if (subdomains) {
    tileOpts['subdomains'] = subdomains;
  }

  L.tileLayer(siteSettings.location_map_tile_layer, tileOpts).addTo(map);

  L.Icon.Default.imagePath = '/plugins/discourse-locations/leaflet/images/';

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  let attribution = L.control.attribution({ position: 'bottomright', prefix: ''});

  return { element, map, attribution };
};

const setupMap = function(map, markers, boundingbox, zoom, center, siteSettings) {
  if (boundingbox) {
    let b = boundingbox;
    // fitBounds needs: south lat, west lon, north lat, east lon
    map.fitBounds([[b[0], b[2]],[b[1], b[3]]]);
  } else if (markers) {
    const maxZoom = siteSettings.location_map_marker_zoom;
    map.fitBounds(markers.getBounds().pad(0.1), { maxZoom });
  } else {
    const defaultLat = Number(siteSettings.location_map_center_lat);
    const defaultLon = Number(siteSettings.location_map_center_lon);
    const defaultZoom = siteSettings.location_map_zoom;
    const setZoom = zoom === undefined ? defaultZoom : zoom;
    const setView = center === undefined ? [defaultLat, defaultLon] : center;
    map.setView(setView);
    map.setZoom(setZoom);
  }
};

const buildMarker = function(rawMarker, location_user_avatar, location_hide_labels) {
  const customMarkerStyle = !!rawMarker.options.color;

  if (customMarkerStyle) {
    const markerStyles = `
      background-color: #${rawMarker.options.color};
      width: 1.5rem;
      height: 1.5rem;
      display: block;
      left: -0.8rem;
      top: 0;
      position: relative;
      border-radius: 3rem 3rem 0;
      transform: rotate(45deg);
      border: 1px solid #${rawMarker.options.color};
      z-index: 100`

    const markerClass = rawMarker.options.class;

    rawMarker.options['icon'] = L.divIcon({
      className: "",
      iconAnchor: [0, 30],
      labelAnchor: [-25, 0],
      popupAnchor: [10, -36],
      html: `<span style="${markerStyles}" class="${markerClass}" />`
    });
  }
  
  const avatarMarkerStyle = !!rawMarker.options.avatar && location_user_avatar;
  
  if (avatarMarkerStyle) {
    const avatarSize = window.devicePixelRatio > 1 ? '60' : '30';
    const userAvatar = rawMarker.options.avatar.replace('{size}', avatarSize);
    
    const markerStyles = `
      background-color: dimgrey;
      width: 30px;
      height: 30px;
      display: block;
      left: -18px;
      top: -0px;
      position: relative;
      border-radius: 50% 50% 0;
      transform: rotate(45deg);
      border: 3px solid dimgrey;
      z-index: 100;`
    
    const avatarStyles = `
      width: 100%;
      border-radius: 50%;
      transform: rotate(-45deg);`
    
    rawMarker.options['icon'] = L.divIcon({
      className: "",
      iconAnchor: [0, 44],
      labelAnchor: [-25, 0],
      popupAnchor: [10, -36],
      html: `<span style="${markerStyles}" class="avatar-marker"><img src="${userAvatar}" style="${avatarStyles}" class="avatar"></span>`
    });
  }

  const marker = L.marker({
    lat: rawMarker.lat,
    lon: rawMarker.lon
  }, rawMarker.options);

  if (rawMarker.options) {
    if (rawMarker.options.routeTo) {
      marker.on('click', () => {
        DiscourseURL.routeTo(rawMarker.options.routeTo);
      });
    }

    if (rawMarker.options.title && !location_hide_labels) {
      const title = emojiUnescape(rawMarker.options.title);
      let className = 'topic-title-map-tooltip';

      if (customMarkerStyle) className += ' custom';
      if (avatarMarkerStyle) className += ' avatar-tip';

      marker.bindTooltip(title,
        {
          permanent: true,
          direction: 'top',
          className
        }
      ).openTooltip();
    }

    if (rawMarker.options.class) {
      $(marker._icon).addClass(rawMarker.options.class);
    }
  }

  return marker;
};

const addCircleMarkersToMap = function(rawCircleMarkers, map, context) {
  rawCircleMarkers.forEach((cm) => {
    const marker = L.circleMarker({
      lat: cm.lat,
      lon: cm.lon
    }, cm.options);

    if (cm.options.routeTo) {
      marker.on('click', () => {
        context.toggleExpand();
        DiscourseURL.routeTo(cm.options.routeTo);
      });
    }

    marker.addTo(map);
  });
};

const addMarkersToMap = function(rawMarkers, map, location_map_maker_cluster_enabled, location_map_marker_cluster_multiplier, location_user_avatar, location_hide_labels) {
  let markers;

  if (location_map_maker_cluster_enabled) {
    markers = L.markerClusterGroup({
      spiderfyDistanceMultiplier: Number(location_map_marker_cluster_multiplier)
    });
  } else {
    markers = L.featureGroup();
  }

  rawMarkers.forEach((raw) => {
    markers.addLayer(buildMarker(raw, map, location_user_avatar, location_hide_labels));
  });

  map.addLayer(markers);

  return markers;
};

export { generateMap, setupMap, addMarkersToMap, addCircleMarkersToMap };
