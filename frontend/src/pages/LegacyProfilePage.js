import React, { useEffect, useMemo, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PostCard from '../components/posts/PostCard';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`px-16 py-10 text-body font-semibold transition rounded-lg border ${
        active ? 'bg-white/5 border-border text-fg' : 'bg-transparent border-border/70 text-fg/90 hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function LegacyProfilePage() {
  const { accessToken, user, logout } = useAuth();
  const userId = user?.id || user?._id || '';

  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');

  const [posts, setPosts] = useState([]);
  const [postsBusy, setPostsBusy] = useState(false);

  const [profileTab, setProfileTab] = useState('builds'); // builds | collection | wishlist

  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState('followers'); // followers | following
  const [followersList, setFollowersList] = useState([]);
  const [followersBusy, setFollowersBusy] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    setEditUsername(user?.username || '');
  }, [user]);

  useEffect(() => {
    async function loadPosts() {
      if (!userId) return;
      setPostsBusy(true);
      try {
        const items = await api.getUserPosts(userId);
        setPosts(items || []);
      } finally {
        setPostsBusy(false);
      }
    }
    loadPosts();
  }, [userId]);

  useEffect(() => {
    if (!accessToken || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [followers, following] = await Promise.all([
          api.getFollowers({ accessToken, targetUserId: userId }),
          api.getFollowing({ accessToken, targetUserId: userId })
        ]);
        if (cancelled) return;
        setFollowersCount((followers || []).length);
        setFollowingCount((following || []).length);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  async function loadFollowersList(nextTab) {
    if (!accessToken || !userId) return;
    setFollowersBusy(true);
    try {
      if (nextTab === 'followers') {
        const list = await api.getFollowers({ accessToken, targetUserId: userId });
        setFollowersList(list || []);
      } else {
        const list = await api.getFollowing({ accessToken, targetUserId: userId });
        setFollowersList(list || []);
      }
    } catch {
      setFollowersList([]);
    } finally {
      setFollowersBusy(false);
    }
  }

  const rightPanel = useMemo(() => {
    return (
      <div className="space-y-16">
        <div className="rounded-lg border border-border bg-bg p-16">
          <div className="text-subtitle font-semibold">Account</div>
          <div className="text-caption text-muted mt-6">Premium social + builds.</div>
          <div className="mt-12 text-body font-semibold">{user?.username || '—'}</div>
          <div className="text-caption text-muted mt-4">{user?.email || ''}</div>
          <div className="mt-14">
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                logout();
                window.location.href = '/auth';
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }, [logout, user]);

  if (!accessToken || !user) {
    return (
      <ShellLayout title="Profile" subtitle="Sign in to view your account." rightPanel={null} showTopbar>
        <div className="rounded-lg border border-border bg-bg p-24 text-caption text-muted">Please sign in.</div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout title="Profile" subtitle="" rightPanel={rightPanel} showTopbar={false}>
      <div className="space-y-16">
        <div className="rounded-lg border border-border bg-bg overflow-hidden">
          <div className="h-48 relative">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                opacity: 0.18
              }}
            />
          </div>

          <div className="p-16">
            <div className="flex items-start gap-16 flex-wrap">
              <div className="relative">
                <Avatar
                  name={user?.username || user?.email}
                  imageUrl={user?.profileImage}
                  size={92}
                />
              </div>

              <div className="min-w-[240px] flex-1">
                <div className="text-title font-semibold">{user.username || user.email}</div>
                <div className="text-caption text-muted mt-6">@{(user.username || user.email || '').replace(/\s+/g, '')}</div>
                <div className="text-caption text-muted mt-12 max-w-[520px] leading-6">
                  Collector-grade builds. Brick by brick, passion to precision.
                </div>

                <div className="mt-14 flex items-center gap-12 flex-wrap">
                  <Button variant="secondary" className="px-16 py-10" onClick={() => setEditOpen(true)}>
                    עריכת פרופיל
                  </Button>

                  <Button
                    variant="ghost"
                    className="px-16 py-10"
                    onClick={() => {
                      setFollowersTab('followers');
                      setFollowersModalOpen(true);
                      loadFollowersList('followers');
                    }}
                  >
                    עוקבים / עוקב
                  </Button>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <div className="grid grid-cols-2 gap-12">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-bg p-12 text-left hover:bg-white/2 transition"
                    onClick={() => {
                      setFollowersTab('followers');
                      setFollowersModalOpen(true);
                      loadFollowersList('followers');
                    }}
                  >
                    <div className="text-caption text-muted">Followers</div>
                    <div className="text-body font-semibold mt-6">{followersCount}</div>
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-border bg-bg p-12 text-left hover:bg-white/2 transition"
                    onClick={() => {
                      setFollowersTab('following');
                      setFollowersModalOpen(true);
                      loadFollowersList('following');
                    }}
                  >
                    <div className="text-caption text-muted">Following</div>
                    <div className="text-body font-semibold mt-6">{followingCount}</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-16 flex items-center justify-between gap-12 flex-wrap">
              <div className="flex items-center gap-12">
                <TabButton active={profileTab === 'builds'} onClick={() => setProfileTab('builds')}>
                  בניות
                </TabButton>
                <TabButton active={profileTab === 'collection'} onClick={() => setProfileTab('collection')}>
                  אוסף
                </TabButton>
                <TabButton active={profileTab === 'wishlist'} onClick={() => setProfileTab('wishlist')}>
                  רשימת משאלות
                </TabButton>
              </div>
              <div className="text-caption text-muted">Premium status</div>
            </div>
          </div>
        </div>

        <div className="space-y-16">
          {profileTab === 'builds' ? (
            postsBusy ? (
              <div className="rounded-lg border border-border bg-bg p-16 text-caption text-muted">Loading posts...</div>
            ) : posts?.length ? (
              <div className="space-y-12">
                {posts.map((p) => (
                  <PostCard key={p._id} post={p} currentUserId={userId} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-bg p-16 text-caption text-muted">No posts yet.</div>
            )
          ) : (
            <div className="rounded-lg border border-border bg-bg p-16 text-caption text-muted">
              This section is currently placeholder for the exact HTML build.
            </div>
          )}
        </div>

        <Modal
          open={editOpen}
          onClose={() => {
            if (!editBusy) setEditOpen(false);
          }}
          title="עריכת פרופיל"
        >
          <div className="space-y-12">
            <Input
              label="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="johndoe"
            />

            <div className="space-y-6">
              <div className="text-caption text-muted font-medium">Profile image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body"
              />
            </div>

            {editError ? <div className="text-caption text-red-400">{editError}</div> : null}

            <div className="flex items-center justify-end gap-12 pt-4">
              <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={editBusy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!accessToken || !userId) return;
                  const username = editUsername.trim();
                  if (!username) return;
                  setEditBusy(true);
                  setEditError('');
                  try {
                    await api.updateProfile({
                      accessToken,
                      userId,
                      username,
                      profileImageFile: editImageFile
                    });
                    setEditOpen(false);
                    window.location.reload();
                  } catch (e) {
                    setEditError(e?.response?.data?.message || e?.message || 'Failed to update profile');
                  } finally {
                    setEditBusy(false);
                  }
                }}
                disabled={editBusy || !editUsername.trim()}
              >
                {editBusy ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={followersModalOpen}
          onClose={() => {
            if (!followersBusy) setFollowersModalOpen(false);
          }}
          title={followersTab === 'followers' ? 'עוקבים' : 'עוקב'}
        >
          <div className="space-y-12">
            <div className="flex items-center gap-12 flex-wrap">
              <TabButton
                active={followersTab === 'followers'}
                onClick={() => {
                  setFollowersTab('followers');
                  loadFollowersList('followers');
                }}
              >
                עוקבים
              </TabButton>
              <TabButton
                active={followersTab === 'following'}
                onClick={() => {
                  setFollowersTab('following');
                  loadFollowersList('following');
                }}
              >
                עוקב
              </TabButton>
            </div>

            {followersBusy ? (
              <div className="text-caption text-muted">Loading...</div>
            ) : followersList?.length ? (
              <div className="space-y-12">
                {followersList.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-12">
                    <div className="flex items-center gap-12 min-w-0">
                      <Avatar name={u.username || u.email} imageUrl={u.profileImage} size={44} />
                      <div className="min-w-0">
                        <div className="text-body font-semibold truncate">{u.username || u.email}</div>
                        <div className="text-caption text-muted truncate">
                          {u.username ? `@${u.username}` : ''}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={u.isFollowing ? 'secondary' : 'primary'}
                      className="px-16 py-10 whitespace-nowrap"
                      onClick={async () => {
                        try {
                          await api.toggleFollow({ accessToken, targetUserId: u.id?.toString?.() || '' });
                          setFollowersList((prev) =>
                            prev.map((x) =>
                              x.id?.toString?.() === u.id?.toString?.()
                                ? { ...x, isFollowing: !x.isFollowing }
                                : x
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
                ))}
              </div>
            ) : (
              <div className="text-caption text-muted">No users found.</div>
            )}
          </div>
        </Modal>
      </div>
    </ShellLayout>
  );
}

