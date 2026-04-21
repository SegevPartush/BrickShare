import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { User, AuthContextType } from '../types';

const ACCESS_KEY = 'brickshare_accessToken';
const REFRESH_KEY = 'brickshare_refreshToken';
const USER_KEY = 'brickshare_user';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
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
    async function loadMe() {
      if (!accessToken) return;
      try {
        const me = await api.getMe(accessToken);
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch (err) {
        // token invalid – try refresh once, otherwise keep UI functional
        // eslint-disable-next-line no-console
        console.error('getMe failed:', err);
        const storedRefresh = refreshToken || localStorage.getItem(REFRESH_KEY) || '';
        if (!storedRefresh) return;
        try {
          const data = await api.refreshToken({ refreshToken: storedRefresh });
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          localStorage.setItem(ACCESS_KEY, data.accessToken);
          localStorage.setItem(REFRESH_KEY, data.refreshToken);
          const me = await api.getMe(data.accessToken);
          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        } catch {
          // ignore
        }
      }
    }
    loadMe();
  }, [accessToken]);

  const authHeaders = useMemo(() => {
    if (!accessToken) return {};
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  function saveSession(at: string, rt: string, u: User) {
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(u);
    localStorage.setItem(ACCESS_KEY, at);
    localStorage.setItem(REFRESH_KEY, rt);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  async function register(payload: { username: string; email: string; password: string }) {
    const data = await api.register(payload);
    saveSession(data.accessToken, data.refreshToken, data.user);
    return data.user;
  }

  async function login(payload: { email: string; password: string }) {
    const data = await api.login(payload);
    saveSession(data.accessToken, data.refreshToken, data.user);
    return data.user;
  }

  function setOAuthTokens({ accessToken: at, refreshToken: rt, userId }: { accessToken: string; refreshToken: string; userId: string }) {
    const newUser: User = userId ? { id: userId, email: '' } : { email: '' };
    saveSession(at, rt, newUser);

    // גם אם /api/auth/me נכשל (טוקן לא תקין/Expired),
    // עדיין נוכל להציג תמונת פרופיל נכונה דרך /api/users/:id (לא דורש auth).
    if (userId) {
      api.getUser(userId)
        .then((u) => {
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }
  }

  async function refresh() {
    const storedRefresh = refreshToken || localStorage.getItem(REFRESH_KEY) || '';
    if (!storedRefresh) throw new Error('Missing refresh token');
    const data = await api.refreshToken({ refreshToken: storedRefresh });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data;
  }

  // מחדש טוקן אוטומטית אם קיים refresh token
  async function getValidToken(): Promise<string> {
    if (accessToken) return accessToken;
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!storedRefresh) return '';
    try {
      const data = await api.refreshToken({ refreshToken: storedRefresh });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem(ACCESS_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      return data.accessToken;
    } catch {
      return '';
    }
  }

  function logout() {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value: AuthContextType = {
    accessToken, refreshToken, user, loading, authHeaders,
    register, login, refresh, logout, setOAuthTokens, getValidToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
