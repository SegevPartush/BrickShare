import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import PostCard from '../components/posts/PostCard';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

interface UserResult {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  followersCount?: number;
  bio?: string;
}

type SearchTab = 'people' | 'posts';

export default function SearchPage() {
  const navigate = useNavigate();
  const { accessToken, user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id || '';

  const [tab, setTab] = useState<SearchTab>('people');
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceUsersRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncePostsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    api.getSuggestedUsers({ accessToken, limit: 10 })
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [accessToken]);

  // חיפוש משתמשים (מקומי על רשימה מהשרת)
  useEffect(() => {
    if (tab !== 'people') return;
    if (debounceUsersRef.current) clearTimeout(debounceUsersRef.current);
    if (!query.trim()) {
      setUserResults([]);
      return;
    }
    debounceUsersRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError('');
      try {
        const data = await api.getSuggestedUsers({ accessToken, limit: 50 });
        const q = query.toLowerCase();
        const filtered = data.filter((u: UserResult) => {
          const name = (u.username || u.email || '').toLowerCase();
          return name.includes(q);
        });
        setUserResults(filtered);
      } catch {
        setUserResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceUsersRef.current) clearTimeout(debounceUsersRef.current);
    };
  }, [query, accessToken, tab]);

  // חיפוש AI בפוסטים (שרת: GET /api/posts/search)
  useEffect(() => {
    if (tab !== 'posts') return;
    if (debouncePostsRef.current) clearTimeout(debouncePostsRef.current);
    if (!query.trim()) {
      setPostResults([]);
      setSearchError('');
      return;
    }
    debouncePostsRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError('');
      try {
        const data = await api.searchPosts(query.trim());
        setPostResults((data.results as Post[]) || []);
      } catch (e: any) {
        setPostResults([]);
        setSearchError(e?.response?.data?.message || e?.message || 'החיפוש נכשל. נסי שוב.');
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debouncePostsRef.current) clearTimeout(debouncePostsRef.current);
    };
  }, [query, tab]);

  async function handleFollow(targetUserId: string) {
    if (!accessToken) {
      window.location.href = '/login';
      return;
    }
    try {
      const data = await api.toggleFollow({ accessToken, targetUserId });
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (data.following) next.add(targetUserId); else next.delete(targetUserId);
        return next;
      });
    } catch { /* */ }
  }

  const handlePostLike = useCallback(
    async (postId: string) => {
      if (!accessToken) return;
      try {
        const data = await api.toggleLike({ accessToken, postId });
        const updated = data.post;
        setPostResults((prev) => prev.map((p) => (p._id === postId ? { ...p, ...updated, likes: updated.likes } : p)));
      } catch { /* */ }
    },
    [accessToken]
  );

  const handlePostDeleted = useCallback((postId: string) => {
    setPostResults((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handlePostEdited = useCallback((updated: Post) => {
    setPostResults((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
  }, []);

  function UserCard({ u }: { u: UserResult }) {
    const uid = u.id || u._id || '';
    const name = u.username || u.email || 'משתמש';
    const isFollowed = followingIds.has(uid);
    const isMe = uid === currentUserId;

    function goToProfile() {
      if (uid) navigate(`/profile/${uid}`);
    }

    return (
      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-[#2f3336] last:border-b-0"
        style={{ cursor: uid ? 'pointer' : 'default' }}
        onClick={goToProfile}
        onKeyDown={(e) => {
          if (uid && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            goToProfile();
          }
        }}
        role={uid ? 'link' : undefined}
        tabIndex={uid ? 0 : undefined}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 text-right">
          <Avatar name={name} imageUrl={u.profileImage} size={44} />
          <div className="min-w-0">
            <div className="font-bold text-[15px] truncate">{name}</div>
            <div className="text-[13px] text-[#71767b] truncate">
              {u.email || `@${name.toLowerCase()}`}
            </div>
            {u.followersCount !== undefined && (
              <div className="text-[12px] text-[#71767b] mt-0.5">
                {u.followersCount} עוקבים
              </div>
            )}
          </div>
        </div>
        {!isMe && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFollow(uid);
            }}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[14px] font-bold transition-colors ${
              isFollowed
                ? 'border border-[#71767b] text-white hover:border-red-400 hover:text-red-400'
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isFollowed ? 'עוקב ✓' : 'עקוב'}
          </button>
        )}
      </div>
    );
  }

  const peopleList = query.trim() ? userResults : suggestions;
  const showPeople = tab === 'people';
  const showPosts = tab === 'posts';

  return (
    <ShellLayout title="חיפוש">
      <div>
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] z-10 px-4 py-3 space-y-3">
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71767b] pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'posts' ? 'למשל: טכניק, סטים עד 500 ש"ח, מילניום...' : 'חיפוש לפי שם או אימייל...'}
              className="w-full bg-[#202327] border border-[#2f3336] rounded-full py-2.5 pr-10 pl-4 text-[15px] outline-none focus:border-[#1d9bf0] focus:bg-transparent transition-colors text-white placeholder-[#71767b]"
              dir="auto"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#71767b] flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-2 p-1 bg-[#16181c] rounded-xl border border-[#2f3336]">
            <button
              type="button"
              onClick={() => setTab('people')}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                tab === 'people' ? 'bg-[#1d9bf0] text-white' : 'text-[#71767b] hover:text-white'
              }`}
            >
              משתמשים
            </button>
            <button
              type="button"
              onClick={() => setTab('posts')}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                tab === 'posts' ? 'bg-[#1d9bf0] text-white' : 'text-[#71767b] hover:text-white'
              }`}
            >
              בניות / פוסטים (AI)
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="font-extrabold text-[20px]">
            {showPeople && (query.trim() ? `תוצאות ל״${query}״` : 'אנשים שאולי מכירים')}
            {showPosts && (
              <span>
                {query.trim() ? `חיפוש חכם בפוסטים: "${query}"` : 'חיפוש לשון חופש בבניות'}
              </span>
            )}
          </div>
          {showPosts && (
            <p className="text-[13px] text-[#71767b] mt-1.5">
              מחפש בטקסטי הפוסטים באמצעות AI ומדגיש למה כל תוצאה רלוונטית
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#2f3336] animate-pulse">
                <div className="w-11 h-11 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && showPeople && (
          <div>
            {peopleList.length === 0 ? (
              <div className="px-4 py-12 text-center text-[#71767b]">
                {query.trim() ? 'לא נמצאו משתמשים' : 'אין עדיין המלצות'}
              </div>
            ) : (
              peopleList.map((u) => <UserCard key={u.id || u._id} u={u} />)
            )}
          </div>
        )}

        {!loading && showPosts && (
          <div>
            {searchError && (
              <div className="px-4 py-4 mx-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[14px] text-center">
                {searchError}
              </div>
            )}
            {!query.trim() && (
              <div className="px-4 py-12 text-center text-[#71767b] text-[15px] max-w-md mx-auto">
                הקלידי ביטוי חופשי – למשל נושא (Star Wars, Technic), תקציב, או &quot;מי בנה את...&quot;
                <br />
                <span className="text-[13px] text-[#5c6366]">החיפוש מבוסס AI ומתאים פוסטים לפי משמעות, לא רק מילה מדויקת</span>
              </div>
            )}
            {query.trim() && !searchError && postResults.length === 0 && (
              <div className="px-4 py-12 text-center text-[#71767b]">לא נמצאו פוסטים רלוונטיים לשאילתה</div>
            )}
            {query.trim() && (
              <div className="px-3 sm:px-4 space-y-3 pt-2">
                {postResults.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUserId}
                    matchReason={post.matchReason}
                    commentsBehavior="navigate"
                    onToggleLike={handlePostLike}
                    onDeleted={handlePostDeleted}
                    onEdited={handlePostEdited}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
