import { useCallback, useEffect, useRef, useState } from 'react';
import { api, onDataChange } from './api';

/** Run an async loader; re-run when data changes anywhere (live refresh). */
export function useAsync<T>(fn: () => Promise<T>, deps: any[] = [], opts: { poll?: number; live?: boolean } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn); fnRef.current = fn;
  const alive = useRef(true);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const d = await fnRef.current(); if (alive.current) { setData(d); setError(null); } }
    catch (e) { if (alive.current) setError(e); }
    finally { if (alive.current) setLoading(false); }
  }, []);
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, deps); // eslint-disable-line
  useEffect(() => { if (opts.live === false) return; return onDataChange(() => load(true)) as any; }, [load, opts.live]);
  useEffect(() => { if (!opts.poll) return; const t = setInterval(() => load(true), opts.poll); return () => clearInterval(t); }, [opts.poll, load]);
  return { data, error, loading, reload: () => load(true), setData };
}

export const useList = (col: string, opts: { poll?: number; optional?: boolean } = {}) => useAsync<any[]>(() => (opts.optional ? api.list(col).catch((e: any) => (e?.status === 403 ? [] : Promise.reject(e))) : api.list(col)), [col], opts);

/** id -> label maps for referenced screens */
export function useLookups(cols: string[]) {
  const key = [...new Set(cols)].sort().join(',');
  const r = useAsync<Record<string, any[]>>(() => (key ? api.action('lookups', { cols: key.split(',') }) : Promise.resolve({})), [key]);
  const maps: Record<string, Record<string, string>> = {};
  for (const [c, rows] of Object.entries(r.data || {})) maps[c] = Object.fromEntries(rows.map((x) => [x.id, x.label]));
  return { lists: r.data || {}, maps, loading: r.loading };
}

export function useDebounced<T>(v: T, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}
