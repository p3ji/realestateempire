import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property, AICompetitor } from '../types';

interface MapProps {
  properties: Property[];
  competitors: AICompetitor[];
  selectedPropertyId: string | null;
  onSelectProperty: (id: string | null) => void;
}

export const Map: React.FC<MapProps> = ({
  properties,
  competitors,
  selectedPropertyId,
  onSelectProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

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

    // Add Custom Zoom Control to top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. High-Resolution Esri World Imagery (Satellite) Tiles
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 17,
      }
    );

    // 2. CartoDB Dark Matter Transparent Labels & Roads Overlay
    const labelLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 17,
        pane: 'markerPane', // Force labels above markers for legibility
      }
    );

    // Add layers to map
    satelliteLayer.addTo(map);
    labelLayer.addTo(map);

    mapRef.current = map;

    // Handle map clicks to deselect
    map.on('click', (e) => {
      // Check if clicking on map itself, not markers
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
    };
  }, []);

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

      // Determine HTML content and colors
      let markerText = '';
      let typeClass = '';
      let ownerClass = '';
      let glowColor = '';

      if (prop.type === 'residential') {
        markerText = '🏠';
        typeClass = 'residential';
      } else if (prop.type === 'commercial') {
        markerText = '🏢';
        typeClass = 'commercial';
      } else if (prop.type === 'industrial') {
        markerText = '🏭';
        typeClass = 'industrial';
      }

      if (isOwnedByPlayer) {
        markerText = 'P';
        ownerClass = 'owned-player';
        glowColor = 'var(--cyber-green-glow)';
      } else if (ownerComp) {
        // Initials of competitor
        markerText = ownerComp.name.substring(0, 1);
        ownerClass = 'owned-competitor';
        glowColor = ownerComp.color;
      }

      // Create glowing HTML structure
      const customIcon = L.divIcon({
        className: 'hud-marker-container',
        html: `
          <div 
            class="hud-marker ${typeClass} ${ownerClass} ${isSelected ? 'selected' : ''}" 
            style="
              --marker-glow-color: ${glowColor}; 
              ${ownerComp ? `background-color: ${ownerComp.color};` : ''}
            "
          >
            ${markerText}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      let marker = markersRef.current[prop.id];

      if (!marker) {
        // Create new marker
        marker = L.marker([prop.lat, prop.lng], { icon: customIcon });
        marker.addTo(map);
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectProperty(prop.id);
        });
        
        // Add simple tooltip for hover address
        marker.bindTooltip(`${prop.address} (${prop.neighborhood})`, {
          direction: 'top',
          offset: [0, -10],
          className: 'leaflet-tooltip-cyber',
        });

        markersRef.current[prop.id] = marker;
      } else {
        // Update existing marker's icon
        marker.setIcon(customIcon);
        // Update tooltip content
        marker.setTooltipContent(`${prop.address} (${prop.neighborhood})`);
      }
    });
  }, [properties, competitors, selectedPropertyId]);

  // Pan to selected property
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPropertyId) return;

    const prop = properties.find(p => p.id === selectedPropertyId);
    if (prop) {
      map.flyTo([prop.lat, prop.lng], 15, {
        duration: 1.2,
      });
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
      {/* Visual cyber HUD scan overlay */}
      <div className="cyber-grid-overlay" style={{ zIndex: 2 }} />
    </div>
  );
};
