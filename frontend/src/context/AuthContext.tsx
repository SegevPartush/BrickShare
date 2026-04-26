import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/api';
import { User, AuthContextType } from '../types';

const ACCESS_KEY = 'brickshare_accessToken';
const REFRESH_KEY = 'brickshare_refreshToken';
const USER_KEY = 'brickshare_user';

type StoreKind = 'local' | 'session';

function getStore(where: StoreKind): Storage {
  return where === 'local' ? localStorage : sessionStorage;
}

function clearStore(where: StoreKind) {
  const s = where === 'local' ? localStorage : sessionStorage;
  s.removeItem(ACCESS_KEY);
  s.removeItem(REFRESH_KEY);
  s.removeItem(USER_KEY);
}

function clearAllAuthStorage() {
  clearStore('local');
  clearStore('session');
}

function readTokens(): {
  a: string;
  r: string;
  uStr: string | null;
  where: StoreKind;
} {
  if (localStorage.getItem(ACCESS_KEY)) {
    return {
      a: localStorage.getItem(ACCESS_KEY) as string,
      r: localStorage.getItem(REFRESH_KEY) || '',
      uStr: localStorage.getItem(USER_KEY),
      where: 'local',
    };
  }
  if (sessionStorage.getItem(ACCESS_KEY)) {
    return {
      a: sessionStorage.getItem(ACCESS_KEY) as string,
      r: sessionStorage.getItem(REFRESH_KEY) || '',
      uStr: sessionStorage.getItem(USER_KEY),
      where: 'session',
    };
  }
  return { a: '', r: '', uStr: null, where: 'local' };
}

function writeAuth(
  at: string,
  rt: string,
  u: User | null,
  where: StoreKind
) {
  clearAllAuthStorage();
  const s = where === 'local' ? localStorage : sessionStorage;
  s.setItem(ACCESS_KEY, at);
  s.setItem(REFRESH_KEY, rt);
  if (u) s.setItem(USER_KEY, JSON.stringify(u));
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const activeStoreRef = useRef<StoreKind>('local');

  useEffect(() => {
    const { a, r, uStr, where } = readTokens();
    activeStoreRef.current = a ? where : 'local';
    setAccessToken(a);
    setRefreshToken(r);
    setUser(uStr ? JSON.parse(uStr) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadMe() {
      if (!accessToken) return;
      const store = getStore(activeStoreRef.current);
      try {
        const me = await api.getMe(accessToken);
        setUser(me);
        store.setItem(USER_KEY, JSON.stringify(me));
      } catch (err) {
        // token invalid – try refresh once, otherwise keep UI functional
        // eslint-disable-next-line no-console
        console.error('getMe failed:', err);
        const storedRefresh = refreshToken || store.getItem(REFRESH_KEY) || '';
        if (!storedRefresh) return;
        try {
          const data = await api.refreshToken({ refreshToken: storedRefresh });
          const me = await api.getMe(data.accessToken);
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          setUser(me);
          writeAuth(data.accessToken, data.refreshToken, me, activeStoreRef.current);
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

  function saveSession(at: string, rt: string, u: User, rememberDevice = true) {
    const where: StoreKind = rememberDevice ? 'local' : 'session';
    activeStoreRef.current = where;
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(u);
    writeAuth(at, rt, u, where);
  }

  async function register(payload: {
    username: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }) {
    const { rememberMe, ...credentials } = payload;
    const data = await api.register(credentials);
    const remember = rememberMe !== false;
    saveSession(data.accessToken, data.refreshToken, data.user, remember);
    return data.user;
  }

  async function login(payload: { email: string; password: string; rememberMe?: boolean }) {
    const { rememberMe, ...credentials } = payload;
    const data = await api.login(credentials);
    const remember = rememberMe !== false;
    saveSession(data.accessToken, data.refreshToken, data.user, remember);
    return data.user;
  }

  function setOAuthTokens({ accessToken: at, refreshToken: rt, userId }: { accessToken: string; refreshToken: string; userId: string }) {
    const newUser: User = userId ? { id: userId, email: '' } : { email: '' };
    saveSession(at, rt, newUser, true);

    // גם אם /api/auth/me נכשל (טוקן לא תקין/Expired),
    // עדיין נוכל להציג תמונת פרופיל נכונה דרך /api/users/:id (לא דורש auth).
    if (userId) {
      api.getUser(userId)
        .then((u) => {
          setUser(u);
          getStore(activeStoreRef.current).setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }
  }

  async function refresh() {
    const w = activeStoreRef.current;
    const storedRefresh = refreshToken || getStore(w).getItem(REFRESH_KEY) || '';
    if (!storedRefresh) throw new Error('Missing refresh token');
    const data = await api.refreshToken({ refreshToken: storedRefresh });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    const uKey = getStore(w).getItem(USER_KEY);
    const u = uKey ? (JSON.parse(uKey) as User) : null;
    writeAuth(data.accessToken, data.refreshToken, u, w);
    return data;
  }

  // מחדש טוקן אוטומטית אם קיים refresh token
  async function getValidToken(): Promise<string> {
    if (accessToken) return accessToken;
    const w = activeStoreRef.current;
    const storedRefresh = getStore(w).getItem(REFRESH_KEY) || refreshToken;
    if (!storedRefresh) return '';
    try {
      const data = await api.refreshToken({ refreshToken: storedRefresh });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      const uKey = getStore(w).getItem(USER_KEY);
      const u = uKey ? (JSON.parse(uKey) as User) : null;
      writeAuth(data.accessToken, data.refreshToken, u, w);
      return data.accessToken;
    } catch {
      return '';
    }
  }

  async function refreshUser() {
    const t = accessToken || localStorage.getItem(ACCESS_KEY) || '';
    if (!t) return;
    try {
      const me = await api.getMe(t);
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      /* ignore */
    }
  }

  function logout() {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    clearAllAuthStorage();
    activeStoreRef.current = 'local';
  }

  const value: AuthContextType = {
    accessToken, refreshToken, user, loading, authHeaders,
    register, login, refresh, logout, setOAuthTokens, getValidToken, refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
