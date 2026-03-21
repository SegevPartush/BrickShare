import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const ACCESS_KEY = 'brickshare_accessToken';
const REFRESH_KEY = 'brickshare_refreshToken';
const USER_KEY = 'brickshare_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_KEY) || '';
    const storedRefresh = localStorage.getItem(REFRESH_KEY) || '';
    const storedUser = localStorage.getItem(USER_KEY);

    setAccessToken(storedAccess);
    setRefreshToken(storedRefresh);
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Best-effort: refresh user data on app start.
    async function loadMe() {
      if (!accessToken) return;
      try {
        const me = await api.getMe(accessToken);
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch {
        // If token is invalid, keep UI functional; user can login again.
      }
    }
    loadMe();
  }, [accessToken]);

  const authHeaders = useMemo(() => {
    if (!accessToken) return {};
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  async function register(payload) {
    const data = await api.register(payload);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function login(payload) {
    const data = await api.login(payload);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  function setOAuthTokens({ accessToken: at, refreshToken: rt, userId }) {
    const newUser = userId ? { id: userId } : null;
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(newUser);
    localStorage.setItem(ACCESS_KEY, at || '');
    localStorage.setItem(REFRESH_KEY, rt || '');
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  async function refresh() {
    if (!refreshToken) throw new Error('Missing refresh token');
    const data = await api.refreshToken({ refreshToken });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data;
  }

  function logout() {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = {
    accessToken,
    refreshToken,
    user,
    loading,
    authHeaders,
    register,
    login,
    refresh,
    logout,
    setOAuthTokens
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

