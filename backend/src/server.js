// NexaERP API server
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { SqliteStore } from './store.js';
import { Service, ApiError, publicService, PUBLIC_ACTIONS, landingData, newId, safeUser } from '../../shared/service.js';

const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES || '12h';
const ORIGINS = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
const store = new SqliteStore(process.env.DB_FILE || './data/erp.sqlite');

if (process.argv.includes('--reseed-only')) { store.seed(); console.log('Database reset to demo data.'); process.exit(0); }
if (SECRET === 'dev-secret-change-me') console.warn('⚠  JWT_SECRET is not set. Set it before going live.');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: ORIGINS.includes('*') ? true : ORIGINS, credentials: false }));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); next(); });

// --- simple login rate limit (per IP)
const attempts = new Map();
const limited = (ip) => { const now = Date.now(); const a = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60e3); attempts.set(ip, a); return a.length >= 10; };

const wrap = (fn) => (req, res) => {
  try { const out = fn(req, res); if (!res.headersSent) res.json(out ?? { ok: true }); }
  catch (e) { const status = e instanceof ApiError ? e.status : e.status || 500; if (status === 500) console.error(e); res.status(status).json({ error: status === 500 ? 'Something went wrong on the server.' : e.message }); }
};

function auth(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please sign in.');
  let payload; try { payload = jwt.verify(token, SECRET); } catch { throw new ApiError(401, 'Your session has expired. Please sign in again.'); }
  const user = store.get('users', payload.sub);
  if (!user || user.status !== 'active') throw new ApiError(401, 'This login is disabled.');
  const businessId = user.role === 'super_admin' ? req.headers['x-business'] || null : user.businessId;
  return new Service(store, { user, businessId });
}

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post('/api/auth/login', wrap((req) => {
  const ip = req.ip; if (limited(ip)) throw new ApiError(429, 'Too many attempts. Wait 15 minutes and try again.');
  const { email = '', password = '' } = req.body || {};
  const user = store.all('users').find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
  const ok = user && user.password_hash && bcrypt.compareSync(String(password), user.password_hash);
  store.insert('login_history', { id: newId(), user_name: user?.name || email, role: user?.role || '—', ip, device: String(req.headers['user-agent'] || '').slice(0, 80), date: new Date().toISOString().slice(0, 16), status: ok ? 'success' : 'failed' });
  if (!ok) { attempts.get(ip)?.push(Date.now()) || attempts.set(ip, [Date.now()]); throw new ApiError(401, 'Email or password is not correct.'); }
  if (user.status !== 'active') throw new ApiError(403, 'This login is disabled. Contact your administrator.');
  store.update('users', user.id, { ...user, last_login: new Date().toISOString().slice(0, 16) });
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES });
  const svc = new Service(store, { user, businessId: user.businessId || store.all('businesses')[0]?.id });
  return { token, ...svc.action('me') };
}));

app.post('/api/auth/password', wrap((req) => {
  const svc = auth(req); const { current, next } = req.body || {};
  const u = store.get('users', svc.user.id);
  if (!bcrypt.compareSync(String(current || ''), u.password_hash)) throw new ApiError(422, 'Your current password is not correct.');
  if (!next || next.length < 6) throw new ApiError(422, 'New password must be at least 6 characters.');
  store.update('users', u.id, { ...u, password: next, _rehash: true });
  return { ok: true };
}));
app.post('/api/auth/profile', wrap((req) => { const svc = auth(req); const u = store.get('users', svc.user.id); const { name, phone } = req.body || {}; const next = store.update('users', u.id, { ...u, name: name || u.name, phone: phone ?? u.phone }); return safeUser(next); }));

app.get('/api/me', wrap((req) => auth(req).action('me')));
app.get('/api/r/:col', wrap((req) => auth(req).list(req.params.col)));
app.get('/api/r/:col/:id', wrap((req) => auth(req).get(req.params.col, req.params.id)));
app.post('/api/r/:col', wrap((req) => auth(req).create(req.params.col, req.body || {})));
app.put('/api/r/:col/:id', wrap((req) => auth(req).update(req.params.col, req.params.id, req.body || {})));
app.delete('/api/r/:col/:id', wrap((req) => auth(req).remove(req.params.col, req.params.id)));
app.post('/api/a/:action', wrap((req) => auth(req).action(req.params.action, req.body || {})));

app.post('/api/admin/reset-demo', wrap((req) => { const svc = auth(req); if (!svc.isSuper) throw new ApiError(403, 'Only the super admin can reset data.'); store.seed(); return { ok: true, message: 'All data was reset to the demo data.' }; }));

app.get('/api/public/landing', wrap(() => landingData(store)));
app.post('/api/public/:slug/:action', wrap((req) => {
  if (!PUBLIC_ACTIONS.includes(req.params.action)) throw new ApiError(404, 'Not found.');
  return publicService(store, req.params.slug)[req.params.action](req.body || {});
}));

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.listen(PORT, () => console.log(`NexaERP API running on http://localhost:${PORT}`));
