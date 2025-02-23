import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useBookmark(routeId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkBookmarkStatus() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session || !mounted) {
        setLoading(false);
        return;
      }

      try {
        const { error, count } = await supabase
          .from('route_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (!mounted) return;

        if (error) {
          console.error('Error checking bookmark status:', error);
          setError(error.message);
          return;
        }

        setIsBookmarked(count === 1);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Error checking bookmark status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkBookmarkStatus();
    return () => {
      mounted = false;
    };
  }, [routeId]);

  async function toggleBookmark() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setError('You must be signed in to bookmark routes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('route_bookmarks')
          .delete()
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('route_bookmarks')
          .insert({
            route_id: routeId,
            user_id: session.session.user.id
          });

        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  }

  return { isBookmarked, loading, error, toggleBookmark };
}