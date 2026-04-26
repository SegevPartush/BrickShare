import axios from 'axios';

const api = axios.create({ baseURL: '' });

export async function register(payload: { username: string; email: string; password: string }) {
  const res = await api.post('/api/auth/register', payload);
  return res.data;
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post('/api/auth/login', payload);
  return res.data;
}

export async function refreshToken(payload: { refreshToken: string }) {
  const res = await api.post('/api/auth/refresh', payload);
  return res.data;
}

export async function getMe(accessToken: string) {
  const res = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.user;
}

export async function getPosts({ page = 1, limit = 10 } = {}) {
  const res = await api.get('/api/posts', { params: { page, limit } });
  return res.data;
}

export async function searchPosts(q: string) {
  const res = await api.get('/api/posts/search', { params: { q } });
  return res.data;
}

export async function getSuggestions(accessToken: string) {
  const res = await api.get('/api/posts/suggestions', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.suggestions;
}

export async function getUserPosts(userId: string) {
  const res = await api.get(`/api/users/${userId}/posts`);
  return res.data.posts || [];
}

export async function updateProfile(payload: {
  accessToken: string;
  userId: string;
  username?: string;
  profileImageFile?: File | null;
  coverImageFile?: File | null;
}) {
  const form = new FormData();
  if (payload.username !== undefined) form.append('username', payload.username);
  if (payload.profileImageFile) form.append('profileImage', payload.profileImageFile);
  if (payload.coverImageFile) form.append('coverImage', payload.coverImageFile);
  const res = await api.put(`/api/users/${payload.userId}`, form, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.user;
}

export async function createPost(payload: {
  accessToken: string;
  text: string;
  imageFile?: File | null;
}) {
  const form = new FormData();
  form.append('text', payload.text);
  if (payload.imageFile) form.append('image', payload.imageFile);
  const res = await api.post('/api/posts', form, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.post;
}

export async function toggleLike(payload: { accessToken: string; postId: string }) {
  const res = await api.post(`/api/posts/${payload.postId}/like`, null, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data;
}

export async function getSuggestedUsers({ accessToken, limit = 5 }: { accessToken?: string; limit?: number } = {}) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await api.get('/api/users', { params: { limit }, headers });
  return res.data.users || [];
}

export async function toggleFollow(payload: { accessToken: string; targetUserId: string }) {
  const res = await api.post(`/api/follow/${payload.targetUserId}`, null, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data;
}

export async function getFollowers(payload: { accessToken: string; targetUserId: string }) {
  const res = await api.get(`/api/users/${payload.targetUserId}/followers`, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.followers;
}

export async function getFollowing(payload: { accessToken: string; targetUserId: string }) {
  const res = await api.get(`/api/users/${payload.targetUserId}/following`, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.following;
}

export async function updatePost(payload: { accessToken: string; postId: string; text: string }) {
  const res = await api.put(`/api/posts/${payload.postId}`, { text: payload.text }, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.post;
}

export async function deletePost(payload: { accessToken: string; postId: string }) {
  await api.delete(`/api/posts/${payload.postId}`, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
}

export async function getUser(userId: string) {
  const res = await api.get(`/api/users/${userId}`);
  return res.data.user;
}

export async function getComments(postId: string) {
  const res = await api.get(`/api/comments/posts/${postId}/comments`);
  return res.data.comments || [];
}

export async function addComment(payload: { accessToken: string; postId: string; text: string }) {
  const res = await api.post(
    `/api/comments/posts/${payload.postId}/comments`,
    { text: payload.text },
    { headers: { Authorization: `Bearer ${payload.accessToken}` } }
  );
  return res.data.comment;
}

export async function deleteComment(payload: { accessToken: string; commentId: string }) {
  await api.delete(`/api/comments/${payload.commentId}`, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
}

// ===== Messages =====

export async function sendMessage(payload: { accessToken: string; recipient: string; text: string }) {
  const res = await api.post(
    '/api/messages',
    { recipient: payload.recipient, text: payload.text },
    { headers: { Authorization: `Bearer ${payload.accessToken}` } }
  );
  return res.data.message;
}

export async function getConversations(accessToken: string) {
  const res = await api.get('/api/messages', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.conversations || [];
}

export async function getThread(payload: { accessToken: string; userId: string }) {
  const res = await api.get(`/api/messages/${payload.userId}`, {
    headers: { Authorization: `Bearer ${payload.accessToken}` }
  });
  return res.data.messages || [];
}

export async function getUnreadMessagesCount(accessToken: string) {
  const res = await api.get('/api/messages/unread/count', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return (res.data?.count as number) || 0;
}
