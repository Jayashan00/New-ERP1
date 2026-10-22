// Offline test of the shared business logic (no server needed): node tests/logic.test.mjs
import { buildSeed } from '../../shared/seed.js';
import { MemoryStore } from '../../shared/memstore.js';
import { Service, publicService } from '../../shared/service.js';
const ok = (c, m) => { console.log((c ? '✔' : '✘') + ' ' + m); if (!c) process.exitCode = 1; };
const db = buildSeed(); const st = new MemoryStore(db);
const U = (e) => db.users.find((u) => u.email === e);
for (const u of db.users) { const d = new Service(st, { user: u, businessId: u.businessId || 'b1' }).action('dashboard'); ok(d.kpis.length > 0, `dashboard ${u.role} (${u.email})`); }
const s = new Service(st, { user: U('gm@ceylonayu.lk') });
for (const r of ['profit-loss', 'balance-sheet', 'trial-balance', 'ledger', 'tax', 'hotel', 'restaurant', 'overview', 'hrm', 'budget', 'stock']) ok(!!s.action('report', { name: r }), 'report ' + r);
const tb = s.action('report', { name: 'trial-balance' }); ok(Math.round(tb.totalDebit) === Math.round(tb.totalCredit), 'trial balance balances');
const d0 = new Date().toISOString().slice(0, 10), d2 = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
const fr = s.action('availableRooms', { ready: true, check_in: d0, check_out: d2 });
const b = s.action('createBooking', { guest: { name: 'Walk In' }, room_id: fr[0].id, check_in: d0, check_out: d2, check_in_now: true }); ok(b.status === 'checked_in', 'walk-in check-in');
s.action('postCharge', { reservation_id: b.id, description: 'Dinner', amount: 5000 });
const co = s.action('checkOut', { reservation_id: b.id }); ok(co.balance === 0 && st.get('rooms', b.room_id).status === 'dirty', 'check-out settles bill and sends room to housekeeping');
const menu = s.list('menu_items').filter((m) => m.available); const t = s.list('tables').find((x) => x.status === 'free');
const po = s.action('placeOrder', { table_id: t.id, type: 'dine_in', items: [{ ref: menu[0].id, qty: 2 }, { ref: menu[menu.length - 1].id, qty: 1 }] }); ok(po.kots.length >= 1, 'order split into kitchen tickets by station: ' + po.kots.map((k) => k.station).join(', '));
po.kots.forEach((k) => s.action('kotStatus', { kot_id: k.id, status: 'ready' })); ok(s.get('restaurant_orders', po.order.id).status === 'ready', 'order ready when all tickets ready');
ok(s.action('payOrder', { order_id: po.order.id, method: 'Card' }).status === 'paid', 'order paid, table to cleaning');
ok(s.action('runPayroll', { month: 'March 2031' }).made > 0, 'payroll generated'); ok(s.action('payPayroll', { month: 'March 2031' }).paid > 0, 'payroll paid');
ok(s.action('nightAudit').status === 'closed', 'night audit closes the day');
let denied = false; try { new Service(st, { user: U('waiter@ceylonayu.lk') }).list('payslips'); } catch (e) { denied = e.status === 403; } ok(denied, 'waiter cannot read payslips');
const se = new Service(st, { user: U('staff@ceylonayu.lk') }); ok(se.list('leave_applications').every((l) => l.employee_id === U('staff@ceylonayu.lk').employeeId), 'employee sees only own leave');
const pub = publicService(st, 'ceylon-ayu'); ok(!!pub.qrOrder({ table: 'T10', items: [{ ref: menu[1].id, qty: 1 }] }).number, 'public QR order');
const rooms = pub.rooms({ check_in: '2031-03-01', check_out: '2031-03-03' }); ok(!!pub.book({ room_type_id: rooms.types[0].id, check_in: '2031-03-01', check_out: '2031-03-03', guest: { name: 'Web', email: 'w@x.com' }, pay_now: true }).number, 'public online booking');
// hotel-specific flows
const pub2 = publicService(st, 'ceylon-ayu');
const inh = db.reservations.find((r) => r.status === 'checked_in'); const rno = db.rooms.find((r) => r.id === inh.room_id).number;
const ro = pub2.roomOrder({ room: rno, items: [{ ref: menu[2].id, qty: 1 }] }); const rord = db.restaurant_orders.find((o) => o.number === ro.number);
const rk = db.kots.filter((k) => k.order_id === rord.id); ok(rk.every((k) => k.table === 'Room ' + rno), 'room-service ticket shows the room number');
rk.forEach((k) => { s.action('kotStatus', { kot_id: k.id, status: 'ready' }); s.action('kotStatus', { kot_id: k.id, status: 'served' }); });
ok(db.restaurant_orders.find((o) => o.id === rord.id).status === 'paid' && db.folio_charges.some((c) => c.reservation_id === inh.id && c.description.includes(ro.number)), 'served room-service order is charged to the room bill');
const slot = db.parking_slots.find((x) => x.status === 'free'); s.action('parkVehicle', { slot_id: slot.id, vehicle_no: 'kx-1' }); ok(st.get('parking_slots', slot.id).status === 'occupied', 'vehicle parked'); s.action('releaseVehicle', { slot_id: slot.id }); ok(st.get('parking_slots', slot.id).status === 'free', 'bay released');
ok(pub2.roomRequest({ room: rno, type: 'Extra towels' }).ok, 'guest request from room QR');
const av = pub2.tablesAvailability({ date: '2031-02-02', time: '19:00', guests: 2 }); ok(!!pub2.bookTable({ table_id: av.tables.find((t) => t.available).id, date: '2031-02-02', time: '19:00', guests: 2, name: 'A', phone: '1' }).table, '3D table booking');
ok(s.action('channelGrid', {}).types.length === 5, 'channel manager grid'); ok(s.action('guestBilling').length > 0, 'guest billing list');
