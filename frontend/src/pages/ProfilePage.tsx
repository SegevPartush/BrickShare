import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import CreateBuildModal from '../components/posts/CreateBuildModal';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

interface ProfilePost {
  _id: string;
  title?: string;
  text: string;
  image?: string;
  likes?: any[];
  commentCount?: number;
  createdAt?: string;
}

// Full-screen post detail modal
function BuildDetailModal({ post, onClose, onDeleted, onEdited, isOwner }: {
  post: ProfilePost;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onEdited?: (id: string, text: string) => void;
  isOwner?: boolean;
}) {
  const { accessToken } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editBusy, setEditBusy] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const [title, ...rest] = post.text?.split('\n\n') ?? [''];
  const hasTitle = post.title || (post.text?.startsWith(title) && rest.length > 0);
  const displayTitle = post.title || (hasTitle ? title : '');
  const displayBody  = post.title ? post.text : (rest.join('\n\n') || post.text);

  async function handleDelete() {
    if (!accessToken) return;
    if (!window.confirm('למחוק את הפוסט?')) return;
    try {
      await api.deletePost({ accessToken, postId: post._id });
      onDeleted?.(post._id);
      onClose();
    } catch { /* silent */ }
  }

  async function handleSaveEdit() {
    if (!accessToken || !editText.trim()) return;
    setEditBusy(true);
    try {
      await api.updatePost({ accessToken, postId: post._id, text: editText.trim() });
      onEdited?.(post._id, editText.trim());
      setEditMode(false);
    } catch { /* silent */ }
    finally { setEditBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[900px] bg-[#16181c] border border-[#2f3336] rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-2xl">
        {/* Image */}
        <div className="md:w-[55%] bg-[#0a0a0a] flex items-center justify-center min-h-[260px]">
          {post.image ? (
            <img src={post.image} alt={displayTitle || 'Build'} className="w-full h-full object-contain max-h-[80vh]" />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#71767b] p-8 h-full">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-3">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span className="text-[15px]">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="md:w-[45%] flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f3336] shrink-0">
            {displayTitle ? (
              <div className="font-bold text-[16px] text-white truncate pr-2">{displayTitle}</div>
            ) : <div />}
            <div className="flex items-center gap-1 shrink-0">
              {isOwner && (
                <>
                  <button
                    onClick={() => { setEditText(post.text || ''); setEditMode(true); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
                    title="Edit"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#71767b] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {editMode ? (
              <div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  dir="auto"
                  rows={5}
                  className="w-full bg-[#202327] border border-[#1d9bf0] rounded-xl px-3 py-2 text-[15px] text-white outline-none resize-none"
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveEdit} disabled={editBusy || !editText.trim()}
                    className="px-4 py-1.5 rounded-full bg-[#1d9bf0] text-white text-[13px] font-bold disabled:opacity-40 hover:bg-[#1a8cd8] transition-colors">
                    {editBusy ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditMode(false)}
                    className="px-4 py-1.5 rounded-full border border-[#2f3336] text-white text-[13px] font-bold hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              displayBody && <p className="text-[15px] leading-relaxed text-[#e7e9ea]">{displayBody}</p>
            )}
          </div>

          <div className="border-t border-[#2f3336] px-5 py-3 flex items-center gap-5 text-[#71767b] text-[14px] shrink-0">
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {post.likes?.length ?? 0} likes
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {post.commentCount ?? 0} comments
            </span>
          </div>
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
  const { user, logout, accessToken } = useAuth();
  const { userId: paramUserId } = useParams<{ userId?: string }>();

  // Viewing own profile if no param or param matches current user
  const ownId = user?.id || user?._id || '';
  const viewingUserId = paramUserId || ownId;
  const isOwnProfile = !paramUserId || paramUserId === ownId;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [postsBusy, setPostsBusy] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);
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
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setPostsBusy(false));

    // Check if current user follows this profile
    if (!isOwnProfile && accessToken) {
      api.getFollowers({ accessToken, targetUserId: viewingUserId })
        .then((followers: any[]) => {
          setIsFollowing(followers.some((f: any) => (f.id || f._id) === ownId));
        })
        .catch(() => {});
    }
  }, [viewingUserId, accessToken]);

  // Keep profileUser in sync after editing own profile
  useEffect(() => {
    if (isOwnProfile && user) setProfileUser(user);
  }, [user, isOwnProfile]);

  async function handleToggleFollow() {
    if (!accessToken) { window.location.href = '/login'; return; }
    setFollowBusy(true);
    try {
      await api.toggleFollow({ accessToken, targetUserId: viewingUserId });
      setIsFollowing(prev => !prev);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
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

      {/* ── Builds grid ── */}
      {postsBusy ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1 mt-1">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-lg" />)}
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
          <button onClick={() => setCreateOpen(true)}
            className="px-8 py-3 rounded-full font-bold text-white text-[15px]"
            style={{ background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)' }}>
            Share Your First Build
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1 mt-1">
          {posts.map(post => {
            const [titleLine] = post.text?.split('\n\n') ?? [''];
            const displayTitle = post.title || (post.text?.includes('\n\n') ? titleLine : '');
            return (
              <button key={post._id} onClick={() => setSelectedPost(post)}
                className="relative aspect-square bg-[#16181c] overflow-hidden rounded-lg group border border-[#2f3336]">
                {post.image ? (
                  <img src={post.image} alt={displayTitle || 'Build'} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c1f23] text-[#71767b] gap-2 p-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    {displayTitle && <div className="text-[11px] text-center text-white/70 line-clamp-2">{displayTitle}</div>}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  {displayTitle && <div className="text-[12px] font-bold text-white text-center line-clamp-2">{displayTitle}</div>}
                  <div className="flex items-center gap-4 text-white font-bold text-[13px]">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {post.likes?.length ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      {post.commentCount ?? 0}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedPost && (
        <BuildDetailModal
          post={selectedPost}
          isOwner={isOwnProfile}
          onClose={() => setSelectedPost(null)}
          onDeleted={(id) => { setPosts(prev => prev.filter(p => p._id !== id)); setSelectedPost(null); }}
          onEdited={(id, text) => { setPosts(prev => prev.map(p => p._id === id ? { ...p, text } : p)); setSelectedPost(prev => prev ? { ...prev, text } : null); }}
        />
      )}
      {editOpen && <EditProfileModal user={profileUser ?? user} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); window.location.reload(); }} />}
      {createOpen && <CreateBuildModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); window.location.reload(); }} />}

      {/* Click outside to close logout menu */}
      {showLogout && <div className="fixed inset-0 z-[5]" onClick={() => setShowLogout(false)} />}
    </ShellLayout>
  );
}
