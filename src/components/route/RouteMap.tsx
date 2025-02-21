import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet-routing-machine';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Custom icons for different marker types
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const locationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle routing
function RoutingMachine({ start, end }: { start: [number, number]; end: [number, number] }) {
  const map = useMap();
  const routingControl = React.useRef<any>(null);
  const routeLayerRef = React.useRef<any>(null);
  const [routeFound, setRouteFound] = useState(false);

  // Fit map to route bounds when route is found
  function handleRouteFound(e: any) {
    if (!map) return;

    if (e.routes && e.routes[0]) {
      const route = e.routes[0];
      const bounds = L.latLngBounds(route.coordinates || []);
      
      // Only fit bounds if they're valid
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 15 // Prevent zooming in too close
        });
      }

      // Add the route layer
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = L.polyline(route.coordinates, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8
      }).addTo(map);

      setRouteFound(true);
    }
  }

  // Reset route found state when props change
  useEffect(() => {
    setRouteFound(false);
  }, [start, end]);

  useEffect(() => {
    if (!map) return;

    function cleanup() {
      if (routingControl.current && map) {
        try {
          map.removeControl(routingControl.current);
        } catch (err) {
          console.warn('Error removing control:', err);
        }
        routingControl.current = null;
      }
      
      if (routeLayerRef.current && map) {
        try {
          map.removeLayer(routeLayerRef.current);
        } catch (err) {
          console.warn('Error removing route layer:', err);
        }
        routeLayerRef.current = null;
      }
    }

    // Clean up existing controls and layers
    cleanup();
    setRouteFound(false);

    if (!start || !end) return;

    // @ts-ignore - leaflet-routing-machine types are not available
    routingControl.current = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: '#6366f1', weight: 4 }]
      },
      containerClassName: 'hidden',
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
      plan: false,
      itineraryFormatter: () => '',
      waypointNameFallback: () => '',
      fitSelectedRoute: true
    }).on('routesfound', handleRouteFound);

    routingControl.current.addTo(map);

    return cleanup;
  }, [start, end, map]);

  return routeFound ? null : <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 opacity-50 z-[1000] flex items-center justify-center">Calculating route...</div>;
}

type RouteMapProps = {
  startPoint: [number, number];
  endPoint: [number, number];
  currentLocation?: [number, number] | null;
  onMapInstance: (map: L.Map) => void;
};

export function RouteMap({ startPoint, endPoint, currentLocation, onMapInstance }: RouteMapProps) {
  const [mapLoaded, setMapLoaded] = React.useState(false);

  function handleMapLoad(map: L.Map) {
    onMapInstance(map);
    setMapLoaded(true);
  }

  return (
    <div className="h-[400px] rounded-lg overflow-hidden shadow-lg relative">
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 z-[1000] flex items-center justify-center">
          Loading map...
        </div>
      )}
      <MapContainer
        center={startPoint}
        zoom={13}
        className="h-full w-full z-0"
        ref={handleMapLoad}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={startPoint} icon={startIcon}>
          <Popup>Route start point</Popup>
        </Marker>
        <Marker position={endPoint} icon={endIcon}>
          <Popup>Route end point</Popup>
        </Marker>
        {currentLocation && (
          <Marker position={currentLocation} icon={locationIcon}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
        {mapLoaded && <RoutingMachine start={startPoint} end={endPoint} />}
      </MapContainer>
    </div>
  );
}