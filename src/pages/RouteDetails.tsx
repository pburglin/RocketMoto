import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Camera } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useRating } from '../lib/useRating';
import { useBookmark } from '../lib/useBookmark';
import { useLocation } from '../lib/location';
import { formatDistance, formatDate, formatDuration } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { RoutePhotos } from '../components/route/RoutePhotos';
import { RouteComments } from '../components/route/RouteComments';
import { RouteActions } from '../components/route/RouteActions';
import { User } from '@supabase/supabase-js';

// Types
type RoutePhoto = {
  id: string;
  photo_url: string;
  photo_blob: string | null;
  caption: string;
  order: number;
  created_at: string;
};

type RouteData = {
  id: string;
  title: string;
  description: string;
  start_point: { coordinates: [number, number] };
  end_point: { coordinates: [number, number] };
  distance: number;
  duration: string;
  created_by: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  route_photos?: RoutePhoto[];
  route_tags?: { tag: string }[];
};

// Error Boundary for map component
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] rounded-lg overflow-hidden shadow-lg relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load map. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load the map component since it's heavy and not immediately visible
const RouteMap = React.lazy(() => import('../components/route/RouteMap').then(module => ({
  default: module.RouteMap
})));

// Custom hook for route data fetching
function useRouteData(id: string | undefined, user: User | null) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [routeCreator, setRouteCreator] = useState<{ username: string; avatar_url: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchRouteData() {
      if (!id) return;

      try {
        // Fetch all data in parallel
        const [bookmarksData, completedData, routeData, completedRouteData] = await Promise.all([
          supabase.from('route_bookmarks').select('*', { count: 'exact' }).eq('route_id', id),
          supabase.from('completed_routes').select('*', { count: 'exact' }).eq('route_id', id),
          supabase.from('routes').select(`
            *,
            route_tags (tag),
            route_photos (id, photo_url, photo_blob, caption, order, created_at)
          `).eq('id', id).single(),
          user ? supabase.from('completed_routes').select('id').eq('route_id', id).eq('user_id', user.id).single() : null
        ]);

        setBookmarkCount(bookmarksData.count || 0);
        setCompletedCount(completedData.count || 0);
        
        if (routeData.error) throw routeData.error;
        setRoute(routeData.data);

        // Fetch creator details only if we have route data
        if (routeData.data) {
          const { data: creator } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', routeData.data.created_by)
            .single();
          
          if (creator) {
            setRouteCreator(creator);
          }
        }

        setIsCompleted(!!completedRouteData?.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load route details');
      } finally {
        setLoading(false);
      }
    }

    fetchRouteData();
  }, [id, user]);

  return { route, loading, error, routeCreator, bookmarkCount, completedCount, isCompleted, setRoute, setIsCompleted };
}

