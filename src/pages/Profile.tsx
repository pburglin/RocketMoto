import React, { useEffect, useState } from 'react';
import { Settings, MapPin, LogOut, CheckCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { RouteCard, Route } from '../components/RouteCard';
import { EditProfileModal } from '../components/EditProfileModal';

interface RawRoutePhoto {
  photo_url: string;
  photo_blob: string | null;
  order: number;
  created_at: string;
}

interface RawRoute {
  id: string;
  title: string;
  description: string;
  distance: number;
  duration: string | null;
  created_by: string | null;
  route_tags: { tag: string }[];
  route_photos: RawRoutePhoto[];
  upvotes: number;
  downvotes: number;
}

interface RawCompletedRoute {
  id: string;
  completed_at: string;
  routes: RawRoute;
}

interface CompletedRoute {
  id: string;
  completed_at: string;
  route: Route;
};

const ROUTES_PER_PAGE = 6;
const HISTORY_PER_PAGE = 5;

export function Profile() {
  const { user, profile } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingMoreRoutes, setLoadingMoreRoutes] = useState(false);

  async function handleSignOut() {
    try {
      // First remove Supabase auth token
      localStorage.removeItem('sb-auth-token');
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Remove all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Clear service worker caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(key => caches.delete(key))
        );
      }

      // Force a complete refresh to clear React state and redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // If error occurs, force a hard reload
      window.location.reload();
    }
  }
  const [hasMoreRoutes, setHasMoreRoutes] = useState(true);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [ratings, setRatings] = useState<number>(0);
  const [totalRoutes, setTotalRoutes] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [completedRoutes, setCompletedRoutes] = useState<CompletedRoute[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAddress() {
      if (!profile?.location) return;

      setAddressLoading(true);
      try {
        const [lat, lon] = profile.location.split(',').map((coord: string) => coord.trim());
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?` + 
          new URLSearchParams({
            lat: lat,
            lon: lon,
            format: 'json',
            'accept-language': 'en'
          }), {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MotorcycleRouteExplorer/1.0'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch address');
        }

        const data = await response.json();
        
        // Check if we have a valid response
        if (!data || data.error) {
          throw new Error(data.error);
        }

        let formattedAddress;
        if (data.address) {
          // Try to build a readable address from components
          const addressParts = [
            data.address.road,
            data.address.suburb,
            data.address.city || data.address.town || data.address.village,
            data.address.state,
            data.address.country
          ].filter(Boolean);
          
          formattedAddress = addressParts.length > 0 
            ? addressParts.join(', ')
            : data.display_name; // Fallback to display_name if we can't build from components
        } else {
          // If no structured address, use display_name
          formattedAddress = data.display_name;
        }
        
        setAddress(formattedAddress);
      } catch (error) {
        console.error('Error fetching address:', error instanceof Error ? error.message : 'Unknown error');
        setAddress(null);
      } finally {
        setAddressLoading(false);
      }
    }

    fetchAddress();
  }, [profile?.location]);

  // Fetch total routes count separately
  useEffect(() => {
    if (!user) return;

    async function fetchTotalRoutes() {
      if (!user) return;
      
      const { count: routesCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact' })
        .eq('created_by', user.id);
      
      setTotalRoutes(routesCount || 0);
    }

    fetchTotalRoutes();
  }, [user]);

  // Fetch completed routes
  useEffect(() => {
    if (!user) return;

    async function fetchCompletedRoutes() {
      const { data: completed, error: completedError } = await supabase
        .from('completed_routes')
        .select(`
          id,
          completed_at,
          routes:routes (
            id,
            title,
            description,
            distance,
            duration,
            created_by,
            upvotes,
            downvotes,
            route_tags (tag),
            route_photos (photo_url, order, created_at)
          )
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .range(0, HISTORY_PER_PAGE - 1);

      //console.log('Completed routes raw data:', completed);
      
      if (completedError) {
        console.error('Error fetching completed routes:', completedError);
        return;
      }

      if (completed) {
        const rawData = completed as unknown as RawCompletedRoute[];
        //console.log('Raw completed routes:', rawData);
        
        const validCompletedRoutes = rawData
          .filter(c => {
            const hasValidRoute = Boolean(c?.routes);
            if (!hasValidRoute) {
              console.log('Filtering out invalid completed route:', c);
            }
            return hasValidRoute;
          })
          .map(c => {
            const routePhotos = (c.routes.route_photos || []).map(photo => ({
              ...photo,
              photo_blob: null  // Add missing photo_blob field
            }));

            const route: Route = {
              id: c.routes.id,
              title: c.routes.title,
              description: c.routes.description,
              distance: c.routes.distance,
              duration: c.routes.duration || null,
              created_by: c.routes.created_by || null,
              upvotes: c.routes.upvotes || 0,
              downvotes: c.routes.downvotes || 0,
              route_tags: c.routes.route_tags || [],
              route_photos: routePhotos
            };
            
            return {
              id: c.id,
              completed_at: c.completed_at,
              route
            };
          });
        
        //console.log('Processed routes:', validCompletedRoutes);
        setCompletedRoutes(validCompletedRoutes);
        setHasMoreHistory(completed.length === HISTORY_PER_PAGE);
      }
    }

    fetchCompletedRoutes();
  }, [user]);

  // Fetch user's routes
  useEffect(() => {
    if (!user) return;

    async function fetchUserRoutes() {
      const { data: userRoutes, error: routesError } = await supabase
        .from('routes')
        .select(`
          *,
          route_tags (
            tag
          ),
          route_photos (
            photo_url,
            order,
            created_at
          )
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .range(0, ROUTES_PER_PAGE - 1);

      if (routesError) {
        console.error('Error fetching routes:', routesError);
      } else if (userRoutes) {
        setRoutes(userRoutes);
        setHasMoreRoutes(userRoutes.length === ROUTES_PER_PAGE);
      }
    }

    fetchUserRoutes();
  }, [user]);

  // Fetch user's ratings count
  useEffect(() => {
    if (!user) return;

    async function fetchUserRatings() {
      const { count } = await supabase
        .from('route_ratings')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id);

      if (count !== null) {
        setRatings(count);
      }
    }

    fetchUserRatings();
  }, [user]);

  async function loadMoreRoutes() {
    if (!user || loadingMoreRoutes) return;

    setLoadingMoreRoutes(true);
    try {
      const { data: newRoutes, error } = await supabase
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
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .range(routes.length, routes.length + ROUTES_PER_PAGE - 1);

      if (error) throw error;

      if (newRoutes) {
        setRoutes(prev => [...prev, ...newRoutes]);
        setHasMoreRoutes(newRoutes.length === ROUTES_PER_PAGE);
        
        // Refresh the total count when loading more routes
        const { count: refreshedCount } = await supabase
          .from('routes')
          .select('*', { count: 'exact' })
          .eq('created_by', user.id);
        
        setTotalRoutes(refreshedCount || 0);
      }
    } catch (err) {
      console.error('Error loading more routes:', err);
    } finally {
      setLoadingMoreRoutes(false);
    }
  }

  async function loadMoreHistory() {
    if (!user || loadingMoreHistory) return;

    setLoadingMoreHistory(true);
    try {
      const { data: newHistory, error } = await supabase
        .from('completed_routes')
        .select(`
          id,
          completed_at,
          routes:routes (
            id,
            title,
            description,
            distance,
            duration,
            created_by,
            upvotes,
            downvotes,
            route_tags (tag),
            route_photos (photo_url, order, created_at)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .range(completedRoutes.length, completedRoutes.length + HISTORY_PER_PAGE - 1);

      if (error) throw error;

      if (newHistory) {
        setCompletedRoutes(prev => [
          ...prev,
          ...(newHistory as unknown as RawCompletedRoute[])
            .filter(c => Boolean(c?.routes))
            .map(c => {
              const routePhotos = (c.routes.route_photos || []).map(photo => ({
                ...photo,
                photo_blob: null
              }));

              const route: Route = {
                id: c.routes.id,
                title: c.routes.title,
                description: c.routes.description,
                distance: c.routes.distance,
                duration: c.routes.duration || null,
                created_by: c.routes.created_by || null,
                upvotes: c.routes.upvotes || 0,
                downvotes: c.routes.downvotes || 0,
                route_tags: c.routes.route_tags || [],
                route_photos: routePhotos
              };

              return {
                id: c.id,
                completed_at: c.completed_at,
                route
              };
            })
        ]);
        setHasMoreHistory(newHistory.length === HISTORY_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading more history:', err);
    } finally {
      setLoadingMoreHistory(false);
    }
  }

  async function handleRemoveCompleted(completedRouteId: string) {
    if (!user) return;
    
    setDeletingRoute(completedRouteId);
    try {
      const { error } = await supabase
        .from('completed_routes')
        .delete()
        .eq('id', completedRouteId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCompletedRoutes(prev => prev.filter(r => r.id !== completedRouteId));
    } catch (err) {
      console.error('Error removing completed route:', err);
    } finally {
      setDeletingRoute(null);
    }
  }

  if (!user || !profile) {
    return null;
  }

  function formatLocation() {
    // We know profile is not null here because of the check at line 404
    const profileData = profile!;
    
    if (addressLoading) {
      return (
        <span className="text-gray-500">
          <span className="animate-pulse">Loading address...</span>
        </span>
      );
    }
    
    if (!profileData.location) {
      return (
        <span className="text-gray-500">
          No location set
        </span>
      );
    }

    if (!address) {
      return (
        <span className="text-gray-500">
          <span className="font-medium">Coordinates:</span>{' '}
          {profileData.location}
        </span>
      );
    }

    return (
      <div className="text-gray-600">
        <span className="text-gray-400 font-medium block">
          {address}
        </span>
        <span className="text-sm block">
          ({profileData.location})
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center">
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Member since {new Date(profile.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-full px-4 py-2 border border-red-300 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start text-gray-600 dark:text-gray-300 mb-2">
                <MapPin className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                <div className="flex-1">{formatLocation()}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalRoutes}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Routes Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{ratings}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Route Likes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route History Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
              Route History
            </h2>
            <div>
              {completedRoutes.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {completedRoutes.map((completed) => (
                      <div key={completed.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                        <div className="flex-1">
                          {completed.route && (
                            <Link
                              to={`/routes/${completed.route.id}`}
                              className="text-lg font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              {completed.route.title}
                            </Link>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Completed on {new Date(completed.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCompleted(completed.id)}
                          disabled={deletingRoute === completed.id}
                          className="ml-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {hasMoreHistory && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadMoreHistory}
                        disabled={loadingMoreHistory}
                        className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
                      >
                        {loadingMoreHistory ? 'Loading...' : 'Load More History'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  You haven't completed any routes yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* My Routes Section */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Routes</h2>
            {routes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {routes.map((route) => (
                    <RouteCard key={route.id} route={route} showEdit />
                  ))}
                </div>
                {hasMoreRoutes && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreRoutes}
                      disabled={loadingMoreRoutes}
                      className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
                    >
                      {loadingMoreRoutes ? 'Loading...' : 'Load More Routes'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                You haven't created any routes yet
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUsername={profile.username}
        currentAvatarUrl={profile.avatar_url}
        currentDistanceUnit={profile.distance_unit || 'km'}
        onProfileUpdate={() => window.location.reload()}
      />
    </div>
  );
}