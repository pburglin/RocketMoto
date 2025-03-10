import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Loader as Road, ThumbsUp, ThumbsDown, Bookmark, CrownIcon } from 'lucide-react';
import { useBookmark } from '../lib/useBookmark';
import { useCompletion } from '../lib/useCompletion';
import { formatDistance, formatDuration, generateRandomColorImage } from '../lib/utils';

export type Route = {
  id: string;
  title: string;
  description: string;
  distance: number;
  duration: string | null;
  created_by: string | null;
  route_photos?: {
    photo_url: string;
    photo_blob: string | null;
    order: number;
    created_at: string;
  }[];
  route_tags?: { tag: string }[];
  upvotes: number;
  downvotes: number;
};

type RouteCardProps = {
  route: Route;
  showEdit?: boolean;
};

const DEFAULT_PHOTO = generateRandomColorImage();

export function RouteCard({ route, showEdit = false }: RouteCardProps) {
  const { user } = useAuth();
  const { distanceUnit } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.id === route.created_by;
  const { isBookmarked } = useBookmark(route.id);
  const { isCompleted } = useCompletion(route.id);

  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>(DEFAULT_PHOTO);

  useEffect(() => {
    // If no photos are available, use default
    if (!route.route_photos?.length) {
      setCoverPhotoUrl(DEFAULT_PHOTO);
      return;
    }

    // Create a new array and sort by date (newest first)
    const photos = [...route.route_photos];
    photos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Use the first available photo
    const firstPhoto = photos[0];
    const photoUrl = firstPhoto?.photo_url || firstPhoto?.photo_blob;

    if (photoUrl) {
      setCoverPhotoUrl(photoUrl);
    } else {
      setCoverPhotoUrl(DEFAULT_PHOTO);
    }
  }, [route.route_photos]);

  return (
    <Link
      to={`/routes/${route.id}`}
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverPhotoUrl}
          alt={route.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 bg-gray-100 dark:bg-gray-700"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PHOTO;
          }}
        />
        {!route.route_photos?.length && (
          <Road className="absolute inset-0 m-auto h-12 w-12 text-gray-400" />
        )}
        {isBookmarked && (
          <div className="absolute top-2 right-2">
            <Bookmark className="h-6 w-6 text-red-500 fill-current" />
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-2 left-2">
            <CrownIcon className="h-6 w-6 text-green-500 fill-current" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{route.title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {route.route_tags?.map(({ tag }) => (
            <span
              key={tag}
              className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {route.description}
        </p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistance(route.distance, distanceUnit)} • {formatDuration(route.duration)}
          </span>
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1 text-green-600" />
              {route.upvotes}
            </span>
            <span className="flex items-center">
              <ThumbsDown className="h-4 w-4 mr-1 text-red-600" />
              {route.downvotes}
            </span>
          </div>
          <div className="relative z-10">
            {showEdit && isAuthor && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/routes/${route.id}/edit`);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}