import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface TopRoute {
  id: string;
  title: string;
  likes_count: number;
}

interface TopAuthor {
  id: string;
  username: string;
  avatar_url: string | null;
  location: string | null;
  routes_count: number;
}

export function Leaderboards() {
  const [topRoutes, setTopRoutes] = useState<TopRoute[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboards() {
      try {
        // Fetch top 5 routes by likes
        const { data: routesData, error: routesError } = await supabase
          .rpc('get_top_routes', { limit_count: 5 });

        if (routesError) throw routesError;

        // Fetch top 10 authors by route count
        const { data: authorsData, error: authorsError } = await supabase
          .rpc('get_top_authors', { limit_count: 10 });

        if (authorsError) throw authorsError;

        setTopRoutes(routesData || []);
        setTopAuthors(authorsData || []);
      } catch (error) {
        console.error('Error fetching leaderboards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboards();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Leaderboards
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Routes Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Top 5 Most Popular Routes
          </h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          ) : (
            <ul className="space-y-4">
              {topRoutes.map((route) => (
                <li key={route.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <Link
                    to={`/routes/${route.id}`}
                    className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    {route.title}
                  </Link>
                  <p className="text-gray-600 dark:text-gray-300">
                    {route.likes_count} {route.likes_count === 1 ? 'like' : 'likes'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Authors Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Top 10 Route Authors
          </h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          ) : (
            <ul className="space-y-4">
              {topAuthors.map((author) => (
                <li key={author.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex items-center">
                    {author.avatar_url && (
                      <img
                        src={author.avatar_url}
                        alt={author.username}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <Link
                        to={`/profile/${author.id}`}
                        className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      >
                        {author.username}
                      </Link>
                      <p className="text-gray-600 dark:text-gray-300">
                        {author.routes_count} {author.routes_count === 1 ? 'route' : 'routes'} shared
                        {author.location && ` • ${author.location}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}