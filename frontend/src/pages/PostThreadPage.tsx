import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ShellLayout from '../components/layout/ShellLayout';
import PostCard from '../components/posts/PostCard';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

export default function PostThreadPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const currentUserId = user?.id || user?._id || '';

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) {
      setError('מזהה פוסט חסר');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api
      .getPost(postId)
      .then((p) => {
        setPost(p as Post);
      })
      .catch(() => {
        setError('הפוסט לא נמצא או שאינו זמין');
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  function handlePostDeleted() {
    navigate('/feed', { replace: true });
  }

  async function handleLikePost(pId: string) {
    if (!accessToken) return;
    try {
      const data = await api.toggleLike({ accessToken, postId: pId });
      setPost((p) => (p && p._id === data.post._id ? { ...p, ...data.post } : p));
    } catch { /* */ }
  }

  return (
    <ShellLayout title="תגובות">
      <div className="min-h-screen">
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            aria-label="חזרה"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="font-bold text-[17px] text-white">שיחה על הפוסט</div>
        </div>

        {loading && (
          <div className="p-8 text-center text-[#71767b]">טוען…</div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-[#71767b] max-w-sm mx-auto">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="px-4 py-2 rounded-full bg-[#1d9bf0] text-white text-[14px] font-bold"
            >
              חזרה לפיד
            </button>
          </div>
        )}

        {!loading && !error && post && (
          <div className="px-3 sm:px-4 pt-2 pb-4">
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              commentsBehavior="thread"
              onToggleLike={handleLikePost}
              onDeleted={handlePostDeleted}
              onEdited={(updated) => setPost((p) => (p && p._id === updated._id ? { ...p, ...updated } : p))}
            />
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
