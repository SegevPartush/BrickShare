import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import CreateBuildModal from '../components/posts/CreateBuildModal';
import PostCard from '../components/posts/PostCard';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import * as api from '../services/api';

function SkeletonPost() {
  return (
    <div className="rounded-2xl border border-[#2f3336]/60 bg-[#0c0d10]/90 p-4 shadow-card animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded-lg w-1/3" />
          <div className="h-4 bg-white/10 rounded-lg w-full" />
          <div className="h-4 bg-white/10 rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Modal לעריכת פרופיל - מאפשר שינוי שם משתמש ותמונת פרופיל
function EditProfileModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const { accessToken } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!accessToken || !user) return;
    setBusy(true);
    setError('');
    try {
      await api.updateProfile({ accessToken, userId: user.id || user._id || '', username: username.trim(), profileImageFile: imageFile });
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[#16181c] border border-[#2f3336] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
          <button onClick={onClose} className="text-[15px] text-white font-medium">Cancel</button>
          <div className="font-extrabold text-[17px]">Edit Profile</div>
          <button onClick={save} disabled={busy || !username.trim()} className="text-[15px] font-bold text-[#1d9bf0] disabled:opacity-40">
            {busy ? 'Saving...' : 'Done'}
          </button>
        </div>
        <div className="px-4 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={username || user?.email} imageUrl={user?.profileImage} size={80} />
            <label className="text-[14px] font-bold text-[#1d9bf0] cursor-pointer hover:underline">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
            {imageFile && <span className="text-[12px] text-[#71767b]">{imageFile.name}</span>}
          </div>
          <div className="border-b border-[#2f3336] pb-4">
            <label className="block text-[12px] font-semibold text-[#1d9bf0] mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-transparent text-[16px] text-white outline-none placeholder-[#4a4f55]"
            />
          </div>
          {error && <div className="text-[13px] text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, accessToken, refreshUser } = useAuth();
  const { userId: paramUserId } = useParams<{ userId?: string }>();

  // Viewing own profile if no param or param matches current user
  const ownId = user?.id || user?._id || '';
  const viewingUserId = paramUserId || ownId;
  const isOwnProfile = !paramUserId || paramUserId === ownId;
  const currentUserId = ownId;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsBusy, setPostsBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState<'builds' | 'liked'>('builds');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length ?? 0), 0);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [posts]);

  async function handlePostLike(postId: string) {
    if (!accessToken) return;
    try {
      const data = await api.toggleLike({ accessToken, postId });
      const updated = data.post;
      setPosts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated, likes: updated.likes } : p)));
    } catch { /* silent */ }
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }

  function handlePostEdited(updated: { _id: string; text?: string; image?: string; title?: string; likes?: any[]; commentCount?: number }) {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
  }

  useEffect(() => {
    if (!viewingUserId) return;

    // Load profile user data
    api.getUser(viewingUserId)
      .then((u: any) => {
        setProfileUser(u);
        setFollowersCount(u.followersCount ?? 0);
        setFollowingCount(u.followingCount ?? 0);
      })
      .catch(() => {
        if (isOwnProfile && user) setProfileUser(user);
      });

    // Load posts
    setPostsBusy(true);
    api.getUserPosts(viewingUserId)
      .then((raw: Post[]) =>
        setPosts((raw || []).map((p) => ({ ...p, likes: p.likes ?? [] }) as Post))
      )
      .catch(() => setPosts([]))
      .finally(() => setPostsBusy(false));
  }, [viewingUserId, accessToken, isOwnProfile, user]);

  // האם אני עוקבת אחרי הפרופיל המוצג — מהשרת, נשאר אחרי ריענון
  useEffect(() => {
    if (isOwnProfile || !viewingUserId) return;
    if (!accessToken) {
      setIsFollowing(false);
      return;
    }
    if (user?.following !== undefined) {
      setIsFollowing(user.following.map(String).includes(String(viewingUserId)));
      return;
    }
    if (!ownId) return;
    api.getFollowers({ accessToken, targetUserId: viewingUserId })
      .then((followers: any[]) => {
        setIsFollowing(
          followers.some((f: any) => String(f.id || f._id) === String(ownId))
        );
      })
      .catch(() => {});
  }, [viewingUserId, accessToken, isOwnProfile, ownId, user?.following]);

  // Keep profileUser in sync after editing own profile
  useEffect(() => {
    if (isOwnProfile && user) setProfileUser(user);
  }, [user, isOwnProfile]);

  async function handleToggleFollow() {
    if (!accessToken) { window.location.href = '/login'; return; }
    setFollowBusy(true);
    try {
      const data = await api.toggleFollow({ accessToken, targetUserId: viewingUserId });
      setIsFollowing(!!data.following);
      setFollowersCount((prev) => (data.following ? prev + 1 : Math.max(0, prev - 1)));
      await refreshUser();
    } catch { /* silent */ }
    finally { setFollowBusy(false); }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setCoverBusy(true);
    try {
      const updated = await api.updateProfile({ accessToken, userId: ownId, coverImageFile: file });
      setProfileUser((prev: any) => ({ ...prev, coverImage: updated.coverImage }));
    } catch { /* silent */ }
    finally { setCoverBusy(false); if (coverInputRef.current) coverInputRef.current.value = ''; }
  }

  if (!user) {
    return (
      <ShellLayout title="Profile">
        <div className="flex flex-col items-center justify-center py-24 px-4 text-[#71767b]">
          <div className="text-[22px] font-bold text-white mb-2">Sign in required</div>
          <div className="text-[15px] mb-6">Please sign in to view your builder profile</div>
          <button onClick={() => { window.location.href = '/login'; }}
            className="px-8 py-3 rounded-full font-bold text-white text-[15px]"
            style={{ background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}>
            Sign In
          </button>
        </div>
      </ShellLayout>
    );
  }

  const displayName = (profileUser?.username || profileUser?.email?.split('@')[0]) ?? 'User';
  const handle = '@' + displayName.toLowerCase().replace(/\s+/g, '_');

  return (
    <ShellLayout title="Profile">
      {/* ── Profile header ── */}
      <div className="border-b border-[#2f3336]">
        {/* Banner */}
        <div className="h-32 md:h-48 relative overflow-hidden group"
          style={profileUser?.coverImage ? {} : { background: 'linear-gradient(135deg, #0f2027 0%, #1a1a2e 40%, #16213e 70%, #0f2027 100%)' }}>

          {/* Cover photo */}
          {profileUser?.coverImage ? (
            <img
              src={profileUser.coverImage}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(255,255,255,0.15) 14px, rgba(255,255,255,0.15) 15px),
                repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(255,255,255,0.15) 14px, rgba(255,255,255,0.15) 15px)`
            }} />
          )}

          {/* Dark overlay on hover for own profile */}
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <label className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-2 bg-black/60 backdrop-blur text-white text-[14px] font-semibold px-4 py-2 rounded-full hover:bg-black/80 transition-colors">
                {coverBusy ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Change Cover
                  </>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={coverBusy}
                />
              </label>
            </div>
          )}

          {/* Settings / logout menu */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setShowLogout(v => !v)}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            {showLogout && (
              <div className="absolute top-10 right-0 w-44 bg-[#16181c] border border-[#2f3336] rounded-2xl shadow-2xl overflow-hidden z-10">
                <button onClick={() => { logout(); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-red-400 hover:bg-red-400/10 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar + actions row */}
        <div className="px-4 md:px-6">
          <div className="flex items-end justify-between -mt-12 md:-mt-14 mb-4">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-black overflow-hidden bg-[#16181c]">
                <Avatar name={displayName} imageUrl={profileUser?.profileImage} size={112} />
              </div>
            </div>

            <div className="flex items-center gap-2 pb-1">
              {isOwnProfile ? (
                <>
                  <button onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[14px] text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Build
                  </button>
                  <button onClick={() => setEditOpen(true)}
                    className="px-4 py-2 rounded-full border border-[#2f3336] text-[14px] font-bold text-white hover:bg-white/5 transition-colors">
                    Edit Profile
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all ${
                    isFollowing
                      ? 'border border-[#2f3336] text-white hover:border-red-500 hover:text-red-400'
                      : 'text-black hover:opacity-90'
                  }`}
                  style={isFollowing ? {} : { background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}
                >
                  {followBusy ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* שם + handle */}
          <div className="mb-3">
            <div className="font-extrabold text-[20px] text-white">{displayName}</div>
            <div className="text-[14px] text-[#71767b] mt-0.5">{handle}</div>
          </div>

          {/* Stats row */}
          <div className="flex gap-5 md:gap-8 py-3 border-t border-[#2f3336]">
            {[
              { label: 'Builds', value: posts.length },
              { label: 'Followers', value: followersCount.toLocaleString() },
              { label: 'Following', value: followingCount.toLocaleString() },
              { label: 'Total Likes', value: totalLikes.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-extrabold text-[18px] text-white">{s.value}</div>
                <div className="text-[12px] text-[#71767b] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#2f3336]">
          {([
            { key: 'builds', label: 'My Builds', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
            { key: 'liked', label: 'Liked', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-semibold relative transition-colors ${activeTab === key ? 'text-white' : 'text-[#71767b] hover:bg-white/[0.03]'}`}>
              {icon}{label}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8]" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts: scrollable timeline (newest first) — same for both tabs until Liked is implemented ── */}
      {postsBusy ? (
        <div className="px-3 sm:px-4 space-y-3 pt-2 pb-2">
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-[#71767b]">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)', opacity: 0.15 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div className="text-[20px] font-bold text-white mb-2">No builds yet</div>
          <div className="text-[15px] mb-6 text-center max-w-[280px]">Share your first LEGO creation with the community!</div>
          {isOwnProfile && (
            <button onClick={() => setCreateOpen(true)}
              className="px-8 py-3 rounded-full font-bold text-white text-[15px]"
              type="button"
              style={{ background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}>
              Share Your First Build
            </button>
          )}
        </div>
      ) : (
        <div className="px-3 sm:px-4 space-y-3 pt-2 pb-4">
          {sortedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={ownId}
              commentsBehavior="thread"
              onToggleLike={handlePostLike}
              onDeleted={handlePostDeleted}
              onEdited={handlePostEdited}
            />
          ))}
        </div>
      )}
      {editOpen && <EditProfileModal user={profileUser ?? user} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); window.location.reload(); }} />}
      {createOpen && <CreateBuildModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); window.location.reload(); }} />}

      {/* Click outside to close logout menu */}
      {showLogout && <div className="fixed inset-0 z-[5]" onClick={() => setShowLogout(false)} />}
    </ShellLayout>
  );
}
