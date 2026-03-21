import React, { useEffect, useMemo, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import PostCard from '../components/posts/PostCard';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import CreateBuildModal from '../components/posts/CreateBuildModal';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

// Sponsored/ad posts data
const sponsoredAds = [
  {
    id: 'ad-1',
    brand: 'LEGO Official',
    handle: '@lego',
    text: '🧱 NEW DROP: Technic Bugatti Bolide – 905 pieces of pure speed. Available now at LEGO.com. Use code BRICK10 for 10% off!',
    tag: 'Sponsored',
    cta: 'Shop Now',
    url: 'https://www.lego.com',
  },
  {
    id: 'ad-2',
    brand: 'BrickLink',
    handle: '@bricklink',
    text: '🔍 Find rare LEGO parts, minifigs and sets from collectors worldwide. The world\'s largest LEGO marketplace.',
    tag: 'Promoted',
    cta: 'Explore',
    url: 'https://www.bricklink.com',
  },
  {
    id: 'ad-3',
    brand: 'Rebrickable',
    handle: '@rebrickable',
    text: '🔧 Build something new with the sets you already own! Rebrickable shows you thousands of MOC designs using your existing pieces.',
    tag: 'Sponsored',
    cta: 'Try Free',
    url: 'https://rebrickable.com',
  },
];

function SponsoredPost() {
  const ad = sponsoredAds[Math.floor(Math.random() * sponsoredAds.length)];
  return (
    <div className="border-b border-[#2f3336] px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#38bdf8] flex items-center justify-center shrink-0 text-white font-bold text-[15px]">
          {ad.brand[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[15px]">{ad.brand}</span>
            <span className="text-[#71767b] text-[14px]">{ad.handle}</span>
            <span className="text-[11px] text-[#71767b] border border-[#2f3336] rounded px-1.5 py-0.5 ml-1">{ad.tag}</span>
          </div>
          <p className="text-[15px] leading-relaxed mt-1 text-white">{ad.text}</p>
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-1.5 border border-[#1d9bf0] text-[#1d9bf0] rounded-full text-[14px] font-bold hover:bg-[#1d9bf0]/10 transition-colors"
          >
            {ad.cta} →
          </a>
        </div>
      </div>
    </div>
  );
}

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
  const currentUserId = user?.id || user?._id || '';
  const isSignedIn = Boolean(accessToken);

  // טאב פעיל - הפיד או בניות מומלצות
  const [activeTab, setActiveTab] = useState<'feed' | 'recommended'>('feed');
  const [createOpen, setCreateOpen] = useState(false);

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

  function handlePostDeleted(postId: string) {
    setPosts(prev => prev.filter(p => p._id !== postId));
  }

  function handlePostEdited(postId: string, newText: string) {
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, text: newText } : p));
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

  // Demo posts shown when no real posts exist
  const demoPosts: Post[] = useMemo(() => [
    {
      _id: 'demo-1',
      text: 'Just finished the Millennium Falcon UCS! 7,541 pieces and 18 hours of building 🚀 Most impressive set I\'ve ever built',
      image: '',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      author: { username: 'sarah_builds', email: 'sarah@demo.local' },
      likes: [],
      commentCount: 23,
    },
    {
      _id: 'demo-2',
      text: 'Looking to trade parts! I have lots of spare Technic pieces, looking for Star Wars Minifigs 🔵🟡',
      image: '',
      createdAt: new Date(Date.now() - 21600000).toISOString(),
      author: { username: 'dani_technic', email: 'dani@demo.local' },
      likes: [],
      commentCount: 18,
    },
    {
      _id: 'demo-3',
      text: 'Tokyo Skyline Architecture just arrived! One of the most beautiful sets released this year 🗼',
      image: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      author: { username: 'michal_moc', email: 'michal@demo.local' },
      likes: [],
      commentCount: 7,
    },
  ], []);

  // הפוסטים שמוצגים - מהשרת או דמו
  const displayedPosts = posts.length > 0 ? posts : demoPosts;

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
        {(suggestedUsers.length > 0 ? suggestedUsers : [
          { _id: 'u1', username: 'sarah_builds' },
          { _id: 'u2', username: 'dani_technic' },
          { _id: 'u3', username: 'michal_moc' },
        ]).map((u: any, i, arr) => {
          const uid = u.id || u._id;
          const name = u.username || 'collector';
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
                    <div className="text-[12px] text-[#71767b]">LEGO collector</div>
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
                  {isFollowed ? 'Following' : 'Follow'}
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
            onCreated={() => { setCreateOpen(false); loadPosts(); }}
          />
        )}

        {/* Sponsored post - shown after 2nd real post */}
        {!loading && displayedPosts.length > 0 && <SponsoredPost />}

        {/* Posts list */}
        {loading ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : (
          displayedPosts.map((post, idx) => (
            <React.Fragment key={post._id}>
              <PostCard
                post={post}
                currentUserId={currentUserId}
                onToggleLike={handleLike}
                onDeleted={handlePostDeleted}
                onEdited={handlePostEdited}
              />
              {/* Insert sponsored post every 5 posts */}
              {(idx + 1) % 5 === 0 && <SponsoredPost />}
            </React.Fragment>
          ))
        )}

        {!loading && displayedPosts.length === 0 && (
          <div className="p-12 text-center text-[#71767b]">
            No posts yet. Be the first to share! 🧱
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
