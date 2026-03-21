import React, { useEffect, useState, useRef } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
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

export default function SearchPage() {
  const { accessToken, user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id || '';

  // מצב החיפוש
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // פוקוס אוטומטי על שדה החיפוש
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // טעינת משתמשים מומלצים בכניסה לעמוד
  useEffect(() => {
    api.getSuggestedUsers({ accessToken, limit: 10 })
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [accessToken]);

  // חיפוש עם debounce - מחכה 400ms אחרי הקלדה
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // חיפוש דרך ה-API - מביא משתמשים ומסנן לפי שם
        const data = await api.getSuggestedUsers({ accessToken, limit: 50 });
        const filtered = data.filter((u: UserResult) => {
          const name = (u.username || u.email || '').toLowerCase();
          return name.includes(query.toLowerCase());
        });
        setResults(filtered);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, accessToken]);

  // עקוב / הפסק לעקוב
  async function handleFollow(targetUserId: string) {
    if (!accessToken) {
      window.location.href = '/login';
      return;
    }
    try {
      const data = await api.toggleFollow({ accessToken, targetUserId });
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (data.following) next.add(targetUserId); else next.delete(targetUserId);
        return next;
      });
    } catch { /* שקט */ }
  }

  // קומפוננט כרטיס משתמש
  function UserCard({ u }: { u: UserResult }) {
    const uid = u.id || u._id || '';
    const name = u.username || u.email || 'משתמש';
    const isFollowed = followingIds.has(uid);
    const isMe = uid === currentUserId;

    return (
      <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-[#2f3336] last:border-b-0">
        <div className="flex items-center gap-3">
          <Avatar name={name} imageUrl={u.profileImage} size={44} />
          <div>
            <div className="font-bold text-[15px]">{name}</div>
            <div className="text-[13px] text-[#71767b]">
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
            onClick={() => handleFollow(uid)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-bold transition-colors ${
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

  const displayList = query.trim() ? results : suggestions;

  return (
    <ShellLayout title="חיפוש">
      <div>
        {/* הדר קבוע עם שורת חיפוש */}
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] z-10 px-4 py-3">
          <div className="relative">
            {/* אייקון זכוכית מגדלת */}
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
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-[#202327] border border-[#2f3336] rounded-full py-2.5 pr-10 pl-4 text-[15px] outline-none focus:border-[#1d9bf0] focus:bg-transparent transition-colors text-white placeholder-[#71767b]"
              dir="rtl"
            />

            {/* כפתור ניקוי */}
            {query && (
              <button
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
        </div>

        {/* כותרת הרשימה */}
        <div className="px-4 py-3">
          <div className="font-extrabold text-[20px]">
            {query.trim() ? `Results for "${query}"` : 'People you may know'}
          </div>
        </div>

        {/* מצב טעינה */}
        {loading && (
          <div className="space-y-0">
            {[1, 2, 3].map(i => (
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

        {/* תוצאות */}
        {!loading && (
          <div>
            {displayList.length === 0 ? (
              <div className="px-4 py-12 text-center text-[#71767b]">
                {query.trim() ? 'No users found' : 'No suggestions yet'}
              </div>
            ) : (
              displayList.map(u => (
                <UserCard key={u.id || u._id} u={u} />
              ))
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
