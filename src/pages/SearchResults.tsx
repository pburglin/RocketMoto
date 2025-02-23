import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLocation } from '../lib/location';
import { milesToKm } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { RouteCard } from '../components/RouteCard';
import { useSearchParams } from 'react-router-dom';

const ROUTES_PER_PAGE = 9;

export function SearchResults() {
  const { profile, distanceUnit } = useAuth();
  const { currentLocation } = useLocation();
  interface Route {
    id: any;
    title: string;
    description: string;
    distance: number;
    duration: any;
    created_by: any;
    upvotes: number;
    downvotes: number;
    created_at: string;
    start_point: any;
    end_point: any;
    route_tags: { tag: string }[];
    route_photos: { photo_url: string; photo_blob: any; order: number }[];
  }
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || ''); // Initialize searchTerm from URL
  const [maxDistance, setMaxDistance] = useState('100');
  const [maxRouteDistance, setMaxRouteDistance] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'distance' | 'routeDistance' | 'relevance' | 'popularity'>(
    'distance'
  );

  useEffect(() => {
    async function fetchRoutes() {
      let query = supabase
        .from('routes')
        .select(`
          id,
          title,
          description,
          distance,
          duration,
          created_by,
          upvotes,
          downvotes,
          created_at,
          start_point,
          end_point,
          route_tags (
            tag
          ),
          route_photos (
            photo_url,
            photo_blob,
            order
          )
        `);

      // Text search
      if (searchTerm) {
        query = query.textSearch('search_vector', searchTerm);
      }

      // Filter by tags
      if (selectedTags.size > 0) {
        const { data: routeIds } = await supabase.rpc(
          'get_routes_with_all_tags',
          { tag_names: Array.from(selectedTags) }
        );
        
        if (routeIds) {
          query = query.in('id', routeIds);
        }
      }

      // Filter by route distance
      if (maxRouteDistance) {
        // Convert miles to kilometers for the database query
        const maxRouteDistanceKm = distanceUnit === 'mi' ? milesToKm(parseFloat(maxRouteDistance)) : parseFloat(maxRouteDistance);
        query = query.lte('distance', maxRouteDistanceKm);
      }

      // Filter by distance from user
      if (maxDistance && (currentLocation || profile?.location)) {
        const [lat, lng] = profile?.location?.split(',').map(Number) || 
          [currentLocation?.lat, currentLocation?.lng];

        // Convert miles to kilometers for the database query
        const maxDistanceKm = distanceUnit === 'mi' ? milesToKm(parseFloat(maxDistance)) : parseFloat(maxDistance);

        if (lat && lng) {
          const { data: routesWithinDistance } = await supabase.rpc(
            'get_routes_within_distance',
            { p_lat: lat, p_lng: lng, p_distance: maxDistanceKm }
          );
          
          if (routesWithinDistance) {
            const routeIds = routesWithinDistance.map((route: any) => route.id);
            query = query.in('id', routeIds);
          }
        }
      }

      const { data, error } = await query
        .range(0, ROUTES_PER_PAGE - 1);
      
      if (error) {
        console.error('Error fetching routes:', error);
        return;
      }

      if (data) {
        // Sort results
        let sortedData = [...data];
        if (sortBy === 'distance' && (currentLocation || profile?.location)) {
          const [lat, lng] = profile?.location?.split(',').map(Number) || 
            [currentLocation?.lat, currentLocation?.lng];
          if (lat && lng) {
            // Calculate distances for sorting
            const routesWithDistances = await Promise.all(
              sortedData.map(async route => {
                const { data: distance } = await supabase.rpc(
                  'calculate_route_distance_from_point',
                  {
                    route_id: route.id,
                    p_lat: lat,
                    p_lng: lng
                  }
                );
                return { ...route, distance_from_user: distance };
              })
            );
            sortedData = routesWithDistances.sort((a, b) => 
              (a.distance_from_user || Infinity) - (b.distance_from_user || Infinity));
          }
        } else if (sortBy === 'routeDistance') {
          sortedData.sort((a, b) => a.distance - b.distance);
        } else if (sortBy === 'popularity') {
          sortedData.sort((a, b) => 
            (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
          );
        }

        setRoutes(sortedData);
        setHasMore(sortedData.length === ROUTES_PER_PAGE);
      }
      setLoadingRoutes(false);
    }

    fetchRoutes();
  }, [searchTerm, selectedTags, maxDistance, maxRouteDistance, sortBy, currentLocation, profile?.location]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (maxDistance) params.set('maxDistance', maxDistance);
    if (maxRouteDistance) params.set('maxRouteDistance', maxRouteDistance);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    selectedTags.forEach(tag => params.append('tags', tag));
    setSearchParams(params);
  }, [searchTerm, maxDistance, maxRouteDistance, selectedTags, sortBy, setSearchParams]);

  async function fetchRoutes(startIndex = 0) {
    const isInitialLoad = startIndex === 0;
    if (isInitialLoad) {
      setLoadingRoutes(true);
    } else {
      setLoadingMore(true);
    }

    let query = supabase
      .from('routes')
      .select(`
        id,
        title,
        description,
        distance,
        duration,
        created_by,
        upvotes,
        downvotes,
        created_at,
        start_point,
        end_point,
        route_tags (
          tag
        ),
        route_photos (
          photo_url,
          photo_blob,
          order
        )
      `);

    // Text search
    if (searchTerm) {
      query = query.textSearch('search_vector', searchTerm);
    }

    // Filter by tags
    if (selectedTags.size > 0) {
      const { data: routeIds } = await supabase.rpc(
        'get_routes_with_all_tags',
        { tag_names: Array.from(selectedTags) }
      );
      
      if (routeIds) {
        query = query.in('id', routeIds);
      }
    }

    // Filter by route distance
    if (maxRouteDistance) {
      // Convert miles to kilometers for the database query
      const maxRouteDistanceKm = distanceUnit === 'mi' ? milesToKm(parseFloat(maxRouteDistance)) : parseFloat(maxRouteDistance);
      query = query.lte('distance', maxRouteDistanceKm);
    }

    // Filter by distance from user
    if (maxDistance && (currentLocation || profile?.location)) {
      const [lat, lng] = profile?.location?.split(',').map(Number) || 
        [currentLocation?.lat, currentLocation?.lng];

      // Convert miles to kilometers for the database query
      const maxDistanceKm = distanceUnit === 'mi' ? milesToKm(parseFloat(maxDistance)) : parseFloat(maxDistance);

      if (lat && lng) {
        const { data: routesWithinDistance } = await supabase.rpc(
          'get_routes_within_distance',
          { p_lat: lat, p_lng: lng, p_distance: maxDistanceKm }
        );
        
        if (routesWithinDistance) {
          const routeIds = routesWithinDistance.map(route => route.id);
          query = query.in('id', routeIds);
        }
      }
    }

    const { data, error } = await query
      .range(startIndex, startIndex + ROUTES_PER_PAGE - 1);
    
    if (error) {
      console.error('Error fetching routes:', error);
      return;
    }

    if (data) {
      // Sort results
      let sortedData = [...data];
      if (sortBy === 'distance' && (currentLocation || profile?.location)) {
        const [lat, lng] = profile?.location?.split(',').map(Number) || 
          [currentLocation?.lat, currentLocation?.lng];
        if (lat && lng) {
          // Calculate distances for sorting
          const routesWithDistances = await Promise.all(
            sortedData.map(async route => {
              const { data: distance } = await supabase.rpc(
                'calculate_route_distance_from_point',
                {
                  route_id: route.id,
                  p_lat: lat,
                  p_lng: lng
                }
              );
              return { ...route, distance_from_user: distance };
            })
          );
          sortedData = routesWithDistances.sort((a, b) => 
            (a.distance_from_user || Infinity) - (b.distance_from_user || Infinity));
        }
      } else if (sortBy === 'routeDistance') {
        sortedData.sort((a, b) => a.distance - b.distance);
      } else if (sortBy === 'popularity') {
        sortedData.sort((a, b) => 
          (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        );
      }

      setRoutes(prev => isInitialLoad ? sortedData : [...prev, ...sortedData]);
      setHasMore(sortedData.length === ROUTES_PER_PAGE);
    }
    setLoadingRoutes(false);
    setLoadingMore(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    await fetchRoutes(routes.length);
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

  function clearFilters() {
    setSearchTerm('');
    setMaxDistance('');
    setMaxRouteDistance('');
    setSelectedTags(new Set());
    setSortBy('relevance');
  }

  const hasActiveFilters = useMemo(() => {
    return searchTerm || maxDistance || maxRouteDistance || selectedTags.size > 0 || sortBy !== 'relevance';
  }, [searchTerm, maxDistance, maxRouteDistance, selectedTags, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search Routes</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <X className="h-5 w-5 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search routes by title or description..."
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Distance from You ({distanceUnit})
                  </label>
                  <input
                    type="number"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Route Distance ({distanceUnit})
                  </label>
                  <input
                    type="number"
                    value={maxRouteDistance}
                    onChange={(e) => setMaxRouteDistance(e.target.value)}
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Route Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {['scenic', 'curves', 'mountain', 'coastal', 'forest', 'desert'].map((tag) => (
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
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="relevance">Relevance</option>
                <option value="distance">Distance from You</option>
                <option value="routeDistance">Route Distance</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full">
          {loadingRoutes ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading routes...</div>
          ) : (
            <>
              {routes.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                      <RouteCard key={route.id} route={route} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
                      >
                        {loadingMore ? 'Loading...' : 'Load More Routes'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No routes found</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}