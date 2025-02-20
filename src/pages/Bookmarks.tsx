import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { RouteCard } from '../components/RouteCard';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Bookmarks() {
  const { user } = useAuth();
  const [bookmarkedRoutes, setBookmarkedRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user) return;

      const { data, error } = await supabase
        .from('route_bookmarks')
        .select(`
          route_id,
          route:routes (
            *,
            route_tags (tag),
            route_photos (photo_url, order)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookmarkedRoutes(data.map(b => b.route));
      }
      setLoading(false);
    }

    fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Bookmark className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Sign in to bookmark routes</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create an account to save your favorite routes for quick access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Bookmarked Routes</h1>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading bookmarks...
        </div>
      ) : bookmarkedRoutes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't bookmarked any routes yet
          </p>
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Explore Routes
          </Link>
        </div>
      )}
    </div>
  );
}