export function RouteDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, distanceUnit } = useAuth();
  const { currentLocation } = useLocation();
  const [reportExpanded, setReportExpanded] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState<'success' | 'error' | null>(null);
  const [showNewRouteAlert, setShowNewRouteAlert] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Use custom hook for route data
  const {
    route,
    loading,
    error,
    routeCreator,
    bookmarkCount,
    completedCount,
    isCompleted,
    setRoute,
    setIsCompleted
  } = useRouteData(id, user);

  // Rating and bookmark hooks
  const { userRating, upvotes, downvotes, rateRoute, loading: ratingLoading, error: ratingError } = useRating(id || '');
  const { isBookmarked, loading: bookmarkLoading, error: bookmarkError, toggleBookmark } = useBookmark(id || '');
  const [completingRoute, setCompletingRoute] = useState(false);
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null);

  // Check for new route alert
  useEffect(() => {
    const shouldShowAlert = sessionStorage.getItem('showNewRouteAlert') === 'true';
    if (shouldShowAlert) {
      setShowNewRouteAlert(true);
      sessionStorage.removeItem('showNewRouteAlert');
    }
  }, []);

  // Memoize coordinates calculations
  const { startPoint, endPoint, startCoords, endCoords } = useMemo(() => {
    if (!route?.start_point || !route?.end_point) {
      return { startPoint: null, endPoint: null, startCoords: null, endCoords: null };
    }

    const startCoords = route.start_point.coordinates;
    const endCoords = route.end_point.coordinates;
    
    // PostGIS returns coordinates in [longitude, latitude] format, swap them for Leaflet
    return {
      startPoint: [startCoords[1], startCoords[0]] as [number, number],
      endPoint: [endCoords[1], endCoords[0]] as [number, number],
      startCoords,
      endCoords
    };
  }, [route]);

  // Calculate distance to start point
  useEffect(() => {
    async function calculateDistance() {
      if (!currentLocation || !route?.start_point) return;

      try {
        const { data: distance } = await supabase.rpc(
          'calculate_route_distance_from_point',
          {
            route_id: route.id,
            p_lat: currentLocation.lat,
            p_lng: currentLocation.lng
          }
        );

        setDistanceToStart(distance);
      } catch (err) {
        console.error('Error calculating distance:', err);
      }
    }

    calculateDistance();
  }, [currentLocation, route]);

  // Memoize handlers
  const handleSubmitReport = useCallback(async () => {
    if (!user || !id) return;

    try {
      const { error: submitError } = await supabase.from('route_reports').insert([
        {
          route_id: id,
          user_id: user.id,
          details: reportDetails,
        },
      ]);

      if (submitError) throw submitError;

      setReportStatus('success');
      setReportExpanded(false);
      setReportDetails('');
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportStatus('error');
    } finally {
      setTimeout(() => setReportStatus(null), 3000);
    }
  }, [user, id, reportDetails]);

  const handleNavigate = useCallback((type: 'start' | 'end') => {
    if (!route || !startCoords || !endCoords) return;
    
    const coords = type === 'start' ? startCoords : endCoords;
    const destination = `${coords[1]},${coords[0]}`; // Latitude,Longitude format
    
    const origin = currentLocation 
      ? `${currentLocation.lat},${currentLocation.lng}`
      : 'current+location';
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  }, [route, startCoords, endCoords, currentLocation]);

  const handleToggleCompleted = useCallback(async () => {
    if (!user || !route) return;
    
    setCompletingRoute(true);
    try {
      if (isCompleted) {
        const { error } = await supabase
          .from('completed_routes')
          .delete()
          .eq('route_id', route.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsCompleted(false);
      } else {
        const { error } = await supabase
          .from('completed_routes')
          .insert([{
            route_id: route.id,
            user_id: user.id
          }]);

        if (error) throw error;
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Error toggling route completion:', err);
    } finally {
      setCompletingRoute(false);
    }
  }, [user, route, isCompleted, setIsCompleted]);

  const handlePhotosUpdated = useCallback((photos: RoutePhoto[]) => {
    if (route) {
      setRoute({ ...route, route_photos: photos });
    }
  }, [route, setRoute]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading route details...</div>
      </div>
    );
  }

  if (!route || !startPoint || !endPoint) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">
          {error || 'Route not found or has invalid coordinates'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showNewRouteAlert && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Camera className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Route Created Successfully
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>
                  Thank you for sharing this route! Please consider sharing photos and comments with highlights of this route.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{route.title}</h1>
            <div className="flex gap-2 mb-4">
              {route.route_tags?.map(({ tag }) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-6">
              {route.description.length > 255 ? (
                <>
                  <p>
                    {isDescriptionExpanded
                      ? route.description
                      : `${route.description.slice(0, 255)}...`}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium mt-2"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Read more'}
                  </button>
                </>
              ) : (
                <p>{route.description}</p>
              )}
            </div>
            <RouteActions
              isAuthenticated={!!user}
              userRating={userRating}
              upvotes={upvotes}
              downvotes={downvotes}
              isBookmarked={isBookmarked}
              isCompleted={isCompleted}
              ratingLoading={ratingLoading}
              bookmarkLoading={bookmarkLoading}
              completingRoute={completingRoute}
              onRate={rateRoute}
              onToggleBookmark={toggleBookmark}
              onToggleCompleted={handleToggleCompleted}
              onNavigate={handleNavigate}
              ratingError={ratingError || undefined}
              bookmarkError={bookmarkError || undefined}
            />
          </div>

          <MapErrorBoundary>
            <Suspense fallback={
              <div className="h-[400px] rounded-lg overflow-hidden shadow-lg relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
              </div>
            }>
              <RouteMap
                startPoint={startPoint}
                endPoint={endPoint}
                currentLocation={currentLocation ? [currentLocation.lat, currentLocation.lng] : null}
                onMapInstance={() => {}}
              />
            </Suspense>
          </MapErrorBoundary>

          <RouteComments
            routeId={route.id}
            isAuthenticated={!!user}
            onCommentAdded={() => {}}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Route Details</h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
                  <p className="text-lg text-gray-900 dark:text-white">{formatDistance(route.distance, distanceUnit)}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
                  <p className="text-lg text-gray-900 dark:text-white">{formatDuration(route.duration)}</p>
                </div>
              </div>
              
              {distanceToStart !== null && (
                <div className="text-center col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance from You</h3>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {formatDistance(distanceToStart, distanceUnit)}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-2 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Point</h3>
                  <a
                    href={`https://www.google.com/maps?q=${startCoords[1]},${startCoords[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    {startCoords[1].toFixed(6)}°N, {startCoords[0].toFixed(6)}°E
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">End Point</h3>
                  <a
                    href={`https://www.google.com/maps?q=${endCoords[1]},${endCoords[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    {endCoords[1].toFixed(6)}°N, {endCoords[0].toFixed(6)}°E
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {routeCreator && (
                <div className="flex items-center mb-3">
                  <img
                    src={routeCreator.avatar_url}
                    alt={routeCreator.username}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Shared by <span className="font-medium">{routeCreator.username}</span>
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>
                  Created {formatDate(route.created_at)}
                </p>
                <p className="flex items-center gap-2">
                  <span>
                    {bookmarkCount} {bookmarkCount === 1 ? 'rider has' : 'riders have'} bookmarked
                  </span>
                  •
                  <span>
                    {completedCount} {completedCount === 1 ? 'completion' : 'completions'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <RoutePhotos
            routeId={route.id}
            photos={route.route_photos || []}
            isAuthenticated={!!user}
            onPhotosUpdated={handlePhotosUpdated}
          />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Report Route</h2>
            {user ? (
              <div className="mb-4">
                <button
                  onClick={() => setReportExpanded(!reportExpanded)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                >
                  {reportExpanded ? 'Hide Report Form' : 'Show Report Form'}
                </button>

                {reportExpanded && (
                  <div className="mt-4">
                    <label htmlFor="reportDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Details
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="reportDetails"
                        rows={4}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-gray-200"
                        placeholder="Please provide details about why you are reporting this route for review."
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSubmitReport}
                      className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Submit Report
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                <p>Sign in to report route for review.</p>
              </div>
            )}
          </div>

          {reportStatus && (
            <div className={`mb-6 ${reportStatus === 'success' ? 'bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 text-red-800 dark:text-red-200'} rounded-lg p-4`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <Camera className={`h-5 w-5 ${reportStatus === 'success' ? 'text-green-400' : 'text-red-400'}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {reportStatus === 'success' ? 'Report submitted successfully!' : 'Failed to submit report. Please try again.'}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}