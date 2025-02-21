import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { RouteMap } from '../components/route/RouteMap';
import { RoutePhotos } from '../components/route/RoutePhotos';
import { RouteComments } from '../components/route/RouteComments';
import { RouteActions } from '../components/route/RouteActions';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useRating } from '../lib/useRating';
import { useBookmark } from '../lib/useBookmark';
import { useLocation } from '../lib/location';
import { formatDistance, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';

type RouteData = {
  id: string;
  title: string;
  description: string;
  start_point: string;
  end_point: string;
  distance: number;
  duration: string;
  created_by: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  route_photos?: {
    id: string;
    photo_url: string;
    caption: string;
    order: number;
  }[];
  route_tags?: { tag: string }[];
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string;
  };
};

export function RouteDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, distanceUnit } = useAuth();
  const { currentLocation } = useLocation();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const { userRating, upvotes, downvotes, rateRoute, loading: ratingLoading, error: ratingError } = useRating(id || '');
  const [isCompleted, setIsCompleted] = useState(false);
  const { isBookmarked, loading: bookmarkLoading, error: bookmarkError, toggleBookmark } = useBookmark(id || '');
  const [completingRoute, setCompletingRoute] = useState(false);
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null);
  const [routeCreator, setRouteCreator] = useState<{ username: string; avatar_url: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showNewRouteAlert, setShowNewRouteAlert] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    // Check if we should show the new route alert
    const shouldShowAlert = sessionStorage.getItem('showNewRouteAlert') === 'true';
    if (shouldShowAlert) {
      setShowNewRouteAlert(true);
      sessionStorage.removeItem('showNewRouteAlert');
    }

    async function fetchRouteAndComments() {
      if (!id) return;

      // Fetch bookmark and completion counts
      const { count: bookmarks } = await supabase
        .from('route_bookmarks')
        .select('*', { count: 'exact' })
        .eq('route_id', id);

      setBookmarkCount(bookmarks || 0);

      const { count: completed } = await supabase
        .from('completed_routes')
        .select('*', { count: 'exact' })
        .eq('route_id', id);

      setCompletedCount(completed || 0);

      // Check if route is completed by user
      if (user) {
        const { data: completedRoute } = await supabase
          .from('completed_routes')
          .select('id')
          .eq('route_id', id)
          .eq('user_id', user.id)
          .single();

        setIsCompleted(!!completedRoute);
      }

      try {
        // Fetch route details
        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select(`
            *,
            route_tags (
              tag
            ),
            route_photos (
              id,
              photo_url,
              photo_blob,
              caption,
              order
            )
          `)
          .eq('id', id)
          .single();

        if (routeError) throw routeError;
        setRoute(routeData);

        // Fetch route creator details
        const { data: creator } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', routeData.created_by)
          .single();
        
        if (creator) {
          setRouteCreator(creator);
        }

        // Fetch comments with user details
        const { data: commentsData, error: commentsError } = await supabase
          .from('route_comments')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('route_id', id)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load route details');
      } finally {
        setLoading(false);
      }
    }

    async function initialize() {
      await fetchRouteAndComments();
    }

    initialize();
  }, [id]);

  // Calculate distance to start point when location or route changes
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

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !route || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: comment, error } = await supabase
        .from('route_comments')
        .insert([
          {
            route_id: route.id,
            user_id: user.id,
            content: newComment.trim()
          }
        ])
        .select(`
          *,
          user:users (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNavigate(type: 'start' | 'end') {
    if (!route) return;
    
    const coords = type === 'start' ? startCoords : endCoords;
    const destination = `${coords[1]},${coords[0]}`; // Latitude,Longitude format
    
    // If we have current location, use it as the starting point
    const origin = currentLocation 
      ? `${currentLocation.lat},${currentLocation.lng}`
      : 'current+location'; // Let maps app use device location
    
    // Create maps URL (compatible with both Google Maps and Apple Maps)
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    // Open in new tab
    window.open(url, '_blank');
  }

  async function handleToggleCompleted() {
    if (!user || !route) return;
    
    setCompletingRoute(true);
    try {
      if (isCompleted) {
        // Remove from completed routes
        const { error } = await supabase
          .from('completed_routes')
          .delete()
          .eq('route_id', route.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsCompleted(false);
      } else {
        // Add to completed routes
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
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Route not found</div>
      </div>
    );
  }

  // Parse start and end points from PostGIS POINT format
  // PostGIS returns coordinates as an object with coordinates array
  const startCoords = route.start_point.coordinates;
  const endCoords = route.end_point.coordinates;
  
  if (!startCoords || !endCoords) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Invalid route coordinates</div>
      </div>
    );
  }

  // PostGIS returns coordinates in [longitude, latitude] format, we need to swap them for Leaflet
  const startPoint: [number, number] = [startCoords[1], startCoords[0]];
  const endPoint: [number, number] = [endCoords[1], endCoords[0]];

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
              ratingError={ratingError}
              bookmarkError={bookmarkError}
            />
          </div>

          <RouteMap
            startPoint={startPoint}
            endPoint={endPoint}
            currentLocation={currentLocation ? [currentLocation.lat, currentLocation.lng] : null}
            onMapInstance={setMapInstance}
          />

          <RouteComments
            routeId={route.id}
            comments={comments}
            isAuthenticated={!!user}
            onCommentAdded={(comment) => setComments([comment, ...comments])}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Route Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
                <p className="text-lg text-gray-900 dark:text-white">{formatDistance(route.distance, distanceUnit)}</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
                <p className="text-lg text-gray-900 dark:text-white">{route.duration}</p>
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
            isOwner={user?.id === route.created_by}
            onPhotosUpdated={(photos) => setRoute({ ...route, route_photos: photos })}
          />
        </div>
      </div>
    </div>
  );
}