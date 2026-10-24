// =====================================================================
//  ANALYTICS — dashboards for every role and all reports.
//  Output is plain data; the UI renders KPIs, charts, lists, alerts.
// =====================================================================
import { iso } from './seed.js';

const today = () => iso(new Date());
const dOff = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const sum = (arr, f) => arr.reduce((s, x) => s + (Number(typeof f === 'function' ? f(x) : x[f]) || 0), 0);
const round = (n) => Math.round(n);
const day = (s) => String(s || '').slice(0, 10);
const count = (arr, f) => { const m = {}; for (const x of arr) { const k = typeof f === 'function' ? f(x) : x[f]; if (k == null || k === '') continue; m[k] = (m[k] || 0) + 1; } return m; };
const sumByKey = (arr, kf, vf) => { const m = {}; for (const x of arr) { const k = kf(x); if (k == null || k === '') continue; m[k] = (m[k] || 0) + (Number(vf(x)) || 0); } return m; };
const toPie = (obj, labeler = (k) => k) => Object.entries(obj).map(([k, v]) => ({ name: labeler(k), value: round(v) })).sort((a, b) => b.value - a.value);
const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const pretty = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const shortDay = (s) => new Date(s + 'T12:00').toLocaleDateString('en', { day: 'numeric', month: 'short' });
const series = (days, rowsByFn) => { const out = []; for (let i = days - 1; i >= 0; i--) { const d = dOff(-i); out.push({ name: shortDay(d), ...rowsByFn(d) }); } return out; };
const nights = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 864e5));
const monthKey = (s) => String(s || '').slice(0, 7);
const monthLabel = (k) => new Date(k + '-15').toLocaleDateString('en', { month: 'short', year: '2-digit' });
const lastMonths = (n) => { const out = []; const d = new Date(); d.setDate(15); for (let i = n - 1; i >= 0; i--) { const x = new Date(d); x.setMonth(d.getMonth() - i); out.push(iso(x).slice(0, 7)); } return out; };

function ctx(svc) {
  const R = (c) => svc.rows(c);
  const has = (m) => !!svc.business()?.modules?.includes(m);
  return { R, has, biz: svc.business(), st: svc.biz ? svc.settings() : {}, user: svc.user };
}

// --------------------------------------------------------------- module snapshots
function hotelSnap(R) {
  const rooms = R('rooms'); const res = R('reservations'); const t = today();
  const inHouse = res.filter((r) => r.status === 'checked_in');
  const arrivals = res.filter((r) => r.check_in === t && ['confirmed', 'tentative'].includes(r.status));
  const departures = res.filter((r) => r.check_out === t && r.status === 'checked_in');
  const occ = rooms.length ? Math.round((inHouse.length / rooms.length) * 100) : 0;
  const adr = inHouse.length ? sum(inHouse, 'rate') / inHouse.length : 0;
  const audits = R('night_audits');
  const roomRevToday = sum(R('folio_charges').filter((c) => c.date === t), 'amount');
  return { rooms, res, inHouse, arrivals, departures, occ, adr, revpar: rooms.length ? (adr * inHouse.length) / rooms.length : 0, audits, roomRevToday, statusCounts: count(rooms, 'status') };
}
function restSnap(R) {
  const orders = R('restaurant_orders'); const t = today();
  const paidToday = orders.filter((o) => o.status === 'paid' && day(o.date) === t);
  const open = orders.filter((o) => !['paid', 'cancelled'].includes(o.status));
  const tables = R('tables');
  return { orders, paidToday, open, tables, salesToday: sum(paidToday, 'total'), kots: R('kots'), lowIng: R('ingredients').filter((i) => i.stock <= i.reorder) };
}
function shopSnap(R) {
  const sales = R('shop_sales'); const t = today();
  const paid = sales.filter((s) => ['paid', 'credit', 'partially_refunded'].includes(s.status));
  const paidToday = paid.filter((s) => day(s.date) === t);
  const products = R('products');
  return { sales, paid, paidToday, salesToday: sum(paidToday, 'total'), products, low: products.filter((p) => p.stock <= p.reorder), expiring: R('batches').filter((b) => ['expiring', 'expired'].includes(b.status) || b.expiry <= dOff(30)) };
}
const revenueSeries = (R, has, days) => series(days, (d) => {
  const o = {};
  if (has('hotel')) o.Hotel = round(sum(R('folio_charges').filter((c) => c.date === d && c.category !== 'Restaurant'), 'amount'));
  if (has('restaurant')) o.Restaurant = round(sum(R('restaurant_orders').filter((x) => x.status === 'paid' && day(x.date) === d), 'total'));
  if (has('shop')) o.Shop = round(sum(R('shop_sales').filter((x) => ['paid', 'credit'].includes(x.status) && day(x.date) === d), 'total'));
  if (!has('hotel') && !has('restaurant') && !has('shop')) { o.Invoices = round(sum(R('sales_invoices').filter((x) => x.date === d), 'total')); o.Revenue = round(sum(R('revenues').filter((x) => x.date === d), 'amount')); }
  return o;
});
const seriesKeys = (has) => { const k = []; if (has('hotel')) k.push('Hotel'); if (has('restaurant')) k.push('Restaurant'); if (has('shop')) k.push('Shop'); if (!k.length) k.push('Invoices', 'Revenue'); return k.map((x) => ({ key: x, label: x })); };
const topItems = (orders, n = 8) => toPie(sumByKey(orders.flatMap((o) => o.items || []), (i) => i.name, (i) => i.qty)).slice(0, n);

// --------------------------------------------------------------- DASHBOARDS
const sing = (t) => String(t || '')
  .replace(/\b1 ((?:[a-z-]+ ){0,2}[a-z-]+)\(s\) need\b/g, '1 $1 needs')
  .replace(/\b1 ((?:[a-z-]+ ){0,2}[a-z-]+)\(s\)/g, '1 $1')
  .replace(/\(s\)/g, 's')
  .replace(/\b1 ((?:[a-z-]+ ){0,2}[a-z-]+?)s (are|need|wait|expire)\b/g, (m, w, v) => `1 ${w} ${({ are: 'is', need: 'needs', wait: 'waits', expire: 'expires' })[v]}`)
  .replace(/\b1 ([a-z-]{2,}?)s\b/g, '1 $1');
