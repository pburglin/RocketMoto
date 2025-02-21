import React, { useEffect, useState } from 'react';
import { Search, Navigation as NavigationIcon, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Icon } from 'leaflet';
import { useLocation } from '../lib/location';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { LatLngBounds } from 'leaflet';
import { RouteCard } from '../components/RouteCard';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to update map view when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

// Component to handle routing visualization
function RouteVisualizer({ 
  routes,
  hoveredRouteId,
  onRouteClick
}: { 
  routes: any[];
  hoveredRouteId: string | null;
  onRouteClick: (routeId: string) => void;
}) {
  const map = useMap();
  const routingControls = React.useRef<{[key: string]: any}>({});

  React.useEffect(() => {
    // Clear all existing routes
    Object.values(routingControls.current).forEach(control => {
      if (control && map) {
        try {
          map.removeControl(control);
        } catch (err) {
          console.warn('Error removing control:', err);
        }
      }
    });
    routingControls.current = {};

    // Add routes
    routes.forEach(route => {
      const startCoords = route.start_point.coordinates;
      const endCoords = route.end_point.coordinates;

      if (!startCoords || !endCoords) return;

      // PostGIS returns [longitude, latitude], we need to swap for Leaflet
      const start: [number, number] = [startCoords[1], startCoords[0]];
      const end: [number, number] = [endCoords[1], endCoords[0]];

      // @ts-ignore - leaflet-routing-machine types are not available
      routingControls.current[route.id] = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoute: hoveredRouteId === route.id,
        container: false,
        lineOptions: {
          styles: [{ 
            color: hoveredRouteId === route.id ? '#4f46e5' : '#6366f1',
            weight: hoveredRouteId === route.id ? 6 : 4,
            opacity: hoveredRouteId === route.id ? 1 : 0.7
          }]
        },
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        containerClassName: 'hidden', // Hide the container completely
        createMarker: () => null,
        plan: false,
        itineraryFormatter: () => '',
        waypointNameFallback: () => '',
      });

      routingControls.current[route.id].addTo(map);

      // If this is the hovered route, fit bounds
      if (hoveredRouteId === route.id) {
        routingControls.current[route.id].on('routesfound', function(e: any) {
          const route = e.routes[0];
          if (route) {
            const bounds = L.latLngBounds(route.coordinates);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        });
      }

      // Add click handler to the route line
      if (routingControls.current[route.id]) {
        routingControls.current[route.id].on('routesfound', function(e: any) {
          e.routes[0].coordinates.forEach((coord: any) => {
            L.polyline([coord], {
            color: 'transparent',
            weight: 10,
            opacity: 0
          }).on('click', () => onRouteClick(route.id)).addTo(map);
          });
        });
      }
    });

    return () => {
      Object.values(routingControls.current).forEach(control => {
        if (control && map) {
          try {
            map.removeControl(control);
          } catch (err) {
            console.warn('Error removing control:', err);
          }
        }
      });
    };
  }, [routes, hoveredRouteId, map, onRouteClick]);

  return null;
}
export function Home() {
  const { currentLocation, getCurrentLocation, loading, error } = useLocation();
  const { user, profile } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchRoutes() {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_tags (
            tag
          ),
          route_photos (
            photo_url,
            order
          )
        `)
        .limit(3);

      if (!error && data) {
        setRoutes(data);
        
        // Calculate bounds for all routes
        if (data.length > 0) {
          const newBounds = data.reduce((acc: L.LatLngBounds, route: any) => {
            const startCoords = route.start_point.coordinates;
            const endCoords = route.end_point.coordinates;
            
            if (startCoords && endCoords) {
              acc.extend([
                [startCoords[1], startCoords[0]],
                [endCoords[1], endCoords[0]]
              ]);
            }
            return acc;
          }, new L.LatLngBounds([]));
          
          setBounds(newBounds);
        }
      }
      setLoadingRoutes(false);
    }

    fetchRoutes();
  }, []);

  // Fit bounds when map instance is available or bounds change
  useEffect(() => {
    if (mapInstance && bounds?.isValid()) {
      mapInstance.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 9 // Lower max zoom for better overview
      });
    }
  }, [mapInstance, bounds]);

  // Parse user's saved location if available
  const savedLocation = profile?.location ? {
    lat: parseFloat(profile.location.split(',')[0]),
    lng: parseFloat(profile.location.split(',')[1])
  } : null;

  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const mapCenter = currentLocation
    ? [currentLocation.lat, currentLocation.lng] as [number, number]
    : savedLocation
    ? [savedLocation.lat, savedLocation.lng] as [number, number]
    : defaultCenter;

  const markerPosition = currentLocation 
    ? [currentLocation.lat, currentLocation.lng] as [number, number]
    : savedLocation
    ? [savedLocation.lat, savedLocation.lng] as [number, number]
    : defaultCenter;

  function handleRouteClick(routeId: string) {
    navigate(`/routes/${routeId}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Discover Amazing Motorcycle Routes
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Find the perfect roads for your next adventure, share your favorite routes, and connect with fellow riders.
        </p>
      </div>

      <div className="mb-12">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for routes near you..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </form>
          {error && (
            <div className="mt-2 flex items-center justify-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Routes Near You</h2>
        <div className="h-[400px] rounded-lg overflow-hidden shadow-lg">
          <MapContainer
            center={mapCenter}
            zoom={13}
            ref={setMapInstance}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={9}
            />
            {(currentLocation || savedLocation) && (
              <Marker position={markerPosition} icon={defaultIcon}>
                <Popup>{currentLocation ? 'Your current location' : 'Your saved location'}</Popup>
              </Marker>
            )}
            <RouteVisualizer 
              routes={routes}
              hoveredRouteId={hoveredRouteId}
              onRouteClick={handleRouteClick}
              container={false}
              show={false}
              addWaypoints={false}
              draggableWaypoints={false}
            />
            <MapUpdater center={mapCenter} />
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loadingRoutes ? (
          <div className="col-span-3 text-center py-8 text-gray-500">
            Loading routes...
          </div>
        ) : routes.length > 0 ? (
          routes.map((route) => (
            <div
              key={route.id}
              onMouseEnter={() => setHoveredRouteId(route.id)}
              onMouseLeave={() => setHoveredRouteId(null)}
            >
              <RouteCard route={route} />
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No routes found
          </div>
        )}
      </div>
    </div>
  );
}