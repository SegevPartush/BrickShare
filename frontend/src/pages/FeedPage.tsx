import React, { useEffect, useMemo, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import PostCard from '../components/posts/PostCard';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

// קומפוננט שלד לטעינה
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
  const currentUserId = user?.id || user?._id || '';
  const isSignedIn = Boolean(accessToken);

  // טאב פעיל - הפיד או בניות מומלצות
  const [activeTab, setActiveTab] = useState<'feed' | 'recommended'>('feed');

  // פוסטים וטעינה
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // יצירת פוסט חדש
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  // משתמשים מומלצים לעקוב
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // טעינת פוסטים מהשרת
  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api.getPosts({ page: 1, limit: 20 });
      setPosts(data.posts || []);
    } catch (e) {
      console.error('שגיאה בטעינת פוסטים:', e);
    } finally {
      setLoading(false);
    }
  }

  // טעינה ראשונית
  useEffect(() => {
    loadPosts();
  }, []);

  // טעינת משתמשים מומלצים
  useEffect(() => {
    api.getSuggestedUsers({ accessToken, limit: 3 })
      .then(setSuggestedUsers)
      .catch(() => setSuggestedUsers([]));
  }, [accessToken]);

  // פרסום פוסט חדש
  async function handleCreatePost() {
    if (!newPostText.trim() || !accessToken) return;
    setCreateBusy(true);
    try {
      await api.createPost({ accessToken, text: newPostText.trim(), imageFile: newPostImage });
      setNewPostText('');
      setNewPostImage(null);
      await loadPosts();
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

  // עקוב / הפסק לעקוב
  async function handleFollow(targetUserId: string) {
    if (!accessToken) return;
    try {
      const data = await api.toggleFollow({ accessToken, targetUserId });
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (data.following) next.add(targetUserId); else next.delete(targetUserId);
        return next;
      });
    } catch { /* שקט */ }
  }

  // פוסטים לדוגמה כשאין פוסטים אמיתיים
  const demoPosts: Post[] = useMemo(() => [
    {
      _id: 'demo-1',
      text: 'סיימתי את ה-Millennium Falcon UCS! 7,541 חלקים ו-18 שעות בניה 🚀 הכי מרשים שבניתי עד עכשיו',
      image: '',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      author: { username: 'sarah_builds', email: 'sarah@demo.local' },
      likes: [],
      commentCount: 23,
    },
    {
      _id: 'demo-2',
      text: 'מישהו מחפש להחליף חלקים? יש לי הרבה חלקי Technic עודפים, מחפש Star Wars Minifigs 🔵🟡',
      image: '',
      createdAt: new Date(Date.now() - 21600000).toISOString(),
      author: { username: 'dani_technic', email: 'dani@demo.local' },
      likes: [],
      commentCount: 18,
    },
    {
      _id: 'demo-3',
      text: 'הזמנתי את Tokyo Skyline Architecture! אחד הסטים הכי יפים שיצאו השנה לדעתי 🗼',
      image: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      author: { username: 'michal_moc', email: 'michal@demo.local' },
      likes: [],
      commentCount: 7,
    },
  ], []);

  // הפוסטים שמוצגים - מהשרת או דמו
  const displayedPosts = posts.length > 0 ? posts : demoPosts;

  // פאנל ימני - Trending + משתמשים מומלצים
  const rightPanel = (
    <div className="space-y-4">
      {/* כרטיס פרופיל */}
      {user ? (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] truncate">{user.username || user.email}</div>
              <div className="text-[13px] text-[#71767b] truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="w-full py-1.5 text-[13px] font-semibold text-[#71767b] hover:text-white border border-[#2f3336] rounded-full transition-colors"
          >
            התנתק
          </button>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="font-bold text-[18px] mb-1">הצטרף לקהילה</div>
          <div className="text-[13px] text-[#71767b] mb-3">שתף בניות וגלה סטים חדשים</div>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="w-full py-2 bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] text-white font-bold rounded-full text-[15px] hover:shadow-lg transition-all"
          >
            הירשם עכשיו
          </button>
        </Card>
      )}

      {/* Trending Sets */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2f3336]">
          <div className="font-extrabold text-[20px]">🔥 Trending Sets</div>
        </div>
        {[
          { category: 'LEGO Icons', title: 'Millennium Falcon UCS', count: '156 בניות' },
          { category: 'LEGO Technic', title: 'Ferrari Daytona SP3', count: '89 בניות' },
          { category: 'LEGO Architecture', title: 'Tokyo Skyline', count: '134 בניות' },
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

      {/* אספנים מומלצים */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2f3336]">
          <div className="font-extrabold text-[20px]">אספנים מומלצים</div>
        </div>
        {(suggestedUsers.length > 0 ? suggestedUsers : [
          { _id: 'u1', username: 'sarah_builds' },
          { _id: 'u2', username: 'dani_technic' },
          { _id: 'u3', username: 'michal_moc' },
        ]).map((u: any, i, arr) => {
          const uid = u.id || u._id;
          const name = u.username || 'אספן';
          const isFollowed = followingIds.has(uid);
          return (
            <div
              key={uid}
              className={`px-4 py-3 hover:bg-white/[0.03] transition-colors ${i < arr.length - 1 ? 'border-b border-[#2f3336]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={name} imageUrl={u.profileImage} size={44} />
                  <div>
                    <div className="font-bold text-[15px]">@{name}</div>
                    <div className="text-[12px] text-[#71767b]">אספן לגו</div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(uid)}
                  disabled={!isSignedIn}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-bold transition-colors disabled:opacity-50 ${
                    isFollowed
                      ? 'border border-[#71767b] text-white hover:border-red-400 hover:text-red-400'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isFollowed ? 'עוקב' : 'עקוב'}
                </button>
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
        {/* הדר קבוע עם טאבים */}
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] z-10">
          <div className="px-4 pt-3 pb-0">
            <div className="font-extrabold text-[20px]">קהילת אספני הלגו</div>
            <div className="text-[13px] text-[#71767b] mt-0.5 mb-3">Building Dreams Together</div>
          </div>

          {/* טאבים */}
          <div className="flex">
            {([
              { key: 'feed', label: 'הפיד' },
              { key: 'recommended', label: 'בניות מומלצות' },
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

        {/* Post Composer - כתיבת פוסט חדש */}
        {isSignedIn && (
          <div className="border-b border-[#2f3336] px-4 py-3">
            <div className="flex gap-3">
              <Avatar name={user?.username || user?.email} imageUrl={user?.profileImage} size={44} />
              <div className="flex-1">
                <textarea
                  className="w-full bg-transparent text-[20px] outline-none resize-none placeholder-[#71767b] min-h-[80px]"
                  placeholder="שתף את הבניה האחרונה שלך..."
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) handleCreatePost();
                  }}
                />

                {/* כפתורי תחתית ה-composer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2f3336]">
                  {/* כפתור העלאת תמונה */}
                  <label className="w-9 h-9 rounded-full flex items-center justify-center text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setNewPostImage(e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    {/* אינדיקטור תמונה נבחרה */}
                    {newPostImage && (
                      <span className="text-[13px] text-[#1d9bf0]">📎 {newPostImage.name}</span>
                    )}
                    {/* כפתור פרסום */}
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostText.trim() || createBusy}
                      className="px-4 py-2 bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] text-white font-bold rounded-full disabled:opacity-40 hover:shadow-lg transition-all text-[15px]"
                    >
                      {createBusy ? 'מפרסם...' : 'פרסם'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* רשימת הפוסטים */}
        {loading ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : (
          displayedPosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onToggleLike={handleLike}
            />
          ))
        )}

        {/* הודעה כשאין פוסטים */}
        {!loading && displayedPosts.length === 0 && (
          <div className="p-12 text-center text-[#71767b]">
            אין פוסטים עדיין. היה הראשון לשתף! 🧱
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