export function computeDashboard(svc) {
  const D = computeDashboardRaw(svc);
  D.summary = sing(D.summary); D.alerts = (D.alerts || []).map((a) => ({ ...a, text: sing(a.text) }));
  return D;
}
function computeDashboardRaw(svc) {
  const sym = (svc.biz ? svc.settings().currency_symbol : 'Rs') || 'Rs';
  const M = (n) => `${sym} ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
  const c = ctx(svc); const { R, has } = c; const type = svc.role?.dashboard || 'owner';
  const name = (svc.user?.name || '').split(' ')[0];
  const hour = new Date().getHours();
  const hello = `Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, ${name}`;
  const D = { type, hello, summary: '', kpis: [], charts: [], lists: [], actions: [], alerts: [] };
  const emp = (id) => R('employees').find((e) => e.id === id)?.name || '—';
  const cust = (id) => R('customers').find((e) => e.id === id)?.name || 'Walk-in';
  const room = (id) => R('rooms').find((e) => e.id === id)?.number || '—';
  const table = (id) => R('tables').find((e) => e.id === id)?.name || '—';

  if (type === 'platform') {
    const bz = svc.s.all('businesses'); const subs = svc.s.all('subscriptions'); const plans = svc.s.all('plans'); const users = svc.s.all('users');
    const mrr = sum(bz.filter((b) => b.status === 'active'), (b) => plans.find((p) => p.id === b.plan_id)?.price_monthly || 0);
    const pendingBT = svc.s.all('bank_transfers').filter((x) => x.status === 'pending');
    const openHD = svc.s.all('helpdesk_tickets').filter((x) => ['open', 'in_progress'].includes(x.status));
    D.summary = `${bz.length} businesses on the platform. ${pendingBT.length} bank transfers wait for approval and ${openHD.length} helpdesk tickets are open.`;
    D.kpis = [{ label: 'Businesses', value: bz.length, hint: `${bz.filter((b) => b.status === 'active').length} active` }, { label: 'Monthly recurring revenue', value: mrr, fmt: 'money' }, { label: 'Total users', value: users.length, hint: 'all logins' }, { label: 'Revenue this year', value: sum(subs.filter((s) => s.status === 'paid' && s.date >= dOff(-365)), 'amount'), fmt: 'money' }];
    D.charts = [
      { title: 'Subscription revenue by month', type: 'bar', data: lastMonths(12).map((m) => ({ name: monthLabel(m), Revenue: sum(subs.filter((s) => s.status === 'paid' && monthKey(s.date) === m), 'amount') })), series: [{ key: 'Revenue', label: 'Revenue' }], fmt: 'money', span: 2 },
      { title: 'Businesses by type', type: 'pie', data: toPie(count(bz, 'type'), pretty) },
      { title: 'Plan mix', type: 'pie', data: toPie(count(bz, (b) => plans.find((p) => p.id === b.plan_id)?.name)) },
    ];
    D.lists = [
      { title: 'Businesses', link: '/app/e/businesses', columns: ['Business', 'Type', 'Plan', 'Users', 'Status'], rows: bz.map((b) => [b.name, pretty(b.type), plans.find((p) => p.id === b.plan_id)?.name, users.filter((u) => u.businessId === b.id).length, { status: b.status }]) },
      { title: 'Latest subscription payments', link: '/app/e/subscriptions', columns: ['Order', 'Business', 'Amount', 'Status'], rows: subs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((s) => [s.number, bz.find((b) => b.id === s.business_id)?.name, { money: s.amount }, { status: s.status }]) },
    ];
    if (pendingBT.length) D.alerts.push({ text: `${pendingBT.length} bank transfer payment(s) need your approval`, to: '/app/e/bank_transfers', tone: 'warn' });
    if (openHD.length) D.alerts.push({ text: `${openHD.length} helpdesk ticket(s) from businesses are open`, to: '/app/e/helpdesk_tickets', tone: 'info' });
    D.actions = [{ label: 'Add a business', to: '/app/e/businesses?new=1', icon: 'Building2' }, { label: 'Manage plans', to: '/app/e/plans', icon: 'BadgeCheck' }, { label: 'All users', to: '/app/all-users', icon: 'Users' }, { label: 'Platform settings', to: '/app/platform-settings', icon: 'SlidersHorizontal' }];
    return D;
  }

  if (!svc.biz) { D.summary = 'Choose a business from the top bar to see its data.'; return D; }

  if (type === 'owner') {
    const kp = []; const parts = [];
    let revToday = 0;
    if (has('hotel')) { const h = hotelSnap(R); revToday += h.roomRevToday; kp.push({ label: 'Occupancy today', value: h.occ, fmt: 'percent', hint: `${h.inHouse.length} of ${h.rooms.length} rooms` }); parts.push(`${h.arrivals.length} arrivals and ${h.departures.length} departures`); }
    if (has('restaurant')) { const r = restSnap(R); revToday += r.salesToday; kp.push({ label: 'Open restaurant orders', value: r.open.length, hint: `${r.tables.filter((t) => t.status === 'occupied').length} tables busy` }); parts.push(`${r.open.length} open restaurant orders`); }
    if (has('shop')) { const s = shopSnap(R); revToday += s.salesToday; kp.push({ label: 'Products low on stock', value: s.low.length, tone: s.low.length ? 'warn' : 'ok' }); }
    const present = R('attendance').filter((a) => a.date === today() && a.clock_in).length;
    const recv = sum(R('sales_invoices').filter((i) => i.status !== 'paid' && i.status !== 'draft'), (i) => i.total - (i.paid || 0));
    D.kpis = [{ label: "Today's revenue", value: revToday, fmt: 'money', hint: 'all outlets' }, ...kp, { label: 'Staff at work', value: present, hint: `of ${R('employees').filter((e) => e.status === 'active').length} active` }, { label: 'Customers owe you', value: recv, fmt: 'money' }].slice(0, 6);
    D.summary = `Today: ${parts.join(', ') || 'business as usual'}. ${present} staff have clocked in.`;
    D.charts.push({ title: 'Revenue — last 14 days', type: 'bar', stacked: true, data: revenueSeries(R, has, 14), series: seriesKeys(has), fmt: 'money', span: 2 });
    const split = {}; for (const row of revenueSeries(R, has, 30)) for (const [k, v] of Object.entries(row)) if (k !== 'name') split[k] = (split[k] || 0) + v;
    D.charts.push({ title: 'Revenue split — 30 days', type: 'pie', data: toPie(split), fmt: 'money' });
    const months = lastMonths(6);
    D.charts.push({ title: 'Income vs expenses — 6 months', type: 'line', data: months.map((m) => ({ name: monthLabel(m), Income: round(sum(R('revenues').filter((r) => monthKey(r.date) === m), 'amount') + sum(R('restaurant_orders').filter((o) => o.status === 'paid' && monthKey(o.date) === m), 'total') + sum(R('shop_sales').filter((o) => o.status === 'paid' && monthKey(o.date) === m), 'total') + sum(R('folio_charges').filter((o) => monthKey(o.date) === m), 'amount') + sum(R('sales_invoices').filter((o) => monthKey(o.date) === m && o.status !== 'draft'), 'total')), Expenses: round(sum(R('expenses').filter((e) => monthKey(e.date) === m), 'amount') + sum(R('purchase_invoices').filter((e) => monthKey(e.date) === m), 'total')) })), series: [{ key: 'Income', label: 'Income' }, { key: 'Expenses', label: 'Expenses' }], fmt: 'money', span: 2 });
    if (has('hotel')) { const h = hotelSnap(R); D.lists.push({ title: 'Arriving today', link: '/app/front-desk', columns: ['Guest', 'Room', 'Nights', 'Source'], rows: h.arrivals.map((r) => [cust(r.guest_id), room(r.room_id), nights(r.check_in, r.check_out), r.source]), empty: 'No arrivals today.' }); }
    if (has('restaurant')) { const r = restSnap(R); D.charts.push({ title: 'Best-selling dishes — 30 days', type: 'hbar', data: topItems(r.orders.filter((o) => o.status === 'paid')), series: [{ key: 'value', label: 'Portions' }] }); }
    if (has('shop')) { const s = shopSnap(R); if (s.low.length) D.alerts.push({ text: `${s.low.length} products at or below reorder level`, to: '/app/stock-levels', tone: 'warn' }); }
    const pendLeave = R('leave_applications').filter((l) => l.status === 'pending').length; if (pendLeave) D.alerts.push({ text: `${pendLeave} leave request(s) waiting for approval`, to: '/app/e/leave_applications', tone: 'info' });
    const overdue = R('sales_invoices').filter((i) => i.status === 'overdue' || (i.status !== 'paid' && i.due_date < today() && i.status !== 'draft')).length; if (overdue) D.alerts.push({ text: `${overdue} sales invoice(s) are overdue`, to: '/app/e/sales_invoices', tone: 'bad' });
    if (has('hotel')) { const dirty = R('rooms').filter((r) => r.status === 'dirty').length; if (dirty) D.alerts.push({ text: `${dirty} rooms are dirty and not yet cleaned`, to: '/app/housekeeping-board', tone: 'warn' }); }
    if (has('restaurant')) { const li = restSnap(R).lowIng.length; if (li) D.alerts.push({ text: `${li} kitchen ingredients are running low`, to: '/app/e/ingredients', tone: 'warn' }); }
    D.lists.push({ title: 'Latest activity', link: '/app/e/audit_log', columns: ['Who', 'Did', 'What', 'When'], rows: R('audit_log').slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map((a) => [a.user_name, pretty(a.action), `${a.entity} ${a.record}`, { datetime: a.date }]) });
    D.actions = [{ label: 'Front desk — today’s guests', to: '/app/front-desk', icon: 'ConciergeBell' }, { label: 'Restaurant tables', to: '/app/floor-plan', icon: 'LayoutGrid' }, { label: 'Money & reports', to: '/app/reports', icon: 'BarChart3' }, { label: 'Add a staff login', to: '/app/users', icon: 'UserPlus' }, { label: 'Who can do what (roles)', to: '/app/roles', icon: 'ShieldCheck' }, { label: 'Edit the website', to: '/app/website', icon: 'Image' }];
    return D;
  }

  if (type === 'hotel' || type === 'frontdesk') {
    const h = hotelSnap(R);
    D.summary = `Today: ${pl(h.arrivals.length, 'guest arrives', 'guests arrive')}, ${pl(h.departures.length, 'guest checks out', 'guests check out')} and ${pl(h.inHouse.length, 'guest is', 'guests are')} staying with us. ${pl(h.statusCounts.available || 0, 'room is', 'rooms are')} clean and ready to sell.`;
    D.kpis = [{ label: 'Occupancy', value: h.occ, fmt: 'percent', hint: `${h.inHouse.length}/${h.rooms.length} rooms` }, { label: 'Arrivals today', value: h.arrivals.length }, { label: 'Departures today', value: h.departures.length }, { label: 'Available rooms', value: h.statusCounts.available || 0, tone: 'ok' }];
    if (type === 'hotel') D.kpis.push({ label: 'Average daily rate', value: h.adr, fmt: 'money' }, { label: 'RevPAR', value: h.revpar, fmt: 'money' });
    D.lists.push({ title: 'Arriving today', link: '/app/front-desk', columns: ['Booking', 'Guest', 'Room', 'Nights', 'Status'], rows: h.arrivals.map((r) => [r.number, cust(r.guest_id), room(r.room_id), nights(r.check_in, r.check_out), { status: r.status }]), empty: 'No more arrivals today.' });
    D.lists.push({ title: 'Leaving today', link: '/app/front-desk', columns: ['Booking', 'Guest', 'Room'], rows: h.departures.map((r) => [r.number, cust(r.guest_id), room(r.room_id)]), empty: 'No departures left today.' });
    D.charts.push({ title: 'Room status now', type: 'pie', data: toPie(h.statusCounts, pretty) });
    const slots = R('parking_slots'); const reqs = R('guest_requests').filter((q) => q.status !== 'done');
    if (slots.length) D.kpis.push({ label: 'Parking free', value: slots.filter((x) => x.status === 'free').length, hint: `of ${slots.length} bays` });
    if (reqs.length) D.alerts.push({ text: `${reqs.length} guest requests are waiting`, to: '/app/e/guest_requests?view=board', tone: reqs.some((q) => q.priority === 'urgent') ? 'bad' : 'warn' });
    const trips = R('transport_bookings').filter((t) => String(t.pickup_time).slice(0, 10) === today() && !['completed', 'cancelled'].includes(t.status));
    if (trips.length) D.lists.push({ title: 'Taxis & transfers today', link: '/app/e/transport_bookings?view=board', columns: ['Time', 'Guest', 'Trip', 'Status'], rows: trips.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time)).map((t) => [String(t.pickup_time).slice(11, 16), t.guest_name, t.type, { status: t.status }]) });
    if (type === 'hotel') {
      D.charts.unshift({ title: 'Occupancy & room revenue — 30 days', type: 'combo', data: h.audits.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-30).map((a) => ({ name: shortDay(a.date), 'Room revenue': a.room_revenue, Occupancy: a.occupancy })), series: [{ key: 'Room revenue', label: 'Room revenue' }, { key: 'Occupancy', label: 'Occupancy %', axis: 'right' }], fmt: 'money', span: 2 });
      D.charts.push({ title: 'Where bookings come from', type: 'pie', data: toPie(count(h.res.filter((r) => r.check_in >= dOff(-60)), 'source')) });
      const mt = R('maintenance').filter((m) => m.status !== 'resolved').length; if (mt) D.alerts.push({ text: `${mt} maintenance jobs open`, to: '/app/e/maintenance', tone: 'warn' });
      const chErr = R('channels').filter((x) => x.status === 'error'); if (chErr.length) D.alerts.push({ text: `${chErr.map((x) => x.name).join(', ')} channel sync failed`, to: '/app/e/channels', tone: 'bad' });
    }
    const dirty = h.statusCounts.dirty || 0; if (dirty) D.alerts.push({ text: `${pl(dirty, 'room needs', 'rooms need')} cleaning before ${dirty === 1 ? 'it' : 'they'} can be sold`, to: '/app/housekeeping-board', tone: 'warn' });
    D.actions = [{ label: 'Check a guest in', to: '/app/front-desk', icon: 'ConciergeBell' }, { label: 'Make a new booking', to: '/app/new-booking', icon: 'CalendarPlus' }, { label: 'Take a payment / check out', to: '/app/guest-billing', icon: 'Receipt' }, { label: 'See all rooms by date', to: '/app/room-chart', icon: 'CalendarRange' }, { label: 'Book a taxi', to: '/app/e/transport_bookings?new=1', icon: 'Car' }, { label: 'Park a guest’s car', to: '/app/parking', icon: 'ParkingSquare' }];
    if (type === 'hotel') D.actions.push({ label: 'Update prices on booking sites', to: '/app/channel-manager', icon: 'Share2' }, { label: 'Close the day (night audit)', to: '/app/night-audit', icon: 'MoonStar' });
    return D;
  }

  if (type === 'concierge') {
    const trips = R('transport_bookings'); const slots = R('parking_slots'); const reqs = R('guest_requests').filter((q) => q.status !== 'done');
    const todayTrips = trips.filter((t) => String(t.pickup_time).slice(0, 10) === today() && t.status !== 'cancelled');
    D.summary = `${pl(todayTrips.length, 'transfer', 'transfers')} today, ${trips.filter((t) => t.status === 'on_trip').length} on the road now. ${pl(slots.filter((x) => x.status === 'free').length, 'parking bay', 'parking bays')} free and ${pl(reqs.length, 'guest request', 'guest requests')} open.`;
    D.kpis = [{ label: 'Transfers today', value: todayTrips.length }, { label: 'Waiting for a driver', value: trips.filter((t) => ['requested', 'confirmed'].includes(t.status)).length, tone: 'warn' }, { label: 'Parking free', value: slots.filter((x) => x.status === 'free').length, hint: `of ${slots.length}`, tone: 'ok' }, { label: 'Guest requests open', value: reqs.length, tone: reqs.length ? 'warn' : 'ok' }];
    D.lists.push({ title: 'Transfers today', link: '/app/e/transport_bookings?view=board', columns: ['Time', 'Guest', 'Trip', 'Status'], rows: todayTrips.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time)).map((t) => [String(t.pickup_time).slice(11, 16), t.guest_name, t.type, { status: t.status }]), empty: 'No transfers today.' });
    D.lists.push({ title: 'Guest requests', link: '/app/e/guest_requests?view=board', columns: ['Room', 'Request', 'Status'], rows: reqs.map((q) => [q.room, q.type, { status: q.status }]), empty: 'All requests handled.' });
    D.charts.push({ title: 'Parking now', type: 'pie', data: toPie(count(slots, 'status'), pretty) });
    D.actions = [{ label: 'Book a taxi', to: '/app/e/transport_bookings?new=1', icon: 'Car' }, { label: 'Park a car', to: '/app/parking', icon: 'ParkingSquare' }, { label: 'Guest requests', to: '/app/e/guest_requests?view=board', icon: 'BellRing' }, { label: 'All trips', to: '/app/e/transport_bookings?view=board', icon: 'Bus' }];
    return D;
  }

  if (type === 'housekeeping') {
    const tasks = R('housekeeping').filter((t) => !['inspected'].includes(t.status));
    const mine = tasks.filter((t) => t.assigned_to === svc.user.employeeId || !t.assigned_to);
    const sc = count(R('rooms'), 'status');
    D.summary = `${sc.dirty || 0} rooms are dirty and ${sc.cleaning || 0} ${(sc.cleaning || 0) === 1 ? 'is' : 'are'} being cleaned. ${mine.filter((t) => t.status === 'pending').length} jobs are waiting for you.`;
    D.kpis = [{ label: 'Dirty rooms', value: sc.dirty || 0, tone: sc.dirty ? 'warn' : 'ok' }, { label: 'Being cleaned', value: sc.cleaning || 0 }, { label: 'My pending jobs', value: mine.filter((t) => t.status === 'pending').length }, { label: 'Ready rooms', value: sc.available || 0, tone: 'ok' }];
    D.lists.push({ title: 'My cleaning jobs', link: '/app/housekeeping-board', columns: ['Room', 'Task', 'Priority', 'Status'], rows: mine.map((t) => [room(t.room_id), t.task, pretty(t.priority), { status: t.status }]), empty: 'All done — nice work!' });
    D.charts.push({ title: 'Rooms by status', type: 'pie', data: toPie(sc, pretty) });
    D.actions = [{ label: 'See rooms to clean', to: '/app/housekeeping-board', icon: 'Sparkles' }, { label: 'Guest requests', to: '/app/e/guest_requests?view=board', icon: 'BellRing' }, { label: 'Report a repair', to: '/app/e/maintenance?new=1', icon: 'Wrench' }, { label: 'Log a lost item', to: '/app/e/lost_found?new=1', icon: 'Search' }];
    return D;
  }

  if (type === 'restaurant' || type === 'cashier' || type === 'waiter' || type === 'kitchen') {
    const r = restSnap(R); const s = has('shop') ? shopSnap(R) : null;
    if (type === 'kitchen') {
      const live = r.kots.filter((k) => ['new', 'preparing'].includes(k.status));
      D.summary = `${live.filter((k) => k.status === 'new').length} new tickets and ${live.filter((k) => k.status === 'preparing').length} in preparation. ${r.lowIng.length} ingredients are low.`;
      D.kpis = [{ label: 'New tickets', value: live.filter((k) => k.status === 'new').length, tone: 'warn' }, { label: 'Preparing', value: live.filter((k) => k.status === 'preparing').length }, { label: 'Ready to serve', value: r.kots.filter((k) => k.status === 'ready').length, tone: 'ok' }, { label: 'Low ingredients', value: r.lowIng.length, tone: r.lowIng.length ? 'bad' : 'ok' }];
      D.charts.push({ title: 'Live tickets by station', type: 'bar', data: toPie(count(live, 'station')).map((x) => ({ name: x.name, Tickets: x.value })), series: [{ key: 'Tickets', label: 'Tickets' }] });
      D.lists.push({ title: 'Low ingredients', link: '/app/e/ingredients', columns: ['Ingredient', 'In stock', 'Reorder at'], rows: r.lowIng.map((i) => [i.name, `${i.stock} ${i.unit}`, `${i.reorder} ${i.unit}`]), empty: 'Kitchen stock is fine.' });
      D.charts.push({ title: 'Most cooked today', type: 'hbar', data: topItems(r.orders.filter((o) => day(o.date) === today())), series: [{ key: 'value', label: 'Portions' }] });
      D.actions = [{ label: 'See new kitchen orders', to: '/app/kitchen-display', icon: 'ChefHat' }, { label: 'Mark a dish sold out', to: '/app/e/menu_items', icon: 'Ban' }, { label: 'Check kitchen stock', to: '/app/e/ingredients', icon: 'PackageSearch' }, { label: 'Recipes', to: '/app/e/recipes', icon: 'BookOpen' }];
      return D;
    }
    if (type === 'waiter') {
      const mine = r.open.filter((o) => o.waiter === svc.user.name);
      const ready = r.open.filter((o) => o.status === 'ready');
      D.summary = `You have ${mine.length} open tables. ${ready.length} orders are ready to serve and ${r.tables.filter((t) => t.status === 'free').length} tables are free.`;
      D.kpis = [{ label: 'My open orders', value: mine.length }, { label: 'Ready to serve', value: ready.length, tone: ready.length ? 'warn' : 'ok' }, { label: 'Free tables', value: r.tables.filter((t) => t.status === 'free').length, tone: 'ok' }, { label: 'Bills requested', value: r.tables.filter((t) => t.status === 'bill_requested').length }];
      const calls = R('service_calls').filter((c) => c.status !== 'done'); if (calls.length) D.alerts.push({ text: `${calls.length} table or room calls are waiting`, to: '/app/service-board', tone: 'bad' });
      D.lists.push({ title: 'Ready to serve now', link: '/app/service-board', columns: ['Table', 'Order', 'Items'], rows: ready.map((o) => [table(o.table_id), o.number, o.items.length]), empty: 'Nothing waiting at the pass.' });
      D.lists.push({ title: 'Table bookings today', link: '/app/e/table_reservations', columns: ['Time', 'Guest', 'Guests', 'Table'], rows: R('table_reservations').filter((x) => x.date === today() && x.status === 'booked').sort((a, b) => a.time.localeCompare(b.time)).map((x) => [x.time, x.customer_name, x.guests, table(x.table_id)]), empty: 'No bookings today.' });
      D.lists.push({ title: 'Waitlist', link: '/app/e/waitlist', columns: ['Guest', 'Party', 'Quoted'], rows: R('waitlist').filter((w) => w.status === 'waiting').map((w) => [w.customer_name, w.guests, w.quoted_minutes + ' min']), empty: 'Nobody waiting.' });
      D.actions = [{ label: 'Take an order', to: '/app/restaurant-pos', icon: 'MonitorSmartphone' }, { label: 'Dishes ready & table calls', to: '/app/service-board', icon: 'BellRing' }, { label: 'See all tables', to: '/app/floor-plan', icon: 'LayoutGrid' }, { label: 'Add guest to waitlist', to: '/app/e/waitlist?new=1', icon: 'Clock' }];
      return D;
    }
    if (type === 'cashier') {
      const myR = r.paidToday; const myS = s ? s.paidToday : [];
      const all = [...myR.map((o) => ({ m: o.payment_method, t: o.total })), ...myS.map((o) => ({ m: o.payment_method, t: o.total }))];
      D.summary = `Today's takings so far: ${M(sum(all, 't'))}. ${r.tables.filter((t) => t.status === 'bill_requested').length} tables are asking for the bill.`;
      D.kpis = [{ label: 'Restaurant takings today', value: r.salesToday, fmt: 'money' }, s && { label: 'Shop takings today', value: s.salesToday, fmt: 'money' }, { label: 'Bills to settle', value: r.open.filter((o) => ['served', 'ready'].includes(o.status)).length, tone: 'warn' }, s && { label: 'Held sales', value: s.sales.filter((x) => x.status === 'held').length }].filter(Boolean);
      D.charts.push({ title: 'Payment methods today', type: 'pie', data: toPie(sumByKey(all, (x) => x.m || 'Other', (x) => x.t)), fmt: 'money' });
      D.lists.push({ title: 'Tables waiting to pay', link: '/app/restaurant-pos', columns: ['Table', 'Order', 'Amount', 'Status'], rows: r.open.filter((o) => ['served', 'ready'].includes(o.status) || r.tables.find((t) => t.id === o.table_id)?.status === 'bill_requested').map((o) => [table(o.table_id), o.number, { money: o.total }, { status: o.status }]), empty: 'No open bills.' });
      D.actions = [{ label: 'Take payment for a table', to: '/app/restaurant-pos', icon: 'MonitorSmartphone' }, { label: 'Guest room bills', to: '/app/guest-billing', icon: 'Receipt' }, { label: 'See all tables', to: '/app/floor-plan', icon: 'LayoutGrid' }];
      return D;
    }
    // restaurant manager
    const paid30 = r.orders.filter((o) => o.status === 'paid' && day(o.date) >= dOff(-29));
    const avg = paid30.length ? sum(paid30, 'total') / paid30.length : 0;
    D.summary = `${r.open.length} orders are open across ${r.tables.filter((t) => t.status === 'occupied').length} busy tables. Sales today: ${M(r.salesToday)}.`;
    D.kpis = [{ label: 'Sales today', value: r.salesToday, fmt: 'money' }, { label: 'Orders today', value: r.orders.filter((o) => day(o.date) === today()).length }, { label: 'Average bill (30d)', value: avg, fmt: 'money' }, { label: 'Tables occupied', value: r.tables.filter((t) => ['occupied', 'bill_requested'].includes(t.status)).length, hint: `of ${r.tables.length}` }, { label: 'Food cost alerts', value: r.lowIng.length, tone: r.lowIng.length ? 'warn' : 'ok', hint: 'low ingredients' }];
    D.charts.push({ title: 'Restaurant sales — 14 days', type: 'area', data: series(14, (d) => ({ Sales: round(sum(r.orders.filter((o) => o.status === 'paid' && day(o.date) === d), 'total')) })), series: [{ key: 'Sales', label: 'Sales' }], fmt: 'money', span: 2 });
    D.charts.push({ title: 'Orders by type', type: 'pie', data: toPie(count(paid30, 'type'), pretty) });
    D.charts.push({ title: 'Busy hours (30 days)', type: 'bar', data: Array.from({ length: 16 }, (_, i) => i + 7).map((h) => ({ name: h + ':00', Orders: paid30.filter((o) => Number(String(o.date).slice(11, 13)) === h).length })), series: [{ key: 'Orders', label: 'Orders' }] });
    D.charts.push({ title: 'Top dishes', type: 'hbar', data: topItems(paid30), series: [{ key: 'value', label: 'Portions' }] });
    if (r.lowIng.length) D.alerts.push({ text: `${r.lowIng.length} ingredients below reorder level`, to: '/app/e/ingredients', tone: 'warn' });
    const unavailable = R('menu_items').filter((m) => m.available === false).length; if (unavailable) D.alerts.push({ text: `${unavailable} menu items are marked unavailable`, to: '/app/e/menu_items', tone: 'info' });
    D.actions = [{ label: 'Take an order', to: '/app/restaurant-pos', icon: 'MonitorSmartphone' }, { label: 'See all tables', to: '/app/floor-plan', icon: 'LayoutGrid' }, { label: 'Kitchen orders', to: '/app/kitchen-display', icon: 'ChefHat' }, { label: 'Change the menu', to: '/app/e/menu_items', icon: 'BookOpen' }, { label: 'Print table QR codes', to: '/app/qr-codes', icon: 'QrCode' }, { label: 'Sales report', to: '/app/restaurant-reports', icon: 'PieChart' }];
    return D;
  }

  if (type === 'shop' || type === 'store') {
    const s = shopSnap(R);
    if (type === 'store') {
      const pos = R('purchase_orders').filter((p) => ['sent', 'partially_received'].includes(p.status));
      if (!s.products.length) { const ing = R('ingredients').filter((i) => i.stock <= i.reorder); const bar = R('bar_stock').filter((x) => (x.bottles || 0) <= 2);
        D.summary = `${ing.length} kitchen items and ${bar.length} bar items need reordering. ${pos.length} purchase orders are on the way.`;
        D.kpis = [{ label: 'Kitchen items low', value: ing.length, tone: ing.length ? 'warn' : 'ok' }, { label: 'Bar items low', value: bar.length, tone: bar.length ? 'warn' : 'ok' }, { label: 'Orders on the way', value: pos.length }, { label: 'Store transfers pending', value: R('transfers').filter((t) => t.status !== 'received').length }];
        D.lists.push({ title: 'Kitchen stock to reorder', link: '/app/e/ingredients', columns: ['Item', 'In stock', 'Reorder at'], rows: ing.map((i) => [i.name, `${i.stock} ${i.unit}`, `${i.reorder} ${i.unit}`]), empty: 'Kitchen stock is fine.' });
        D.lists.push({ title: 'Purchase orders to receive', link: '/app/e/purchase_orders', columns: ['PO', 'Supplier', 'Expected'], rows: pos.map((p) => [p.number, R('vendors').find((v) => v.id === p.vendor_id)?.name, { date: p.expected }]), empty: 'Nothing pending.' });
        D.actions = [{ label: 'Goods arrived — receive them', to: '/app/e/purchase_orders', icon: 'Truck' }, { label: 'Order from a supplier', to: '/app/e/purchase_orders?new=1', icon: 'PackagePlus' }, { label: 'What is running low', to: '/app/stock-levels', icon: 'PackageSearch' }];
        return D; }
      D.summary = `${s.low.length} products need reordering, ${s.expiring.length} batches expire within 30 days and ${pos.length} purchase orders are on the way.`;
      D.kpis = [{ label: 'Low stock items', value: s.low.length, tone: s.low.length ? 'warn' : 'ok' }, { label: 'Expiring batches', value: s.expiring.length, tone: s.expiring.length ? 'bad' : 'ok' }, { label: 'Orders on the way', value: pos.length }, { label: 'Transfers in transit', value: R('transfers').filter((t) => t.status === 'in_transit').length }];
      D.lists.push({ title: 'Reorder these', link: '/app/stock-levels', columns: ['Product', 'In stock', 'Reorder at'], rows: s.low.map((p) => [p.name, p.stock, p.reorder]), empty: 'All stock is healthy.' });
      D.lists.push({ title: 'Expiring soon', link: '/app/e/batches', columns: ['Batch', 'Product', 'Expires'], rows: s.expiring.map((b) => [b.batch_no, s.products.find((p) => p.id === b.product_id)?.name, { date: b.expiry }]), empty: 'Nothing expiring.' });
      D.lists.push({ title: 'Purchase orders to receive', link: '/app/e/purchase_orders', columns: ['PO', 'Supplier', 'Expected'], rows: pos.map((p) => [p.number, R('vendors').find((v) => v.id === p.vendor_id)?.name, { date: p.expected }]), empty: 'Nothing pending.' });
      D.actions = [{ label: 'Stock levels', to: '/app/stock-levels', icon: 'PackageSearch' }, { label: 'Adjust stock', to: '/app/e/stock_adjustments?new=1', icon: 'SlidersHorizontal' }, { label: 'Print barcodes', to: '/app/barcode-labels', icon: 'Barcode' }, { label: 'Receive goods', to: '/app/e/purchase_orders', icon: 'Truck' }];
      return D;
    }
    const p30 = s.paid.filter((x) => day(x.date) >= dOff(-29));
    const margin = sum(p30.flatMap((x) => x.items), (i) => (i.price - (s.products.find((p) => p.id === i.ref)?.cost || 0)) * i.qty);
    D.summary = `Shop sales today: ${M(s.salesToday)} from ${s.paidToday.length} receipts. ${s.low.length} products need reordering.`;
    D.kpis = [{ label: 'Sales today', value: s.salesToday, fmt: 'money' }, { label: 'Receipts today', value: s.paidToday.length }, { label: 'Average basket (30d)', value: p30.length ? sum(p30, 'total') / p30.length : 0, fmt: 'money' }, { label: 'Gross margin (30d)', value: margin, fmt: 'money' }, { label: 'Low stock', value: s.low.length, tone: s.low.length ? 'warn' : 'ok' }];
    D.charts.push({ title: 'Shop sales — 14 days', type: 'area', data: series(14, (d) => ({ Sales: round(sum(s.paid.filter((x) => day(x.date) === d), 'total')) })), series: [{ key: 'Sales', label: 'Sales' }], fmt: 'money', span: 2 });
    D.charts.push({ title: 'Sales by category', type: 'pie', data: toPie(sumByKey(p30.flatMap((x) => x.items), (i) => R('product_categories').find((c) => c.id === s.products.find((p) => p.id === i.ref)?.category_id)?.name, (i) => i.total)), fmt: 'money' });
    D.charts.push({ title: 'Top products', type: 'hbar', data: topItems(p30), series: [{ key: 'value', label: 'Units' }] });
    D.lists.push({ title: 'Low stock', link: '/app/stock-levels', columns: ['Product', 'In stock', 'Reorder at'], rows: s.low.map((p) => [p.name, p.stock, p.reorder]), empty: 'All stock is healthy.' });
    if (s.expiring.length) D.alerts.push({ text: `${s.expiring.length} batches expire within 30 days`, to: '/app/e/batches', tone: 'bad' });
    D.actions = [{ label: 'Shop POS', to: '/app/shop-pos', icon: 'ScanBarcode' }, { label: 'Add product', to: '/app/e/products?new=1', icon: 'PackagePlus' }, { label: 'New promotion', to: '/app/e/promotions?new=1', icon: 'BadgePercent' }, { label: 'Shop reports', to: '/app/shop-reports', icon: 'PieChart' }];
    return D;
  }

  if (type === 'finance') {
    const inv = R('sales_invoices'); const bills = R('purchase_invoices');
    const recv = sum(inv.filter((i) => !['paid', 'draft'].includes(i.status)), (i) => i.total - (i.paid || 0));
    const pay = sum(bills.filter((i) => !['paid', 'draft'].includes(i.status)), (i) => i.total - (i.paid || 0));
    const bank = sum(R('bank_accounts'), 'balance');
    const pl = profitLoss(svc, 'month');
    D.summary = `Customers owe you ${M(recv)} and you owe suppliers ${M(pay)}. Open Profit & loss for the full picture of income and costs.`;
    D.kpis = [{ label: 'Cash & bank', value: bank, fmt: 'money' }, { label: 'Receivables', value: recv, fmt: 'money' }, { label: 'Payables', value: pay, fmt: 'money' }, { label: 'Income (30d)', value: pl.income, fmt: 'money' }, { label: 'Net profit (30d)', value: pl.net, fmt: 'money', tone: pl.net >= 0 ? 'ok' : 'bad' }];
    const months = lastMonths(6);
    D.charts.push({ title: 'Income vs expenses', type: 'bar', data: months.map((m) => { const p = profitLoss(svc, 'range', m + '-01', m + '-31'); return { name: monthLabel(m), Income: round(p.income), Expenses: round(p.expense) }; }), series: [{ key: 'Income', label: 'Income' }, { key: 'Expenses', label: 'Expenses' }], fmt: 'money', span: 2 });
    D.charts.push({ title: 'Expenses by category (30d)', type: 'pie', data: pl.expenseLines.map((l) => ({ name: l.name, value: round(l.amount) })), fmt: 'money' });
    D.lists.push({ title: 'Unpaid invoices', link: '/app/e/sales_invoices', columns: ['Invoice', 'Customer', 'Due', 'Amount due', 'Status'], rows: inv.filter((i) => !['paid', 'draft'].includes(i.status)).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 8).map((i) => [i.number, cust(i.customer_id), { date: i.due_date }, { money: i.total - (i.paid || 0) }, { status: i.due_date < today() ? 'overdue' : i.status }]) });
    D.lists.push({ title: 'Bills to pay', link: '/app/e/purchase_invoices', columns: ['Bill', 'Supplier', 'Due', 'Amount due'], rows: bills.filter((i) => !['paid', 'draft'].includes(i.status)).slice(0, 8).map((i) => [i.number, R('vendors').find((v) => v.id === i.vendor_id)?.name, { date: i.due_date }, { money: i.total - (i.paid || 0) }]) });
    D.actions = [{ label: 'Record an expense', to: '/app/e/expenses?new=1', icon: 'Wallet' }, { label: 'Pay a supplier bill', to: '/app/e/purchase_invoices', icon: 'Receipt' }, { label: 'Guest room bills', to: '/app/guest-billing', icon: 'ConciergeBell' }, { label: 'Profit & loss', to: '/app/profit-loss', icon: 'TrendingUp' }, { label: 'VAT report', to: '/app/tax-report', icon: 'Percent' }];
    return D;
  }

  if (type === 'hr') {
    const emps = R('employees'); const att = R('attendance');
    const presentToday = att.filter((a) => a.date === today() && a.clock_in);
    const pend = R('leave_applications').filter((l) => l.status === 'pending');
    D.summary = `${presentToday.length} of ${emps.filter((e) => e.status === 'active').length} staff are at work today. ${pend.length} leave requests need a decision.`;
    D.kpis = [{ label: 'Headcount', value: emps.filter((e) => ['active', 'on_leave'].includes(e.status)).length }, { label: 'Present today', value: presentToday.length, tone: 'ok' }, { label: 'Late today', value: presentToday.filter((a) => a.late_minutes > 0).length, tone: 'warn' }, { label: 'On leave', value: emps.filter((e) => e.status === 'on_leave').length }, { label: 'Leave to approve', value: pend.length, tone: pend.length ? 'warn' : 'ok' }];
    D.charts.push({ title: 'Attendance — 14 days', type: 'bar', stacked: true, data: series(14, (d) => ({ Present: att.filter((a) => a.date === d && a.status === 'present').length, Late: att.filter((a) => a.date === d && a.status === 'late').length, Absent: att.filter((a) => a.date === d && a.status === 'absent').length })), series: [{ key: 'Present', label: 'Present' }, { key: 'Late', label: 'Late' }, { key: 'Absent', label: 'Absent' }], span: 2 });
    D.charts.push({ title: 'Staff by department', type: 'pie', data: toPie(count(emps, (e) => R('departments').find((d) => d.id === e.department_id)?.name)) });
    D.lists.push({ title: 'Leave waiting for approval', link: '/app/e/leave_applications', columns: ['Employee', 'Type', 'From', 'Days'], rows: pend.map((l) => [emp(l.employee_id), R('leave_types').find((t) => t.id === l.leave_type_id)?.name, { date: l.start }, l.days]), empty: 'No pending requests.' });
    D.lists.push({ title: 'Recruitment pipeline', link: '/app/e/candidates', columns: ['Stage', 'Candidates'], rows: Object.entries(count(R('candidates'), 'stage')).map(([k, v]) => [pretty(k), v]) });
    D.lists.push({ title: 'Upcoming holidays', link: '/app/e/holidays', columns: ['Holiday', 'Date'], rows: R('holidays').filter((h) => h.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((h) => [h.name, { date: h.date }]) });
    D.actions = [{ label: 'Approve leave', to: '/app/e/leave_applications', icon: 'CalendarCheck' }, { label: 'Who is at work today', to: '/app/e/attendance', icon: 'Clock' }, { label: 'Make the duty roster', to: '/app/e/rosters', icon: 'CalendarDays' }, { label: 'Pay salaries', to: '/app/run-payroll', icon: 'Banknote' }, { label: 'Add a staff member', to: '/app/e/employees?new=1', icon: 'UserPlus' }];
    return D;
  }

  if (type === 'sales') {
    const leads = R('leads'); const deals = R('deals');
    const open = deals.filter((d) => !['won', 'lost'].includes(d.stage));
    const fu = leads.filter((l) => l.follow_up <= today() && !['won', 'lost'].includes(l.stage));
    D.summary = `${open.length} open deals worth ${M(sum(open, 'value'))}. ${fu.length} leads need a follow-up today.`;
    D.kpis = [{ label: 'Open pipeline', value: sum(open, 'value'), fmt: 'money' }, { label: 'Weighted forecast', value: sum(open, (d) => d.value * (d.probability || 0) / 100), fmt: 'money' }, { label: 'Open leads', value: leads.filter((l) => !['won', 'lost'].includes(l.stage)).length }, { label: 'Follow-ups due', value: fu.length, tone: fu.length ? 'warn' : 'ok' }];
    D.charts.push({ title: 'Leads by stage', type: 'bar', data: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((s) => ({ name: pretty(s), Leads: leads.filter((l) => l.stage === s).length })), series: [{ key: 'Leads', label: 'Leads' }] });
    D.charts.push({ title: 'Lead sources', type: 'pie', data: toPie(count(leads, (l) => R('lead_sources').find((s) => s.id === l.source_id)?.name)) });
    D.lists.push({ title: 'Follow up today', link: '/app/e/leads', columns: ['Lead', 'Company', 'Value', 'Stage'], rows: fu.map((l) => [l.name, l.company, { money: l.value }, { status: l.stage }]), empty: 'All caught up.' });
    D.lists.push({ title: 'Upcoming activities', link: '/app/e/activities', columns: ['Activity', 'Type', 'Due'], rows: R('activities').filter((a) => a.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).map((a) => [a.subject, a.type, { date: a.date }]) });
    D.actions = [{ label: 'Add lead', to: '/app/e/leads?new=1', icon: 'UserPlus' }, { label: 'Deals board', to: '/app/e/deals?view=board', icon: 'Columns3' }, { label: 'New proposal', to: '/app/e/proposals?new=1', icon: 'FileText' }];
    return D;
  }

  if (type === 'projects') {
    const pj = R('projects'); const tasks = R('tasks');
    const overdue = tasks.filter((t) => t.status !== 'done' && t.due < today());
    D.summary = `${pj.filter((p) => p.status === 'active').length} active projects, ${tasks.filter((t) => t.status !== 'done').length} open tasks, ${overdue.length} overdue.`;
    D.kpis = [{ label: 'Active projects', value: pj.filter((p) => p.status === 'active').length }, { label: 'Open tasks', value: tasks.filter((t) => t.status !== 'done').length }, { label: 'Overdue tasks', value: overdue.length, tone: overdue.length ? 'bad' : 'ok' }, { label: 'Hours logged (7d)', value: sum(R('timesheets').filter((t) => t.date >= dOff(-6)), 'hours') }];
    D.charts.push({ title: 'Tasks by status', type: 'pie', data: toPie(count(tasks, 'status'), pretty) });
    D.charts.push({ title: 'Project progress', type: 'hbar', data: pj.map((p) => ({ name: p.name, value: p.progress })), series: [{ key: 'value', label: '% done' }] });
    D.lists.push({ title: 'Overdue tasks', link: '/app/e/tasks', columns: ['Task', 'Assigned to', 'Due'], rows: overdue.map((t) => [t.title, emp(t.assignee_id), { date: t.due }]), empty: 'Nothing overdue.' });
    D.actions = [{ label: 'Task board', to: '/app/e/tasks?view=board', icon: 'Columns3' }, { label: 'New project', to: '/app/e/projects?new=1', icon: 'FolderPlus' }, { label: 'Goals', to: '/app/e/goals', icon: 'Flag' }];
    return D;
  }

  if (type === 'support') {
    const tk = R('tickets'); const open = tk.filter((t) => !['resolved', 'closed'].includes(t.status));
    D.summary = `${open.length} tickets are open, ${open.filter((t) => t.priority === 'urgent').length} of them urgent.`;
    D.kpis = [{ label: 'Open tickets', value: open.length }, { label: 'Urgent', value: open.filter((t) => t.priority === 'urgent').length, tone: 'bad' }, { label: 'Resolved', value: tk.filter((t) => t.status === 'resolved').length, tone: 'ok' }, { label: 'Help articles', value: R('kb_articles').length }];
    D.charts.push({ title: 'Tickets by status', type: 'pie', data: toPie(count(tk, 'status'), pretty) });
    D.lists.push({ title: 'Open tickets', link: '/app/e/tickets', columns: ['Ticket', 'Subject', 'Priority', 'Status'], rows: open.map((t) => [t.number, t.subject, pretty(t.priority), { status: t.status }]) });
    D.actions = [{ label: 'Tickets board', to: '/app/e/tickets?view=board', icon: 'Columns3' }, { label: 'Write an article', to: '/app/e/kb_articles?new=1', icon: 'BookOpen' }];
    return D;
  }

  if (type === 'employee') {
    const me = svc.user.employeeId; const t = today();
    const att = R('attendance').find((a) => a.employee_id === me && a.date === t);
    const slip = R('payslips').filter((p) => p.employee_id === me).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    const annual = R('leave_types')[0]; const usedAnnual = sum(R('leave_applications').filter((l) => l.employee_id === me && l.leave_type_id === annual?.id && l.status === 'approved'), 'days');
    const myTasks = R('tasks').filter((x) => x.assignee_id === me && x.status !== 'done');
    D.summary = att?.clock_in ? `You clocked in at ${att.clock_in}${att.clock_out ? ` and out at ${att.clock_out}` : ''}.` : 'You have not clocked in yet today. Tap Clock in when you start your shift.';
    D.kpis = [{ label: 'Today', value: att?.clock_in ? (att.clock_out ? 'Clocked out' : 'At work since ' + att.clock_in) : 'Not clocked in', fmt: 'text', tone: att?.clock_in ? 'ok' : 'warn' }, { label: 'Annual leave left', value: (annual?.days || 0) - usedAnnual, hint: 'days' }, { label: 'Last net pay', value: slip?.net || 0, fmt: 'money', hint: slip?.month }, { label: 'Announcements', value: R('announcements').length }];
    D.lists.push({ title: 'Announcements', link: '/app/e/announcements', columns: ['Title', 'Until'], rows: R('announcements').map((a) => [a.title, { date: a.end }]) });
    D.lists.push({ title: 'Upcoming holidays', link: '/app/e/holidays', columns: ['Holiday', 'Date'], rows: R('holidays').filter((h) => h.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map((h) => [h.name, { date: h.date }]) });
    D.actions = [{ label: att?.clock_in && !att?.clock_out ? 'Clock out (going home)' : 'Clock in (starting work)', to: '/app/my-attendance', icon: 'Clock' }, { label: 'Ask for leave', to: '/app/my-leaves', icon: 'Plane' }, { label: 'See my salary slip', to: '/app/my-payslips', icon: 'Wallet' }];
    return D;
  }

  if (type === 'customer') {
    const cid = svc.user.customerId; const c = R('customers').find((x) => x.id === cid);
    const bk = R('reservations').filter((r) => r.guest_id === cid);
    const next = bk.filter((r) => ['confirmed', 'tentative', 'checked_in'].includes(r.status)).sort((a, b) => a.check_in.localeCompare(b.check_in))[0];
    const tiers = R('loyalty_tiers').slice().sort((a, b) => b.min_points - a.min_points); const tier = tiers.find((t) => (c?.loyalty_points || 0) >= t.min_points);
    D.summary = next ? (next.status === 'checked_in' ? `Welcome! You are staying in room ${room(next.room_id)} until ${new Date(next.check_out + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.` : `Your next stay starts on ${new Date(next.check_in + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.`) : 'Welcome back! Book your next stay any time.';
    D.kpis = [{ label: 'Loyalty points', value: c?.loyalty_points || 0 }, { label: 'Member tier', value: tier?.name || '—', fmt: 'text' }, { label: 'Stays with us', value: bk.filter((r) => r.status === 'checked_out').length }, { label: 'Upcoming stays', value: bk.filter((r) => ['confirmed', 'tentative'].includes(r.status)).length }];
    D.lists.push({ title: 'My bookings', link: '/app/my-bookings', columns: ['Booking', 'Check-in', 'Check-out', 'Status'], rows: bk.map((r) => [r.number, { date: r.check_in }, { date: r.check_out }, { status: r.status }]) });
    D.actions = [{ label: 'My bookings', to: '/app/my-bookings', icon: 'BedDouble' }, { label: 'My orders', to: '/app/my-orders', icon: 'ShoppingBag' }, { label: 'Book again', to: '/book/' + (svc.business()?.slug || ''), icon: 'CalendarPlus' }];
    return D;
  }
  return D;
}

// --------------------------------------------------------------- FINANCIALS
function periodRange(period, from, to) {
  if (period === 'range') return [from, to];
  if (period === 'all') return ['0000', '9999'];
  if (period === 'year') return [dOff(-364), today()];
  if (period === 'quarter') return [dOff(-89), today()];
  return [dOff(-29), today()];
}
export function profitLoss(svc, period = 'month', from, to) {
  const { R } = ctx(svc); const [a, b] = periodRange(period, from, to); const inR = (d) => day(d) >= a && day(d) <= b;
  const vat = (svc.settings().vat || 18) / 100;
  const folio = R('folio_charges').filter((c) => inR(c.date));
  const lines = [
    { name: 'Room revenue', amount: sum(folio.filter((c) => c.category === 'Room'), 'amount') },
    { name: 'Other hotel services', amount: sum(folio.filter((c) => !['Room', 'Restaurant', 'Bar'].includes(c.category)), 'amount') },
    { name: 'Food & beverage', amount: sum(R('restaurant_orders').filter((o) => o.status === 'paid' && inR(o.date)), (o) => o.total - o.tax) },
    { name: 'Retail sales', amount: sum(R('shop_sales').filter((o) => ['paid', 'credit', 'partially_refunded'].includes(o.status) && inR(o.date)), (o) => o.total - (o.tax || 0)) },
    { name: 'Invoiced sales', amount: sum(R('sales_invoices').filter((o) => o.status !== 'draft' && inR(o.date)), (o) => o.total / (1 + vat)) },
    { name: 'Other income', amount: sum(R('revenues').filter((o) => inR(o.date)), 'amount') },
  ].filter((l) => l.amount);
  const refunds = sum(R('shop_returns').filter((r) => r.status === 'approved' && inR(r.date)), 'refund');
  if (refunds) lines.push({ name: 'Less: returns & refunds', amount: -refunds });
  const exp = R('expenses').filter((e) => inR(e.date) && !String(e.reference).startsWith('PAYROLL-'));
  const expenseLines = toPie(sumByKey(exp, (e) => e.category, (e) => e.amount)).map((x) => ({ name: x.name, amount: x.value }));
  const cogs = sum(R('purchase_invoices').filter((p) => inR(p.date)), (p) => p.total / (1 + vat));
  if (cogs) expenseLines.unshift({ name: 'Purchases (cost of goods)', amount: cogs });
  const salaries = sum(R('payslips').filter((p) => p.status === 'paid' && inR(p.created_at)), 'net');
  if (salaries) expenseLines.push({ name: 'Salaries & wages', amount: salaries });
  const income = sum(lines, 'amount'); const expense = sum(expenseLines, 'amount');
  return { from: a, to: b, incomeLines: lines, expenseLines, income, expense, gross: income - cogs, net: income - expense };
}
export function balanceSheet(svc) {
  const { R } = ctx(svc); const vat = (svc.settings().vat || 18) / 100;
  const cash = sum(R('bank_accounts'), 'balance');
  const ar = sum(R('sales_invoices').filter((i) => !['paid', 'draft'].includes(i.status)), (i) => i.total - (i.paid || 0)) + sum(R('customers'), (c) => Math.max(0, c.balance || 0)) + sum(R('travel_agents'), (t) => t.balance || 0);
  const inv = sum(R('products'), (p) => Math.max(0, p.stock) * (p.cost || 0)) + sum(R('ingredients'), (i) => Math.max(0, i.stock) * (i.cost || 0)) + sum(R('items').filter((i) => i.type === 'product'), (i) => (i.quantity || 0) * (i.purchase_price || 0));
  const je = R('journal_entries').filter((j) => j.status === 'posted'); const acct = (id) => R('accounts').find((x) => x.id === id);
  const fixed = sum(je.filter((j) => acct(j.debit_account_id)?.sub_type === 'Fixed asset'), 'amount') + 4500000;
  const ap = sum(R('purchase_invoices').filter((i) => !['paid', 'draft'].includes(i.status)), (i) => i.total - (i.paid || 0));
  const vatCollected = sum(R('restaurant_orders').filter((o) => o.status === 'paid' && day(o.date) >= dOff(-30)), 'tax') + sum(R('shop_sales').filter((o) => o.status === 'paid' && day(o.date) >= dOff(-30)), 'tax');
  const loan = sum(je.filter((j) => acct(j.credit_account_id)?.sub_type === 'Long-term liability'), 'amount') + 1500000;
  const assets = [{ name: 'Cash & bank', amount: cash }, { name: 'Accounts receivable', amount: ar }, { name: 'Inventory', amount: inv }, { name: 'Fixed assets', amount: fixed }];
  const liabilities = [{ name: 'Accounts payable', amount: ap }, { name: 'VAT & service charge payable', amount: vatCollected * (1 + 0) }, { name: 'Bank loan', amount: loan }];
  const ta = sum(assets, 'amount'); const tl = sum(liabilities, 'amount');
  const capital = 5000000; const retained = ta - tl - capital;
  const equity = [{ name: 'Owner capital', amount: capital }, { name: 'Retained earnings', amount: retained }];
  void vat;
  return { asOf: today(), assets, liabilities, equity, totalAssets: ta, totalLiabilities: tl, totalEquity: capital + retained };
}
export function trialBalance(svc) {
  const bs = balanceSheet(svc); const pl = profitLoss(svc, 'all');
  const rows = [
    ...bs.assets.map((a) => ({ account: a.name, type: 'Asset', debit: a.amount, credit: 0 })),
    ...bs.liabilities.map((a) => ({ account: a.name, type: 'Liability', debit: 0, credit: a.amount })),
    { account: 'Owner capital', type: 'Equity', debit: 0, credit: 5000000 },
    ...pl.incomeLines.map((l) => ({ account: l.name, type: 'Income', debit: l.amount < 0 ? -l.amount : 0, credit: l.amount > 0 ? l.amount : 0 })),
    ...pl.expenseLines.map((l) => ({ account: l.name, type: 'Expense', debit: l.amount, credit: 0 })),
  ];
  const d = sum(rows, 'debit'); const c = sum(rows, 'credit');
  rows.push({ account: 'Opening balances / retained earnings', type: 'Equity', debit: c > d ? c - d : 0, credit: d > c ? d - c : 0 });
  return { rows, totalDebit: Math.max(d, c), totalCredit: Math.max(d, c) };
}

// --------------------------------------------------------------- REPORTS
export function computeReport(svc, name, opts = {}) {
  const { R, has } = ctx(svc);
  const cust = (id) => R('customers').find((e) => e.id === id)?.name || 'Walk-in';
  const need = (k) => { if (!svc.can(k)) { const e = new Error('You do not have permission to view this report.'); e.status = 403; throw e; } };
  switch (name) {
    case 'profit-loss': need('page:profit-loss'); return profitLoss(svc, opts.period || 'month', opts.from, opts.to);
    case 'balance-sheet': need('page:balance-sheet'); return balanceSheet(svc);
    case 'trial-balance': need('page:trial-balance'); return trialBalance(svc);
    case 'ledger': {
      need('page:ledger');
      const accts = R('accounts'); const je = R('journal_entries');
      return { accounts: accts.map((a) => { const dr = sum(je.filter((j) => j.debit_account_id === a.id), 'amount'); const cr = sum(je.filter((j) => j.credit_account_id === a.id), 'amount'); return { ...a, debit: dr, credit: cr, balance: ['Asset', 'Expense'].includes(a.type) ? dr - cr : cr - dr }; }), entries: je.slice().sort((a, b) => b.date.localeCompare(a.date)).map((j) => ({ ...j, debit: accts.find((a) => a.id === j.debit_account_id)?.name, credit: accts.find((a) => a.id === j.credit_account_id)?.name })) };
    }
    case 'tax': {
      need('page:tax-report');
      const vat = (svc.settings().vat || 18) / 100;
      return { months: lastMonths(6).map((m) => { const inM = (d) => monthKey(d) === m; const out = sum(R('restaurant_orders').filter((o) => o.status === 'paid' && inM(o.date)), 'tax') + sum(R('shop_sales').filter((o) => o.status === 'paid' && inM(o.date)), 'tax') + sum(R('sales_invoices').filter((o) => o.status !== 'draft' && inM(o.date)), (o) => o.total - o.total / (1 + vat)) + sum(R('folio_charges').filter((c) => inM(c.date)), 'amount') * vat; const inp = sum(R('purchase_invoices').filter((o) => inM(o.date)), (o) => o.total - o.total / (1 + vat)); return { month: monthLabel(m), output: round(out), input: round(inp), payable: round(out - inp) }; }) };
    }
    case 'hotel': {
      need('page:hotel-reports');
      const res = R('reservations').filter((r) => r.check_in >= dOff(-60)); const audits = R('night_audits').slice().sort((a, b) => a.date.localeCompare(b.date));
      const types = R('room_types');
      return {
        occupancy: audits.map((a) => ({ name: shortDay(a.date), Occupancy: a.occupancy, ADR: a.occupied ? round(a.room_revenue / a.occupied) : 0, Revenue: a.room_revenue })),
        sources: toPie(sumByKey(res.filter((r) => r.status !== 'cancelled'), (r) => r.source, (r) => r.total)),
        roomTypes: types.map((t) => { const rr = res.filter((r) => r.room_type_id === t.id && r.status !== 'cancelled'); return { name: t.name, bookings: rr.length, nights: sum(rr, (r) => nights(r.check_in, r.check_out)), revenue: sum(rr, 'total') }; }),
        cancellations: { cancelled: res.filter((r) => r.status === 'cancelled').length, noShow: res.filter((r) => r.status === 'no_show').length, total: res.length },
        nationality: toPie(count(res, (r) => R('customers').find((c) => c.id === r.guest_id)?.nationality)),
        charges: toPie(sumByKey(R('folio_charges').filter((c) => c.date >= dOff(-30)), (c) => c.category, (c) => c.amount)),
        guests: Object.entries(sumByKey(res, (r) => r.guest_id, (r) => r.total)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, v]) => ({ name: cust(id), value: v })),
      };
    }
    case 'restaurant': {
      need('page:restaurant-reports');
      const days = Number(opts.days || 30); const o = R('restaurant_orders').filter((x) => x.status === 'paid' && day(x.date) >= dOff(-(days - 1)));
      const menu = R('menu_items'); const cats = R('menu_categories');
      const itemsAgg = {}; for (const it of o.flatMap((x) => x.items)) { const m = menu.find((mm) => mm.id === it.ref); const k = it.name; itemsAgg[k] ||= { name: k, category: cats.find((c) => c.id === m?.category_id)?.name || '—', qty: 0, revenue: 0, cost: 0 }; itemsAgg[k].qty += it.qty; itemsAgg[k].revenue += it.qty * it.price; itemsAgg[k].cost += it.qty * (m?.cost || 0); }
      return {
        totals: { orders: o.length, revenue: sum(o, 'total'), avg: o.length ? sum(o, 'total') / o.length : 0, covers: o.length * 2, discounts: sum(o, 'discount'), service: sum(o, 'service_charge'), tax: sum(o, 'tax'), cancelled: R('restaurant_orders').filter((x) => x.status === 'cancelled' && day(x.date) >= dOff(-(days - 1))).length },
        daily: series(days, (d) => ({ Sales: round(sum(o.filter((x) => day(x.date) === d), 'total')) })),
        items: Object.values(itemsAgg).sort((a, b) => b.revenue - a.revenue).map((x) => ({ ...x, margin: x.revenue ? Math.round(((x.revenue - x.cost) / x.revenue) * 100) : 0 })),
        categories: toPie(sumByKey(Object.values(itemsAgg), (x) => x.category, (x) => x.revenue)),
        types: toPie(sumByKey(o, (x) => pretty(x.type), (x) => x.total)),
        payments: toPie(sumByKey(o, (x) => x.payment_method, (x) => x.total)),
        waiters: toPie(sumByKey(o, (x) => x.waiter, (x) => x.total)),
        hours: Array.from({ length: 16 }, (_, i) => i + 7).map((h) => ({ name: h + ':00', Orders: o.filter((x) => Number(String(x.date).slice(11, 13)) === h).length })),
      };
    }
    case 'shop': {
      need('page:shop-reports');
      const days = Number(opts.days || 30); const s = R('shop_sales').filter((x) => ['paid', 'credit', 'partially_refunded'].includes(x.status) && day(x.date) >= dOff(-(days - 1)));
      const prods = R('products'); const cats = R('product_categories');
      const agg = {}; for (const it of s.flatMap((x) => x.items)) { const p = prods.find((pp) => pp.id === it.ref); agg[it.name] ||= { name: it.name, category: cats.find((c) => c.id === p?.category_id)?.name || '—', qty: 0, revenue: 0, cost: 0 }; agg[it.name].qty += it.qty; agg[it.name].revenue += it.total; agg[it.name].cost += it.qty * (p?.cost || 0); }
      return {
        totals: { receipts: s.length, revenue: sum(s, 'total'), avg: s.length ? sum(s, 'total') / s.length : 0, units: sum(s.flatMap((x) => x.items), 'qty'), refunds: sum(R('shop_returns').filter((r) => r.date >= dOff(-(days - 1))), 'refund'), margin: sum(Object.values(agg), (x) => x.revenue - x.cost) },
        daily: series(days, (d) => ({ Sales: round(sum(s.filter((x) => day(x.date) === d), 'total')) })),
        products: Object.values(agg).sort((a, b) => b.revenue - a.revenue).map((x) => ({ ...x, margin: x.revenue ? Math.round(((x.revenue - x.cost) / x.revenue) * 100) : 0 })),
        categories: toPie(sumByKey(Object.values(agg), (x) => x.category, (x) => x.revenue)),
        payments: toPie(sumByKey(s, (x) => x.payment_method, (x) => x.total)),
        cashiers: toPie(sumByKey(s, (x) => x.cashier, (x) => x.total)),
        channels: toPie(sumByKey(s, (x) => pretty(x.channel), (x) => x.total)),
        stockValue: { cost: sum(prods, (p) => Math.max(0, p.stock) * p.cost), retail: sum(prods, (p) => Math.max(0, p.stock) * p.price) },
      };
    }
    case 'overview': {
      need('page:reports');
      const pl = profitLoss(svc, opts.period || 'month');
      return { pl, revenue: revenueSeries(R, has, 30), keys: seriesKeys(has), modules: svc.business()?.modules || [] };
    }
    case 'crm': {
      need('page:crm-dashboard');
      const leads = R('leads'); const deals = R('deals');
      return { stages: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((s) => ({ name: pretty(s), Leads: leads.filter((l) => l.stage === s).length, Value: sum(leads.filter((l) => l.stage === s), 'value') })), dealStages: ['discovery', 'proposal', 'negotiation', 'won', 'lost'].map((s) => ({ name: pretty(s), Deals: deals.filter((d) => d.stage === s).length, Value: sum(deals.filter((d) => d.stage === s), 'value') })), sources: toPie(count(leads, (l) => R('lead_sources').find((s) => s.id === l.source_id)?.name)), owners: toPie(sumByKey(deals.filter((d) => d.stage === 'won'), (d) => d.owner, (d) => d.value)), won: sum(deals.filter((d) => d.stage === 'won'), 'value'), pipeline: sum(deals.filter((d) => !['won', 'lost'].includes(d.stage)), 'value'), conversion: leads.length ? Math.round((leads.filter((l) => l.stage === 'won').length / leads.length) * 100) : 0 };
    }
    case 'projects': {
      need('page:projects-dashboard');
      const pj = R('projects'); const tasks = R('tasks'); const ts = R('timesheets');
      return { projects: pj.map((p) => ({ ...p, tasks: tasks.filter((t) => t.project_id === p.id).length, done: tasks.filter((t) => t.project_id === p.id && t.status === 'done').length, hours: sum(ts.filter((t) => t.project_id === p.id), 'hours'), spent: sum(R('milestones').filter((m) => m.project_id === p.id), 'cost') })), status: toPie(count(tasks, 'status'), pretty), priority: toPie(count(tasks, 'priority'), pretty), hours: series(14, (d) => ({ Hours: sum(ts.filter((t) => t.date === d), 'hours') })) };
    }
    case 'hrm': {
      need('page:hrm-dashboard');
      const emps = R('employees'); const att = R('attendance');
      return { headcount: emps.length, active: emps.filter((e) => e.status === 'active').length, departments: toPie(count(emps, (e) => R('departments').find((d) => d.id === e.department_id)?.name)), gender: toPie(count(emps, 'gender')), attendance: series(14, (d) => ({ Present: att.filter((a) => a.date === d && a.status === 'present').length, Late: att.filter((a) => a.date === d && a.status === 'late').length, Absent: att.filter((a) => a.date === d && a.status === 'absent').length })), payroll: lastMonths(3).map((m) => ({ name: monthLabel(m), Payroll: sum(R('payslips').filter((p) => { const d = new Date('1 ' + p.month); return !isNaN(d) && iso(d).slice(0, 7) === m; }), 'net') })), turnover: { resigned: R('resignations').length, terminated: R('terminations').length } };
    }
    case 'budget': {
      need('page:budget-monitor');
      return { budgets: R('budgets').map((b) => ({ ...b, used: b.planned ? Math.round((b.actual / b.planned) * 100) : 0, department: R('departments').find((d) => d.id === b.department_id)?.name })) };
    }
    case 'stock': {
      need('page:stock-levels');
      const prods = R('products').map((p) => ({ ...p, category: R('product_categories').find((c) => c.id === p.category_id)?.name, value: Math.max(0, p.stock) * p.cost, state: p.stock <= 0 ? 'out' : p.stock <= p.reorder ? 'low' : 'ok' }));
      return { products: prods, ingredients: R('ingredients').map((i) => ({ ...i, value: Math.max(0, i.stock) * i.cost, state: i.stock <= 0 ? 'out' : i.stock <= i.reorder ? 'low' : 'ok' })), items: R('items').filter((i) => i.type === 'product'), batches: R('batches') };
    }
    default: { const e = new Error('Unknown report'); e.status = 404; throw e; }
  }
}
