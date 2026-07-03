import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property, AICompetitor } from '../types';
import { formatCurrency } from '../utils';

interface MapProps {
  properties: Property[];
  competitors: AICompetitor[];
  selectedPropertyId: string | null;
  onSelectProperty: (id: string | null) => void;
}

type MapStyle = 'illustrated' | 'satellite';

const MAP_STYLE_KEY = 'real_estate_empire_map_style';

// Deterministic sprite variety per property, keyed by type + id hash
const getSpriteForProperty = (prop: Property): string => {
  let hash = 0;
  for (let i = 0; i < prop.id.length; i++) {
    hash = (hash * 31 + prop.id.charCodeAt(i)) % 997;
  }
  if (prop.type === 'commercial') {
    const commercial = ['strip_mall', 'office_tower', 'mega_mall'];
    return commercial[hash % commercial.length];
  }
  if (prop.type === 'industrial') {
    const industrial = ['warehouse', 'data_center'];
    return industrial[hash % industrial.length];
  }
  // Residential: pick by price tier for plausibility, hash for variety in the middle
  if (prop.basePrice >= 900000) return 'single_family';
  if (prop.basePrice <= 450000) return 'apartment';
  const mid = ['row_house', 'single_family', 'condo_tower'];
  return mid[hash % mid.length];
};

export const Map: React.FC<MapProps> = ({
  properties,
  competitors,
  selectedPropertyId,
  onSelectProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const markerHtmlRef = useRef<Record<string, string>>({});
  const layersRef = useRef<{
    illustrated: L.TileLayer;
    satellite: L.TileLayer;
    satelliteLabels: L.TileLayer;
  } | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    const saved = localStorage.getItem(MAP_STYLE_KEY);
    return saved === 'satellite' ? 'satellite' : 'illustrated';
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map centered on Ottawa
    const map = L.map(mapContainerRef.current, {
      center: [45.4110, -75.6980], // Centered near Centretown/The Glebe
      zoom: 13,
      minZoom: 11,
      maxZoom: 17,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Illustrated "board game" base: CARTO Voyager tinted to warm parchment via CSS
    const illustrated = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 17,
        className: 'tiles-styled',
      }
    );

    // High-Resolution Esri World Imagery (Satellite) Tiles
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 17,
        className: 'tiles-satellite',
      }
    );

    // Transparent labels & roads overlay for satellite mode
    const satelliteLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 17,
        className: 'tiles-satellite-labels',
      }
    );

    layersRef.current = { illustrated, satellite, satelliteLabels };
    mapRef.current = map;

    // Handle map clicks to deselect
    map.on('click', (e) => {
      if ((e.originalEvent.target as HTMLElement).id === 'map-container' ||
          (e.originalEvent.target as HTMLElement).classList.contains('leaflet-container')) {
        onSelectProperty(null);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // StrictMode remounts: stale markers belong to the destroyed map instance
      markersRef.current = {};
      markerHtmlRef.current = {};
      layersRef.current = null;
    };
  }, []);

  // Apply active base layer whenever style changes (and on init)
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    if (mapStyle === 'illustrated') {
      map.removeLayer(layers.satellite);
      map.removeLayer(layers.satelliteLabels);
      layers.illustrated.addTo(map);
    } else {
      map.removeLayer(layers.illustrated);
      layers.satellite.addTo(map);
      layers.satelliteLabels.addTo(map);
    }
    localStorage.setItem(MAP_STYLE_KEY, mapStyle);
  }, [mapStyle]);

  // Update / Render Markers when properties or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear obsolete markers
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const propExists = properties.some(p => p.id === id);
      if (!propExists) {
        marker.remove();
        delete markersRef.current[id];
        delete markerHtmlRef.current[id];
      }
    });

    // Add or update markers
    properties.forEach(prop => {
      const isSelected = selectedPropertyId === prop.id;
      const isOwnedByPlayer = prop.ownerId === 'player';

      let ownerComp: AICompetitor | undefined;
      if (prop.ownerId && prop.ownerId !== 'player') {
        ownerComp = competitors.find(c => c.id === prop.ownerId);
      }

      const sprite = prop.sprite ?? getSpriteForProperty(prop);

      let ownerClass = 'for-sale';
      let tokenColor = '';
      let badge = '';
      if (isOwnedByPlayer) {
        ownerClass = 'owned-player';
        badge = '<span class="token-badge badge-player">P</span>';
      } else if (ownerComp) {
        ownerClass = 'owned-competitor';
        tokenColor = ownerComp.color;
        badge = `<span class="token-badge" style="background:${ownerComp.color}">${ownerComp.name.substring(0, 1)}</span>`;
      }

      const html = `
        <div
          class="sprite-token ${ownerClass} ${isSelected ? 'selected' : ''}"
          ${tokenColor ? `style="--token-color: ${tokenColor};"` : ''}
        >
          <img src="/sprites/${sprite}.png" alt="" draggable="false" />
          ${badge}
        </div>
      `;

      let marker = markersRef.current[prop.id];
      const tooltip = `${prop.address} — ${formatCurrency(prop.marketValue)} (${prop.neighborhood})`;

      // Leaflet can throw transiently when markers mutate mid zoom/fly
      // animation; a skipped frame self-heals on the next game tick
      try {
        if (!marker) {
          const icon = L.divIcon({
            className: 'sprite-token-container',
            html,
            iconSize: [46, 46],
            iconAnchor: [23, 23],
          });
          marker = L.marker([prop.lat, prop.lng], { icon });
          marker.addTo(map);
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectProperty(prop.id);
          });
          marker.bindTooltip(tooltip, {
            direction: 'top',
            offset: [0, -24],
            className: 'leaflet-tooltip-cyber',
          });
          markersRef.current[prop.id] = marker;
          markerHtmlRef.current[prop.id] = html;
        } else {
          // Only rebuild the icon DOM when its content actually changed,
          // otherwise CSS animations restart on every game tick
          if (markerHtmlRef.current[prop.id] !== html) {
            marker.setIcon(L.divIcon({
              className: 'sprite-token-container',
              html,
              iconSize: [46, 46],
              iconAnchor: [23, 23],
            }));
            markerHtmlRef.current[prop.id] = html;
          }
          const tt = marker.getTooltip();
          if (tt && tt.getContent() !== tooltip) {
            marker.setTooltipContent(tooltip);
          }
        }
      } catch (err) {
        console.warn('Skipped marker update for', prop.id, err);
      }
    });
  }, [properties, competitors, selectedPropertyId]);

  // Pan to selected property
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPropertyId) return;

    const prop = properties.find(p => p.id === selectedPropertyId);
    if (prop) {
      try {
        map.flyTo([prop.lat, prop.lng], 15, {
          duration: 1.2,
        });
      } catch (err) {
        map.setView([prop.lat, prop.lng], 15, { animate: false });
      }
    }
  }, [selectedPropertyId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Map Element */}
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      />

      {/* Map style toggle */}
      <div className="map-style-toggle" style={{ zIndex: 1001 }}>
        <button
          className={mapStyle === 'illustrated' ? 'active' : ''}
          onClick={() => setMapStyle('illustrated')}
        >
          City Map
        </button>
        <button
          className={mapStyle === 'satellite' ? 'active' : ''}
          onClick={() => setMapStyle('satellite')}
        >
          Satellite
        </button>
      </div>

      {/* Visual cyber HUD scan overlay (satellite mode only) */}
      {mapStyle === 'satellite' && <div className="cyber-grid-overlay" style={{ zIndex: 1000 }} />}
    </div>
  );
};
