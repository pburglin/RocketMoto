import { useState, useEffect } from 'react';
import { supabase } from './supabase';

type Rating = 'up' | 'down' | null;

export function useRating(routeId: string) {
  const [userRating, setUserRating] = useState<Rating>(null);
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRating() {
      // Fetch route's current vote counts
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('upvotes, downvotes')
        .eq('id', routeId)
        .single();

      if (routeError) {
        console.error('Error fetching route votes:', routeError);
        return;
      }

      setUpvotes(route.upvotes);
      setDownvotes(route.downvotes);

      // Only fetch user rating if authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's current rating
        const { data, error } = await supabase
          .from('route_ratings')
          .select('rating_type')
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id)
          .single();

        if (error) throw error;
        setUserRating(data?.rating_type as Rating || null);
      } catch (err) {
        console.error('Error fetching user rating:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRating();
  }, [routeId]);

  async function rateRoute(rating: Rating) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setError('You must be signed in to rate routes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (userRating === rating) {
        // Remove rating
        const { error } = await supabase
          .from('route_ratings')
          .delete()
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (error) throw error;
        setUserRating(null);
        setUpvotes(prev => prev - (rating === 'up' ? 1 : 0));
        setDownvotes(prev => prev - (rating === 'down' ? 1 : 0));
      } else if (userRating) {
        // Update rating
        const { error } = await supabase
          .from('route_ratings')
          .update({ rating_type: rating })
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (error) throw error;
        setUserRating(rating);
        if (rating === 'up') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => prev - 1);
        } else {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        }
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('route_ratings')
          .insert({
            route_id: routeId,
            user_id: session.session.user.id,
            rating_type: rating,
            rating: rating === 'up' // Convert rating type to boolean for the rating column
          });

        if (error) throw error;
        setUserRating(rating);
        if (rating === 'up') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate route');
    } finally {
      setLoading(false);
    }
  }

  return { userRating, upvotes, downvotes, loading, error, rateRoute };
}