import React, { useEffect, useMemo, useRef, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import PostCard from '../components/posts/PostCard';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

function formatCount(n) {
  if (typeof n !== 'number') return 0;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}

export default function LegacyFeedPage() {
  const { accessToken, user, logout } = useAuth();
  const userId = user?.id || user?._id || '';

  const [activeTab, setActiveTab] = useState('feed'); // feed | builds
  const [posts, setPosts] = useState([]);
  const [totalBusy, setTotalBusy] = useState(false);

  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [createText, setCreateText] = useState('');
  const [createImage, setCreateImage] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);
  const fileInputRef = useRef(null);

  const [whoToFollow, setWhoToFollow] = useState([]);
  const [whoBusy, setWhoBusy] = useState(false);

  const displayedPosts = searching ? searchResults : posts;

  const rightPanel = useMemo(() => {
    return (
      <div className="space-y-16">
        <Card className="p-16">
          <div className="flex items-center justify-between gap-12">
            <div className="space-y-4">
              <div className="text-subtitle font-semibold">Search</div>
              <div className="text-caption text-muted">Find builds, collectors, ideas.</div>
            </div>
            <div className="text-caption text-muted">Tip</div>
          </div>

          <div className="mt-12 space-y-10">
            <Input
              label={null}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search: modular towers, micro scenes..."
              className="w-full"
            />
            <Button
              variant="secondary"
              className="w-full px-16 py-10"
              onClick={() => {
                if (!searchQ.trim()) return;
                (async () => {
                  setSearching(true);
                  try {
                    const data = await api.searchPosts(searchQ.trim());
                    setSearchResults(data.results || []);
                  } catch {
                    setSearchResults([]);
                  } finally {
                    setSearching(false);
                  }
                })();
              }}
              disabled={searching || !searchQ.trim()}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </Card>

        <Card className="p-16">
          <div className="flex items-center justify-between gap-12">
            <div className="text-subtitle font-semibold">מי לעקוב</div>
            <div className="text-caption text-muted">Powered</div>
          </div>

          <div className="mt-12 space-y-12">
            {whoBusy ? (
              <div className="text-caption text-muted">Loading...</div>
            ) : whoToFollow?.length ? (
              whoToFollow.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-12">
                  <div className="flex items-center gap-12 min-w-0">
                    <Avatar name={u.username || u.email} imageUrl={u.profileImage} size={40} />
                    <div className="min-w-0">
                      <div className="text-body font-semibold truncate">{u.username || u.email}</div>
                      <div className="text-caption text-muted truncate">{u.username ? `@${u.username}` : ''}</div>
                    </div>
                  </div>
                  <Button
                    variant={u.isFollowing ? 'secondary' : 'primary'}
                    className="px-16 py-10 whitespace-nowrap"
                    disabled={!accessToken}
                    onClick={async () => {
                      if (!accessToken) return;
                      const targetUserId = u.id?.toString?.() || '';
                      if (!targetUserId) return;
                      try {
                        await api.toggleFollow({ accessToken, targetUserId });
                        setWhoToFollow((prev) =>
                          prev.map((x) =>
                            x.id?.toString?.() === targetUserId ? { ...x, isFollowing: !x.isFollowing } : x
                          )
                        );
                      } catch {
                        // silent
                      }
                    }}
                  >
                    {u.isFollowing ? 'עוקב' : 'לעקוב'}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-caption text-muted">No suggestions yet.</div>
            )}
          </div>
        </Card>

        {!accessToken ? (
          <Card className="p-16">
            <div className="text-body font-semibold">Sign in to post.</div>
            <div className="text-caption text-muted mt-6">Premium builds, premium follow.</div>
            <div className="mt-14">
              <Button variant="primary" className="w-full" onClick={() => (window.location.href = '/auth')}>
                Continue
              </Button>
            </div>
          </Card>
        ) : null}

        {accessToken ? (
          <Card className="p-16">
            <div className="flex items-center gap-12">
              <Avatar name={user?.username || user?.email} imageUrl={user?.profileImage} size={44} />
              <div className="min-w-0">
                <div className="text-body font-semibold truncate">{user?.username || user?.email}</div>
                <div className="text-caption text-muted truncate">Collector</div>
              </div>
            </div>
            <div className="mt-14">
              <Button variant="danger" className="w-full" onClick={() => { logout(); window.location.href = '/auth'; }}>
                Sign out
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    );
  }, [accessToken, logout, searchQ, searching, whoBusy, whoToFollow, user]);

  async function loadPosts() {
    setTotalBusy(true);
    try {
      const data = await api.getPosts({ page: 1, limit: 10 });
      setPosts(data.posts || []);
      setSearchResults([]);
      setSearching(false);
    } finally {
      setTotalBusy(false);
    }
  }

  async function loadWhoToFollow() {
    if (!accessToken || !userId) return;
    setWhoBusy(true);
    try {
      const followers = await api.getFollowers({ accessToken, targetUserId: userId });
      setWhoToFollow((followers || []).slice(0, 4));
    } catch {
      setWhoToFollow([]);
    } finally {
      setWhoBusy(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    loadWhoToFollow();
  }, [accessToken, userId]);

  async function onToggleLike(postId) {
    if (!accessToken) return;
    try {
      const data = await api.toggleLike({ accessToken, postId });
      const updated = data.post;
      setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setSearchResults((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch {
      // silent
    }
  }

  async function onCreatePost() {
    if (!accessToken) return;
    const text = createText.trim();
    if (!text) return;
    setCreateBusy(true);
    try {
      await api.createPost({ accessToken, text, imageFile: createImage });
      setCreateText('');
      setCreateImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadPosts();
    } finally {
      setCreateBusy(false);
    }
  }

  if (!accessToken) {
    // Still show layout so the design is consistent.
  }

  return (
    <ShellLayout title="BrickShare" subtitle="Share Your Passion" rightPanel={rightPanel} showTopbar={false}>
      <div className="space-y-16">
        <div className="rounded-lg border border-border bg-bg/70 p-16 feed-header sticky top-0 z-20 backdrop-blur">
          <div className="flex items-start justify-between gap-16 flex-wrap">
            <div className="space-y-6">
              <div className="text-subtitle font-semibold">BrickShare</div>
              <div className="text-caption text-muted">LEGO/BrickShare energy, premium builds.</div>
            </div>

            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                className={`px-16 py-10 text-body font-semibold transition ${
                  activeTab === 'feed' ? 'bg-white/5 text-fg' : 'bg-transparent text-fg/90 hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('feed')}
              >
                הפיד
              </button>
              <button
                type="button"
                className={`px-16 py-10 text-body font-semibold transition ${
                  activeTab === 'builds'
                    ? 'bg-white/5 text-fg'
                    : 'bg-transparent text-fg/90 hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('builds')}
              >
                בניות
              </button>
            </div>
          </div>

          <div className="mt-16 post-composer rounded-lg border border-border bg-bg p-16">
            <div className="flex items-start gap-12">
              <Avatar
                name={user?.username || user?.email || 'You'}
                imageUrl={user?.profileImage}
                size={42}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-10 flex-wrap">
                  <div className="text-caption text-muted">שתף בניה חדשה</div>
                  <div className="h-1 w-1 rounded-full bg-border hidden sm:block" />
                  <div className="text-caption text-muted">עדכן סטטוס + הוסף תמונה</div>
                </div>

                <textarea
                  className="mt-10 w-full min-h-[80px] resize-none rounded-lg border border-border bg-transparent px-12 py-10 text-body outline-none focus:ring-2 focus:ring-accent"
                  value={createText}
                  placeholder="מה בנית? מה מיוחד? מה למדת?"
                  onChange={(e) => setCreateText(e.target.value)}
                  disabled={!accessToken}
                />

                <div className="mt-12 flex items-center justify-between gap-12">
                  <div className="flex items-center gap-10">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setCreateImage(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="secondary"
                      className="px-16 py-10"
                      disabled={!accessToken}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      הוסף תמונה
                    </Button>

                    {createImage ? (
                      <div className="text-caption text-muted truncate max-w-[220px]">
                        {createImage.name}
                      </div>
                    ) : (
                      <div className="text-caption text-muted">PNG / JPG</div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    className="px-16 py-10"
                    disabled={!accessToken || createBusy || !createText.trim()}
                    onClick={onCreatePost}
                  >
                    {createBusy ? 'מפרסם...' : 'פרסם'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {totalBusy ? (
            <div className="rounded-lg border border-border bg-bg p-16 text-caption text-muted">Loading posts...</div>
          ) : displayedPosts?.length ? (
            displayedPosts.map((p) => (
              <PostCard
                key={p._id}
                post={p}
                currentUserId={userId}
                onToggleLike={onToggleLike}
              />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-bg p-16 text-caption text-muted">
              No posts yet.
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}

