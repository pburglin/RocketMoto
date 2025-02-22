import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string;
  };
};

type RouteCommentsProps = {
  routeId: string;
  isAuthenticated: boolean;
  onCommentAdded: (comment: Comment) => void;
};

export function RouteComments({ routeId, isAuthenticated, onCommentAdded }: RouteCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const COMMENTS_PER_PAGE = 5;

  useEffect(() => {
    loadComments();
  }, [routeId]);

  async function loadComments(startIndex = 0) {
    setLoading(true);
    try {
      const { data: newComments, error } = await supabase
        .from('route_comments')
        .select(`
          *,
          user:users (
            username,
            avatar_url
          )
        `)
        .eq('route_id', routeId)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + COMMENTS_PER_PAGE - 1);

      if (error) throw error;

      if (newComments) {
        setComments(prev => startIndex === 0 ? newComments : [...prev, ...newComments]);
        setHasMore(newComments.length === COMMENTS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLoadMore() {
    loadComments(comments.length);
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setCommentError(null);

    try {
      const { data: comment, error } = await supabase
        .from('route_comments')
        .insert([
          {
            route_id: routeId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            content: newComment.trim()
          }
        ])
        .select(`
          *,
          user:users (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      
      setComments(prev => [comment, ...prev]);
      onCommentAdded(comment);
      setNewComment('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comments
      </h2>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
            <div className="flex items-center mb-2">
              <img
                src={comment.user.avatar_url}
                alt="User avatar"
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{comment.user.username}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
          </div>
        ))}
        
        {loading && (
          <div className="text-center py-4">
            <div className="text-gray-500 dark:text-gray-400">Loading comments...</div>
          </div>
        )}
        
        {!loading && hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              Load More Comments
            </button>
          </div>
        )}
      </div>
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
          {commentError && (
            <p className="mt-2 text-red-600 text-sm">{commentError}</p>
          )}
        </form>
      ) : (
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to leave a comment
          </p>
        </div>
      )}
    </div>
  );
}