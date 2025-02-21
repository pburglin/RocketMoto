import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, ThumbsUp, Clock } from 'lucide-react';
import { useLocation } from '../lib/location';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { RouteCard } from '../components/RouteCard';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const { currentLocation, getCurrentLocation, loading, error } = useLocation();
  const { user, profile } = useAuth();
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [newRoutes, setNewRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchRoutes() {
      if (!currentLocation) return;

      // Fetch popular routes
      const { data: popularData } = await supabase.from('routes')
        .select(`
          *,
          route_tags (tag),
          route_photos (photo_url, order)
        `)
        .order('upvotes', { ascending: false })
        .limit(3);

      if (popularData) {
        setPopularRoutes(popularData);
      }

      // Fetch newest routes
      const { data: newData } = await supabase.from('routes')
        .select(`
          *,
          route_tags (tag),
          route_photos (photo_url, order)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (newData) {
        setNewRoutes(newData);
      }

      setLoadingRoutes(false);
    }

    fetchRoutes();
  }, [currentLocation]);

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