import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet-routing-machine';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle routing
function RoutingMachine({ start, end }: { start: [number, number]; end: [number, number] }) {
  const map = useMap();
  const routingControl = React.useRef<any>(null);
  const routeLayer = React.useRef<any>(null);
  const [routeFound, setRouteFound] = React.useState(false);

  // Fit map to route bounds when route is found
  function handleRouteFound(e: any) {
    if (!map) return;

    const route = e.routes[0];
    if (route) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
      setRouteFound(true);

      // Store the route layer for cleanup
      if (e.routes[0].coordinates && map) {
        routeLayer.current = L.polyline(e.routes[0].coordinates, {
          color: '#6366f1',
          weight: 4
        }).addTo(map);
      }
    }
  }

  // Reset route found state when props change
  useEffect(() => {
    setRouteFound(false);
  }, [start, end]);

  React.useEffect(() => {
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
      
      if (routeLayer.current && map) {
        try {
          map.removeLayer(routeLayer.current);
        } catch (err) {
          console.warn('Error removing route layer:', err);
        }
        routeLayer.current = null;
      }
    }

    // Clean up existing controls and layers
    cleanup();

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
      addWaypoints: false,
      fitSelectedRoute: true
    })
    .on('routesfound', handleRouteFound).addTo(map);

    return cleanup;
  }, [start, end, map]);

  return routeFound ? null : <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 opacity-50 z-[1000] flex items-center justify-center">Calculating route...</div>;
}

type RouteMapProps = {
  startPoint: [number, number];
  endPoint: [number, number];
  onMapInstance: (map: L.Map) => void;
};

export function RouteMap({ startPoint, endPoint, onMapInstance }: RouteMapProps) {
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
        className="h-full w-full"
        ref={handleMapLoad}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={startPoint} icon={defaultIcon}>
          <Popup>Route start point</Popup>
        </Marker>
        <Marker position={endPoint} icon={defaultIcon}>
          <Popup>Route end point</Popup>
        </Marker>
        {mapLoaded && <RoutingMachine start={startPoint} end={endPoint} />}
      </MapContainer>
    </div>
  );
}