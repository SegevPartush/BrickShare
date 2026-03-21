import React, { useEffect, useMemo, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PostCard from '../components/posts/PostCard';
import Card from '../components/ui/Card';
import RarityBadge from '../components/ui/RarityBadge';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

function SkeletonLine({ width = '100%' }) {
  return <div className="h-4 w-full rounded-lg bg-white/5 animate-pulse" style={{ width }} />;
}

function formatMoney(n) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function FeedPage() {
  const { accessToken, user, logout } = useAuth();
  const currentUserId = user?.id || user?._id || '';
  const isSignedIn = Boolean(accessToken);

  const collectionsDemo = useMemo(
    () => [
      { id: 'col-1', name: 'Star Wars UCS', rarity: 'Legendary', sets: 18, value: 12450, note: 'Millennium Falcon, AT-AT, X-Wing - הקולקציה המושלמת' },
      { id: 'col-2', name: 'LEGO Technic', rarity: 'Epic', sets: 12, value: 8320, note: 'Ferrari, Bugatti, Lamborghini - מכוניות פרימיום' },
      { id: 'col-3', name: 'Architecture', rarity: 'Rare', sets: 25, value: 4150, note: 'Tokyo, Paris, New York - ערים מסביב לעולם' }
    ],
    []
  );

  const rareSetsDemo = useMemo(
    () => [
      { id: 'r-1', title: 'Millennium Falcon UCS', rarity: 'Legendary' },
      { id: 'r-2', title: 'Ferrari Daytona SP3', rarity: 'Epic' },
      { id: 'r-3', title: 'Tokyo Skyline', rarity: 'Rare' },
      { id: 'r-4', title: 'Modular Buildings', rarity: 'Rare' }
    ],
    []
  );

  const wishlistDemo = useMemo(
    () => [
      { id: 'w-1', title: 'AT-AT Walker', rarity: 'Epic' },
      { id: 'w-2', title: 'Liebherr Crane', rarity: 'Rare' },
      { id: 'w-3', title: 'NASA Apollo Saturn V', rarity: 'Rare' },
      { id: 'w-4', title: 'Hogwarts Castle', rarity: 'Legendary' }
    ],
    []
  );

  const recentActivityDemo = useMemo(
    () => [
      { id: 'a-1', text: 'החלפת חלקים עם @sarah_builds', time: 'לפני שעתיים' },
      { id: 'a-2', text: '@dani_technic אהב את הבניה שלך', time: 'אתמול' },
      { id: 'a-3', text: 'סט חדש הוסף לרשימת המשאלות', time: 'לפני 3 ימים' }
    ],
    []
  );

  const tradesDemo = useMemo(
    () => [
      { id: 't-1', with: '@sarah_builds', offer: 'חלקי Technic', request: 'Star Wars Minifigs', status: 'פתוח' },
      { id: 't-2', with: '@michal_moc', offer: 'Instructions מקוריות', request: 'חלקים נדירים', status: 'ממתין' }
    ],
    []
  );

  const demoPosts = useMemo(
    () => [
      {
        _id: 'demo-1',
        text: 'סיימתי את ה-Millennium Falcon! 7541 חלקים ו-18 שעות בניה 🚀',
        image: '',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        author: { username: 'sarah_builds', email: 'sarah@demo.local', profileImage: '' },
        likes: [],
        commentCount: 23
      },
      {
        _id: 'demo-2',
        text: 'החלפת חלקים עם מישהו? מחפש חלק #32316 בצהוב 🔵',
        image: '',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        author: { username: 'dani_technic', email: 'dani@demo.local', profileImage: '' },
        likes: [],
        commentCount: 18
      },
      {
        _id: 'demo-3',
        text: 'MOC חדש של בניין מודרני! מישהו רוצה את ההוראות? 🏗️',
        image: '',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
        author: { username: 'michal_moc', email: 'michal@demo.local', profileImage: '' },
        likes: [],
        commentCount: 45
      }
    ],
    []
  );

  const [activeTab, setActiveTab] = useState('collections'); // collections | activity
  const [postsState, setPostsState] = useState({
    items: demoPosts,
    totalPosts: 0,
    currentPage: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsBusy, setSuggestionsBusy] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());

  async function loadActivity({ page = 1, limit = 10 } = {}) {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.getPosts({ page, limit });
      setPostsState({
        items: data.posts || [],
        totalPosts: data.totalPosts || 0,
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || 1
      });
      setSearchResults([]);
      setSearching(false);
    } catch (e) {
      setLoadError(e?.response?.data?.message || e?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(q) {
    if (!q.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await api.searchPosts(q.trim());
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    loadActivity({ page: 1, limit: 10 });
  }, []);

  useEffect(() => {
    async function loadSuggestions() {
      if (!accessToken) return;
      setSuggestionsBusy(true);
      try {
        const items = await api.getSuggestions(accessToken);
        setSuggestions(items || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsBusy(false);
      }
    }
    loadSuggestions();
  }, [accessToken]);

  useEffect(() => {
    async function loadSuggestedUsers() {
      try {
        const users = await api.getSuggestedUsers({ accessToken, limit: 3 });
        setSuggestedUsers(users);
      } catch {
        setSuggestedUsers([]);
      }
    }
    loadSuggestedUsers();
  }, [accessToken]);

  async function onToggleFollow(targetUserId) {
    if (!accessToken) return;
    try {
      const data = await api.toggleFollow({ accessToken, targetUserId });
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (data.following) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
    } catch {
      // silent
    }
  }

  async function onCreatePost() {
    if (!accessToken) return;
    const text = newText.trim();
    if (!text) return;
    setCreateBusy(true);
    try {
      await api.createPost({ accessToken, text, imageFile: newImage });
      setCreateOpen(false);
      setNewText('');
      setNewImage(null);
      await loadActivity({ page: 1, limit: 10 });
    } finally {
      setCreateBusy(false);
    }
  }

  async function onToggleLike(postId) {
    if (!accessToken) return;
    try {
      const data = await api.toggleLike({ accessToken, postId });
      const updated = data.post;
      setPostsState((prev) => ({
        ...prev,
        items: prev.items.map((p) => (p._id === updated._id ? updated : p))
      }));
      setSearchResults((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch {
      // silent
    }
  }

  const displayedActivity = searching ? searchResults : postsState.items;

  const rightPanel = (
    <div className="space-y-16">
      <Card className="p-16">
        {user ? (
          <div className="space-y-12">
            <div className="flex items-center gap-12">
              <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={44} />
              <div className="min-w-0">
                <div className="text-body font-semibold truncate">{user.username || user.email}</div>
                <div className="text-caption text-muted truncate">{user.email}</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1d9bf0]/10 border border-[#1d9bf0]/30 rounded-lg text-sm font-semibold text-[#1d9bf0]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
              </svg>
              340+ סטים באוסף
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                logout();
                window.location.href = '/auth';
              }}
            >
              התנתק
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-body font-semibold">הצטרף לקהילה</div>
            <div className="text-caption text-muted mt-6">התחל לשתף בניות ולגלות סטים חדשים</div>
            <div className="mt-14">
              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8]"
                onClick={() => (window.location.href = '/auth')}
              >
                הירשם עכשיו
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-16">
        <div className="flex items-center justify-between gap-12 mb-3">
          <div className="text-subtitle font-semibold">🔥 Trending Sets</div>
          <div className="text-caption text-muted">פופולרי</div>
        </div>
        <div className="mt-12 space-y-10">
          {rareSetsDemo.map((s) => (
            <div key={s.id} className="hover:bg-white/2 p-2 rounded-lg transition-colors cursor-pointer">
              <div className="text-[13px] text-[#71767b] mb-1">LEGO Icons</div>
              <div className="text-body font-semibold">{s.title}</div>
              <div className="text-caption text-muted mt-1">156 בניות</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-16">
        <div className="flex items-center justify-between gap-12">
          <div className="text-subtitle font-semibold">אספנים מומלצים</div>
        </div>
        <div className="mt-12 space-y-10">
          {(suggestedUsers.length > 0 ? suggestedUsers : wishlistDemo.slice(0, 3)).map((item) => {
            const uid = item.id || item._id || item.id2;
            const name = item.username || item.title || 'אספן';
            const isFollowed = followingIds.has(uid);
            return (
              <div
                key={uid || item.id}
                className="flex items-center justify-between gap-12 hover:bg-white/2 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={name} imageUrl={item.profileImage} size={40} />
                  <div>
                    <div className="text-body font-semibold">@{name}</div>
                    <div className="text-caption text-muted">
                      {item.followersCount != null ? `${item.followersCount} עוקבים` : 'Star Wars Fan'}
                    </div>
                  </div>
                </div>
                {uid && uid !== currentUserId && (
                  <button
                    onClick={() => onToggleFollow(uid)}
                    disabled={!isSignedIn}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                      isFollowed
                        ? 'bg-transparent border border-[#71767b] text-white hover:border-red-400 hover:text-red-400'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {isFollowed ? 'עוקב' : 'עקוב'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-16">
        <div className="flex items-center justify-between gap-12">
          <div className="text-subtitle font-semibold">Recent activity</div>
          <div className="text-caption text-muted">Live</div>
        </div>
        <div className="mt-12 space-y-12">
          {recentActivityDemo.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-12">
              <div className="text-body font-semibold">{a.text}</div>
              <div className="text-caption text-muted whitespace-nowrap">{a.time}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-16">
        <div className="flex items-center justify-between gap-12">
          <div className="text-subtitle font-semibold">Marketplace / trades</div>
          <div className="text-caption text-muted">{tradesDemo.length} active</div>
        </div>
        <div className="mt-12 space-y-12">
          {tradesDemo.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-bg p-12">
              <div className="flex items-center justify-between gap-12">
                <div className="text-body font-semibold">{t.with}</div>
                <div className="text-caption text-muted">{t.status}</div>
              </div>
              <div className="text-caption text-muted mt-8 leading-6">
                Offer: <span className="text-fg/90">{t.offer}</span>
              </div>
              <div className="text-caption text-muted mt-8 leading-6">
                Request: <span className="text-fg/90">{t.request}</span>
              </div>
              <div className="mt-12 flex justify-end">
                <Button variant="secondary" className="px-16 py-10" disabled={!isSignedIn}>
                  {isSignedIn ? 'Review' : 'Sign in'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-16">
        <div className="flex items-center justify-between gap-12">
          <div className="text-subtitle font-semibold">AI suggestions</div>
          <div className="text-caption text-muted">{isSignedIn ? 'personalized' : 'sign in'}</div>
        </div>
        <div className="mt-12 space-y-10">
          {suggestionsBusy ? (
            <>
              <SkeletonLine width="80%" />
              <SkeletonLine width="68%" />
              <SkeletonLine width="92%" />
            </>
          ) : suggestions?.length ? (
            suggestions.slice(0, 5).map((s, idx) => (
              <div key={`${s}-${idx}`} className="text-caption text-fg/90 leading-6">
                {s}
              </div>
            ))
          ) : (
            <div className="text-caption text-muted">
              {isSignedIn ? 'No suggestions yet.' : 'Sign in to see suggestions.'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <ShellLayout title="קהילת אספני הלגו" subtitle="Building Dreams Together" rightPanel={rightPanel}>
      <div className="space-y-16">
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] p-4 z-10">
          <div className="text-xl font-bold text-white">קהילת אספני הלגו</div>
          <div className="text-sm text-[#71767b] mt-0.5">Building Dreams Together</div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex rounded-full border border-[#2f3336] overflow-hidden bg-[#16181c]">
            <button
              type="button"
              className={`relative px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                activeTab === 'collections'
                  ? 'bg-[#1d9bf0] text-white'
                  : 'bg-transparent text-[#71767b] hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('collections')}
            >
              אוספים
            </button>
            <button
              type="button"
              className={`relative px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                activeTab === 'activity'
                  ? 'bg-[#1d9bf0] text-white'
                  : 'bg-transparent text-[#71767b] hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              בניות
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={!isSignedIn || activeTab !== 'activity'}
            className="px-4 py-1.5 text-[13px] font-semibold rounded-full"
            style={{
              background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)',
              boxShadow: '0 2px 8px rgba(29,155,240,0.25)'
            }}
          >
            + שתף בניה
          </Button>
        </div>

        {activeTab === 'collections' ? (
          <div className="space-y-16">
            <Card className="p-16">
              <div className="flex items-center justify-between gap-12">
                <div>
                  <div className="text-title font-semibold">Your collections</div>
                  <div className="text-caption text-muted mt-6">Value, sets count, and collector intent.</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1d9bf0]/10 border border-[#1d9bf0]/30 rounded-lg text-sm font-semibold text-[#1d9bf0] mt-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                    </svg>
                    340+ סטים באוסף
                  </div>
                </div>
                <div className="text-caption text-muted whitespace-nowrap">Updated today</div>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-16">
                {collectionsDemo.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border bg-bg p-16 transition hover:bg-white/2"
                  >
                    <div className="flex items-center justify-between gap-12">
                      <div className="text-body font-semibold">{c.name}</div>
                      <RarityBadge rarity={c.rarity} />
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-12">
                      <div>
                        <div className="text-caption text-muted">Value</div>
                        <div className="text-body font-semibold mt-4">{formatMoney(c.value)}</div>
                      </div>
                      <div>
                        <div className="text-caption text-muted">Sets</div>
                        <div className="text-body font-semibold mt-4">{c.sets}</div>
                      </div>
                    </div>
                    <div className="text-caption text-muted mt-12 leading-6">{c.note}</div>
                    <div className="mt-14">
                      <div className="text-caption text-muted font-semibold">Signal</div>
                      <div className="mt-8 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-accent/30 rounded-full"
                          style={{ width: `${Math.min(100, 30 + c.sets)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-16">
              <div className="flex items-center justify-between gap-12">
                <div className="text-subtitle font-semibold">Collection activity</div>
                <div className="text-caption text-muted">Last 48 hours</div>
              </div>
              <div className="mt-12 space-y-12">
                {recentActivityDemo.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-12">
                    <div className="text-body font-semibold">{a.text}</div>
                    <div className="text-caption text-muted whitespace-nowrap">{a.time}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-16">
            <Card className="p-16">
              <div className="flex items-center justify-between gap-12 flex-wrap">
                <div>
                  <div className="text-subtitle font-semibold">Smart search</div>
                  <div className="text-caption text-muted mt-6">
                    Ask in natural language and see curated relevance.
                  </div>
                </div>

                <div className="flex gap-12 items-center w-full sm:w-auto">
                  <Input
                    label={null}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search: 'modular towers with trackable value'..."
                    className="w-[min(520px,100%)]"
                  />
                  <Button
                    variant="secondary"
                    className="px-16 py-10"
                    onClick={() => runSearch(searchQ)}
                    disabled={!searchQ.trim() || searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </Card>

            {loading ? (
              <div className="space-y-16">
                <div className="rounded-lg border border-border bg-bg p-16">
                  <div className="flex items-start gap-12">
                    <div className="rounded-lg border border-border bg-white/5 w-44 h-44" />
                    <div className="flex-1 space-y-12">
                      <SkeletonLine width="60%" />
                      <SkeletonLine width="85%" />
                      <SkeletonLine width="92%" />
                    </div>
                  </div>
                </div>
              </div>
            ) : loadError ? (
              <div className="text-caption text-red-400">{loadError}</div>
            ) : null}

            {displayedActivity?.length ? (
              <div className="space-y-16">
                {displayedActivity.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    currentUserId={currentUserId}
                    onToggleLike={onToggleLike}
                    matchReason={p.matchReason}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="rounded-lg border border-border bg-bg p-24 text-caption text-muted">
                No activity found.
              </div>
            ) : null}
          </div>
        )}

        <Modal
          open={createOpen}
          title="שתף בניה"
          onClose={() => {
            if (!createBusy) setCreateOpen(false);
          }}
          footer={
            <div className="flex items-center justify-end gap-12">
              <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createBusy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onCreatePost}
                disabled={createBusy || !newText.trim()}
              >
                {createBusy ? 'Posting...' : 'Post'}
              </Button>
            </div>
          }
        >
          <div className="space-y-16">
            <Input
              label="Text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Share your LEGO build..."
              as="textarea"
            />
            <div className="space-y-6">
              <div className="text-caption text-muted font-medium">Optional image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body"
              />
              <div className="text-caption text-muted">Leave empty for text-only posts.</div>
            </div>
          </div>
        </Modal>
      </div>
    </ShellLayout>
  );
}

