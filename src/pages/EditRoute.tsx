import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function EditRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoute() {
      if (!id) return;

      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select(`
          *,
          route_tags (
            tag
          )
        `)
        .eq('id', id)
        .single();

      if (routeError) {
        setError('Failed to load route');
        setLoading(false);
        return;
      }

      if (!route) {
        setError('Route not found');
        setLoading(false);
        return;
      }

      // Verify ownership
      if (route.created_by !== user?.id) {
        navigate('/profile');
        return;
      }

      setTitle(route.title);
      setDescription(route.description || '');
      setSelectedTags(new Set(route.route_tags?.map(t => t.tag) || []));
      setLoading(false);
    }

    fetchRoute();
  }, [id, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user) return;

    setSaving(true);
    setError(null);

    try {
      // Update route
      const { error: routeError } = await supabase
        .from('routes')
        .update({
          title,
          description
        })
        .eq('id', id)
        .eq('created_by', user.id);

      if (routeError) throw routeError;

      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('route_tags')
        .delete()
        .eq('route_id', id);

      if (deleteError) throw deleteError;

      // Insert new tags
      if (selectedTags.size > 0) {
        const { error: tagsError } = await supabase
          .from('route_tags')
          .insert(
            Array.from(selectedTags).map(tag => ({
              route_id: id,
              tag
            }))
          );

        if (tagsError) throw tagsError;
      }

      navigate(`/routes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update route');
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Route</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Route Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {['scenic', 'curves', 'mountain', 'coastal', 'forest', 'desert'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full border ${
                      selectedTags.has(tag)
                        ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-600 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/routes/${id}`)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}