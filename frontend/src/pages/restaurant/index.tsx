import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Minus, Plus, Send, CreditCard, Search, Trash2, Printer, ArrowLeftRight, Merge, Clock, ChefHat, Check, X, Users, StickyNote, Ban, Utensils } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Modal, Field, Tabs, Kpi, Card, Status, Empty, useConfirm, Help } from '@/components/ui';
import { PrintModal, ReceiptDoc, KotDoc } from '@/components/Printable';
import { ChartCard } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { PublicLinkCard } from '../hotel';
import { FloorPlan2D, Legend2D, TableEditor } from '@/components/FloorPlan2D';
import { money, minutesSince, pretty, time, today } from '@/lib/format';

const TYPES = [['dine_in', 'Dine-in'], ['takeaway', 'Takeaway'], ['delivery', 'Delivery'], ['room_service', 'Room service']];

// ------------------------------------------------------------------ PAY MODAL (shared)
export function PayModal({ order, open, onClose, onPaid }: { order: any; open: boolean; onClose: () => void; onPaid: (o: any) => void }) {
  const [method, setMethod] = useState('Cash');
  const [discount, setDiscount] = useState<any>(order?.discount || 0);
  const [tendered, setTendered] = useState<any>('');
  const [split, setSplit] = useState<any[]>([{ method: 'Cash', amount: '' }, { method: 'Card', amount: '' }]);
  const [resId, setResId] = useState('');
  const res = useAsync<any[]>(() => (open ? api.list('reservations').then((r) => r.filter((x: any) => x.status === 'checked_in')).catch(() => []) : Promise.resolve([])), [open]);
  const { maps } = useLookups(['customers', 'rooms']);
  const toast = useToast(); const { me } = useAuth();
  useEffect(() => { if (open) { setMethod('Cash'); setDiscount(order?.discount || 0); setTendered(''); setResId(order?.room_reservation_id || ''); } }, [open]);
  if (!order) return null;
  const sub = order.subtotal || 0; const disc = Math.min(sub, Number(discount) || 0);
  const st = me?.settings || {}; const dine = ['dine_in', 'qr'].includes(order.type);
  const sc = dine && st.table_service_charge !== false ? Math.round((sub - disc) * (st.service_charge || 0)) / 100 : 0;
  const total = Math.round((sub - disc + sc) * (1 + (st.vat || 0) / 100) * 100) / 100;
  const change = Number(tendered) - total;
  const pay = async () => {
    try {
      const payload: any = { order_id: order.id, method, discount: disc };
      if (method === 'Split') payload.payments = split.filter((s) => Number(s.amount) > 0).map((s) => ({ method: s.method, amount: Number(s.amount) }));
      if (method === 'Room charge') payload.reservation_id = resId;
      const r = await api.action('payOrder', payload); toast.ok(`${r.number} paid — ${money(r.total)}`); onPaid({ ...r, tendered: Number(tendered) || 0, change: change > 0 ? change : 0 });
    } catch (e) { toast.err(e); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Take payment · ${order.number}`} footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={pay} disabled={method === 'Cash' && tendered !== '' && change < 0}><CreditCard className="h-4 w-4" />Pay {money(total)}</button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{['Cash', 'Card', 'Online', 'Room charge', 'Split'].map((m) => <button key={m} onClick={() => setMethod(m)} className={`rounded-lg border-2 px-2 py-3 text-sm font-semibold ${method === m ? 'border-brand bg-brand-soft text-brand' : 'border-line'}`}>{m}</button>)}</div>
        <Field label="Discount amount" hint="Applied before service charge and VAT."><input className="input" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
        {method === 'Cash' && <><Field label="Cash received"><input className="input text-lg" type="number" autoFocus value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder={String(total)} /></Field>
          <div className="flex flex-wrap gap-2">{[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000].filter((v, i, a) => a.indexOf(v) === i).map((v) => <button key={v} className="btn-secondary btn-sm" onClick={() => setTendered(v)}>{money(v)}</button>)}</div>
          {tendered !== '' && <div className={`rounded-lg px-4 py-3 text-lg font-bold ${change >= 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'}`}>{change >= 0 ? `Give change: ${money(change)}` : `Still short by ${money(-change)}`}</div>}</>}
        {method === 'Room charge' && <Field label="Charge to in-house guest"><select className="input" value={resId} onChange={(e) => setResId(e.target.value)}><option value="">Choose a room…</option>{(res.data || []).map((r: any) => <option key={r.id} value={r.id}>Room {maps.rooms?.[r.room_id]} — {maps.customers?.[r.guest_id]}</option>)}</select></Field>}
        {method === 'Split' && <div className="space-y-2">{split.map((s, i) => <div key={i} className="flex gap-2"><select className="input" value={s.method} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}>{['Cash', 'Card', 'Online'].map((m) => <option key={m}>{m}</option>)}</select><input className="input" type="number" placeholder="Amount" value={s.amount} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} /></div>)}<button className="btn-ghost btn-sm text-brand" onClick={() => setSplit([...split, { method: 'Card', amount: '' }])}><Plus className="h-4 w-4" />Add another payer</button><p className="text-sm text-muted">Entered {money(split.reduce((s, x) => s + (Number(x.amount) || 0), 0))} of {money(total)} · each of {split.length} pays {money(total / split.length)} if split equally <button className="text-brand underline" onClick={() => setSplit(split.map((x) => ({ ...x, amount: Math.round((total / split.length) * 100) / 100 })))}>split equally</button></p></div>}
        <div className="rounded-xl bg-paper p-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(sub)}</span></div>{disc > 0 && <div className="flex justify-between"><span>Discount</span><span>-{money(disc)}</span></div>}<div className="flex justify-between"><span>Service charge + VAT</span><span>{money(total - (sub - disc))}</span></div><div className="mt-1 flex justify-between text-lg font-bold"><span>To pay</span><span>{money(total)}</span></div></div>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ RESTAURANT POS
export function RestaurantPOS() {
  const [sp] = useSearchParams();
  const menu = useList('menu_items'); const cats = useList('menu_categories', { optional: true }); const tables = useList('tables'); const orders = useList('restaurant_orders');
  const { maps } = useLookups(['customers', 'riders', 'areas']);
  const { can, me } = useAuth(); const toast = useToast(); const confirm = useConfirm();
  const [type, setType] = useState('dine_in');
  const [tableId, setTableId] = useState(sp.get('table') || '');
  const [orderId, setOrderId] = useState(sp.get('order') || '');
  const [cat, setCat] = useState('all'); const [q, setQ] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState('');
  const [note, setNote] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [kots, setKots] = useState<any[] | null>(null);
  const [mobileCart, setMobileCart] = useState(false);
  const open = (orders.data || []).filter((o) => !['paid', 'cancelled'].includes(o.status));
  const current = orderId ? open.find((o) => o.id === orderId) : tableId && type === 'dine_in' ? open.find((o) => o.table_id === tableId) : null;
  useEffect(() => { if (current && current.id !== orderId) setOrderId(current.id); if (current) { setType(current.type === 'qr' ? 'dine_in' : current.type); if (current.table_id) setTableId(current.table_id); } }, [current?.id]);
  if (menu.error || tables.error || orders.error) return <ErrorBox error={menu.error || tables.error || orders.error} />;
  if (!menu.data || !cats.data || !tables.data || !orders.data) return <Spinner />;
  const items = menu.data.filter((m) => m.status === 'active' && (cat === 'all' || m.category_id === cat) && (!q || m.name.toLowerCase().includes(q.toLowerCase())));
  const add = (m: any) => { if (m.available === false) return toast.err(`${m.name} is not available right now.`); const i = cart.findIndex((c) => c.ref === m.id && !c.note); if (i >= 0) setCart(cart.map((c, j) => (j === i ? { ...c, qty: c.qty + 1 } : c))); else setCart([...cart, { ref: m.id, name: m.name, price: m.price, qty: 1, note: '' }]); };
  const qty = (i: number, d: number) => setCart(cart.map((c, j) => (j === i ? { ...c, qty: c.qty + d } : c)).filter((c) => c.qty > 0));
  const newTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const reset = () => { setCart([]); setOrderId(''); setTableId(''); setCustomer(''); };
  const send = async () => {
    if (type === 'dine_in' && !tableId && !orderId) return toast.err('Choose a table first.');
    try { const r = await api.action('placeOrder', { order_id: orderId || undefined, table_id: tableId || undefined, type, items: cart, customer_id: customer || undefined }); setOrderId(r.order.id); setCart([]); setKots(r.kots); toast.ok(`Sent to kitchen — ${r.kots.map((k: any) => k.station).join(', ')}`); setMobileCart(false); }
    catch (e) { toast.err(e); }
  };
  const voidItem = async (i: number) => { if (!(await confirm({ title: 'Remove this item?', text: 'The kitchen may already be preparing it.', confirm: 'Remove', danger: true }))) return; try { await api.action('voidItem', { order_id: current.id, index: i }); toast.ok('Item removed.'); } catch (e) { toast.err(e); } };
  const cancel = async () => { if (!(await confirm({ title: `Cancel ${current.number}?`, text: 'All kitchen tickets for this order will be cancelled.', confirm: 'Cancel order', danger: true }))) return; try { await api.action('cancelOrder', { order_id: current.id }); toast.ok('Order cancelled.'); reset(); } catch (e) { toast.err(e); } };
  const tableName = (id: string) => tables.data!.find((t) => t.id === id)?.name;

  const CartPanel = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <div className="flex items-center justify-between"><h2 className="font-bold">{current ? `${current.number} · ${current.table_id ? tableName(current.table_id) : pretty(current.type)}` : 'New order'}</h2>{current && <Status value={current.status} />}</div>
        {current && <div className="text-xs text-muted">Opened {time(current.date)} by {current.waiter}</div>}
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto">
        {current?.items?.map((it: any, i: number) => (
          <div key={'o' + i} className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm text-muted">
            <Check className="h-3.5 w-3.5 shrink-0 text-ok" aria-label="Sent to kitchen" /><span className="flex-1">{it.qty} × {it.name}{it.note && <span className="block text-xs">{it.note}</span>}</span><span>{money(it.qty * it.price)}</span>
            {can('restaurant_orders', 'e') && <button className="text-bad/70 hover:text-bad" onClick={() => voidItem(i)} aria-label={`Remove ${it.name}`}><X className="h-3.5 w-3.5" /></button>}
          </div>
        ))}
        {cart.map((c, i) => (
          <div key={i} className="border-b border-line px-3 py-2">
            <div className="flex items-center gap-2"><span className="flex-1 text-sm font-semibold">{c.name}</span><span className="text-sm">{money(c.qty * c.price)}</span></div>
            <div className="mt-1.5 flex items-center gap-2">
              <button className="btn-secondary h-8 w-8 p-0" onClick={() => qty(i, -1)} aria-label="Less"><Minus className="h-4 w-4" /></button><span className="w-6 text-center font-bold">{c.qty}</span><button className="btn-secondary h-8 w-8 p-0" onClick={() => qty(i, 1)} aria-label="More"><Plus className="h-4 w-4" /></button>
              <button className={`btn-ghost btn-sm ml-auto ${c.note ? 'text-brand' : ''}`} onClick={() => setNote(i)}><StickyNote className="h-4 w-4" />{c.note ? 'Note' : 'Add note'}</button>
            </div>
            {c.note && <div className="mt-1 text-xs text-muted">→ {c.note}</div>}
          </div>
        ))}
        {!cart.length && !current && <Empty title="Tap dishes to add them" text="Choose the table first for dine-in orders." icon="Utensils" />}
      </div>
      <div className="space-y-2 border-t border-line p-3">
        {current && <div className="flex justify-between text-sm"><span className="text-muted">Order total (incl. charges)</span><b>{money(current.total)}</b></div>}
        {cart.length > 0 && <div className="flex justify-between text-sm"><span className="text-muted">New items</span><b>{money(newTotal)}</b></div>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary col-span-2 py-3 text-base" disabled={!cart.length} onClick={send}><Send className="h-4 w-4" />Send to kitchen</button>
          <button className="btn-secondary" disabled={!current || cart.length > 0} onClick={() => setPaying(true)} title={cart.length ? 'Send new items to the kitchen first' : ''}><CreditCard className="h-4 w-4" />Pay</button>
          <button className="btn-secondary" disabled={!current} onClick={() => setReceipt({ ...current })}><Printer className="h-4 w-4" />Bill</button>
          {current && can('restaurant_orders', 'e') && <button className="btn-ghost col-span-2 text-bad" onClick={cancel}><Ban className="h-4 w-4" />Cancel order</button>}
          {(current || cart.length > 0) && <button className="btn-ghost col-span-2" onClick={reset}>Start a new order</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="anim-pop -mx-3 -my-5 flex h-[calc(100vh-64px)] sm:-mx-6 sm:-my-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="space-y-2 border-b border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-line p-0.5">{TYPES.map(([k, l]) => <button key={k} onClick={() => { setType(k); if (k !== 'dine_in') setTableId(''); setOrderId(''); }} className={`btn-sm btn ${type === k ? 'bg-brand text-white' : 'text-muted'}`}>{l}</button>)}</div>
            {type === 'dine_in' && <select className="input w-auto" value={tableId} onChange={(e) => { setTableId(e.target.value); setOrderId(''); }} aria-label="Table"><option value="">Choose table…</option>{tables.data.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.seats} seats · {pretty(t.status)}</option>)}</select>}
            <select className="input w-auto max-w-[180px]" value={customer} onChange={(e) => setCustomer(e.target.value)} aria-label="Customer"><option value="">Walk-in guest</option>{Object.entries(maps.customers || {}).map(([id, n]) => <option key={id} value={id}>{n as string}</option>)}</select>
            <select className="input w-auto max-w-[200px]" value={orderId} onChange={(e) => { setOrderId(e.target.value); setCart([]); }} aria-label="Open orders"><option value="">Open orders ({open.length})</option>{open.map((o) => <option key={o.id} value={o.id}>{o.number} · {o.table_id ? tableName(o.table_id) : pretty(o.type)} · {money(o.total)}</option>)}</select>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Find a dish…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          <div className="thin-scroll flex gap-1.5 overflow-x-auto pb-1">{[{ id: 'all', name: 'All', icon: '🍽️' }, ...cats.data.sort((a, b) => a.order - b.order)].map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`btn-sm btn shrink-0 rounded-full border ${cat === c.id ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'}`}><span>{c.icon}</span>{c.name}</button>)}</div>
        </div>
        <div className="thin-scroll grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((m) => (
            <button key={m.id} onClick={() => add(m)} className={`relative rounded-xl border border-line bg-surface p-3 text-left shadow-sm transition hover:border-brand hover:shadow-card active:scale-[0.98] ${m.available === false ? 'opacity-40' : ''}`}>
              <div className="text-2xl">{m.icon || '🍽️'}</div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold leading-tight">{m.name}</div>
              <div className="mt-1 flex items-center justify-between text-sm"><b className="text-brand">{money(m.price)}</b>{m.veg && <span className="chip bg-ok/10 px-1.5 text-[10px] text-ok">Veg</span>}</div>
              {m.available === false && <span className="absolute right-2 top-2 chip bg-bad/10 text-[10px] text-bad">Sold out</span>}
            </button>
          ))}
        </div>
        <button className="btn-primary m-3 lg:hidden" onClick={() => setMobileCart(true)}>View order ({cart.length} new{current ? `, ${current.items.length} sent` : ''})</button>
      </div>
      <aside className="hidden w-[360px] shrink-0 border-l border-line bg-surface lg:block">{CartPanel}</aside>
      {mobileCart && <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMobileCart(false)}><div className="anim-slide absolute inset-y-0 right-0 w-[92vw] max-w-sm bg-surface" onClick={(e) => e.stopPropagation()}>{CartPanel}</div></div>}

      <Modal open={note !== null} onClose={() => setNote(null)} title="Note for the kitchen" size="sm" footer={<button className="btn-primary" onClick={() => setNote(null)}>Done</button>}>
        {note !== null && cart[note] && <><div className="mb-2 flex flex-wrap gap-1.5">{['No onion', 'Extra spicy', 'Mild', 'No sugar', 'Extra cheese', 'Well done', 'Allergy: nuts'].map((n) => <button key={n} className="chip border border-line bg-surface px-2.5 py-1" onClick={() => setCart(cart.map((c, j) => (j === note ? { ...c, note: c.note ? c.note + ', ' + n : n } : c)))}>{n}</button>)}</div><textarea className="input" autoFocus value={cart[note].note} onChange={(e) => setCart(cart.map((c, j) => (j === note ? { ...c, note: e.target.value } : c)))} /></>}
      </Modal>
      <PayModal order={current} open={paying} onClose={() => setPaying(false)} onPaid={(o) => { setPaying(false); setReceipt(o); reset(); }} />
      {receipt && <PrintModal open onClose={() => setReceipt(null)} title="Bill" narrow><ReceiptDoc kind="restaurant" sale={receipt} party={maps.customers?.[receipt.customer_id]} tableName={tableName(receipt.table_id)} /></PrintModal>}
      {kots && <PrintModal open onClose={() => setKots(null)} title="Kitchen tickets sent" narrow>{kots.map((k) => <div key={k.id} className="mb-6"><KotDoc kot={k} /></div>)}</PrintModal>}
    </div>
  );
}

