'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../lib/store';
import { useRouter } from 'next/navigation';

// ── useApi: fetch data from API with loading/error state ──
export function useApi(endpoint, options = {}) {
  const { token } = useAuthStore();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async (overrideUrl) => {
    if (!endpoint && !overrideUrl) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(overrideUrl || endpoint, {
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'সমস্যা হয়েছে');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ── usePost: POST/PATCH/DELETE API call ──
export function usePost() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const post = useCallback(async (url, body, method = 'POST') => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'সমস্যা হয়েছে');
      return { data: json, ok: true };
    } catch (e) {
      setError(e.message);
      return { data: null, ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { post, loading, error };
}

// ── useDebounce ──
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

// ── useAuth: redirect if not logged in ──
export function useAuth(requiredRole = null) {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.push('/dashboard');
    }
  }, [user, token, requiredRole, router]);

  return { user, token, isAdmin: user?.role === 'super_admin' };
}

// ── useLocalStorage ──
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) { console.error(e); }
  };

  return [storedValue, setValue];
}

// ── usePagination ──
export function usePagination(items = [], perPage = 20) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return {
    pageItems, page, pages, total,
    nextPage: () => setPage(p => Math.min(p + 1, pages)),
    prevPage: () => setPage(p => Math.max(p - 1, 1)),
    goToPage: setPage,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

// ── useSearch: client-side search with debounce ──
export function useSearch(items = [], keys = ['name']) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query);

  const results = debounced
    ? items.filter(item => keys.some(k => String(item[k] || '').toLowerCase().includes(debounced.toLowerCase())))
    : items;

  return { query, setQuery, results };
}

// ── usePrint ──
export function usePrint() {
  return useCallback((elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write('<html><head><style>body{font-family:Arial,sans-serif;}</style></head><body>');
    w.document.write(el.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  }, []);
}
