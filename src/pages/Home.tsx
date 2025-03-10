import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, ThumbsUp, Clock, X } from 'lucide-react';
import { useLocation } from '../lib/location';
import { useAuth } from '../lib/auth';
import { useGeocoding } from '../lib/useGeocoding';
import { supabase } from '../lib/supabase';
import { RouteCard, Route } from '../components/RouteCard';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const { currentLocation, setManualLocation, error } = useLocation();
  const { profile } = useAuth();
  const [popularRoutes, setPopularRoutes] = useState<Route[]>([]);
  const [newRoutes, setNewRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [showLocationForm, setShowLocationForm] = useState(true);
  const { getCoordinates, loading: geocodingLoading } = useGeocoding();

  useEffect(() => {
    async function fetchRoutes() {
      const userLat = currentLocation?.lat || parseFloat(profile?.location?.split(',')[0] || '40.7128');
      const userLng = currentLocation?.lng || parseFloat(profile?.location?.split(',')[1] || '-74.0060');
      const maxDistance = 62; // ~62 miles (100km) radius for consistency with new default miles unit

      try {
        // First get routes within distance
        const { data: nearbyRouteIds, error: distanceError } = await supabase
          .rpc('get_routes_within_distance', {
            p_lat: userLat,
            p_lng: userLng,
            p_distance: maxDistance
          });

        if (distanceError) {
          console.error('Error fetching nearby routes:', distanceError);
          return;
        }

        if (nearbyRouteIds && nearbyRouteIds.length > 0) {
          // Then fetch full route details for these IDs
          const { data: routeDetails, error: routesError } = await supabase
            .from('routes')
            .select(`
              *,
              route_tags (tag),
              route_photos (photo_url, photo_blob, order, created_at)
            `)
            .in('id', nearbyRouteIds.map((r: { id: string }) => r.id));

          if (routesError) {
            console.error('Error fetching route details:', routesError);
            return;
          }

          if (routeDetails) {
            // Sort by upvotes for popular routes
            const sortedByPopularity = [...routeDetails].sort((a, b) => 
              (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            );
            setPopularRoutes(sortedByPopularity.slice(0, 3));

            // Sort by creation date for new routes
            const sortedByDate = [...routeDetails].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setNewRoutes(sortedByDate.slice(0, 3));
          }
        } else {
          setPopularRoutes([]);
          setNewRoutes([]);
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
      setLoadingRoutes(false);
    }

    fetchRoutes();
  }, [currentLocation, profile?.location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await getCoordinates(addressInput);
    if (result) {
      await setManualLocation(result.lat, result.lon);
    }
  };

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

          {error && showLocationForm && (
            <div className="mt-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                    <button
                      onClick={() => setShowLocationForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Close form"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddressSubmit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Enter your address or ZIP code to improve route suggestions..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={geocodingLoading}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {geocodingLoading ? 'Setting Location...' : 'Set Location'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <ThumbsUp className="h-6 w-6 mr-2 text-indigo-600" />
            Popular Routes In Your Area
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingRoutes ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading routes...
              </div>
            ) : popularRoutes.length > 0 ? (
              popularRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No popular routes found in your area
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-indigo-600" />
            What's New In Your Area
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingRoutes ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading routes...
              </div>
            ) : newRoutes.length > 0 ? (
              newRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No new routes found in your area
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}