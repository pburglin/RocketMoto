import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet-routing-machine';
import { ThumbsUp, ThumbsDown, Navigation as NavigationIcon, Flag, MessageSquare, Camera, Plus, X, CheckCircle, Bookmark } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useRating } from '../lib/useRating';
import { useBookmark } from '../lib/useBookmark';
import { useLocation } from '../lib/location';
import { formatDistance } from '../lib/utils';
import { supabase } from '../lib/supabase';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle routing
function RoutingMachine({ map, start, end }: { map: L.Map; start: [number, number]; end: [number, number] }) {
  const routingControl = React.useRef<any>(null);

  // Fit map to route bounds when route is found
  function handleRouteFound(e: any) {
    const route = e.routes[0];
    if (route) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  React.useEffect(() => {
    if (!map) return;

    if (routingControl.current) {
      routingControl.current.remove();
    }

    // @ts-ignore - leaflet-routing-machine types are not available
    routingControl.current = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      showAlternatives: false,
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
      waypointNameFallback: () => ''
    })
    .on('routesfound', handleRouteFound).addTo(map);

    return () => {
      if (routingControl.current) {
        routingControl.current.remove();
      }
    };
  }, [start, end, map]);

  return null;
}

type RouteData = {
  id: string;
  title: string;
  description: string;
  start_point: string;
  end_point: string;
  distance: number;
  duration: string;
  created_by: string;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const DEFAULT_PHOTO = 'https://source.unsplash.com/random/800x600?road,motorcycle';
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const { isBookmarked, loading: bookmarkLoading, error: bookmarkError, toggleBookmark } = useBookmark(id || '');
  const [completingRoute, setCompletingRoute] = useState(false);

  useEffect(() => {
    async function fetchRouteAndComments() {
      if (!id) return;

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

  async function handlePhotoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !route) return;

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      // Get the next order number
      const maxOrder = route.route_photos?.reduce((max, photo) => 
        Math.max(max, photo.order), -1) ?? -1;
      const nextOrder = maxOrder + 1;

      let photoData: { photo_url?: string; photo_blob?: string } = {};

      if (fileInputRef.current?.files?.length) {
        // Handle file upload
        const file = fileInputRef.current.files[0];
        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        photoData.photo_blob = base64String;
      } else if (photoUrl) {
        // Handle URL
        try {
          new URL(photoUrl); // Validate URL
          photoData.photo_url = photoUrl;
        } catch {
          throw new Error('Invalid photo URL');
        }
      } else {
        throw new Error('Please provide either a photo file or URL');
      }

      const { error: uploadError } = await supabase
        .from('route_photos')
        .insert([{
          route_id: route.id,
          ...photoData,
          caption: photoCaption,
          order: nextOrder
        }]);

      if (uploadError) throw uploadError;

      // Refresh route data to get new photos
      const { data: updatedRoute, error: routeError } = await supabase
        .from('routes')
        .select(`
          *,
          route_tags (tag),
          route_photos (
            id,
            photo_url,
            photo_blob,
            caption,
            order
          )
        `)
        .eq('id', route.id)
        .single();

      if (routeError) throw routeError;
      setRoute(updatedRoute);

      // Reset form
      setPhotoUrl('');
      setPhotoCaption('');
      setShowPhotoForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
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
            <p className="text-gray-600 dark:text-gray-300 mb-6">{route.description}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-4 w-full sm:w-auto">
                {user ? (
                  <button
                    onClick={() => rateRoute('up')}
                    disabled={ratingLoading}
                    className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                      userRating === 'up'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ThumbsUp className={`h-5 w-5 mr-2 ${
                      userRating === 'up' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className={userRating === 'up' ? 'text-green-700 dark:text-green-300' : ''}>
                      {upvotes}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600"
                >
                    <ThumbsUp className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {upvotes}
                    </span>
                  </div>
                )}
                {user ? (
                  <button
                    onClick={() => rateRoute('down')}
                    disabled={ratingLoading}
                    className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                      userRating === 'down'
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ThumbsDown className={`h-5 w-5 mr-2 ${
                      userRating === 'down' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <span className={userRating === 'down' ? 'text-red-700 dark:text-red-300' : ''}>
                      {downvotes}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600"
                >
                    <ThumbsDown className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {downvotes}
                    </span>
                  </div>
                )}
                {!user && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Sign in to rate routes
                  </span>
                )}
                {ratingError && (
                  <span className="text-sm text-red-600">
                    {ratingError}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                {user ? (
                  <button
                    onClick={toggleBookmark}
                    disabled={bookmarkLoading}
                    className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                      isBookmarked
                        ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 mr-2 ${
                      isBookmarked ? 'text-yellow-600' : 'text-gray-400'
                    }`} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                ) : (
                  <div className="flex items-center px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600">
                    <Bookmark className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Bookmark</span>
                  </div>
                )}
                {bookmarkError && (
                  <span className="text-sm text-red-600">
                    {bookmarkError}
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleNavigate('start')}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <NavigationIcon className="h-5 w-5 mr-2" />
                  Navigate to Start Point
                </button>
                <button
                  onClick={() => handleNavigate('end')}
                  className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Flag className="h-5 w-5 mr-2" />
                  Navigate to End Point
                </button>
              </div>
            </div>
            {user && (
              <div className="mt-4">
                <button
                  onClick={handleToggleCompleted}
                  disabled={completingRoute}
                  className={`flex items-center justify-center w-full px-4 py-2 rounded-lg ${
                    isCompleted
                      ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/50'
                      : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500'
                  }`}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {completingRoute ? 'Updating...' : (isCompleted ? 'Completed' : 'Mark as Completed')}
                </button>
              </div>
            )}
          </div>

          <div className="h-[400px] rounded-lg overflow-hidden shadow-lg">
            <MapContainer
              center={startPoint}
              zoom={13}
              className="h-full w-full"
              ref={setMapInstance}
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
              {mapInstance && <RoutingMachine map={mapInstance} start={startPoint} end={endPoint} />}
            </MapContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments
            </h2>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex items-center mb-2">
                    <img
                      src={comment.user.avatar_url}
                      alt="User avatar"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{comment.user.username}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                </div>
              ))}
            </div>
            {user ? (
              <form onSubmit={handleSubmitComment} className="mt-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
                {error && (
                  <p className="mt-2 text-red-600 text-sm">{error}</p>
                )}
              </form>
            ) : (
              <div className="mt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Sign in to leave a comment
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Route Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
                <p className="text-lg text-gray-900 dark:text-white">{formatDistance(route.distance, distanceUnit)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
                <p className="text-lg text-gray-900 dark:text-white">{route.duration}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Photos</h2>
            {user?.id === route.created_by && (
              <div className="mb-4">
                {!showPhotoForm ? (
                  <button
                    onClick={() => setShowPhotoForm(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Photo
                  </button>
                ) : (
                  <form onSubmit={handlePhotoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          dark:file:bg-indigo-900 dark:file:text-indigo-200
                          hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Or Add Photo URL
                      </label>
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Caption (optional)
                      </label>
                      <input
                        type="text"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    {photoError && (
                      <p className="text-sm text-red-600">{photoError}</p>
                    )}
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoForm(false);
                          setPhotoUrl('');
                          setPhotoCaption('');
                          setPhotoError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingPhoto}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {route.route_photos?.length ? (
                route.route_photos
                  .sort((a, b) => a.order - b.order)
                  .map((photo) => (
                    <div key={photo.id} className="relative">
                      <img 
                        src={
                          photo.photo_url || 
                          (photo.photo_blob && photo.photo_blob.length > 0 
                            ? `data:image/jpeg;base64,${photo.photo_blob}` 
                            : DEFAULT_PHOTO)
                        }
                        alt={photo.caption || 'Route photo'}
                        className="rounded-lg w-full aspect-[4/3] object-cover bg-gray-100 dark:bg-gray-700"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_PHOTO;
                        }}
                      />
                      {photo.caption && (
                        <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-2 rounded-b-lg">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))
              ) : (
                <img
                  src={DEFAULT_PHOTO}
                  alt="Generic road photo"
                  className="rounded-lg col-span-2 w-full aspect-[4/3] object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}