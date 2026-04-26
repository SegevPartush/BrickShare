import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const POLL_INTERVAL_MS = 8000;

// Hook גלובלי שמחזיר את מספר ההודעות הלא-נקראו של המשתמש המחובר.
// עושה polling רך כל 8 שניות ועוצר אם לא מחובר.
export function useUnreadMessages(): number {
  const { accessToken } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!accessToken) {
      setCount(0);
      return;
    }
    let cancelled = false;

    async function fetchCount() {
      try {
        const c = await api.getUnreadMessagesCount(accessToken!);
        if (!cancelled) setCount(c);
      } catch {
        // שקט - ננסה שוב בפעם הבאה
      }
    }

    fetchCount();
    const t = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [accessToken]);

  return count;
}
