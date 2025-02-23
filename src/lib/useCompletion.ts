import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useCompletion(routeId: string) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkCompletionStatus() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session || !mounted) {
        setLoading(false);
        return;
      }

      try {
        const { error, count } = await supabase
          .from('completed_routes')
          .select('*', { count: 'exact', head: true })
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (!mounted) return;

        if (error) {
          console.error('Error checking completion status:', error);
          setError(error.message);
          return;
        }

        setIsCompleted(count === 1);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Error checking completion status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkCompletionStatus();
    return () => {
      mounted = false;
    };
  }, [routeId]);

  async function toggleCompletion() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setError('You must be signed in to mark routes as completed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('completed_routes')
          .delete()
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id);

        if (error) throw error;
        setIsCompleted(false);
      } else {
        // Add completion
        const { error } = await supabase
          .from('completed_routes')
          .insert({
            route_id: routeId,
            user_id: session.session.user.id
          });

        if (error) throw error;
        setIsCompleted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update completion status');
    } finally {
      setLoading(false);
    }
  }

  return { isCompleted, loading, error, toggleCompletion };
}