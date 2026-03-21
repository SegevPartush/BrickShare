import React, { useEffect, useMemo, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

interface Post {
  _id: string;
  text: string;
  image?: string;
}

export default function ProfilePage() {
  const { accessToken, user, logout } = useAuth();
  const userId = user?.id || '';

  const [profileBusy, setProfileBusy] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsBusy, setPostsBusy] = useState(false);

  useEffect(() => { setUsername(user?.username || ''); }, [user]);

  useEffect(() => {
    if (!userId) return;
    setPostsBusy(true);
    api.getUserPosts(userId)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setPostsBusy(false));
  }, [userId]);

  async function onSubmit() {
    if (!accessToken || !userId) return;
    setProfileBusy(true);
    setError('');
    try {
      await api.updateProfile({ accessToken, userId, username: username.trim(), profileImageFile });
      window.location.reload();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update profile');
    } finally {
      setProfileBusy(false);
    }
  }

  const rightPanel = useMemo(() => {
    if (!userId) return null;
    return (
      <div className="space-y-16">
        <div className="rounded-lg border border-border bg-bg p-16">
          <div className="text-subtitle font-semibold">Account</div>
          <div className="mt-12 text-body font-semibold">{user?.username || '—'}</div>
          <div className="text-caption text-muted">{user?.email}</div>
          <div className="mt-14">
            <Button variant="danger" className="w-full" onClick={() => { logout(); window.location.href = '/login'; }}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }, [userId, user, logout]);

  if (!user) {
    return (
      <ShellLayout title="Profile">
        <div className="rounded-lg border border-border bg-bg p-24 text-caption text-muted">Please sign in.</div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout title="Profile" subtitle="Update your image and username." rightPanel={rightPanel}>
      <div className="space-y-16">
        <div className="flex items-start gap-16 flex-wrap">
          <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={74} />
          <div className="min-w-[240px]">
            <div className="text-title font-semibold">{user.username || user.email}</div>
            <div className="text-caption text-muted mt-6">{user.email}</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg p-16">
          <div className="text-subtitle font-semibold">Edit profile</div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
            <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
            <div className="space-y-6">
              <div className="text-caption text-muted font-medium">Profile image</div>
              <input type="file" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} className="w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body" />
            </div>
          </div>
          {error && <div className="mt-16 text-caption text-red-400">{error}</div>}
          <div className="mt-16 flex items-center justify-end gap-12">
            <Button variant="secondary" onClick={() => window.location.reload()} disabled={profileBusy}>Reset</Button>
            <Button variant="primary" onClick={onSubmit} disabled={profileBusy || !username.trim()}>{profileBusy ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg p-16">
          <div className="text-subtitle font-semibold">Your posts</div>
          {postsBusy ? (
            <div className="text-caption text-muted mt-10">Loading...</div>
          ) : posts.length ? (
            <div className="mt-12 space-y-12">
              {posts.map((p) => (
                <div key={p._id} className="rounded-lg border border-border bg-bg p-12">
                  <div className="text-body font-semibold">{p.text?.slice(0, 120)}</div>
                  <div className="text-caption text-muted mt-6">{p.image ? 'Has image' : 'Text only'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-caption text-muted mt-10">No posts yet.</div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
