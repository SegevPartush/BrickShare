import axios from 'axios';

const api = axios.create({
  // With CRA `proxy`, calls to `/api/*` are forwarded to the backend.
  baseURL: ''
});

export async function register({ username, email, password }) {
  const res = await api.post('/api/auth/register', { username, email, password });
  return res.data;
}

export async function login({ email, password }) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function refreshToken({ refreshToken }) {
  const res = await api.post('/api/auth/refresh', { refreshToken });
  return res.data;
}

export async function getMe(accessToken) {
  const res = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.user;
}

export async function getPosts({ page = 1, limit = 10 } = {}) {
  const res = await api.get('/api/posts', { params: { page, limit } });
  return res.data;
}

export async function searchPosts(q) {
  const res = await api.get('/api/posts/search', { params: { q } });
  return res.data;
}

export async function getSuggestions(accessToken) {
  const res = await api.get('/api/posts/suggestions', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.suggestions;
}

export async function getUserPosts(userId) {
  const res = await api.get(`/api/users/${userId}/posts`);
  return res.data.posts || [];
}

export async function updateProfile({ accessToken, userId, username, profileImageFile }) {
  const form = new FormData();
  if (username !== undefined) form.append('username', username);
  if (profileImageFile) form.append('profileImage', profileImageFile);

  const res = await api.put(`/api/users/${userId}`, form, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return res.data.user;
}

export async function createPost({ accessToken, text, imageFile }) {
  const form = new FormData();
  form.append('text', text);
  if (imageFile) form.append('image', imageFile);

  const res = await api.post('/api/posts', form, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.post;
}

export async function toggleLike({ accessToken, postId }) {
  const res = await api.post(`/api/posts/${postId}/like`, null, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

export async function getSuggestedUsers({ accessToken, limit = 5 } = {}) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await api.get('/api/users', { params: { limit }, headers });
  return res.data.users || [];
}

export async function toggleFollow({ accessToken, targetUserId }) {
  const res = await api.post(`/api/follow/${targetUserId}`, null, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

export async function getFollowers({ accessToken, targetUserId }) {
  const res = await api.get(`/api/users/${targetUserId}/followers`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.followers;
}

export async function getFollowing({ accessToken, targetUserId }) {
  const res = await api.get(`/api/users/${targetUserId}/following`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data.following;
}

