import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useCompletion(routeId: string) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkCompletionStatus() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('completed_routes')
          .select('id')
          .eq('route_id', routeId)
          .eq('user_id', session.session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setIsCompleted(!!data);
      } catch (err) {
        console.error('Error checking completion status:', err);
      } finally {
        setLoading(false);
      }
    }

    checkCompletionStatus();
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