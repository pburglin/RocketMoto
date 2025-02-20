import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet-routing-machine';
import { Camera, AlertCircle } from 'lucide-react';
import { Clock, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useGeocoding } from '../lib/useGeocoding';
import { supabase } from '../lib/supabase';

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

// Component to handle routing
function RoutingMachine({ 
  start, 
  end,
  onRouteCalculated
}: { 
  start: [number, number] | null; 
  end: [number, number] | null;
  onRouteCalculated: (distance: number, duration: string) => void;
}) {
  const map = useMap();
  const routingRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Clean up previous routing if it exists
    if (routingRef.current) {
      map.removeControl(routingRef.current);
      routingRef.current = null;
    }

    if (start && end) {
      // @ts-ignore - leaflet-routing-machine types are not available
      routingRef.current = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        routeWhileDragging: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#6366f1', weight: 4 }]
        },
        fitSelectedRoute: true,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false // Hide the text instructions
      }).on('routesfound', function(e: any) {
        const route = e.routes[0];
        const distanceInKm = Math.round(route.summary.totalDistance / 1000);
        const durationInMinutes = Math.round(route.summary.totalTime / 60);
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;
        
        onRouteCalculated(
          distanceInKm,
          hours > 0 
          ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
          : `${minutes} minute${minutes !== 1 ? 's' : ''}`
        );
      });

      routingRef.current.addTo(map);

      return () => {
        if (routingRef.current) {
          map.removeControl(routingRef.current);
          routingRef.current = null;
        }
      };
    }
  }, [map, start, end]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function CreateRoute() {
  const { user, profile } = useAuth();
  const { getCoordinates, loading, error } = useGeocoding();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startLocation, setStartLocation] = useState<[number, number] | null>(null);
  const [endLocation, setEndLocation] = useState<[number, number] | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [mapping, setMapping] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);

  // Parse user's saved location if available
  const savedLocation = profile?.location ? {
    lat: parseFloat(profile.location.split(',')[0]),
    lng: parseFloat(profile.location.split(',')[1])
  } : null;

  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const mapCenter = savedLocation
    ? [savedLocation.lat, savedLocation.lng] as [number, number]
    : defaultCenter;

  async function handleMapRoute(e: React.MouseEvent) {
    e.preventDefault();
    if (!startAddress || !endAddress) return;
    
    setMapping(true);
    setGeocodingError(null);

    try {
      // Process start location
      const startCoordsMatch = startAddress.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      let startCoords: [number, number];
      
      if (startCoordsMatch) {
        const [_, lat, lng] = startCoordsMatch;
        startCoords = [parseFloat(lat), parseFloat(lng)];
      } else {
        const result = await getCoordinates(startAddress);
        if (!result) throw new Error('Failed to find start location');
        startCoords = [result.lat, result.lon];
      }
      setStartLocation(startCoords);

      // Process end location
      const endCoordsMatch = endAddress.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      let endCoords: [number, number];
      
      if (endCoordsMatch) {
        const [_, lat, lng] = endCoordsMatch;
        endCoords = [parseFloat(lat), parseFloat(lng)];
      } else {
        const result = await getCoordinates(endAddress);
        if (!result) throw new Error('Failed to find end location');
        endCoords = [result.lat, result.lon];
      }
      setEndLocation(endCoords);
    } catch (err) {
      setGeocodingError(err instanceof Error ? err.message : 'Failed to map route');
    } finally {
      setMapping(false);
    }
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!startLocation || !endLocation) {
      setSaveError('Please set both start and end locations');
      return;
    }
    if (!title) {
      setSaveError('Please enter a route title');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Insert the route
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert([
          {
            title,
            description,
            start_point: `POINT(${startLocation[1]} ${startLocation[0]})`,
            end_point: `POINT(${endLocation[1]} ${endLocation[0]})`,
            distance: routeDistance || 0,
            duration: routeDuration || '0 minutes',
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (routeError) throw routeError;
      if (!route) throw new Error('Failed to create route');

      // Insert tags
      if (selectedTags.size > 0) {
        const { error: tagsError } = await supabase
          .from('route_tags')
          .insert(
            Array.from(selectedTags).map(tag => ({
              route_id: route.id,
              tag
            }))
          );

        if (tagsError) throw tagsError;
      }

      // Navigate to the route details page
      navigate(`/routes/${route.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create route');
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create New Route</h1>
          
          <form onSubmit={handleCreateRoute} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Route Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="title"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Give your route a descriptive title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter address or coordinates (e.g., 40.7128, -74.0060)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter address or coordinates (e.g., 40.7128, -74.0060)"
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleMapRoute}
                disabled={loading || !startAddress || !endAddress || mapping}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50"
              >
                {mapping ? 'Mapping Route...' : 'Map Route'}
              </button>
            </div>

            {(error || geocodingError) && (
              <div className="mt-2 flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error || geocodingError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Route Map
              </label>
              <div className="h-[400px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {startLocation && (
                    <Marker position={startLocation} icon={defaultIcon}>
                      <Popup>Start point</Popup>
                    </Marker>
                  )}
                  {endLocation && (
                    <Marker position={endLocation} icon={defaultIcon}>
                      <Popup>End point</Popup>
                    </Marker>
                  )}
                  {startLocation && endLocation && (
                    <RoutingMachine
                      start={startLocation}
                      end={endLocation}
                      onRouteCalculated={(distance: number, duration: string) => {
                        setRouteDistance(distance);
                        setRouteDuration(duration);
                      }}
                    />
                  )}
                  <MapClickHandler
                    onLocationSelect={(latlng) => {
                      if (!startLocation) {
                        setStartLocation(latlng);
                        setStartAddress(`${latlng[0]}, ${latlng[1]}`);
                      } else if (!endLocation) {
                        setEndLocation(latlng);
                        setEndAddress(`${latlng[0]}, ${latlng[1]}`);
                      }
                    }}
                  />
                  <MapUpdater center={mapCenter} />
                </MapContainer>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter addresses, coordinates, or click on the map to set route points
              </p>
            </div>
            {startLocation && endLocation && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Route className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Distance</div>
                      <div className="font-medium text-gray-900 dark:text-white">{routeDistance} kilometers</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                      <div className="font-medium text-gray-900 dark:text-white">{routeDuration}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Describe the route, road conditions, points of interest, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {['scenic', 'curves', 'mountain', 'coastal', 'forest', 'desert','street','dirt','touring'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full border ${
                      selectedTags.has(tag)
                        ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                  <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </div>

            {saveError && (
              <div className="text-red-600 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  setTitle('');
                  setDescription('');
                  setStartLocation(null);
                  setEndLocation(null);
                  setStartAddress('');
                  setEndAddress('');
                  setSelectedTags(new Set());
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !startLocation || !endLocation || !title}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}