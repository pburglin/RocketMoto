import React, { useState } from 'react';
import { X, AlertCircle, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentAvatarUrl: string;
  currentDistanceUnit: 'km' | 'mi';
  onProfileUpdate: () => void;
};

export function EditProfileModal({
  isOpen,
  onClose,
  currentUsername,
  currentAvatarUrl,
  currentDistanceUnit,
  onProfileUpdate
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>(currentDistanceUnit);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if username is taken (if changed)
      if (username !== currentUsername) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      // Validate avatar URL
      if (avatarUrl) {
        try {
          new URL(avatarUrl);
        } catch {
          throw new Error('Invalid avatar URL');
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          avatar_url: avatarUrl,
          distance_unit: distanceUnit
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (updateError) throw updateError;

      onProfileUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter a URL for your avatar image
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme Preference
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Sun className="h-5 w-5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Moon className="h-5 w-5" />
                Dark
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distance Unit Preference
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDistanceUnit('km')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                  distanceUnit === 'km'
                    ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Kilometers
              </button>
              <button
                type="button"
                onClick={() => setDistanceUnit('mi')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                  distanceUnit === 'mi'
                    ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Miles
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !username}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}