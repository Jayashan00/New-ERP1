// =====================================================================
//  API CLIENT
//  DEMO mode (no VITE_API_URL): the full business logic runs in the
//  browser on a local copy of the demo data (saved in localStorage).
//  LIVE mode (VITE_API_URL set): calls the Node.js backend.
//  Both modes run the exact same shared service code.
// =====================================================================
import { buildSeed } from '@shared/seed.js';
import { MemoryStore } from '@shared/memstore.js';
import { Service, publicService, landingData, safeUser } from '@shared/service.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const MODE: 'demo' | 'live' = API ? 'live' : 'demo';
const DB_KEY = 'ceylon-ayu-erp-db-v3';
const SESSION_KEY = 'ceylon-ayu-session';

export class HttpError extends Error { status: number; constructor(status: number, msg: string) { super(msg); this.status = status; } }

// ------------------------------------------------ change events (so screens refresh live)
type Listener = () => void;
const listeners = new Set<Listener>();
export const onDataChange = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((l) => l());

// ------------------------------------------------ session
type Session = { token?: string; userId?: string; businessId?: string | null };
const loadSession = (): Session => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; } };
let session: Session = loadSession();
const saveSession = () => localStorage.setItem(SESSION_KEY, JSON.stringify(session));

// ------------------------------------------------ demo store
let store: any = null;
let saveTimer: any = null;
function demoStore() {
  if (store) return store;
  let db: any = null;
  try { const raw = localStorage.getItem(DB_KEY); if (raw) db = JSON.parse(raw); } catch { db = null; }
  if (!db) db = buildSeed();
  store = new MemoryStore(db);
  store.onChange = () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); };
  persist();
  return store;
}
function persist() { try { localStorage.setItem(DB_KEY, JSON.stringify(store.db)); } catch { /* storage full — keep in memory */ } }
// keep several open tabs (e.g. POS + kitchen display) in sync in demo mode
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === DB_KEY && e.newValue && store) { store.db = JSON.parse(e.newValue); emit(); } });

function demoService() {
  const s = demoStore();
  const user = s.get('users', session.userId);
  if (!user) throw new HttpError(401, 'Please sign in.');
  if (user.status !== 'active') throw new HttpError(403, 'This login is disabled.');
  return new Service(s, { user, businessId: user.role === 'super_admin' ? session.businessId : user.businessId });
}
const wrapErr = (e: any) => { if (e instanceof HttpError) return e; return new HttpError(e?.status || 500, e?.message || 'Something went wrong.'); };
const delay = <T,>(fn: () => T, mutate = false): Promise<T> => new Promise((res, rej) => setTimeout(() => { try { const out = fn(); res(JSON.parse(JSON.stringify(out ?? null))); if (mutate) emit(); } catch (e) { rej(wrapErr(e)); } }, 60));