// ------------------------------------------------------------------ FLOOR PLAN
const TABLE_STYLE: Record<string, string> = { free: 'border-ok/50 bg-ok/10', occupied: 'border-info/50 bg-info/10', reserved: 'border-saffron/60 bg-saffron-soft', bill_requested: 'border-bad/60 bg-bad/10 pulse-ring', cleaning: 'border-muted/40 bg-muted/10' };
export function FloorPlan() {
  const tables = useList('tables'); const areas = useList('areas', { optional: true }); const orders = useList('restaurant_orders'); const resv = useList('table_reservations', { optional: true }); const wait = useList('waitlist', { optional: true });
  const { can } = useAuth(); const nav = useNavigate(); const toast = useToast();
  const [area, setArea] = useState('all'); const [sel, setSel] = useState<any>(null); const [move, setMove] = useState<any>(null); const [editMode, setEditMode] = useState(false); const [edSel, setEdSel] = useState<string | null>(null);
  if (tables.error || orders.error) return <ErrorBox error={tables.error || orders.error} />;
  if (!tables.data || !areas.data || !orders.data) return <Spinner />;
  const open = orders.data.filter((o) => !['paid', 'cancelled'].includes(o.status));
  const orderOf = (t: any) => open.find((o) => o.table_id === t.id);
  const shown = tables.data.filter((t) => area === 'all' || t.area_id === area);
  const busiest = [...areas.data].sort((a, b) => tables.data!.filter((t) => t.area_id === b.id && t.status !== 'free').length - tables.data!.filter((t) => t.area_id === a.id && t.status !== 'free').length)[0];
  const area3d = area === 'all' ? busiest?.id : area;
  const toneOf = (t: any) => (t.status === 'free' ? 'free' : t.status === 'occupied' ? 'busy' : t.status === 'reserved' ? 'reserved' : t.status === 'bill_requested' ? 'alert' : 'cleaning') as any;
  const setStatus = async (t: any, status: string) => { try { await api.action('setTableStatus', { table_id: t.id, status }); toast.ok(`${t.name}: ${pretty(status)}`); setSel(null); } catch (e) { toast.err(e); } };
  const o = sel ? orderOf(sel) : null;
  return (
    <div className="anim-pop">
      <PageHeader title="Tables & floor" icon="LayoutGrid" desc="Live view of every table. Tap a table to take an order, move guests or settle the bill." help={<><b>Green</b> = free, <b>blue</b> = seated, <b>gold</b> = reserved, <b>red pulsing</b> = asking for the bill, grey = needs clearing. The timer shows how long guests have been seated.</>}
        actions={<>{can('tables', 'c') && <button className={editMode ? 'btn-primary' : 'btn-secondary'} onClick={() => { setEditMode(!editMode); setEdSel(null); }}>{editMode ? 'Done editing' : 'Edit layout'}</button>}<button className="btn-primary" onClick={() => nav('/app/restaurant-pos')}>Open POS</button></>} />
      <div className="mb-3 flex flex-wrap items-center gap-3"><Tabs value={area} onChange={setArea} tabs={[{ key: 'all', label: 'All areas' }, ...areas.data.map((a) => ({ key: a.id, label: a.name }))]} /><div className="flex flex-wrap gap-2 text-xs">{Object.keys(TABLE_STYLE).map((s) => <span key={s} className={`chip border ${TABLE_STYLE[s].replace('pulse-ring', '')}`}>{pretty(s)}</span>)}</div></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {editMode ? <LayoutEditor areaId={area3d} tables={tables.data.filter((t) => t.area_id === area3d)} sel={edSel} setSel={setEdSel} /> : <div className="space-y-2">{area === 'all' && <p className="text-sm text-muted">Showing <b>{busiest?.name}</b> — pick an area above to see the others.</p>}<FloorPlan2D tables={tables.data.filter((t) => t.area_id === area3d).map((t) => { const o = orderOf(t); return { ...t, tone: toneOf(t), sub: o ? `${money(o.total, { short: true })} · ${minutesSince(o.date)}m` : `${t.seats} seats` }; })} onSelect={(t) => setSel(tables.data!.find((x) => x.id === t.id))} /><Legend2D tones={['free', 'busy', 'reserved', 'alert', 'cleaning']} /></div>}
        {!editMode && <div className="space-y-4">
          <Card title="Bookings today" pad={false}><ul>{(resv.data || []).filter((r) => r.date === today() && r.status === 'booked').sort((a, b) => a.time.localeCompare(b.time)).map((r) => <li key={r.id} className="flex items-center justify-between border-t border-line px-4 py-2 text-sm first:border-0"><span><b>{r.time}</b> {r.customer_name}</span><span className="text-muted">{r.guests} pax · {tables.data!.find((t) => t.id === r.table_id)?.name}</span></li>)}{!(resv.data || []).some((r) => r.date === today() && r.status === 'booked') && <li className="px-4 py-4 text-center text-sm text-muted">No bookings left today.</li>}</ul></Card>
          <Card title="Waitlist" pad={false} actions={can('waitlist', 'c') && <button className="text-xs font-semibold text-brand" onClick={() => nav('/app/e/waitlist?new=1')}>Add</button>}><ul>{(wait.data || []).filter((w) => w.status === 'waiting' || w.status === 'notified').map((w) => <li key={w.id} className="flex items-center justify-between border-t border-line px-4 py-2 text-sm first:border-0"><span>{w.customer_name} <span className="text-muted">({w.guests})</span></span>{can('waitlist', 'e') && <button className="btn-ghost btn-sm text-brand" onClick={() => api.update('waitlist', w.id, { status: 'seated' }).then(() => toast.ok('Marked as seated.'))}>Seat</button>}</li>)}{!(wait.data || []).some((w) => w.status === 'waiting') && <li className="px-4 py-4 text-center text-sm text-muted">Nobody waiting.</li>}</ul></Card>
        </div>}
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.name} · ${sel.seats} seats` : ''} footer={sel && <>
        {o && can('restaurant_orders', 'e') && <button className="btn-secondary" onClick={() => setMove({ mode: 'transfer', to: '' })}><ArrowLeftRight className="h-4 w-4" />Move / merge</button>}
        <button className="btn-primary" onClick={() => nav(`/app/restaurant-pos?table=${sel.id}${o ? '&order=' + o.id : ''}`)}>{o ? 'Add items / pay' : 'Take order'}</button></>}>
        {sel && <div className="space-y-4">
          <div className="flex items-center gap-2"><Status value={sel.status} />{o && <span className="text-sm text-muted">{o.number} · seated {minutesSince(o.date)} min · {o.waiter}</span>}</div>
          {o ? <div className="rounded-xl border border-line">{o.items.map((i: any, n: number) => <div key={n} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-0"><span>{i.qty} × {i.name}</span><span>{money(i.qty * i.price)}</span></div>)}<div className="flex justify-between bg-paper px-3 py-2 font-bold"><span>Total</span><span>{money(o.total)}</span></div></div> : <p className="text-sm text-muted">No open order on this table.</p>}
          {can('tables', 'e') && <div><div className="label">Set table status</div><div className="flex flex-wrap gap-2">{['free', 'reserved', 'cleaning', 'bill_requested'].map((s) => <button key={s} className="btn-secondary btn-sm" onClick={() => setStatus(sel, s)}>{pretty(s)}</button>)}</div></div>}
        </div>}
      </Modal>
      <Modal open={!!move} onClose={() => setMove(null)} title="Move or merge table" footer={<><button className="btn-secondary" onClick={() => setMove(null)}>Cancel</button><button className="btn-primary" disabled={!move?.to} onClick={async () => { const target = tables.data!.find((t) => t.id === move.to); const tOrder = target && orderOf(target); try { const r = tOrder ? await api.action('mergeOrders', { from_order_id: o.id, to_order_id: tOrder.id }) : await api.action('transferTable', { order_id: o.id, table_id: move.to }); toast.ok(r.message); setMove(null); setSel(null); } catch (e) { toast.err(e); } }}>{move?.to && orderOf(tables.data.find((t) => t.id === move.to)) ? <><Merge className="h-4 w-4" />Merge orders</> : 'Move guests'}</button></>}>
        <p className="mb-3 text-sm text-muted">Choose a free table to move to, or a busy table to merge the bills into one.</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{tables.data.filter((t) => t.id !== sel?.id).map((t) => <button key={t.id} onClick={() => setMove({ ...move, to: t.id })} className={`rounded-lg border-2 px-2 py-3 text-sm font-bold ${move?.to === t.id ? 'border-brand bg-brand text-white' : orderOf(t) ? 'border-info/40 bg-info/5' : 'border-line'}`}>{t.name}<span className="block text-[10px] font-normal">{orderOf(t) ? 'merge' : 'free'}</span></button>)}</div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------ LAYOUT EDITOR
function LayoutEditor({ areaId, tables, sel, setSel }: { areaId: string; tables: any[]; sel: string | null; setSel: (id: string | null) => void }) {
  const toast = useToast(); const confirm = useConfirm();
  const [local, setLocal] = useState<Record<string, any>>({});
  const merged = tables.map((t) => ({ ...t, ...(local[t.id] || {}) }));
  const cur = merged.find((t) => t.id === sel);
  const save = async (id: string, patch: any) => { setLocal((l) => ({ ...l, [id]: { ...(l[id] || {}), ...patch } })); try { await api.update('tables', id, patch); } catch (e) { toast.err(e); } };
  const add = async (shape: string, seats: number) => { const all = await api.list('tables'); const n = Math.max(0, ...all.map((t: any) => parseInt(String(t.name).replace(/\D/g, ''), 10) || 0)) + 1; try { const here = all.filter((t: any) => t.area_id === areaId); let spot = { x: 1.5, y: 1.5 };
    outer: for (let y = 1.2; y < 6.6; y += 1.6) for (let x = 1.3; x < 11; x += 2.2) if (!here.some((t: any) => Math.abs(t.pos_x - x) < 2.1 && Math.abs(t.pos_y - y) < 1.6)) { spot = { x, y }; break outer; }
    const t = await api.create('tables', { name: 'T' + n, area_id: areaId, seats, shape, pos_x: spot.x, pos_y: spot.y, rotation: '0', status: 'free' }); setSel(t.id); toast.ok(`Table T${n} added — drag it where you want.`); } catch (e) { toast.err(e); } };
  return (
    <div className="grid gap-4 xl:col-span-2 xl:grid-cols-[1fr_300px]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft/60 p-3 text-sm"><b className="mr-2">Add a table:</b><button className="btn-secondary btn-sm" onClick={() => add('round', 2)}>Round · 2</button><button className="btn-secondary btn-sm" onClick={() => add('square', 4)}>Square · 4</button><button className="btn-secondary btn-sm" onClick={() => add('long', 6)}>Long · 6</button><button className="btn-secondary btn-sm" onClick={() => add('long', 10)}>Long · 10</button><span className="ml-auto text-xs text-muted">Drag tables to move them. Changes save by themselves.</span></div>
        <FloorPlan2D editable tables={merged.map((t) => ({ ...t, tone: 'free' }))} selectedId={sel || undefined} onSelect={(t) => setSel(t.id)} onMove={(id, x, y) => save(id, { pos_x: x, pos_y: y })} />
      </div>
      <Card title={cur ? `Table ${cur.name}` : 'Choose a table'}>{cur ? <TableEditor t={cur} onChange={(patch) => save(cur.id, patch)} onDelete={async () => { if (await confirm({ title: `Remove table ${cur.name}?`, text: 'It disappears from the floor plan and QR ordering.', confirm: 'Remove', danger: true })) { try { await api.remove('tables', cur.id); setSel(null); toast.ok('Table removed.'); } catch (e) { toast.err(e); } } }} /> : <p className="text-sm text-muted">Tap a table on the plan to change its name, number of chairs or shape. Use the buttons above to add new tables.</p>}</Card>
    </div>
  );
}

// ------------------------------------------------------------------ KITCHEN DISPLAY
export function KitchenDisplay() {
  const kots = useList('kots', { poll: 5000 }); const cats = useList('menu_categories', { optional: true });
  const { can } = useAuth(); const toast = useToast();
  const [station, setStation] = useState('all');
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  if (kots.error) return <ErrorBox error={kots.error} />;
  if (!kots.data) return <Spinner />;
  const stations = [...new Set([...(cats.data || []).map((c) => c.station), ...kots.data.map((k) => k.station)])].filter(Boolean);
  const live = kots.data.filter((k) => ['new', 'preparing', 'ready'].includes(k.status) && (station === 'all' || k.station === station)).sort((a, b) => String(a.created).localeCompare(String(b.created)));
  const bump = async (k: any, status: string) => { try { await api.action('kotStatus', { kot_id: k.id, status }); toast.ok(`${k.table}: ${pretty(status)}`); } catch (e) { toast.err(e); } };
  const col = (s: string, label: string, next: string, btn: string) => (
    <div className="flex min-h-[60vh] flex-col rounded-xl bg-surface/60 p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{label}</h2><span className="chip bg-paper text-muted">{live.filter((k) => k.status === s).length}</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {live.filter((k) => k.status === s).map((k) => { const m = minutesSince(k.created); const late = m >= 20, warn = m >= 12; return (
          <div key={k.id} className={`overflow-hidden rounded-xl border-2 bg-surface ${late ? 'border-bad' : warn ? 'border-saffron' : 'border-line'}`}>
            <div className={`flex items-center justify-between px-3 py-2 text-sm font-bold ${late ? 'bg-bad text-white' : warn ? 'bg-saffron text-ink' : 'bg-ink text-surface'}`}><span>{k.table}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m} min</span></div>
            <div className="px-3 py-1 text-[11px] text-muted">{k.number} · {k.station}</div>
            <ul className="px-3 pb-2">{k.items.map((i: any, n: number) => <li key={n} className="py-1"><span className="text-lg font-bold">{i.qty}×</span> <span className="font-semibold">{i.name}</span>{(i.note || i.mods) && <div className="ml-6 text-sm font-semibold text-bad">→ {[i.mods, i.note].filter(Boolean).join(', ')}</div>}</li>)}</ul>
            {can('kots', 'e') && <div className="flex gap-2 border-t border-line p-2">{s === 'new' && <button className="btn-ghost btn-sm text-bad" onClick={() => bump(k, 'cancelled')}>Cancel</button>}<button className="btn-primary flex-1 py-2.5" onClick={() => bump(k, next)}>{btn}</button></div>}
          </div>); })}
        {!live.some((k) => k.status === s) && <p className="col-span-full py-10 text-center text-sm text-muted">Nothing here.</p>}
      </div>
    </div>
  );
  return (
    <div className="anim-pop">
      <PageHeader title="Kitchen display" icon="ChefHat" desc="Tickets arrive here the moment a waiter or guest orders. Oldest first. Cards turn gold after 12 minutes and red after 20." help={<>Tap <b>Start</b> when cooking begins and <b>Ready</b> when the dish is at the pass — the waiter is notified. Tap <b>Served</b> once it leaves. Choose your station to see only your tickets. This screen refreshes automatically.</>} actions={<Tabs value={station} onChange={setStation} tabs={[{ key: 'all', label: 'All stations' }, ...stations.map((s) => ({ key: s, label: s }))]} />} />
      <div className="grid gap-4 lg:grid-cols-3">{col('new', 'New', 'preparing', 'Start cooking')}{col('preparing', 'Cooking', 'ready', 'Ready to serve')}{col('ready', 'At the pass', 'served', 'Served')}</div>
    </div>
  );
}

// ------------------------------------------------------------------ QR CODES
export function QRCodes() {
  const tables = useList('tables'); const { me } = useAuth();
  const slug = me?.business?.slug;
  const codes = useAsync<Record<string, string>>(async () => { const out: any = {}; for (const t of tables.data || []) out[t.id] = await QRCode.toDataURL(`${location.origin}/menu/${slug}/${encodeURIComponent(t.name)}`, { margin: 1, width: 260, color: { dark: '#0E2A2D' } }); return out; }, [tables.data?.length, slug]);
  if (!tables.data) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="QR menu & codes" icon="QrCode" desc="Guests scan the code on their table, see the menu with photos and order straight to the kitchen." actions={<button className="btn-primary no-print" onClick={() => window.print()}><Printer className="h-4 w-4" />Print all table cards</button>} />
      <div className="no-print"><PublicLinkCard title="Digital menu (view only)" path={`/menu/${slug}`} desc="Share this link on social media or print it on takeaway bags. Guests can browse the menu without a table." /></div>
      <Help>Table QR codes open the menu for that table. Orders appear on the Kitchen display and Tables screen instantly. Guests can also call a waiter or ask for the bill from their phone. Turn QR ordering on or off in Business settings.</Help>
      <div className="print-area grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tables.data.map((t) => (
          <div key={t.id} className="card break-inside-avoid p-4 text-center">
            <div className="text-sm font-semibold text-muted">{me?.settings?.brand_name}</div>
            <div className="text-2xl font-bold">Table {t.name}</div>
            {codes.data?.[t.id] ? <img src={codes.data[t.id]} alt={`QR code for table ${t.name}`} className="mx-auto my-2 h-36 w-36" /> : <div className="mx-auto my-2 h-36 w-36 animate-pulse rounded bg-paper" />}
            <div className="text-xs text-muted">Scan to see the menu & order</div>
            <a className="no-print mt-2 inline-block text-xs font-semibold text-brand" href={`/menu/${slug}/${encodeURIComponent(t.name)}`} target="_blank" rel="noreferrer">Test it</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ RESTAURANT REPORTS
export function RestaurantReports() {
  const [days, setDays] = useState('30');
  const { data: r, error } = useAsync<any>(() => api.action('report', { name: 'restaurant', days }), [days]);
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Restaurant reports" icon="PieChart" desc="Sales, best and worst sellers, food cost margin, busy hours and staff performance." actions={<><select className="input w-auto" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Period"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Kpi label="Revenue" value={r.totals.revenue} fmt="money" /><Kpi label="Orders" value={r.totals.orders} /><Kpi label="Average bill" value={r.totals.avg} fmt="money" /><Kpi label="Service charge" value={r.totals.service} fmt="money" /><Kpi label="Discounts given" value={r.totals.discounts} fmt="money" /><Kpi label="Cancelled orders" value={r.totals.cancelled} tone={r.totals.cancelled ? 'warn' : 'ok'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Daily sales', type: 'area', data: r.daily, series: [{ key: 'Sales', label: 'Sales' }], fmt: 'money', span: 2 }} />
        <ChartCard spec={{ title: 'Sales by category', type: 'pie', data: r.categories, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Busy hours', type: 'bar', data: r.hours, series: [{ key: 'Orders', label: 'Orders' }], span: 2 }} />
        <ChartCard spec={{ title: 'Order types', type: 'pie', data: r.types, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Payment methods', type: 'pie', data: r.payments, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Sales by waiter', type: 'pie', data: r.waiters, fmt: 'money' }} />
      </div>
      <h2 className="font-semibold">Item sales & food cost</h2>
      <DataTable rows={r.items.map((x: any, i: number) => ({ ...x, id: String(i) }))} exportName="item-sales" cols={[{ key: 'name', label: 'Dish', render: (x) => <b>{x.name}</b> }, { key: 'category', label: 'Category' }, { key: 'qty', label: 'Sold', className: 'text-right' }, { key: 'revenue', label: 'Revenue', render: (x) => money(x.revenue), className: 'text-right' }, { key: 'cost', label: 'Food cost', render: (x) => money(x.cost), className: 'text-right' }, { key: 'margin', label: 'Margin', render: (x) => <span className={x.margin < 60 ? 'font-semibold text-bad' : 'text-ok'}>{x.margin}%</span>, className: 'text-right' }]} />
    </div>
  );
}
export { ChefHat, Trash2 };
