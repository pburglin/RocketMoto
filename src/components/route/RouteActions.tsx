import React from 'react';
import { ThumbsUp, ThumbsDown, NavigationIcon, Flag, Bookmark, CheckCircle } from 'lucide-react';

type RouteActionsProps = {
  isAuthenticated: boolean;
  userRating: 'up' | 'down' | null;
  upvotes: number;
  downvotes: number;
  isBookmarked: boolean;
  isCompleted: boolean;
  ratingLoading: boolean;
  bookmarkLoading: boolean;
  completingRoute: boolean;
  onRate: (rating: 'up' | 'down') => void;
  onToggleBookmark: () => void;
  onToggleCompleted: () => void;
  onNavigate: (type: 'start' | 'end') => void;
  ratingError?: string;
  bookmarkError?: string;
};

const buttonBaseClasses = "flex items-center justify-center px-4 py-2 rounded-lg transition-colors";

export function RouteActions({
  isAuthenticated,
  userRating,
  upvotes,
  downvotes,
  isBookmarked,
  isCompleted,
  ratingLoading,
  bookmarkLoading,
  completingRoute,
  onRate,
  onToggleBookmark,
  onToggleCompleted,
  onNavigate,
  ratingError,
  bookmarkError
}: RouteActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-start gap-4">
        {isAuthenticated ? (
          <button
            onClick={() => onRate('up')}
            disabled={ratingLoading}
            className={`${buttonBaseClasses} border ${
              userRating === 'up'
                ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 mr-2 ${
              userRating === 'up' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className={userRating === 'up' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}>
              {upvotes}
            </span>
          </button>
        ) : (
          <div className="flex items-center px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600">
            <ThumbsUp className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{upvotes}</span>
          </div>
        )}
        {isAuthenticated ? (
          <button
            onClick={() => onRate('down')}
            disabled={ratingLoading}
            className={`${buttonBaseClasses} border ${
              userRating === 'down'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ThumbsDown className={`h-5 w-5 mr-2 ${
              userRating === 'down' ? 'text-red-600' : 'text-gray-400'
            }`} />
            <span className={userRating === 'down' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
              {downvotes}
            </span>
          </button>
        ) : (
          <div className="flex items-center px-4 py-2 border rounded-lg border-gray-300 dark:border-gray-600">
            <ThumbsDown className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{downvotes}</span>
          </div>
        )}
        {isAuthenticated ? (
          <button
            onClick={onToggleBookmark}
            disabled={bookmarkLoading}
            className={`${buttonBaseClasses} border ${
              isBookmarked
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
            <span className="text-gray-600 dark:text-gray-400">Bookmark</span>
          </div>
        )}
        {!isAuthenticated && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to rate routes
          </span>
        )}
        {ratingError && (
          <span className="text-sm text-red-600">{ratingError}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => onNavigate('start')}
          className={`${buttonBaseClasses} bg-green-600 text-white hover:bg-green-700`}
        >
          <NavigationIcon className="h-5 w-5 mr-2" />
          Navigate to Start Point
        </button>
        <button
          onClick={() => onNavigate('end')}
          className={`${buttonBaseClasses} bg-red-600 text-white hover:bg-red-700`}
        >
          <Flag className="h-5 w-5 mr-2" />
          Navigate to End Point
        </button>
      </div>
      {isAuthenticated && (
        <div className="mt-4">
          <button
            onClick={onToggleCompleted}
            disabled={completingRoute}
            className={`${buttonBaseClasses} w-full ${
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
  );
}