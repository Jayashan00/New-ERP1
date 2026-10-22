// =====================================================================
//  SERVICE LAYER — every read/write goes through here, in the browser
//  demo AND on the server. Enforces permissions, business scoping,
//  "own records only", validation, numbering and the audit trail.
// =====================================================================
import { ENTITIES } from './entities.js';
import { can } from './roles.js';
import { iso, defaultSettings } from './seed.js';
import { computeDashboard, computeReport } from './analytics.js';

export const safeUser = (u) => { if (!u) return u; const { password, password_hash, _rehash, ...rest } = u; return rest; };
export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const deny = (msg = 'You do not have permission to do this.') => { throw new ApiError(403, msg); };
const bad = (msg) => { throw new ApiError(422, msg); };
const notFound = (what = 'Record') => { throw new ApiError(404, what + ' not found.'); };

let counter = 0;
export const newId = () => 'x' + Date.now().toString(36) + (counter++).toString(36) + Math.random().toString(36).slice(2, 5);
const today = () => iso(new Date());
const day3 = (s) => String(s || '').slice(0, 10);
const pretty2 = (x) => String(x || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const nowStamp = () => { const d = new Date(); return `${today()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const nights = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 864e5));
const round = (n) => Math.round(n * 100) / 100;

/**
 * store: { all(col), get(col,id), insert(col,rec), update(col,id,patch), remove(col,id) }
 * ctx:   { user, businessId }  (businessId = active business; super admin may switch)
 */
export class Service {
  constructor(store, ctx = {}) {
    this.s = store;
    this.user = ctx.user || null;
    this.role = this.user ? store.all('roles').find((r) => r.key === this.user.role) : null;
    this.isSuper = this.user?.role === 'super_admin';
    this.biz = this.isSuper ? ctx.businessId || this.user?.businessId || null : this.user?.businessId || null;
  }

  // ---------------------------------------------------- helpers
  can(key, a = 'v') { return can(this.role, key, a); }
  need(key, a = 'v') { if (!this.user) throw new ApiError(401, 'Please sign in.'); if (!this.can(key, a)) deny(); }
  business() { return this.biz ? this.s.get('businesses', this.biz) : null; }
  settings() { const st = this.s.all('settings').find((x) => x.businessId === this.biz); return st ? st.data : defaultSettings(this.business() || { name: 'Business', type: 'mixed' }); }
  rows(col) { const e = ENTITIES[col]; const all = this.s.all(col); if (e && e.scope === 'platform') return all; return all.filter((r) => r.businessId === this.biz); }
  find(col, id) { const r = this.s.get(col, id); if (!r) return null; const e = ENTITIES[col]; if (e && e.scope !== 'platform' && r.businessId !== this.biz) return null; return r; }
  audit(action, entity, record) {
    if (!this.user) return;
    this.s.insert('audit_log', { id: newId(), businessId: this.biz, user_name: this.user.name, action, entity: ENTITIES[entity]?.label || entity, record: String(record || ''), date: nowStamp() });
  }
  notify(title, body, module, roles) { this.s.insert('notifications', { id: newId(), businessId: this.biz, title, body, module, roles: roles || null, date: nowStamp(), read: false }); }
  nextNumber(col) {
    const e = ENTITIES[col]; if (!e?.prefix) return undefined;
    const max = this.rows(col).reduce((m, r) => Math.max(m, parseInt(String(r.number || '').replace(/\D/g, ''), 10) || 0), 1000);
    return e.prefix + (max + 1);
  }
  ownFilter(col, rows) {
    const e = ENTITIES[col];
    if (this.role?.self && e?.ownerField) return rows.filter((r) => r[e.ownerField] === this.user.employeeId);
    return rows;
  }

  // ---------------------------------------------------- generic CRUD
  list(col) {
    const e = ENTITIES[col]; if (!e) notFound('Screen');
    this.need(col, 'v');
    if (e.scope !== 'platform' && !this.biz) return [];
    return this.ownFilter(col, this.rows(col)).slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }
  get(col, id) { this.need(col, 'v'); const r = this.find(col, id); if (!r) notFound(); return r; }
  validate(e, data, partial) {
    for (const f of e.fields) {
      const v = data[f.k];
      if (!partial && f.req && (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) bad(`${f.l} is required.`);
      if (v !== undefined && v !== '' && v !== null && ['number', 'money', 'percent', 'rating'].includes(f.t) && isNaN(Number(v))) bad(`${f.l} must be a number.`);
    }
    const clean = {};
    for (const f of e.fields) if (f.k in data) clean[f.k] = ['number', 'money', 'percent', 'rating'].includes(f.t) && data[f.k] !== '' && data[f.k] !== null ? Number(data[f.k]) : data[f.k];
    return clean;
  }
  create(col, data) {
    const e = ENTITIES[col]; if (!e) notFound('Screen');
    this.need(col, 'c');
    if (e.scope !== 'platform' && !this.biz) bad('Choose a business first (top bar).');
    if (this.role?.self && e.ownerField) data = { ...data, [e.ownerField]: this.user.employeeId };
    const rec = { id: newId(), ...(e.scope === 'platform' ? {} : { businessId: this.biz }), created_at: nowStamp(), ...this.validate(e, data) };
    if (e.prefix && !rec.number) rec.number = this.nextNumber(col);
    this.computeDoc(col, rec);
    this.s.insert(col, rec);
    this.afterCreate(col, rec);
    this.audit('created', col, rec[e.title] || rec.number || rec.id);
    return rec;
  }
  update(col, id, data) {
    const e = ENTITIES[col]; if (!e) notFound('Screen');
    this.need(col, 'e');
    const cur = this.find(col, id); if (!cur) notFound();
    if (this.role?.self && e.ownerField && cur[e.ownerField] !== this.user.employeeId) deny('You can only change your own records.');
    const patch = this.validate(e, data, true);
    const next = { ...cur, ...patch, updated_at: nowStamp() };
    this.computeDoc(col, next);
    this.s.update(col, id, next);
    this.afterUpdate(col, cur, next);
    this.audit('updated', col, next[e.title] || next.number || id);
    return next;
  }
  remove(col, id) {
    const e = ENTITIES[col]; this.need(col, 'd');
    const cur = this.find(col, id); if (!cur) notFound();
    this.s.remove(col, id);
    this.audit('deleted', col, cur[e.title] || cur.number || id);
    return { ok: true };
  }
  computeDoc(col, rec) {
    if (Array.isArray(rec.items) && ['proposals', 'quotations', 'sales_invoices', 'sales_returns', 'purchase_orders', 'grns', 'purchase_invoices', 'purchase_returns'].includes(col)) {
      rec.items = rec.items.filter((x) => x && (x.name || x.ref) && Number(x.qty) > 0).map((x) => ({ ...x, qty: Number(x.qty) || 0, price: Number(x.price) || 0, total: round((Number(x.qty) || 0) * (Number(x.price) || 0)) }));
      rec.total = round(rec.items.reduce((s, x) => s + x.total, 0) * 1.18);
    }
    if (col === 'customers' && (rec.first_name || rec.last_name)) rec.name = [rec.first_name, rec.last_name].filter(Boolean).join(' ');
    if (col === 'leave_applications' && rec.start && rec.end) rec.days = nights(rec.start, rec.end) + 1;
    if (col === 'reservations' && rec.check_in && rec.check_out && rec.rate) rec.total = rec.rate * nights(rec.check_in, rec.check_out);
    if (col === 'payslips') rec.net = (rec.basic || 0) + (rec.allowances || 0) + (rec.overtime || 0) + (rec.service_charge || 0) - (rec.deductions || 0);
  }
  afterCreate(col, r) {
    if (col === 'stock_adjustments') { const p = this.find('products', r.product_id); if (p) this.s.update('products', p.id, { ...p, stock: (p.stock || 0) + (r.type === 'add' ? 1 : -1) * r.quantity }); }
    if (col === 'grns') for (const it of r.items || []) { const item = this.find('items', it.ref); if (item) this.s.update('items', item.id, { ...item, quantity: (item.quantity || 0) + Number(it.qty || 0) }); }
    if (col === 'leave_applications') this.notify('Leave request', `${this.find('employees', r.employee_id)?.name || 'An employee'} applied for ${r.days} day(s) leave`, 'hrm');
    if (col === 'reservations') { const room = this.find('rooms', r.room_id); if (room && r.check_in === today() && room.status === 'available') this.s.update('rooms', room.id, { ...room, status: 'reserved' }); this.notify('New booking', `${r.number} for ${this.find('customers', r.guest_id)?.name || 'guest'}`, 'hotel'); }
    if (col === 'guest_requests') this.notify(`Room ${r.room}: ${r.type}`, r.details || `${r.guest_name || 'Guest'} needs help`, 'hotel', ['front_office', 'housekeeping', 'hotel_manager', 'concierge']);
    if (col === 'transport_bookings') this.notify('Transport requested', `${r.type} for ${r.guest_name} at ${String(r.pickup_time).replace('T', ' ')}`, 'hotel', ['concierge', 'front_office', 'hotel_manager']);
    if (col === 'feedback') this.notify('New feedback', `${r.customer_name || 'A customer'} rated ${r.rating}★`, 'customers');
  }
  afterUpdate(col, prev, next) {
    if (col === 'transport_bookings' && next.status === 'completed' && prev.status !== 'completed' && next.charge_to_room && next.reservation_id && !next.charged) {
      const r = this.find('reservations', next.reservation_id);
      if (r && r.status === 'checked_in') { this.s.insert('folio_charges', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: r.id, description: `${next.type} — ${next.number}`, category: 'Transport', amount: Number(next.fare) || 0, date: today(), posted_by: this.user?.name || 'Transport desk' }); this.s.update('transport_bookings', next.id, { ...next, charged: true }); }
    }
    if (col === 'transport_bookings' && next.status === 'driver_assigned' && prev.status !== 'driver_assigned') this.notify('Driver assigned', `${next.type} for ${next.guest_name}`, 'hotel', ['front_office', 'concierge']);
    if (col === 'guest_requests' && next.status === 'done' && prev.status !== 'done') this.notify(`Room ${next.room}: done`, `${next.type} completed`, 'hotel', ['front_office', 'hotel_manager']);
    if (col === 'housekeeping' && prev.status !== next.status && ['done', 'inspected'].includes(next.status)) {
      const room = this.find('rooms', next.room_id); if (room && ['dirty', 'cleaning'].includes(room.status)) this.s.update('rooms', room.id, { ...room, status: 'available' });
    }
    if (col === 'housekeeping' && next.status === 'in_progress') { const room = this.find('rooms', next.room_id); if (room && room.status === 'dirty') this.s.update('rooms', room.id, { ...room, status: 'cleaning' }); }
    if (col === 'maintenance' && next.room_id) { const room = this.find('rooms', next.room_id); if (room) { if (next.status === 'resolved' && room.status === 'out_of_order') this.s.update('rooms', room.id, { ...room, status: 'dirty' }); if (next.priority === 'urgent' && next.status !== 'resolved' && room.status === 'available') this.s.update('rooms', room.id, { ...room, status: 'out_of_order' }); } }
  }

  // ---------------------------------------------------- actions
  action(name, p = {}) {
    const fn = ACTIONS[name]; if (!fn) notFound('Action');
    return fn.call(this, p || {});
  }
}

// guard helper for actions
function req(svc, key, a) { svc.need(key, a); }

const ACTIONS = {
  // ------------------------------------------------ session / settings / comms
  me() { if (!this.user) throw new ApiError(401, 'Please sign in.'); return { user: safeUser(this.user), role: this.role, business: this.business(), businesses: this.isSuper ? this.s.all('businesses') : [this.business()].filter(Boolean), settings: this.biz ? this.settings() : null, platform: this.s.all('platform_settings')[0]?.data }; },
  getSettings() { return this.settings(); },
  saveSettings(p) { req(this, 'page:settings', 'e'); const st = this.s.all('settings').find((x) => x.businessId === this.biz); const data = { ...this.settings(), ...p }; if (st) this.s.update('settings', st.id, { ...st, data }); else this.s.insert('settings', { id: newId(), businessId: this.biz, data }); this.audit('updated', 'settings', 'Business settings'); return data; },
  getPlatformSettings() { return this.s.all('platform_settings')[0]?.data || {}; },
  savePlatformSettings(p) { if (!this.isSuper) deny(); const cur = this.s.all('platform_settings')[0]; const data = { ...(cur?.data || {}), ...p }; if (cur) this.s.update('platform_settings', cur.id, { ...cur, data }); else this.s.insert('platform_settings', { id: 'platform', data }); return data; },
  notifications() { if (!this.user) return []; const k = this.role?.key; return this.s.all('notifications').filter((n) => n.businessId === this.biz && (!n.roles || n.roles.includes(k) || ['super_admin', 'business_owner'].includes(k))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40); },
  markNotificationsRead() { for (const n of ACTIONS.notifications.call(this).filter((n) => !n.read)) this.s.update('notifications', n.id, { ...n, read: true }); return { ok: true }; },
  messages({ channel = 'general' }) { req(this, 'page:messenger'); return this.s.all('messages').filter((m) => m.businessId === this.biz && m.channel === channel).sort((a, b) => a.date.localeCompare(b.date)); },
  sendMessage({ channel = 'general', text }) { req(this, 'page:messenger'); if (!text?.trim()) bad('Type a message first.'); const m = { id: newId(), businessId: this.biz, channel, from: this.user.name, text: text.trim(), date: nowStamp() }; this.s.insert('messages', m); return m; },
  lookups({ cols = [] }) {
    if (!this.user) throw new ApiError(401, 'Please sign in.');
    // a role may see the *names* of records referenced by any screen it can open
    const allowed = new Set();
    const ITEM_SRC = { restaurant_orders: 'menu_items', kots: 'menu_items', shop_sales: 'products' };
    for (const e of Object.values(ENTITIES)) if (this.can(e.key)) { allowed.add(e.key); for (const f of e.fields) { if (f.ref) allowed.add(f.ref); if (f.t === 'items') allowed.add(ITEM_SRC[e.key] || 'items'); } }
    const out = {};
    for (const c of cols) {
      const e = ENTITIES[c]; if (!e || !allowed.has(c)) { out[c] = []; continue; }
      if (e.scope === 'platform' && !this.isSuper && !['plans'].includes(c)) { out[c] = []; continue; }
      out[c] = (e.scope === 'platform' ? this.s.all(c) : this.rows(c)).map((r) => ({ id: r.id, label: String(r[e.title] ?? r.name ?? r.number ?? r.id), price: r.price ?? r.sale_price ?? r.base_rate ?? r.rate, cost: r.purchase_price ?? r.cost, status: r.status, icon: r.icon }));
    }
    return out;
  },
  dashboard() { if (!this.user) throw new ApiError(401, 'Please sign in.'); return computeDashboard(this); },
  report({ name }) { return computeReport(this, name); },

  // ------------------------------------------------ users & roles
  users({ all }) {
    if (all) { if (!this.isSuper) deny(); return this.s.all('users').map(safeUser); }
    req(this, 'page:users'); return this.s.all('users').filter((u) => u.businessId === this.biz).map(safeUser);
  },
  saveUser(p) {
    const isAll = this.isSuper && p.businessId !== undefined;
    if (!isAll) req(this, 'page:users', p.id ? 'e' : 'c');
    if (!p.name || !p.email || !p.role) bad('Name, email and role are required.');
    if (p.role === 'super_admin' && !this.isSuper) deny('Only a super admin can create another super admin.');
    const dupe = this.s.all('users').find((u) => u.email.toLowerCase() === p.email.toLowerCase() && u.id !== p.id); if (dupe) bad('That email is already used by another login.');
    const businessId = this.isSuper && p.businessId !== undefined ? p.businessId || null : this.biz;
    if (p.id) { const cur = this.s.get('users', p.id); if (!cur) notFound('User'); if (!this.isSuper && cur.businessId !== this.biz) deny(); const next = { ...cur, name: p.name, email: p.email, role: p.role, phone: p.phone || '', status: p.status || cur.status, employeeId: p.employeeId ?? cur.employeeId, customerId: p.customerId ?? cur.customerId, businessId, ...(p.password ? { password: p.password, _rehash: true } : {}) }; this.s.update('users', p.id, next); this.audit('updated', 'users', p.email); return safeUser(next); }
    if (!p.password || p.password.length < 6) bad('Password must be at least 6 characters.');
    const u = { id: newId(), name: p.name, email: p.email, password: p.password, _rehash: true, role: p.role, businessId, employeeId: p.employeeId || null, customerId: p.customerId || null, phone: p.phone || '', status: p.status || 'active', created_at: nowStamp() };
    this.s.insert('users', u); this.audit('created', 'users', p.email); return safeUser(u);
  },
  deleteUser({ id }) { const cur = this.s.get('users', id); if (!cur) notFound('User'); if (!this.isSuper) { req(this, 'page:users', 'd'); if (cur.businessId !== this.biz) deny(); } if (cur.id === this.user.id) bad('You cannot delete your own login.'); this.s.remove('users', id); this.audit('deleted', 'users', cur.email); return { ok: true }; },
  roles() { return this.s.all('roles').filter((r) => !r.businessId || r.businessId === this.biz); },
  saveRole(p) {
    req(this, 'page:roles', p.id ? 'e' : 'c');
    if (!p.name) bad('Give the role a name.');
    if (p.id) { const cur = this.s.get('roles', p.id); if (!cur) notFound('Role'); if (!cur.businessId && !this.isSuper) deny('Built-in roles can only be changed by the super admin. Create a custom role instead.'); if (cur.key === 'super_admin') bad('The super admin role always has full access.'); const next = { ...cur, name: p.name, desc: p.desc ?? cur.desc, grants: p.grants || cur.grants, dashboard: p.dashboard || cur.dashboard, color: p.color || cur.color, self: !!p.self }; this.s.update('roles', p.id, next); this.audit('updated', 'roles', p.name); return next; }
    const key = 'custom_' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    const r = { id: newId(), key, name: p.name, desc: p.desc || '', grants: p.grants || { 'page:dashboard': 'v' }, dashboard: p.dashboard || 'owner', color: p.color || '#64748B', self: !!p.self, businessId: this.isSuper ? null : this.biz };
    this.s.insert('roles', r); this.audit('created', 'roles', p.name); return r;
  },
  deleteRole({ id }) { req(this, 'page:roles', 'd'); const cur = this.s.get('roles', id); if (!cur) notFound('Role'); if (cur.system || (!cur.businessId && !this.isSuper)) bad('Built-in roles cannot be deleted.'); if (this.s.all('users').some((u) => u.role === cur.key)) bad('Move the users on this role to another role first.'); this.s.remove('roles', id); return { ok: true }; },

  // ------------------------------------------------ HOTEL
  availableRooms({ check_in, check_out, room_type_id, exclude, ready }) {
    req(this, 'rooms');
    if (!check_in || !check_out || check_out <= check_in) bad('Choose a check-out date after check-in.');
    const tomorrow = iso(new Date(Date.now() + 864e5));
    // an in-house guest keeps the room until they actually check out (even if due today)
    const effOut = (r) => (r.status === 'checked_in' && r.check_out < tomorrow ? tomorrow : r.check_out);
    const busy = new Set(this.rows('reservations').filter((r) => r.id !== exclude && !['cancelled', 'no_show', 'checked_out'].includes(r.status) && r.check_in < check_out && effOut(r) > check_in).map((r) => r.room_id));
    return this.rows('rooms').filter((r) => r.status !== 'out_of_order' && !busy.has(r.id) && (!room_type_id || r.room_type_id === room_type_id) && (!ready || ['available', 'reserved'].includes(r.status)));
  },
  createBooking(p) {
    req(this, 'reservations', 'c');
    let guestId = p.guest_id;
    if (!guestId) { const g = { ...p.guest }; if (!g.first_name && g.name) { const [f, ...l] = g.name.split(' '); g.first_name = f; g.last_name = l.join(' ') || '-'; } if (!g.first_name || !g.last_name) bad('Enter the guest’s first and last name.'); guestId = this.create('customers', { type: 'individual', status: 'active', loyalty_points: 0, ...g }).id; }
    if (!p.room_id) bad('Choose a room.');
    const free = ACTIONS.availableRooms.call(this, { check_in: p.check_in, check_out: p.check_out, ready: !!p.check_in_now });
    if (!free.some((r) => r.id === p.room_id)) bad(p.check_in_now ? 'That room is not clean and free right now. Pick a room marked Available.' : 'That room is no longer free for those dates. Pick another room.');
    const room = this.find('rooms', p.room_id); const rt = this.find('room_types', room.room_type_id);
    const rate = Number(p.rate || rt.base_rate);
    const res = this.create('reservations', { guest_id: guestId, room_id: room.id, room_type_id: rt.id, check_in: p.check_in, check_out: p.check_out, adults: p.adults || 1, children: p.children || 0, meal_plan: p.meal_plan || 'BB', rate, source: p.source || 'Walk-in', agent_id: p.agent_id || '', ota_ref: p.ota_ref || '', arrival_time: p.arrival_time || '', vehicle_no: p.vehicle_no || '', advance: Number(p.advance || 0), special_requests: p.special_requests || '', status: p.status || 'confirmed' });
    if (p.parking_slot_id && p.vehicle_no) ACTIONS.parkVehicle.call(this, { slot_id: p.parking_slot_id, vehicle_no: p.vehicle_no, reservation_id: res.id, purpose: 'Hotel guest', reserve: !p.check_in_now, driver: this.find('customers', guestId)?.name });
    if (Number(p.advance) > 0) this.s.insert('folio_payments', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: res.id, amount: Number(p.advance), method: p.advance_method || 'Card', reference: 'ADV' + Date.now().toString().slice(-5), date: today(), type: 'advance' });
    if (p.check_in_now) ACTIONS.checkIn.call(this, { reservation_id: res.id });
    return this.find('reservations', res.id);
  },
  checkIn({ reservation_id, room_id }) {
    req(this, 'reservations', 'e');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    if (!['confirmed', 'tentative'].includes(r.status)) bad(`This booking is ${r.status.replace('_', ' ')} — it cannot be checked in.`);
    const roomId = room_id || r.room_id; const room = this.find('rooms', roomId);
    if (!room) bad('Assign a room first.');
    if (room.status === 'occupied') bad(`Room ${room.number} is occupied. Choose another room.`);
    if (room.status === 'out_of_order') bad(`Room ${room.number} is out of order.`);
    this.s.update('reservations', r.id, { ...r, room_id: roomId, status: 'checked_in', checked_in_at: nowStamp() });
    this.s.update('rooms', room.id, { ...room, status: 'occupied' });
    if (!this.rows('registration_cards').some((c) => c.reservation_id === r.id)) this.s.insert('registration_cards', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: r.id, guest_id: r.guest_id, signed_at: nowStamp(), id_verified: true, id_copy: '', notes: '' });
    if (r.parking_slot_id) { const sl = this.find('parking_slots', r.parking_slot_id); if (sl && sl.status === 'reserved') this.s.update('parking_slots', sl.id, { ...sl, status: 'occupied' }); }
    this.audit('checked_in', 'reservations', r.number);
    return { ok: true, message: `Checked in to room ${room.number}.` };
  },
  folio({ reservation_id }) {
    if (!this.can('reservations') && !(this.role?.key === 'customer')) deny();
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    if (this.role?.key === 'customer' && r.guest_id !== this.user.customerId) deny();
    const charges = this.rows('folio_charges').filter((c) => c.reservation_id === r.id).sort((a, b) => a.date.localeCompare(b.date));
    const payments = this.rows('folio_payments').filter((c) => c.reservation_id === r.id);
    const st = this.settings();
    const chargeTotal = charges.reduce((s, c) => s + Number(c.amount), 0);
    const roomPending = r.status === 'checked_in' ? Math.max(0, nights(r.check_in, r.check_out) - charges.filter((c) => c.category === 'Room').length) * r.rate : 0;
    const sub = chargeTotal + roomPending;
    const roomSub = charges.filter((c) => c.category === 'Room').reduce((t, c) => t + Number(c.amount), 0) + roomPending;
    const sc = round(sub * (st.service_charge || 0) / 100); const tdl = round(roomSub * (st.tdl || 0) / 100); const vat = round((sub + sc + tdl) * (st.vat || 0) / 100);
    const total = round(sub + sc + tdl + vat); const paid = payments.reduce((s, x) => s + (x.type === 'refund' ? -1 : 1) * Number(x.amount), 0);
    return { reservation: r, guest: this.find('customers', r.guest_id), room: this.find('rooms', r.room_id), charges, payments, roomPending, subtotal: sub, service_charge: sc, tdl, vat, total, paid, balance: round(total - paid) };
  },
  postCharge({ reservation_id, description, category, amount }) {
    req(this, 'folio_charges', 'c');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    if (r.status !== 'checked_in') bad('Charges can only be posted to an in-house guest.');
    if (!description || !(Number(amount) > 0)) bad('Enter a description and an amount.');
    const c = { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id, description, category: category || 'Other', amount: Number(amount), date: today(), posted_by: this.user.name };
    this.s.insert('folio_charges', c); this.audit('created', 'folio_charges', description); return c;
  },
  addPayment({ reservation_id, amount, method, type = 'settlement', reference }) {
    req(this, 'folio_payments', 'c');
    if (!(Number(amount) > 0)) bad('Enter an amount.');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    const pmt = { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id, amount: Number(amount), method: method || 'Cash', reference: reference || 'PAY' + Date.now().toString().slice(-6), date: today(), type };
    this.s.insert('folio_payments', pmt); this.audit('paid', 'folio_payments', r.number); return pmt;
  },
  checkOut({ reservation_id, method = 'Card' }) {
    req(this, 'reservations', 'e');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    if (r.status !== 'checked_in') bad('Only in-house guests can be checked out.');
    // post any pending room nights
    const f0 = ACTIONS.folio.call(this, { reservation_id });
    const postedNights = f0.charges.filter((c) => c.category === 'Room').length;
    const n = nights(r.check_in, r.check_out);
    for (let i = postedNights; i < n; i++) { const d = new Date(r.check_in); d.setDate(d.getDate() + i); this.s.insert('folio_charges', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id, description: 'Room charge — night ' + (i + 1), category: 'Room', amount: r.rate, date: iso(d), posted_by: 'Check-out' }); }
    const f = ACTIONS.folio.call(this, { reservation_id });
    if (f.balance > 0) ACTIONS.addPayment.call(this, { reservation_id, amount: f.balance, method, type: 'settlement' });
    this.s.update('reservations', r.id, { ...r, status: 'checked_out', checked_out_at: nowStamp(), total: f.total });
    const room = this.find('rooms', r.room_id);
    if (room) { this.s.update('rooms', room.id, { ...room, status: 'dirty' }); this.s.insert('housekeeping', { id: newId(), businessId: this.biz, created_at: nowStamp(), room_id: room.id, task: 'Checkout clean', assigned_to: '', priority: 'high', date: today(), notes: 'Auto-created at check-out', status: 'pending' }); }
    if (r.parking_slot_id) { const sl = this.find('parking_slots', r.parking_slot_id); if (sl && sl.status !== 'free') ACTIONS.releaseVehicle.call(this, { slot_id: sl.id }); }
    const g = this.find('customers', r.guest_id); const st = this.settings();
    if (g && st.loyalty_enabled) this.s.update('customers', g.id, { ...g, loyalty_points: (g.loyalty_points || 0) + Math.floor(f.total / 100) * (st.points_per_100 || 1) });
    this.audit('checked_out', 'reservations', r.number);
    return { ...ACTIONS.folio.call(this, { reservation_id }), message: `Checked out. Room ${room?.number} sent to housekeeping.` };
  },
  cancelBooking({ reservation_id, status = 'cancelled' }) {
    req(this, 'reservations', 'e');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    if (!['confirmed', 'tentative'].includes(r.status)) bad('Only upcoming bookings can be cancelled.');
    this.s.update('reservations', r.id, { ...r, status });
    const room = this.find('rooms', r.room_id); if (room && room.status === 'reserved') this.s.update('rooms', room.id, { ...room, status: 'available' });
    this.audit('updated', 'reservations', r.number + ' ' + status); return { ok: true };
  },
  moveRoom({ reservation_id, room_id }) {
    req(this, 'reservations', 'e');
    const r = this.find('reservations', reservation_id); if (!r) notFound('Booking');
    const free = ACTIONS.availableRooms.call(this, { check_in: r.check_in, check_out: r.check_out, exclude: r.id });
    if (!free.some((x) => x.id === room_id)) bad('That room is not free for this stay.');
    const old = this.find('rooms', r.room_id); const nw = this.find('rooms', room_id);
    this.s.update('reservations', r.id, { ...r, room_id, room_type_id: nw.room_type_id });
    if (r.status === 'checked_in') { if (old) this.s.update('rooms', old.id, { ...old, status: 'dirty' }); this.s.update('rooms', nw.id, { ...nw, status: 'occupied' }); }
    return { ok: true, message: `Moved to room ${nw.number}.` };
  },
  setRoomStatus({ room_id, status }) { req(this, 'rooms', 'e'); const room = this.find('rooms', room_id); if (!room) notFound('Room'); this.s.update('rooms', room.id, { ...room, status }); this.audit('updated', 'rooms', room.number + ' → ' + status); return { ok: true }; },
  nightAudit() {
    req(this, 'page:night-audit');
    const d = today();
    if (this.rows('night_audits').some((a) => a.date === d)) bad('The night audit for today is already closed.');
    let posted = 0; const inHouse = this.rows('reservations').filter((r) => r.status === 'checked_in');
    for (const r of inHouse) { const has = this.rows('folio_charges').some((c) => c.reservation_id === r.id && c.category === 'Room' && c.date === d); if (!has) { this.s.insert('folio_charges', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: r.id, description: 'Room charge — ' + d, category: 'Room', amount: r.rate, date: d, posted_by: 'Night audit' }); posted++; } }
    let noShows = 0; for (const r of this.rows('reservations').filter((r) => ['confirmed', 'tentative'].includes(r.status) && r.check_in < d)) { this.s.update('reservations', r.id, { ...r, status: 'no_show' }); noShows++; }
    const rooms = this.rows('rooms'); const roomRev = inHouse.reduce((s, r) => s + r.rate, 0);
    const other = this.rows('folio_charges').filter((c) => c.date === d && c.category !== 'Room').reduce((s, c) => s + c.amount, 0);
    const rec = { id: newId(), businessId: this.biz, created_at: nowStamp(), date: d, occupied: inHouse.length, occupancy: Math.round((inHouse.length / Math.max(1, rooms.length)) * 100), room_revenue: roomRev, other_revenue: other, closed_by: this.user.name, status: 'closed' };
    this.s.insert('night_audits', rec);
    return { ...rec, posted, noShows, message: `Day closed. ${posted} room charges posted, ${noShows} no-shows marked.` };
  },

  // ------------------------------------------------ PARKING
  parkVehicle({ slot_id, vehicle_no, vehicle_type = 'Car', driver = '', reservation_id = '', purpose = 'Hotel guest', reserve = false }) {
    req(this, 'parking_logs', 'c');
    const sl = this.find('parking_slots', slot_id); if (!sl) notFound('Parking slot');
    if (!vehicle_no) bad('Enter the vehicle number.');
    if (sl.status === 'occupied') bad(`Slot ${sl.code} is already taken by ${sl.vehicle_no}.`);
    if (sl.status === 'out_of_service') bad(`Slot ${sl.code} is out of service.`);
    this.s.update('parking_slots', sl.id, { ...sl, status: reserve ? 'reserved' : 'occupied', vehicle_no: vehicle_no.toUpperCase() });
    if (!reserve) this.s.insert('parking_logs', { id: newId(), businessId: this.biz, created_at: nowStamp(), slot_id: sl.id, vehicle_no: vehicle_no.toUpperCase(), vehicle_type, driver, reservation_id, purpose, time_in: nowStamp(), time_out: '', fee: 0, status: 'parked' });
    if (reservation_id) { const r = this.find('reservations', reservation_id); if (r) this.s.update('reservations', r.id, { ...r, parking_slot_id: sl.id, vehicle_no: vehicle_no.toUpperCase() }); }
    this.audit('created', 'parking_logs', `${vehicle_no} → ${sl.code}`);
    return { ok: true, message: `${vehicle_no.toUpperCase()} ${reserve ? 'reserved' : 'parked'} in ${sl.code}.` };
  },
  releaseVehicle({ slot_id, fee = 0, charge_to_room = false }) {
    req(this, 'parking_logs', 'c');
    const sl = this.find('parking_slots', slot_id); if (!sl) notFound('Parking slot');
    const log = this.rows('parking_logs').find((l) => l.slot_id === sl.id && l.status === 'parked');
    if (log) {
      this.s.update('parking_logs', log.id, { ...log, time_out: nowStamp(), fee: Number(fee) || 0, status: 'left' });
      if (Number(fee) > 0 && charge_to_room && log.reservation_id) { const r = this.find('reservations', log.reservation_id); if (r?.status === 'checked_in') this.s.insert('folio_charges', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: r.id, description: 'Parking ' + sl.code, category: 'Other', amount: Number(fee), date: today(), posted_by: this.user?.name }); }
    }
    this.s.update('parking_slots', sl.id, { ...sl, status: 'free', vehicle_no: '' });
    this.audit('updated', 'parking_logs', `${sl.code} released`);
    return { ok: true, message: `Slot ${sl.code} is free again.` };
  },
  // ------------------------------------------------ CHANNEL MANAGER
  channelGrid({ start, days = 14 }) {
    req(this, 'channels');
    const types = this.rows('room_types'); const rooms = this.rows('rooms'); const plans = this.rows('rate_plans');
    const dates = Array.from({ length: days }, (_, i) => iso(new Date(new Date((start || today()) + 'T12:00').getTime() + i * 864e5)));
    const res = this.rows('reservations').filter((r) => !['cancelled', 'no_show', 'checked_out'].includes(r.status));
    return { dates, types: types.map((t) => ({ id: t.id, name: t.name, total: rooms.filter((r) => r.room_type_id === t.id && r.status !== 'out_of_order').length, cells: dates.map((d) => { const sold = res.filter((r) => r.room_type_id === t.id && r.check_in <= d && r.check_out > d).length; const total = rooms.filter((r) => r.room_type_id === t.id && r.status !== 'out_of_order').length; const plan = plans.find((pl) => pl.room_type_id === t.id && pl.status === 'active' && pl.start <= d && pl.end >= d); return { date: d, available: Math.max(0, total - sold), sold, rate: plan?.rate || t.base_rate }; }) })), channels: this.rows('channels') };
  },
  channelPush({ action = 'Full sync', details = '' }) {
    req(this, 'channels', 'e');
    const chans = this.rows('channels').filter((c) => c.status !== 'disconnected');
    for (const c of chans) {
      const ok = c.status !== 'error';
      this.s.insert('channel_sync_logs', { id: newId(), businessId: this.biz, created_at: nowStamp(), channel: c.name, action, details: details || 'Rates and availability for all room types, next 365 days', date: nowStamp(), by: this.user.name, status: ok ? 'queued' : 'failed' });
      this.s.update('channels', c.id, { ...c, last_sync: nowStamp() });
    }
    return { ok: true, message: `${action} queued for ${chans.length} channels. Connect the live channel-manager API in Integrations to deliver it.` };
  },
  // ------------------------------------------------ BILLING & SERVICE
  guestBilling() {
    req(this, 'page:guest-billing');
    return this.rows('reservations').filter((r) => ['checked_in', 'checked_out', 'confirmed'].includes(r.status)).map((r) => { const f = ACTIONS.folio.call(this, { reservation_id: r.id }); return { id: r.id, number: r.number, status: r.status, guest: f.guest?.name, room: f.room?.number, check_in: r.check_in, check_out: r.check_out, source: r.source, total: f.total, paid: f.paid, balance: f.balance }; }).sort((a, b) => b.check_in.localeCompare(a.check_in));
  },
  handleCall({ id, status }) {
    req(this, 'service_calls', 'e');
    const c = this.find('service_calls', id); if (!c) notFound('Call');
    this.s.update('service_calls', c.id, { ...c, status, handled_by: this.user.name });
    if (status === 'done' && c.kind === 'Bill') { const t = this.rows('tables').find((x) => 'Table ' + x.name === c.place); if (t && t.status === 'bill_requested') this.s.update('tables', t.id, { ...t, status: 'occupied' }); }
    return { ok: true };
  },

  // ------------------------------------------------ RESTAURANT
  placeOrder(p) {
    req(this, 'restaurant_orders', p.order_id ? 'e' : 'c');
    const newItems = (p.items || []).filter((x) => Number(x.qty) > 0);
    if (!newItems.length && !p.order_id) bad('Add at least one item.');
    const menu = this.rows('menu_items'); const cats = this.rows('menu_categories');
    const enrich = newItems.map((x) => { const m = menu.find((mm) => mm.id === x.ref) || {}; if (m.id && m.available === false) bad(`${m.name} is not available right now.`); const station = cats.find((c) => c.id === m.category_id)?.station || 'Hot kitchen'; return { ref: x.ref, name: x.name || m.name, qty: Number(x.qty), price: Number(x.price ?? m.price), note: x.note || '', mods: x.mods || '', station, total: Number(x.qty) * Number(x.price ?? m.price) }; });
    let order = p.order_id ? this.find('restaurant_orders', p.order_id) : null;
    const table = p.table_id ? this.find('tables', p.table_id) : order?.table_id ? this.find('tables', order.table_id) : null;
    if (!order && p.room_reservation_id) { const open = this.rows('restaurant_orders').find((o) => o.room_reservation_id === p.room_reservation_id && !['paid', 'cancelled'].includes(o.status)); if (open && !p.new_order) order = open; }
    if (!order) {
      if (table && ['dine_in', 'qr'].includes(p.type || 'dine_in')) { const open = this.rows('restaurant_orders').find((o) => o.table_id === table.id && !['paid', 'cancelled'].includes(o.status)); if (open) order = open; }
    }
    const items = [...(order?.items || []), ...enrich];
    const totals = this.orderTotals(items, p.discount ?? order?.discount ?? 0, (p.type || order?.type) === 'dine_in' || (p.type || order?.type) === 'qr');
    if (order) { order = { ...order, items, ...totals, customer_id: p.customer_id || order.customer_id, status: enrich.length ? 'preparing' : order.status, updated_at: nowStamp() }; this.s.update('restaurant_orders', order.id, order); }
    else { order = { id: newId(), businessId: this.biz, created_at: nowStamp(), number: this.nextNumber('restaurant_orders'), type: p.type || 'dine_in', table_id: table?.id || '', customer_id: p.customer_id || '', waiter: p.waiter || this.user?.name || 'QR guest', items, ...totals, payment_method: '', rider_id: p.rider_id || '', date: nowStamp(), status: 'preparing', guest_name: p.guest_name || '', room_reservation_id: p.room_reservation_id || '' }; this.s.insert('restaurant_orders', order); }
    if (table && table.status !== 'occupied') this.s.update('tables', table.id, { ...table, status: 'occupied' });
    // KOT per station for the new items
    const byStation = {}; enrich.forEach((it) => (byStation[it.station] ||= []).push(it));
    const kots = Object.entries(byStation).map(([station, its]) => { const k = { id: newId(), businessId: this.biz, created_at: nowStamp(), number: this.nextNumber('kots'), order_id: order.id, station, table: table?.name || (order.type === 'takeaway' ? 'Takeaway' : order.type === 'delivery' ? 'Delivery' : order.type === 'room_service' ? (p.room_no ? 'Room ' + p.room_no : order.waiter?.startsWith('Room ') ? order.waiter : 'Room service') : '—'), items: its, created: nowStamp(), status: 'new' }; this.s.insert('kots', k); return k; });
    if (enrich.length) this.notify(p.source === 'qr' ? 'New QR order' : p.source === 'room' ? 'New room-service order' : 'New kitchen ticket', `${table?.name || (order.type === 'room_service' ? 'Room ' + (p.room_no || '') : pretty2(order.type))} — ${enrich.map((x) => x.qty + '× ' + x.name).join(', ')}`, 'restaurant', ['chef', 'restaurant_manager', ...(p.source ? ['waiter', 'front_office'] : [])]);
    this.audit(p.order_id ? 'updated' : 'created', 'restaurant_orders', order.number);
    return { order, kots };
  },
  orderTotals(items, discount = 0, dineIn = true) {
    const st = this.settings();
    const sub = items.reduce((s, x) => s + Number(x.qty) * Number(x.price), 0);
    const disc = Math.min(sub, Number(discount) || 0);
    const sc = dineIn && st.table_service_charge !== false ? round((sub - disc) * (st.service_charge || 0) / 100) : 0;
    const tax = round((sub - disc + sc) * (st.vat || 0) / 100);
    return { subtotal: round(sub), discount: disc, service_charge: sc, tax, total: round(sub - disc + sc + tax) };
  },
  voidItem({ order_id, index }) {
    req(this, 'restaurant_orders', 'e');
    const o = this.find('restaurant_orders', order_id); if (!o) notFound('Order');
    if (o.status === 'paid') bad('This order is already paid.');
    const items = o.items.filter((_, i) => i !== index);
    const next = { ...o, items, ...this.orderTotals(items, o.discount, ['dine_in', 'qr'].includes(o.type)) };
    this.s.update('restaurant_orders', o.id, next); this.audit('updated', 'restaurant_orders', o.number + ' item removed'); return next;
  },
  payOrder({ order_id, method = 'Cash', discount, payments, reservation_id, tip = 0 }) {
    req(this, 'restaurant_orders', 'e');
    const o = this.find('restaurant_orders', order_id); if (!o) notFound('Order');
    if (o.status === 'paid') bad('This order is already paid.');
    const totals = this.orderTotals(o.items, discount ?? o.discount, ['dine_in', 'qr'].includes(o.type));
    if (method === 'Room charge') {
      const r = this.find('reservations', reservation_id); if (!r || r.status !== 'checked_in') bad('Choose an in-house guest to charge the room.');
      this.s.insert('folio_charges', { id: newId(), businessId: this.biz, created_at: nowStamp(), reservation_id: r.id, description: `Restaurant ${o.number}`, category: 'Restaurant', amount: totals.total, date: today(), posted_by: this.user.name });
    }
    if (payments && payments.length) { const sum = payments.reduce((s, x) => s + Number(x.amount || 0), 0); if (round(sum) < totals.total) bad(`Split payments add up to ${sum}, but the bill is ${totals.total}.`); }
    const next = { ...o, ...totals, tip: Number(tip) || 0, payment_method: payments?.length > 1 ? 'Split' : method, payments: payments || [{ method, amount: totals.total }], status: 'paid', paid_at: nowStamp() };
    this.s.update('restaurant_orders', o.id, next);
    if (o.table_id) { const t = this.find('tables', o.table_id); if (t) this.s.update('tables', t.id, { ...t, status: 'cleaning' }); }
    // stock deduction from recipes
    const recipes = this.rows('recipes');
    for (const it of o.items) for (const rc of recipes.filter((r) => r.menu_item_id === it.ref)) { const ing = this.find('ingredients', rc.ingredient_id); if (ing) this.s.update('ingredients', ing.id, { ...ing, stock: round((ing.stock || 0) - rc.quantity * it.qty) }); }
    for (const k of this.rows('kots').filter((k) => k.order_id === o.id && k.status !== 'cancelled')) this.s.update('kots', k.id, { ...k, status: 'served' });
    this.loyalty(o.customer_id, totals.total);
    this.audit('paid', 'restaurant_orders', o.number);
    return next;
  },
  cancelOrder({ order_id }) {
    req(this, 'restaurant_orders', 'e');
    const o = this.find('restaurant_orders', order_id); if (!o) notFound('Order');
    if (o.status === 'paid') bad('Paid orders cannot be cancelled. Use a refund instead.');
    this.s.update('restaurant_orders', o.id, { ...o, status: 'cancelled' });
    for (const k of this.rows('kots').filter((k) => k.order_id === o.id)) this.s.update('kots', k.id, { ...k, status: 'cancelled' });
    if (o.table_id) { const t = this.find('tables', o.table_id); if (t) this.s.update('tables', t.id, { ...t, status: 'free' }); }
    this.audit('updated', 'restaurant_orders', o.number + ' cancelled'); return { ok: true };
  },
  kotStatus({ kot_id, status }) {
    req(this, 'kots', 'e');
    const k = this.find('kots', kot_id); if (!k) notFound('KOT');
    this.s.update('kots', k.id, { ...k, status, [status + '_at']: nowStamp() });
    const o = this.find('restaurant_orders', k.order_id);
    if (o && o.status !== 'paid') {
      const ks = this.rows('kots').filter((x) => x.order_id === o.id && x.status !== 'cancelled');
      const st = ks.every((x) => x.status === 'served') ? 'served' : ks.every((x) => ['ready', 'served'].includes(x.status)) ? 'ready' : 'preparing';
      this.s.update('restaurant_orders', o.id, { ...o, status: st });
      if (status === 'preparing') this.notify('Kitchen accepted', `${k.table} — ${k.items.map((i) => i.qty + '× ' + i.name).join(', ')} is being cooked`, 'restaurant', ['waiter']);
      if (st === 'ready') this.notify('Order ready — please collect', `${k.table} — ${o.number} is ready at the pass`, 'restaurant', ['waiter', 'restaurant_manager', 'cashier']);
      if (st === 'served' && o.type === 'room_service' && o.room_reservation_id) { const r = this.find('reservations', o.room_reservation_id); if (r && r.status === 'checked_in') ACTIONS.payOrder.call(this, { order_id: o.id, method: 'Room charge', reservation_id: r.id }); }
    }
    return { ok: true };
  },
  transferTable({ order_id, table_id }) {
    req(this, 'restaurant_orders', 'e');
    const o = this.find('restaurant_orders', order_id); const t = this.find('tables', table_id);
    if (!o || !t) notFound();
    if (this.rows('restaurant_orders').some((x) => x.table_id === t.id && !['paid', 'cancelled'].includes(x.status))) bad(`${t.name} already has an open order. Use merge instead.`);
    const old = this.find('tables', o.table_id);
    this.s.update('restaurant_orders', o.id, { ...o, table_id: t.id });
    if (old) this.s.update('tables', old.id, { ...old, status: 'cleaning' });
    this.s.update('tables', t.id, { ...t, status: 'occupied' });
    for (const k of this.rows('kots').filter((k) => k.order_id === o.id)) this.s.update('kots', k.id, { ...k, table: t.name });
    return { ok: true, message: `Moved to ${t.name}.` };
  },
  mergeOrders({ from_order_id, to_order_id }) {
    req(this, 'restaurant_orders', 'e');
    const a = this.find('restaurant_orders', from_order_id); const b = this.find('restaurant_orders', to_order_id); if (!a || !b) notFound('Order');
    const items = [...b.items, ...a.items];
    this.s.update('restaurant_orders', b.id, { ...b, items, ...this.orderTotals(items, b.discount, true) });
    this.s.update('restaurant_orders', a.id, { ...a, status: 'cancelled', merged_into: b.number });
    for (const k of this.rows('kots').filter((k) => k.order_id === a.id)) this.s.update('kots', k.id, { ...k, order_id: b.id });
    const ta = this.find('tables', a.table_id); if (ta) this.s.update('tables', ta.id, { ...ta, status: 'free' });
    return { ok: true, message: `Merged into ${b.number}.` };
  },
  setTableStatus({ table_id, status }) { req(this, 'tables', 'e'); const t = this.find('tables', table_id); if (!t) notFound('Table'); this.s.update('tables', t.id, { ...t, status }); return { ok: true }; },

  // ------------------------------------------------ SHOP
  shopCheckout(p) {
    req(this, 'shop_sales', 'c');
    const items = (p.items || []).filter((x) => Number(x.qty) > 0);
    if (!items.length) bad('Scan or add at least one product.');
    const st = this.settings();
    for (const it of items) { const pr = this.find('products', it.ref); if (pr && p.status !== 'held' && !st.allow_negative_stock && (pr.stock || 0) < it.qty) bad(`Only ${pr.stock} × ${pr.name} left in stock.`); }
    const lines = items.map((x) => ({ ref: x.ref, name: x.name, qty: Number(x.qty), price: Number(x.price), discount: Number(x.discount || 0), total: round(Number(x.qty) * Number(x.price) - Number(x.discount || 0)) }));
    const sub = round(lines.reduce((s, x) => s + x.total, 0));
    const disc = Math.min(sub, Number(p.discount || 0));
    const total = round(sub - disc);
    const tax = round(total - total / (1 + (st.vat || 0) / 100)); // prices include VAT
    let gcUsed = 0;
    if (p.gift_card_code) { const gc = this.rows('gift_cards').find((g) => g.code === p.gift_card_code && g.status === 'active'); if (!gc) bad('That gift card is not valid.'); gcUsed = Math.min(gc.balance, total); this.s.update('gift_cards', gc.id, { ...gc, balance: gc.balance - gcUsed, status: gc.balance - gcUsed <= 0 ? 'used' : 'active' }); }
    if (p.payment_method === 'Credit') { const c = this.find('customers', p.customer_id); if (!c) bad('Choose a customer for a credit sale.'); if ((c.balance || 0) + total > (c.credit_limit || 0)) bad(`${c.name} would go over their credit limit.`); this.s.update('customers', c.id, { ...c, balance: (c.balance || 0) + total }); }
    let sale;
    if (p.sale_id) { const cur = this.find('shop_sales', p.sale_id); if (!cur) notFound('Held sale'); sale = { ...cur, customer_id: p.customer_id || '', items: lines, subtotal: sub, discount: disc, tax, total, payment_method: p.payment_method, payments: p.payments, gift_card: gcUsed, status: p.status || 'paid', date: nowStamp() }; this.s.update('shop_sales', cur.id, sale); }
    else { sale = { id: newId(), businessId: this.biz, created_at: nowStamp(), number: this.nextNumber('shop_sales'), customer_id: p.customer_id || '', items: lines, subtotal: sub, discount: disc, tax, total, payment_method: p.status === 'held' ? '' : p.payment_method || 'Cash', payments: p.payments, gift_card: gcUsed, tendered: Number(p.tendered || 0), change: Math.max(0, round(Number(p.tendered || 0) - total)), channel: p.channel || 'counter', cashier: this.user?.name || 'Online', date: nowStamp(), status: p.status || (p.payment_method === 'Credit' ? 'credit' : 'paid') }; this.s.insert('shop_sales', sale); }
    if (sale.status !== 'held') { for (const it of lines) { const pr = this.find('products', it.ref); if (pr) this.s.update('products', pr.id, { ...pr, stock: round((pr.stock || 0) - it.qty) }); } this.loyalty(p.customer_id, total); const low = lines.map((l) => this.find('products', l.ref)).filter((pr) => pr && pr.stock <= pr.reorder); if (low.length) this.notify('Low stock', low.map((x) => x.name).join(', ') + ' at or below reorder level', 'shop'); }
    this.audit(sale.status === 'held' ? 'created' : 'paid', 'shop_sales', sale.number);
    return sale;
  },
  shopReturn({ sale_id, product_id, quantity = 1, reason = 'Changed mind', type = 'refund' }) {
    req(this, 'shop_returns', 'c');
    const s = this.find('shop_sales', sale_id); if (!s) notFound('Receipt');
    const line = s.items.find((x) => x.ref === product_id); if (!line) bad('That product is not on this receipt.');
    const already = this.rows('shop_returns').filter((r) => r.sale_id === s.id && r.product_id === product_id).reduce((t, r) => t + r.quantity, 0);
    if (already + Number(quantity) > line.qty) bad(`Only ${line.qty - already} can still be returned.`);
    const refund = round(line.price * Number(quantity));
    const r = { id: newId(), businessId: this.biz, created_at: nowStamp(), number: this.nextNumber('shop_returns'), sale_id, product_id, quantity: Number(quantity), reason, refund, type, date: today(), status: 'approved' };
    this.s.insert('shop_returns', r);
    const pr = this.find('products', product_id); if (pr && reason !== 'Damaged' && reason !== 'Expired') this.s.update('products', pr.id, { ...pr, stock: (pr.stock || 0) + Number(quantity) });
    const fully = s.items.every((x) => this.rows('shop_returns').filter((rr) => rr.sale_id === s.id && rr.product_id === x.ref).reduce((t, rr) => t + rr.quantity, 0) >= x.qty);
    this.s.update('shop_sales', s.id, { ...s, status: fully ? 'refunded' : 'partially_refunded' });
    if (type === 'store_credit' && s.customer_id) { const c = this.find('customers', s.customer_id); if (c) this.s.update('customers', c.id, { ...c, balance: (c.balance || 0) - refund }); }
    this.audit('created', 'shop_returns', r.number);
    return r;
  },
  receivePO({ po_id }) {
    req(this, 'grns', 'c');
    const po = this.find('purchase_orders', po_id); if (!po) notFound('Purchase order');
    if (po.status === 'received') bad('This order is already fully received.');
    const g = this.create('grns', { po_id, vendor_id: po.vendor_id, date: today(), items: po.items, received_by: this.user.name, status: 'completed' });
    this.s.update('purchase_orders', po.id, { ...this.find('purchase_orders', po.id), status: 'received' });
    return { grn: g, message: `${g.number} created and stock updated.` };
  },
  loyalty(customerId, amount) {
    if (!customerId) return; const st = this.settings(); if (!st.loyalty_enabled) return;
    const c = this.find('customers', customerId); if (c) this.s.update('customers', c.id, { ...c, loyalty_points: (c.loyalty_points || 0) + Math.floor(amount / 100) * (st.points_per_100 || 1) });
  },

  // ------------------------------------------------ HR
  myAttendance() {
    if (!this.user.employeeId) return { today: null, history: [], employee: null };
    const rows = this.rows('attendance').filter((a) => a.employee_id === this.user.employeeId).sort((a, b) => b.date.localeCompare(a.date));
    return { today: rows.find((r) => r.date === today()) || null, history: rows.slice(0, 31), employee: this.find('employees', this.user.employeeId) };
  },
  clock({ type }) {
    if (!this.user.employeeId) bad('Your login is not linked to an employee record. Ask HR to link it.');
    const now = new Date(); const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let rec = this.rows('attendance').find((a) => a.employee_id === this.user.employeeId && a.date === today());
    const emp = this.find('employees', this.user.employeeId); const shift = this.find('shifts', emp?.shift_id);
    if (type === 'in') {
      if (rec?.clock_in) bad('You already clocked in today at ' + rec.clock_in + '.');
      let late = 0; if (shift) { const [h, m] = shift.start.split(':').map(Number); late = Math.max(0, now.getHours() * 60 + now.getMinutes() - (h * 60 + m) - (shift.grace_minutes || 0)); }
      rec = { id: newId(), businessId: this.biz, created_at: nowStamp(), employee_id: this.user.employeeId, date: today(), clock_in: t, clock_out: '', late_minutes: late, overtime_minutes: 0, status: late ? 'late' : 'present' };
      this.s.insert('attendance', rec); return rec;
    }
    if (!rec?.clock_in) bad('Clock in first.');
    if (rec.clock_out) bad('You already clocked out today.');
    let ot = 0; if (shift) { const [h, m] = shift.end.split(':').map(Number); ot = Math.max(0, now.getHours() * 60 + now.getMinutes() - (h * 60 + m)); }
    const next = { ...rec, clock_out: t, overtime_minutes: ot }; this.s.update('attendance', rec.id, next); return next;
  },
  myLeaves() {
    if (!this.user?.employeeId) return [];
    return this.rows('leave_applications').filter((l) => l.employee_id === this.user.employeeId).map((l) => ({ ...l, type: this.find('leave_types', l.leave_type_id)?.name })).sort((a, b) => String(b.start).localeCompare(String(a.start)));
  },
  applyLeave({ leave_type_id, start, end, reason }) {
    if (!this.user?.employeeId) bad('Your login is not linked to an employee record. Ask HR to link it.');
    if (!leave_type_id || !start || !end) bad('Choose the leave type and dates.');
    if (end < start) bad('The end date must be on or after the start date.');
    const rec = { id: newId(), businessId: this.biz, created_at: nowStamp(), employee_id: this.user.employeeId, leave_type_id, start, end, reason: reason || '', status: 'pending' };
    this.computeDoc('leave_applications', rec); this.s.insert('leave_applications', rec); this.afterCreate('leave_applications', rec); this.audit('created', 'leave_applications', this.user.name);
    return rec;
  },
  leaveTypes() { return this.rows('leave_types').map((t) => ({ id: t.id, label: t.name })); },
  myPayslips() {
    if (!this.user?.employeeId) return [];
    return this.rows('payslips').filter((p) => p.employee_id === this.user.employeeId).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  },
  myTasks() {
    if (!this.user?.employeeId) return [];
    return this.rows('tasks').filter((t) => t.assignee_id === this.user.employeeId).map((t) => ({ ...t, project: this.find('projects', t.project_id)?.name || '' }));
  },
  updateMyTask({ id, status }) {
    const t = this.find('tasks', id); if (!t) notFound('Task');
    if (t.assignee_id !== this.user.employeeId) deny('You can only update tasks assigned to you.');
    if (!['todo', 'in_progress', 'review', 'done'].includes(status)) bad('Unknown status.');
    this.s.update('tasks', t.id, { ...t, status, updated_at: nowStamp() }); this.audit('updated', 'tasks', t.title + ' → ' + status);
    return { ok: true };
  },
  leaveBalance({ employee_id, mine } = {}) {
    const mineOnly = mine || this.role?.self || !this.can('leave_applications', 'e'); const empId = mineOnly ? this.user.employeeId : employee_id;
    const types = this.rows('leave_types'); const year = String(new Date().getFullYear());
    const emps = empId ? [this.find('employees', empId)].filter(Boolean) : this.rows('employees').filter((e) => e.status !== 'terminated');
    const apps = this.rows('leave_applications').filter((a) => a.status === 'approved' && String(a.start).startsWith(year));
    return emps.map((e) => ({ employee: e, balances: types.map((t) => { const used = apps.filter((a) => a.employee_id === e.id && a.leave_type_id === t.id).reduce((s, a) => s + (a.days || 0), 0); return { type: t, entitled: t.days, used, left: t.days - used }; }) }));
  },
  decideLeave({ id, status }) {
    req(this, 'leave_applications', 'e');
    if (this.role?.self) deny('Only managers can approve leave.');
    const a = this.find('leave_applications', id); if (!a) notFound('Leave request');
    this.s.update('leave_applications', a.id, { ...a, status, approved_by: this.user.name });
    if (status === 'approved') { const e = this.find('employees', a.employee_id); if (e && a.start <= today() && a.end >= today()) this.s.update('employees', e.id, { ...e, status: 'on_leave' }); }
    this.audit('approved', 'leave_applications', status); return { ok: true };
  },
  runPayroll({ month }) {
    req(this, 'payslips', 'c');
    if (!month) bad('Choose a month.');
    const comps = this.rows('salary_components'); const existing = this.rows('payslips').filter((p) => p.month === month);
    let made = 0;
    for (const e of this.rows('employees').filter((e) => ['active', 'on_leave'].includes(e.status))) {
      if (existing.some((p) => p.employee_id === e.id)) continue;
      const mine = comps.filter((c) => c.employee_id === e.id && c.recurring);
      const allow = mine.filter((c) => ['allowance', 'commission'].includes(c.type)).reduce((s, c) => s + c.amount, 0);
      const ded = mine.filter((c) => ['deduction', 'loan', 'tax'].includes(c.type)).reduce((s, c) => s + c.amount, 0);
      const otMin = this.rows('attendance').filter((a) => a.employee_id === e.id).reduce((s, a) => s + (a.overtime_minutes || 0), 0);
      const ot = Math.round((e.basic_salary / 240) * 1.5 * (otMin / 60));
      const basic = e.basic_salary || 0;
      this.s.insert('payslips', { id: newId(), businessId: this.biz, created_at: nowStamp(), employee_id: e.id, month, basic, allowances: allow, deductions: ded, overtime: ot, service_charge: 0, net: basic + allow + ot - ded, status: 'draft' });
      made++;
    }
    this.audit('created', 'payslips', `Payroll ${month} (${made})`);
    return { made, message: made ? `${made} payslips created for ${month}. Review and mark them paid.` : `Payslips for ${month} already exist.` };
  },
  payPayroll({ month }) {
    req(this, 'payslips', 'e');
    const slips = this.rows('payslips').filter((p) => p.month === month && p.status === 'draft');
    if (!slips.length) bad('No draft payslips for ' + month + '.');
    slips.forEach((p) => this.s.update('payslips', p.id, { ...p, status: 'paid' }));
    const total = slips.reduce((s, p) => s + p.net, 0);
    this.s.insert('expenses', { id: newId(), businessId: this.biz, created_at: nowStamp(), date: today(), amount: total, category: 'Salaries', reference: 'PAYROLL-' + month, description: 'Salaries ' + month, status: 'paid' });
    return { paid: slips.length, total, message: `${slips.length} payslips paid. Expense of ${total} recorded.` };
  },

  // ------------------------------------------------ SALES / ACCOUNTING / CRM
  recordInvoicePayment({ invoice_id, amount, method = 'Bank transfer', account_id }) {
    req(this, 'customer_payments', 'c');
    const inv = this.find('sales_invoices', invoice_id); if (!inv) notFound('Invoice');
    const due = round(inv.total - (inv.paid || 0)); const amt = Number(amount);
    if (!(amt > 0)) bad('Enter an amount.'); if (amt > due) bad(`Only ${due} is still due on this invoice.`);
    this.create('customer_payments', { customer_id: inv.customer_id, invoice_id, amount: amt, date: today(), method, account_id: account_id || '', reference: 'CP' + Date.now().toString().slice(-6) });
    const paid = round((inv.paid || 0) + amt);
    this.s.update('sales_invoices', inv.id, { ...inv, paid, status: paid >= inv.total ? 'paid' : 'partially_paid' });
    if (account_id) { const b = this.find('bank_accounts', account_id); if (b) this.s.update('bank_accounts', b.id, { ...b, balance: (b.balance || 0) + amt }); }
    return { ok: true, message: paid >= inv.total ? 'Invoice fully paid.' : `Payment recorded. ${round(inv.total - paid)} still due.` };
  },
  payBill({ bill_id, amount, method = 'Bank transfer', account_id }) {
    req(this, 'vendor_payments', 'c');
    const b = this.find('purchase_invoices', bill_id); if (!b) notFound('Bill');
    const due = round(b.total - (b.paid || 0)); const amt = Number(amount);
    if (!(amt > 0)) bad('Enter an amount.'); if (amt > due) bad(`Only ${due} is still due on this bill.`);
    this.create('vendor_payments', { vendor_id: b.vendor_id, bill_id, amount: amt, date: today(), method, account_id: account_id || '', reference: 'VP' + Date.now().toString().slice(-6) });
    const paid = round((b.paid || 0) + amt);
    this.s.update('purchase_invoices', b.id, { ...b, paid, status: paid >= b.total ? 'paid' : 'partially_paid' });
    if (account_id) { const ba = this.find('bank_accounts', account_id); if (ba) this.s.update('bank_accounts', ba.id, { ...ba, balance: (ba.balance || 0) - amt }); }
    return { ok: true, message: paid >= b.total ? 'Bill fully paid.' : `Payment recorded. ${round(b.total - paid)} still due.` };
  },
  convertToInvoice({ from, id }) {
    req(this, 'sales_invoices', 'c');
    const src = this.find(from, id); if (!src) notFound();
    const inv = this.create('sales_invoices', { customer_id: src.customer_id, date: today(), due_date: iso(new Date(Date.now() + 14 * 864e5)), items: src.items, paid: 0, notes: `From ${src.number}`, status: 'sent' });
    this.s.update(from, src.id, { ...src, status: from === 'proposals' ? 'converted' : 'accepted' });
    return { invoice: inv, message: `${inv.number} created from ${src.number}.` };
  },
  convertLead({ lead_id }) {
    req(this, 'deals', 'c');
    const l = this.find('leads', lead_id); if (!l) notFound('Lead');
    const c = this.create('customers', { name: l.company || l.name, phone: l.phone, email: l.email, type: l.company ? 'company' : 'individual', status: 'active', loyalty_points: 0 });
    const d = this.create('deals', { name: (l.company || l.name) + ' deal', customer_id: c.id, value: l.value || 0, probability: 40, close_date: iso(new Date(Date.now() + 30 * 864e5)), owner: l.owner || this.user.name, stage: 'discovery' });
    this.s.update('leads', l.id, { ...l, stage: 'won' });
    return { deal: d, message: 'Lead converted to a customer and a new deal.' };
  },

  // ------------------------------------------------ PLATFORM
  approveBankTransfer({ id, status }) {
    if (!this.isSuper) deny();
    const t = this.s.get('bank_transfers', id); if (!t) notFound('Request');
    this.s.update('bank_transfers', id, { ...t, status });
    if (status === 'approved') { const plan = this.s.get('plans', t.plan_id); this.s.insert('subscriptions', { id: newId(), created_at: nowStamp(), number: 'ORD-' + Date.now().toString().slice(-5), business_id: t.business_id, plan_id: t.plan_id, cycle: 'monthly', amount: t.amount, gateway: 'Bank transfer', date: today(), status: 'paid' }); const b = this.s.get('businesses', t.business_id); if (b && plan) this.s.update('businesses', b.id, { ...b, plan_id: plan.id, status: 'active' }); }
    return { ok: true };
  },
  createBusiness(p) {
    if (!this.isSuper) deny();
    const b = this.create('businesses', { status: 'active', currency: 'LKR', country: 'Sri Lanka', ...p, slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    this.s.insert('settings', { id: newId(), businessId: b.id, data: defaultSettings(b) });
    if (p.owner_email && p.owner_password) ACTIONS.saveUser.call(this, { name: p.owner_name || 'Owner', email: p.owner_email, password: p.owner_password, role: 'business_owner', businessId: b.id });
    return b;
  },
  changePlan({ plan_id }) {
    if (!this.can('page:subscription')) deny();
    const b = this.business(); const plan = this.s.get('plans', plan_id); if (!plan) notFound('Plan');
    this.s.update('businesses', b.id, { ...b, plan_id });
    this.s.insert('subscriptions', { id: newId(), created_at: nowStamp(), number: 'ORD-' + Date.now().toString().slice(-5), business_id: b.id, plan_id, cycle: 'monthly', amount: plan.price_monthly, gateway: 'Stripe', date: today(), status: 'paid' });
    return { ok: true, message: `You are now on the ${plan.name} plan.` };
  },
  helpdeskMine() { return this.s.all('helpdesk_tickets').filter((t) => t.business_id === this.biz); },
  helpdeskCreate({ subject, message, priority = 'medium' }) {
    if (!subject) bad('Enter a subject.');
    const t = { id: newId(), created_at: nowStamp(), number: 'HD-' + (100 + this.s.all('helpdesk_tickets').length + 1), subject, message, priority, business_id: this.biz, category_id: '', status: 'open' };
    this.s.insert('helpdesk_tickets', t); return t;
  },

  // ------------------------------------------------ CUSTOMER PORTAL
  myBookings() {
    const cid = this.user.customerId; if (!cid) return [];
    return this.rows('reservations').filter((r) => r.guest_id === cid).map((r) => ({ ...r, room: this.find('rooms', r.room_id), room_type: this.find('room_types', r.room_type_id) })).sort((a, b) => b.check_in.localeCompare(a.check_in));
  },
  myOrders() {
    const cid = this.user.customerId; if (!cid) return { restaurant: [], shop: [], customer: null };
    return { restaurant: this.rows('restaurant_orders').filter((o) => o.customer_id === cid), shop: this.rows('shop_sales').filter((o) => o.customer_id === cid), customer: this.find('customers', cid), tiers: this.rows('loyalty_tiers') };
  },
};

// internal helpers are methods, not callable actions
Service.prototype.orderTotals = ACTIONS.orderTotals;
Service.prototype.loyalty = ACTIONS.loyalty;
delete ACTIONS.orderTotals;
delete ACTIONS.loyalty;

// =====================================================================
//  PUBLIC (no login) — QR menu, online booking, online store, forms
// =====================================================================
export function publicService(store, slug) {
  const b = store.all('businesses').find((x) => x.slug === slug && x.status !== 'suspended');
  if (!b) throw new ApiError(404, 'This page does not exist.');
  const sys = new Service(store, { user: { id: 'public', name: 'Online guest', role: 'super_admin' }, businessId: b.id });
  sys.audit = () => {};
  const st = sys.settings();
  const pub = { name: b.name, slug: b.slug, logo: st.logo_emoji, currency: st.currency_symbol || 'Rs', city: b.city, address: st.address, phone: st.phone, email: st.email, modules: b.modules, service_charge: st.service_charge, vat: st.vat, check_in_time: st.check_in_time, check_out_time: st.check_out_time };
  return {
    info: () => pub,
    menu: () => ({ business: pub, categories: sys.rows('menu_categories').filter((c) => c.status === 'active').sort((a, z) => a.order - z.order), items: sys.rows('menu_items').filter((m) => m.status === 'active'), tables: sys.rows('tables').map((t) => ({ id: t.id, name: t.name })) }),
    qrOrder: ({ table, items, guest_name, note }) => {
      if (!st.qr_ordering) throw new ApiError(422, 'Ordering from the table is switched off. Please call a waiter.');
      const t = sys.rows('tables').find((x) => x.name === table || x.id === table); if (!t) throw new ApiError(404, 'Table not found.');
      const r = ACTIONS.placeOrder.call(sys, { table_id: t.id, type: 'qr', items: items.map((i) => ({ ...i, note: i.note || note || '' })), waiter: 'QR guest', guest_name, source: 'qr' });
      return { number: r.order.number, total: r.order.total, status: r.order.status, order_id: r.order.id };
    },
    orderStatus: ({ order_id }) => { const o = sys.find('restaurant_orders', order_id); if (!o) throw new ApiError(404, 'Order not found.'); return { number: o.number, status: o.status, items: o.items, total: o.total, subtotal: o.subtotal, service_charge: o.service_charge, tax: o.tax }; },
    callWaiter: ({ table, kind }) => { const t = sys.rows('tables').find((x) => x.name === table); if (!t) throw new ApiError(404, 'Table not found.'); if (kind === 'bill') store.update('tables', t.id, { ...t, status: 'bill_requested' }); store.insert('service_calls', { id: newId(), businessId: b.id, created_at: nowStamp(), place: 'Table ' + t.name, kind: kind === 'bill' ? 'Bill' : kind === 'water' ? 'Water' : 'Waiter', note: '', created: nowStamp(), handled_by: '', status: 'open' }); sys.notify(kind === 'bill' ? 'Bill requested' : 'Waiter called', `Table ${t.name} ${kind === 'bill' ? 'asked for the bill' : 'needs a waiter'}`, 'restaurant', ['waiter', 'cashier', 'restaurant_manager']); return { ok: true }; },
    rooms: ({ check_in, check_out, guests = 1 }) => {
      const free = ACTIONS.availableRooms.call(sys, { check_in, check_out });
      const types = sys.rows('room_types');
      return { business: pub, nights: nights(check_in, check_out), types: types.map((t) => ({ ...t, available: free.filter((r) => r.room_type_id === t.id).length })).filter((t) => (t.max_adults || 2) + (t.max_children || 0) >= Number(guests)) };
    },
    book: ({ room_type_id, check_in, check_out, guest, adults, children, meal_plan, special_requests, pay_now, gateway }) => {
      if (!guest?.name || !guest?.email) throw new ApiError(422, 'Enter your name and email.');
      const free = ACTIONS.availableRooms.call(sys, { check_in, check_out, room_type_id });
      if (!free.length) throw new ApiError(422, 'Sorry, that room type just sold out for those dates.');
      const rt = sys.find('room_types', room_type_id);
      const existing = sys.rows('customers').find((c) => c.email && c.email.toLowerCase() === guest.email.toLowerCase());
      const total = rt.base_rate * nights(check_in, check_out);
      const res = ACTIONS.createBooking.call(sys, { guest_id: existing?.id, guest: existing ? undefined : { ...guest, type: 'individual' }, room_id: free[0].id, check_in, check_out, adults, children, meal_plan, rate: rt.base_rate, source: 'Website', special_requests, advance: pay_now ? total : 0, advance_method: 'Online' });
      return { number: res.number, total, paid: pay_now ? total : 0, gateway: pay_now ? gateway || 'Stripe' : null, room_type: rt.name, check_in, check_out };
    },
    store: () => ({ business: pub, categories: sys.rows('product_categories'), products: sys.rows('products').filter((p) => p.online && p.status === 'active').map((p) => ({ id: p.id, name: p.name, price: p.price, icon: p.icon, category_id: p.category_id, stock: p.stock, unit: p.unit })) }),
    storeOrder: ({ items, customer, pay_now, gateway }) => {
      if (!customer?.name || !customer?.phone) throw new ApiError(422, 'Enter your name and phone number.');
      let c = sys.rows('customers').find((x) => x.phone === customer.phone);
      if (!c) c = sys.create('customers', { name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '', type: 'individual', status: 'active', loyalty_points: 0 });
      const sale = ACTIONS.shopCheckout.call(sys, { items, customer_id: c.id, payment_method: pay_now ? 'Online' : 'Cash', channel: 'online', status: 'paid' });
      sys.notify('Online order', `${sale.number} from ${c.name} — ${customer.delivery ? 'delivery' : 'pickup'}`, 'shop');
      return { number: sale.number, total: sale.total, gateway: pay_now ? gateway || 'Stripe' : null };
    },
    form: ({ id }) => { const f = sys.find('forms', id); if (!f || f.status !== 'active') throw new ApiError(404, 'This form is closed.'); return { business: pub, form: { id: f.id, name: f.name, description: f.description, fields: String(f.fields || '').split('\n').filter(Boolean).map((l) => { const i = l.lastIndexOf(':'); return { label: l.slice(0, i), type: l.slice(i + 1) || 'text' }; }) } }; },
    submitForm: ({ id, answers, name }) => { const f = sys.find('forms', id); if (!f) throw new ApiError(404, 'Form not found.'); store.insert('form_responses', { id: newId(), businessId: b.id, created_at: nowStamp(), form_id: f.id, submitted_by: name || 'Anonymous', answers: Object.entries(answers || {}).map(([k, v]) => `${k}: ${v}`).join('\n'), date: nowStamp() }); store.update('forms', f.id, { ...f, responses: (f.responses || 0) + 1 }); return { ok: true }; },
    site: () => ({ business: pub, website: st.website || {}, rooms: sys.rows('room_types'), menu: sys.rows('menu_items').filter((m) => m.status === 'active' && m.available !== false).slice(0, 12), categories: sys.rows('menu_categories'), services: sys.rows('extra_services').filter((x) => x.status === 'active'), reviews: sys.rows('feedback').filter((f) => f.rating >= 4 && f.comment).slice(0, 6) }),
    roomInfo: ({ room }) => {
      const rm = sys.rows('rooms').find((x) => x.number === String(room)); if (!rm) throw new ApiError(404, 'Room not found.');
      const r = sys.rows('reservations').find((x) => x.room_id === rm.id && x.status === 'checked_in');
      const g = r ? sys.find('customers', r.guest_id) : null;
      const orders = r ? sys.rows('restaurant_orders').filter((o) => o.room_reservation_id === r.id && day3(o.date) === today()).map((o) => ({ number: o.number, status: o.status, total: o.total, items: o.items })) : [];
      return { business: pub, room: rm.number, occupied: !!r, guest_first_name: g?.first_name || '', check_out: r?.check_out, categories: sys.rows('menu_categories').filter((c) => c.status === 'active').sort((a, z) => a.order - z.order), items: sys.rows('menu_items').filter((m) => m.status === 'active'), orders, requests: r ? sys.rows('guest_requests').filter((q) => q.room === rm.number && q.status !== 'done') : [] };
    },
    roomOrder: ({ room, items, note }) => {
      const rm = sys.rows('rooms').find((x) => x.number === String(room)); if (!rm) throw new ApiError(404, 'Room not found.');
      const r = sys.rows('reservations').find((x) => x.room_id === rm.id && x.status === 'checked_in'); if (!r) throw new ApiError(422, 'Room service ordering is available to checked-in guests only. Please call reception.');
      if (!items?.length) throw new ApiError(422, 'Add at least one item.');
      const out = ACTIONS.placeOrder.call(sys, { type: 'room_service', room_reservation_id: r.id, room_no: rm.number, items: items.map((i) => ({ ...i, note: i.note || note || '' })), waiter: 'Room ' + rm.number, guest_name: sys.find('customers', r.guest_id)?.name, customer_id: r.guest_id, source: 'room', new_order: true });
      return { number: out.order.number, total: out.order.total, status: out.order.status };
    },
    roomRequest: ({ room, type, details }) => {
      const rm = sys.rows('rooms').find((x) => x.number === String(room)); if (!rm) throw new ApiError(404, 'Room not found.');
      const r = sys.rows('reservations').find((x) => x.room_id === rm.id && x.status === 'checked_in');
      const rec = sys.create('guest_requests', { room: rm.number, guest_name: r ? sys.find('customers', r.guest_id)?.name : 'Guest', type: type || 'Other', details: details || '', source: 'Room QR', priority: type === 'Maintenance / repair' ? 'urgent' : 'normal', created: nowStamp(), status: 'new' });
      return { ok: true, id: rec.id };
    },
    tablesAvailability: ({ date, time, guests = 2 }) => {
      if (!date || !time) throw new ApiError(422, 'Choose a date and time.');
      const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
      const taken = new Set(sys.rows('table_reservations').filter((x) => x.date === date && ['booked', 'seated'].includes(x.status) && Math.abs(toMin(x.time) - toMin(time)) < 120).map((x) => x.table_id));
      const now = date === today() && Math.abs(toMin(time) - (new Date().getHours() * 60 + new Date().getMinutes())) < 90;
      return { business: pub, areas: sys.rows('areas'), tables: sys.rows('tables').map((t) => ({ id: t.id, name: t.name, seats: t.seats, shape: t.shape, area_id: t.area_id, pos_x: t.pos_x, pos_y: t.pos_y, available: !taken.has(t.id) && t.seats >= Number(guests) && !(now && t.status !== 'free') })) };
    },
    bookTable: ({ table_id, date, time, guests, name, phone, occasion, notes }) => {
      if (!name || !phone) throw new ApiError(422, 'Enter your name and phone number.');
      const av = publicService(store, slug).tablesAvailability({ date, time, guests });
      const t = av.tables.find((x) => x.id === table_id); if (!t) throw new ApiError(404, 'Table not found.');
      if (!t.available) throw new ApiError(422, 'Sorry, that table was just taken. Please pick another.');
      const rec = sys.create('table_reservations', { customer_name: name, phone, date, time, guests: Number(guests) || 2, table_id, occasion: occasion || 'None', notes: notes || '', status: 'booked' });
      sys.notify('New table booking', `${name} · ${guests} guests · ${date} ${time} · ${t.name}`, 'restaurant', ['waiter', 'restaurant_manager']);
      return { ok: true, table: t.name, date, time, id: rec.id };
    },
    feedback: ({ name, rating, comment, source = 'online' }) => { store.insert('feedback', { id: newId(), businessId: b.id, created_at: nowStamp(), customer_name: name || 'Guest', source, rating: Number(rating) || 5, comment: comment || '', date: today(), status: 'new' }); sys.notify('New feedback', `${name || 'A guest'} rated ${rating}★`, 'customers'); return { ok: true }; },
  };
}

export const PUBLIC_ACTIONS = ['site', 'roomInfo', 'roomOrder', 'roomRequest', 'tablesAvailability', 'bookTable', 'info', 'menu', 'qrOrder', 'orderStatus', 'callWaiter', 'rooms', 'book', 'store', 'storeOrder', 'form', 'submitForm', 'feedback'];

/** Landing page + plans for the marketing home page */
export function landingData(store) {
  return { sections: store.all('landing_sections').filter((s) => s.status === 'visible').sort((a, b) => a.order - b.order), plans: store.all('plans').filter((p) => p.status === 'active'), faqs: [], platform: store.all('platform_settings')[0]?.data || {}, pages: store.all('custom_pages').filter((p) => p.status === 'published') };
}
