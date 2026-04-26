import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellLayout from '../components/layout/ShellLayout';
import PostCard from '../components/posts/PostCard';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import CreateBuildModal from '../components/posts/CreateBuildModal';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

// Loading skeleton post
function SkeletonPost() {
  return (
    <div className="border-b border-[#2f3336] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { accessToken, user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?._id || '';
  const isSignedIn = Boolean(accessToken);

  // טאב פעיל - הפיד או בניות מומלצות
  const [activeTab, setActiveTab] = useState<'feed' | 'recommended'>('feed');
  const [createOpen, setCreateOpen] = useState(false);

  // פוסטים וטעינה
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // יצירת פוסט חדש
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  // משתמשים מומלצים לעקוב
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // טעינת פוסטים מהשרת
  async function loadPosts(pageNum: number = 1, append: boolean = false) {
    if (loading) return;
    setLoading(true);
    try {
      const data = await api.getPosts({ page: pageNum, limit: 10 });
      setPosts(prev => append ? [...prev, ...(data.posts || [])] : (data.posts || []));
      setHasMore(pageNum < data.totalPages);
    } catch (e) {
      console.error('שגיאה בטעינת פוסטים:', e);
    } finally {
      setLoading(false);
    }
  }

  // טעינה ראשונית
  useEffect(() => { loadPosts(1, false); }, []);

  // Infinite scroll
  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  // טעינת משתמשים מומלצים
  useEffect(() => {
    api.getSuggestedUsers({ accessToken, limit: 3 })
      .then(setSuggestedUsers)
      .catch(() => setSuggestedUsers([]));
  }, [accessToken]);

  // טעינת רשימת המשתמשים שאני עוקב אחריהם - כדי להציג נכון "Following" על הכפתור
  useEffect(() => {
    if (!accessToken || !currentUserId) {
      setFollowingIds(new Set());
      return;
    }
    api.getFollowing({ accessToken, targetUserId: currentUserId })
      .then((list: any[]) => {
        const ids = new Set<string>(
          (list || []).map((u: any) => String(u.id || u._id))
        );
        setFollowingIds(ids);
      })
      .catch(() => setFollowingIds(new Set()));
  }, [accessToken, currentUserId]);

  // פרסום פוסט חדש
  async function handleCreatePost() {
    if (!accessToken) return;
    const t = newPostText.trim();
    if (!t && !newPostImage) return;
    setCreateBusy(true);
    try {
      await api.createPost({ accessToken, text: t, imageFile: newPostImage });
      setNewPostText('');
      setNewPostImage(null);
      setPage(1);
      setHasMore(true);
      await loadPosts(1, false);
    } catch (e) {
      console.error('שגיאה ביצירת פוסט:', e);
    } finally {
      setCreateBusy(false);
    }
  }

  // לייק / ביטול לייק
  async function handleLike(postId: string) {
    if (!accessToken) return;
    try {
      const data = await api.toggleLike({ accessToken, postId });
      const updated = data.post;
      setPosts(prev => prev.map(p => p._id === updated._id ? updated : p));
    } catch (e) {
      console.error('שגיאה בלייק:', e);
    }
  }

  function handlePostDeleted(postId: string) {
    setPosts(prev => prev.filter(p => p._id !== postId));
  }

  function handlePostEdited(postId: string, newText: string) {
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, text: newText } : p));
  }

  // עקוב / הפסק לעקוב
  async function handleFollow(targetUserId: string) {
    if (!accessToken) return;
    if (!targetUserId || targetUserId === currentUserId) return;

    // עדכון אופטימי - הכפתור מתחלף מיד, ואם השרת ייכשל נחזיר אחורה
    const wasFollowing = followingIds.has(targetUserId);
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(targetUserId); else next.add(targetUserId);
      return next;
    });

    try {
      const data = await api.toggleFollow({ accessToken, targetUserId });
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (data.following) next.add(targetUserId); else next.delete(targetUserId);
        return next;
      });
    } catch (e) {
      console.error('שגיאה במעקב אחרי משתמש:', e);
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (wasFollowing) next.add(targetUserId); else next.delete(targetUserId);
        return next;
      });
    }
  }

  function goToProfile(uid: string) {
    if (!uid) return;
    navigate(`/profile/${uid}`);
  }

  // Right panel - Trending + suggested users
  const rightPanel = (
    <div className="space-y-4">
      {/* Profile card */}
      {user ? (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] truncate">{user.username || user.email}</div>
              <div className="text-[13px] text-[#71767b] truncate">{user.email}</div>
            </div>
          </div>
          <a
            href="/profile"
            className="block w-full py-1.5 text-[13px] font-semibold text-center text-white border border-[#2f3336] rounded-full hover:bg-white/5 transition-colors"
          >
            View Profile
          </a>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="font-bold text-[18px] mb-1">Join the community</div>
          <div className="text-[13px] text-[#71767b] mb-3">Share builds and discover new sets</div>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="w-full py-2 bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] text-white font-bold rounded-full text-[15px] hover:shadow-lg transition-all"
          >
            Sign Up
          </button>
        </Card>
      )}

      {/* Trending Sets */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2f3336]">
          <div className="font-extrabold text-[20px]">🔥 Trending Sets</div>
        </div>
        {[
          { category: 'LEGO Icons', title: 'Millennium Falcon UCS', count: '156 builds' },
          { category: 'LEGO Technic', title: 'Ferrari Daytona SP3', count: '89 builds' },
          { category: 'LEGO Architecture', title: 'Tokyo Skyline', count: '134 builds' },
        ].map((item, i, arr) => (
          <div
            key={item.title}
            className={`px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${i < arr.length - 1 ? 'border-b border-[#2f3336]' : ''}`}
          >
            <div className="text-[12px] text-[#71767b]">{item.category}</div>
            <div className="font-bold text-[15px]">{item.title}</div>
            <div className="text-[12px] text-[#71767b] mt-0.5">{item.count}</div>
          </div>
        ))}
      </Card>

      {/* Suggested collectors */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2f3336]">
          <div className="font-extrabold text-[20px]">Who to Follow</div>
        </div>
        {suggestedUsers.length === 0 ? (
          <div className="px-4 py-6 text-[13px] text-[#71767b] text-center">
            אין כרגע משתמשים מומלצים
          </div>
        ) : suggestedUsers.map((u: any, i, arr) => {
          const uid = String(u.id || u._id || '');
          const name = u.username || 'collector';
          const isFollowed = followingIds.has(uid);
          const isSelf = uid === currentUserId;
          return (
            <div
              key={uid}
              className={`px-4 py-3 hover:bg-white/[0.03] transition-colors ${i < arr.length - 1 ? 'border-b border-[#2f3336]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToProfile(uid)}
                  className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
                  title="הצג פרופיל"
                >
                  <Avatar name={name} imageUrl={u.profileImage} size={44} />
                  <div>
                    <div className="font-bold text-[15px] hover:underline">@{name}</div>
                    <div className="text-[12px] text-[#71767b]">LEGO collector</div>
                  </div>
                </button>
                {!isSelf && (
                  <button
                    onClick={() => handleFollow(uid)}
                    disabled={!isSignedIn}
                    className={`px-4 py-1.5 rounded-full text-[14px] font-bold transition-colors disabled:opacity-50 ${
                      isFollowed
                        ? 'border border-[#71767b] text-white hover:border-red-400 hover:text-red-400'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );

  return (
    <ShellLayout title="קהילת אספני הלגו" rightPanel={rightPanel}>
      <div>
        {/* Sticky header with tabs */}
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] z-10">
          {/* Tabs */}
          <div className="flex">
            {([
              { key: 'feed', label: 'For You' },
              { key: 'recommended', label: 'Following' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-4 text-[15px] font-semibold relative transition-colors ${
                  activeTab === key ? 'text-white' : 'text-[#71767b] hover:bg-white/[0.03]'
                }`}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Composer trigger */}
        {isSignedIn && (
          <div className="border-b border-[#2f3336] px-4 py-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center gap-3 group"
            >
              <Avatar name={user?.username || user?.email} imageUrl={user?.profileImage} size={44} />
              <div className="flex-1 text-left bg-[#202327] hover:bg-[#2f3336] transition-colors rounded-full px-4 py-3 text-[16px] text-[#71767b]">
                Share your latest LEGO build...
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </button>
          </div>
        )}

        {createOpen && (
          <CreateBuildModal
            onClose={() => setCreateOpen(false)}
            onCreated={() => { setCreateOpen(false); setPage(1); setHasMore(true); loadPosts(1, false); }}
          />
        )}

        {/* Posts list */}
        {loading && posts.length === 0 ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onToggleLike={handleLike}
              onDeleted={handlePostDeleted}
              onEdited={handlePostEdited}
            />
          ))
        )}

        {!loading && posts.length === 0 && (
          <div className="p-12 text-center text-[#71767b]">
            No posts yet. Be the first to share! 🧱
          </div>
        )}

        <div ref={bottomRef} className="h-10" />
        {loading && posts.length > 0 && (
          <div className="py-4 text-center text-[#71767b] text-[14px]">Loading more builds...</div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="py-6 text-center text-[#71767b] text-[14px] border-t border-[#2f3336]">You've seen all the builds! 🧱</div>
        )}
      </div>
    </ShellLayout>
  );
}
