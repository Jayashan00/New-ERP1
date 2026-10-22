// Quick end-to-end check of the running API: node src/selftest.js [baseUrl]
const BASE = process.argv[2] || 'http://localhost:4000';
const j = async (path, opts = {}, token) => { const r = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) } }); const body = await r.json(); return { status: r.status, body }; };
const ok = (c, m) => { console.log((c ? '✔' : '✘') + ' ' + m); if (!c) process.exitCode = 1; };
const login = async (email, password = 'Demo@1234') => (await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })).body;
const sa = await login('owner@ceylonayu.lk', 'Admin@1234'); ok(sa.token, 'super admin login');
const bad = await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'gm@ceylonayu.lk', password: 'wrong' }) }); ok(bad.status === 401, 'wrong password rejected');
const owner = await login('gm@ceylonayu.lk'); ok(owner.business?.name, 'owner login → ' + owner.business?.name);
const rooms = await j('/api/r/rooms', {}, owner.token); ok(rooms.body.length > 0, 'owner lists rooms: ' + rooms.body.length);
const waiter = await login('waiter@ceylonayu.lk');
const ps = await j('/api/r/payslips', {}, waiter.token); ok(ps.status === 403, 'waiter blocked from payslips (403)');
const dash = await j('/api/a/dashboard', { method: 'POST', body: '{}' }, waiter.token); ok(dash.body.kpis?.length, 'waiter dashboard: ' + dash.body.summary);
const menu = await j('/api/public/ceylon-ayu/menu', { method: 'POST', body: '{}' }); ok(menu.body.items?.length, 'public QR menu: ' + menu.body.items?.length + ' items');
const sab = await j('/api/r/rooms', { headers: { 'x-business': 'b1' } }, sa.token); ok(sab.body.length > 0, 'super admin switched into Ceylon Ayu');
const noauth = await j('/api/r/rooms'); ok(noauth.status === 401, 'no token → 401');

// ---- business flows over HTTP
const act = (t, name, body = {}) => j('/api/a/' + name, { method: 'POST', body: JSON.stringify(body) }, t);
const fd = await login('reception@ceylonayu.lk');
const d0 = new Date().toISOString().slice(0, 10), d1 = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const free = await act(fd.token, 'availableRooms', { check_in: d0, check_out: d1, ready: true });
const bk = await act(fd.token, 'createBooking', { guest: { name: 'API Guest' }, room_id: free.body[0]?.id, check_in: d0, check_out: d1, check_in_now: true });
ok(bk.body.status === 'checked_in', 'walk-in booked and checked in: ' + bk.body.number);
const co = await act(fd.token, 'checkOut', { reservation_id: bk.body.id, method: 'Card' }); ok(co.body.balance === 0, 'checked out, balance 0');
const wt = await login('waiter@ceylonayu.lk');
const menu2 = (await j('/api/r/menu_items', {}, wt.token)).body.filter((m) => m.available);
const tables = (await j('/api/r/tables', {}, wt.token)).body.filter((t) => t.status === 'free');
const po = await act(wt.token, 'placeOrder', { table_id: tables[0].id, type: 'dine_in', items: [{ ref: menu2[0].id, qty: 2 }] }); ok(po.body.kots?.length, 'waiter order → ' + po.body.kots?.length + ' kitchen ticket(s)');
const ch = await login('chef@ceylonayu.lk'); const ks = await act(ch.token, 'kotStatus', { kot_id: po.body.kots[0].id, status: 'ready' }); ok(ks.status === 200, 'chef marked ticket ready');
const cs = await login('cashier@ceylonayu.lk'); const paid = await act(cs.token, 'payOrder', { order_id: po.body.order.id, method: 'Cash' }); ok(paid.body.status === 'paid', 'cashier took payment ' + paid.body.total);
const emp = await login('staff@ceylonayu.lk'); const ms = await act(emp.token, 'myPayslips'); ok(ms.body.length && ms.body.every((p) => p.employee_id === emp.user.employeeId), 'employee sees only own payslips (' + ms.body.length + ')');
const qr = await j('/api/public/ceylon-ayu/qrOrder', { method: 'POST', body: JSON.stringify({ table: 'T12', items: [{ ref: menu2[1].id, qty: 1 }] }) }); ok(qr.body.number, 'public QR order ' + qr.body.number);
const hr = await login('hr@ceylonayu.lk'); const pr = await act(hr.token, 'runPayroll', { month: 'January 2031' }); ok(pr.body.made > 0, pr.body.message);