// ------------------------------------------------ http
async function http(method: string, path: string, body?: any, auth = true) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (auth && session.token) headers.Authorization = 'Bearer ' + session.token;
  if (session.businessId) headers['x-business'] = session.businessId;
  let res: Response;
  try { res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new HttpError(0, 'Cannot reach the server. Check your internet connection.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && auth) { session = {}; saveSession(); } throw new HttpError(res.status, data.error || 'Request failed.'); }
  return data;
}
const MUTATING = /^(update|apply|create|save|delete|place|pay|cancel|check|post|add|move|set|night|void|kot|transfer|merge|shop|receive|clock|decide|run|record|convert|approve|change|mark|send|helpdesk)/i;

// ------------------------------------------------ public API
export const api = {
  mode: MODE,
  get businessId() { return session.businessId || null; },
  isSignedIn() { return MODE === 'demo' ? !!session.userId : !!session.token; },

  async login(email: string, password: string) {
    if (MODE === 'live') { const r = await http('POST', '/api/auth/login', { email, password }, false); session = { token: r.token, businessId: r.user.role === 'super_admin' ? 'b1' : r.user.businessId }; saveSession(); emit(); return r; }
    return delay(() => {
      const s = demoStore();
      const u = s.all('users').find((x: any) => x.email.toLowerCase() === email.toLowerCase().trim());
      s.insert('login_history', { id: 'lh' + Date.now(), user_name: u?.name || email, role: u?.role || '—', ip: 'demo', device: navigator.userAgent.slice(0, 60), date: new Date().toISOString().slice(0, 16), status: u && u.password === password ? 'success' : 'failed' });
      if (!u || u.password !== password) throw new HttpError(401, 'Email or password is not correct.');
      if (u.status !== 'active') throw new HttpError(403, 'This login is disabled. Contact your administrator.');
      s.update('users', u.id, { ...u, last_login: new Date().toISOString().slice(0, 16) });
      session = { userId: u.id, businessId: u.role === 'super_admin' ? 'b1' : u.businessId }; saveSession();
      return new Service(s, { user: u, businessId: session.businessId }).action('me');
    }, true);
  },
  logout() { session = {}; saveSession(); emit(); },
  setBusiness(id: string | null) { session.businessId = id; saveSession(); emit(); },
  me() { return MODE === 'live' ? http('GET', '/api/me') : delay(() => demoService().action('me')); },

  list(col: string): Promise<any[]> { return MODE === 'live' ? http('GET', '/api/r/' + col) : delay(() => demoService().list(col)); },
  get(col: string, id: string) { return MODE === 'live' ? http('GET', `/api/r/${col}/${id}`) : delay(() => demoService().get(col, id)); },
  async create(col: string, data: any) { const r = MODE === 'live' ? await http('POST', '/api/r/' + col, data) : await delay(() => demoService().create(col, data), true); if (MODE === 'live') emit(); return r; },
  async update(col: string, id: string, data: any) { const r = MODE === 'live' ? await http('PUT', `/api/r/${col}/${id}`, data) : await delay(() => demoService().update(col, id, data), true); if (MODE === 'live') emit(); return r; },
  async remove(col: string, id: string) { const r = MODE === 'live' ? await http('DELETE', `/api/r/${col}/${id}`) : await delay(() => demoService().remove(col, id), true); if (MODE === 'live') emit(); return r; },
  async action<T = any>(name: string, payload: any = {}): Promise<T> {
    const mut = MUTATING.test(name);
    const r = MODE === 'live' ? await http('POST', '/api/a/' + name, payload) : await delay(() => demoService().action(name, payload), mut);
    if (MODE === 'live' && mut) emit();
    return r;
  },
  async pub<T = any>(slug: string, action: string, payload: any = {}): Promise<T> {
    if (MODE === 'live') { const r = await http('POST', `/api/public/${slug}/${action}`, payload, false); emit(); return r; }
    return delay(() => (publicService(demoStore(), slug) as any)[action](payload), true);
  },
  landing() { return MODE === 'live' ? http('GET', '/api/public/landing', undefined, false) : delay(() => landingData(demoStore())); },
  async changePassword(current: string, next: string) {
    if (MODE === 'live') return http('POST', '/api/auth/password', { current, next });
    return delay(() => { const s = demoStore(); const u = s.get('users', session.userId); if (u.password !== current) throw new HttpError(422, 'Your current password is not correct.'); if (!next || next.length < 6) throw new HttpError(422, 'New password must be at least 6 characters.'); s.update('users', u.id, { ...u, password: next }); return { ok: true }; });
  },
  async updateProfile(data: { name: string; phone: string }) {
    if (MODE === 'live') { const r = await http('POST', '/api/auth/profile', data); emit(); return r; }
    return delay(() => { const s = demoStore(); const u = s.get('users', session.userId); const n = { ...u, ...data }; s.update('users', u.id, n); return safeUser(n); }, true);
  },
  async resetDemo() {
    if (MODE === 'live') { const r = await http('POST', '/api/admin/reset-demo', {}); emit(); return r; }
    localStorage.removeItem(DB_KEY); store = null; demoStore(); emit(); return { ok: true, message: 'Demo data restored.' };
  },
};
