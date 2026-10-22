import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Bell, Receipt, Check, Star, BedDouble, Users, CreditCard, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { Spinner, Field, Modal, Empty } from '@/components/ui';
import { money, today, addDays, nightsBetween, date, pretty, setCurrency } from '@/lib/format';

function Shell({ biz, children, sub }: { biz: any; children: any; sub?: string }) {
  useEffect(() => { if (biz?.currency) setCurrency(biz.currency); }, [biz?.currency]);
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3"><span className="text-2xl">{biz?.logo}</span><div className="min-w-0"><div className="truncate font-bold">{biz?.name}</div><div className="truncate text-xs text-muted">{sub || biz?.city}</div></div></div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>{children}</main>
    </div>
  );
}
const NotFound = ({ e }: any) => <div className="grid min-h-screen place-items-center p-6 text-center"><div><div className="text-4xl">🔎</div><h1 className="mt-2 text-xl font-bold">{e?.message || 'This page does not exist.'}</h1><p className="text-muted">Check the link or ask the staff for help.</p></div></div>;

// ------------------------------------------------------------------ QR MENU
export function QRMenu() {
  const { slug = '', table } = useParams();
  const { data, error } = useAsync<any>(() => api.pub(slug, 'menu'), [slug], { live: false });
  const toast = useToast();
  const [cat, setCat] = useState('all'); const [q, setQ] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({}); const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [note, setNote] = useState('');
  const [placed, setPlaced] = useState<any>(() => { try { return JSON.parse(sessionStorage.getItem('qr-order-' + slug + table) || 'null'); } catch { return null; } });
  const status = useAsync<any>(() => (placed ? api.pub(slug, 'orderStatus', { order_id: placed.order_id }) : Promise.resolve(null)), [placed?.order_id], { poll: 10000, live: false });
  if (error) return <NotFound e={error} />;
  if (!data) return <Spinner />;
  const items = data.items.filter((m: any) => (cat === 'all' || m.category_id === cat) && (!q || m.name.toLowerCase().includes(q.toLowerCase())));
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ ...data.items.find((m: any) => m.id === id), qty: n }));
  const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Math.round(sub * (1 + data.business.service_charge / 100) * (1 + data.business.vat / 100));
  const set = (id: string, d: number) => setCart({ ...cart, [id]: Math.max(0, (cart[id] || 0) + d) });
  const order = async () => { try { const r = await api.pub(slug, 'qrOrder', { table, items: lines.map((l) => ({ ref: l.id, qty: l.qty })), guest_name: name, note }); setPlaced(r); sessionStorage.setItem('qr-order-' + slug + table, JSON.stringify(r)); setCart({}); setOpen(false); toast.ok('Order sent to the kitchen!'); } catch (e) { toast.err(e); } };
  const call = async (kind: string) => { try { await api.pub(slug, 'callWaiter', { table, kind }); toast.ok(kind === 'bill' ? 'Your bill is on its way.' : 'A waiter is coming to your table.'); } catch (e) { toast.err(e); } };
  const steps = ['preparing', 'ready', 'served', 'paid'];
  const st = status.data?.status;
  return (
    <Shell biz={data.business} sub={table ? `Table ${table} · order from your phone` : 'Our menu'}>
      {placed && status.data && <div className="mb-4 rounded-2xl bg-side p-4 text-white"><div className="flex items-center justify-between"><b>Your order {status.data.number}</b><span className="text-sm">{money(status.data.total)}</span></div><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">{steps.map((s, i) => <div key={s}><div className={`mx-auto mb-1 h-1.5 rounded-full ${steps.indexOf(st) >= i ? 'bg-saffron' : 'bg-white/20'}`} />{['Cooking', 'Ready', 'Served', 'Paid'][i]}</div>)}</div></div>}
      {table && <div className="mb-4 grid grid-cols-2 gap-2"><button className="btn-secondary py-3" onClick={() => call('waiter')}><Bell className="h-4 w-4" />Call waiter</button><button className="btn-secondary py-3" onClick={() => call('bill')}><Receipt className="h-4 w-4" />Ask for the bill</button></div>}
      <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="thin-scroll -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">{[{ id: 'all', name: 'All', icon: '🍽️' }, ...data.categories].map((c: any) => <button key={c.id} onClick={() => setCat(c.id)} className={`btn-sm btn shrink-0 rounded-full ${cat === c.id ? 'bg-ink text-surface' : 'bg-surface shadow-card'}`}>{c.icon} {c.name}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((m: any) => (
          <div key={m.id} className={`flex gap-3 rounded-2xl bg-surface p-3 shadow-card ${!m.available ? 'opacity-50' : ''}`}>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-paper text-4xl">{m.icon || '🍽️'}</div>
            <div className="min-w-0 flex-1"><div className="font-semibold">{m.name}</div><div className="line-clamp-2 text-xs text-muted">{m.description}</div><div className="mt-1 flex flex-wrap gap-1">{m.veg && <span className="chip bg-ok/10 text-[10px] text-ok">Vegetarian</span>}{m.spicy && m.spicy !== 'none' && <span className="chip bg-bad/10 text-[10px] text-bad">{pretty(m.spicy)}</span>}</div>
              <div className="mt-2 flex items-center justify-between"><b className="text-brand">{money(m.price)}</b>{table && (m.available ? (cart[m.id] ? <div className="flex items-center gap-2"><button className="btn-secondary h-8 w-8 p-0" onClick={() => set(m.id, -1)} aria-label="Less"><Minus className="h-4 w-4" /></button><b>{cart[m.id]}</b><button className="btn-primary h-8 w-8 p-0" onClick={() => set(m.id, 1)} aria-label="More"><Plus className="h-4 w-4" /></button></div> : <button className="btn-primary btn-sm" onClick={() => set(m.id, 1)}><Plus className="h-4 w-4" />Add</button>) : <span className="text-xs text-muted">Sold out</span>)}</div>
            </div>
          </div>
        ))}
      </div>
      {lines.length > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}><button className="btn-primary mx-auto flex w-full max-w-5xl justify-between py-3.5 text-base" onClick={() => setOpen(true)}><span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{lines.reduce((s, l) => s + l.qty, 0)} items</span><span>Review order · {money(sub)}</span></button></div>}
      <Modal open={open} onClose={() => setOpen(false)} title="Your order" footer={<button className="btn-primary w-full py-3" onClick={order}><Check className="h-4 w-4" />Send order to kitchen</button>}>
        <div className="space-y-2">{lines.map((l) => <div key={l.id} className="flex items-center justify-between text-sm"><span>{l.qty} × {l.name}</span><span>{money(l.qty * l.price)}</span></div>)}</div>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm"><div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{money(sub)}</span></div><div className="flex justify-between"><span className="text-muted">Service {data.business.service_charge}% + VAT {data.business.vat}%</span><span>{money(total - sub)}</span></div><div className="flex justify-between text-base font-bold"><span>Estimated total</span><span>{money(total)}</span></div></div>
        <div className="mt-4 space-y-3"><Field label="Your name (optional)"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Anything the kitchen should know?"><input className="input" placeholder="Allergies, less spicy…" value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
        <p className="mt-3 text-xs text-muted">You pay at the end of your meal — ask for the bill from this page.</p>
      </Modal>
      <FeedbackBox slug={slug} source="restaurant" />
    </Shell>
  );
}

function FeedbackBox({ slug, source }: { slug: string; source: string }) {
  const [r, setR] = useState(0); const [c, setC] = useState(''); const [done, setDone] = useState(false); const toast = useToast();
  if (done) return <div className="mt-8 rounded-2xl bg-ok/10 p-4 text-center text-sm font-semibold text-ok">Thank you for your feedback!</div>;
  return <div className="mt-8 rounded-2xl bg-surface p-4 shadow-card"><div className="font-semibold">How was your experience?</div><div className="my-2 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setR(n)} aria-label={`${n} stars`}><Star className={`h-7 w-7 ${n <= r ? 'fill-saffron text-saffron' : 'text-line'}`} /></button>)}</div>{r > 0 && <><textarea className="input" placeholder="Tell us more (optional)" value={c} onChange={(e) => setC(e.target.value)} /><button className="btn-primary mt-2" onClick={async () => { try { await api.pub(slug, 'feedback', { rating: r, comment: c, source }); setDone(true); } catch (e) { toast.err(e); } }}>Send feedback</button></>}</div>;
}

// ------------------------------------------------------------------ ONLINE BOOKING
export function BookOnline() {
  const { slug = '' } = useParams();
  const info = useAsync<any>(() => api.pub(slug, 'info'), [slug], { live: false });
  const qp = new URLSearchParams(location.search);
  const [q, setQ] = useState({ check_in: qp.get('in') || addDays(today(), 1), check_out: qp.get('out') || addDays(today(), 3), guests: Number(qp.get('g') || 2) });
  const [res, setRes] = useState<any>(null); const [pick, setPick] = useState<any>(null); const [done, setDone] = useState<any>(null);
  const [g, setG] = useState({ name: '', email: '', phone: '', nationality: '', special_requests: '', pay_now: true, gateway: 'Stripe' });
  const toast = useToast();
  const search = async () => { try { setRes(await api.pub(slug, 'rooms', q)); setPick(null); } catch (e) { toast.err(e); } };
  useEffect(() => { if (info.data) search(); }, [info.data]);
  if (info.error) return <NotFound e={info.error} />;
  if (!info.data) return <Spinner />;
  if (done) return <Shell biz={info.data} sub="Booking confirmed"><div className="mx-auto max-w-lg rounded-2xl bg-surface p-8 text-center shadow-card"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok"><Check className="h-7 w-7" /></div><h1 className="mt-4 text-2xl font-bold">You’re booked!</h1><p className="mt-1 text-muted">Booking number <b className="text-ink">{done.number}</b></p><div className="mt-5 rounded-xl bg-paper p-4 text-left text-sm"><div>{done.room_type}</div><div>{date(done.check_in)} → {date(done.check_out)}</div><div className="mt-2 font-bold">{done.paid ? `Paid ${money(done.paid)} via ${done.gateway}` : `Pay ${money(done.total)} at the hotel`}</div></div><p className="mt-4 text-sm text-muted">Check-in from {info.data.check_in_time}. A confirmation was sent to your email.</p></div></Shell>;
  const n = nightsBetween(q.check_in, q.check_out);
  return (
    <Shell biz={info.data} sub="Book direct — best price guaranteed">
      <div className="grid gap-3 rounded-2xl bg-surface p-4 shadow-card sm:grid-cols-4">
        <Field label="Check-in"><input type="date" className="input" min={today()} value={q.check_in} onChange={(e) => setQ({ ...q, check_in: e.target.value, check_out: e.target.value >= q.check_out ? addDays(e.target.value, 1) : q.check_out })} /></Field>
        <Field label="Check-out"><input type="date" className="input" min={addDays(q.check_in, 1)} value={q.check_out} onChange={(e) => setQ({ ...q, check_out: e.target.value })} /></Field>
        <Field label="Guests"><select className="input" value={q.guests} onChange={(e) => setQ({ ...q, guests: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div className="flex items-end"><button className="btn-primary h-10 w-full" onClick={search}><Search className="h-4 w-4" />Check availability</button></div>
      </div>
      {res && <div className="mt-5 space-y-3">
        <p className="text-sm text-muted">{n} night{n > 1 ? 's' : ''} · {date(q.check_in)} – {date(q.check_out)}</p>
        {res.types.map((t: any) => <div key={t.id} className={`flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-card sm:flex-row ${pick?.id === t.id ? 'ring-2 ring-brand' : ''}`}>
          <div className="grid h-28 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand sm:w-40"><BedDouble className="h-10 w-10" /></div>
          <div className="flex-1"><h3 className="text-lg font-bold">{t.name}</h3><p className="text-sm text-muted">{t.description}</p><div className="mt-1 flex flex-wrap gap-1">{(t.amenities || []).map((a: string) => <span key={a} className="chip bg-paper text-muted">{a}</span>)}</div><div className="mt-1 flex items-center gap-1 text-xs text-muted"><Users className="h-3.5 w-3.5" />Up to {t.max_adults} adults · {t.bed} bed · {t.size} sq ft</div></div>
          <div className="flex shrink-0 flex-col items-end justify-between gap-2"><div className="text-right"><div className="text-2xl font-bold">{money(t.base_rate)}</div><div className="text-xs text-muted">per night · {money(t.base_rate * n)} total</div></div>{t.available ? <button className="btn-primary" onClick={() => setPick(t)}>{t.available <= 2 ? `Only ${t.available} left — ` : ''}Select</button> : <span className="chip bg-bad/10 text-bad">Sold out</span>}</div>
        </div>)}
        {!res.types.length && <Empty title="No rooms for that many guests" />}
      </div>}
      <Modal open={!!pick} onClose={() => setPick(null)} title={`Book ${pick?.name}`} footer={<button className="btn-primary w-full py-3" onClick={async () => { try { const r = await api.pub(slug, 'book', { room_type_id: pick.id, check_in: q.check_in, check_out: q.check_out, adults: q.guests, guest: { name: g.name, email: g.email, phone: g.phone, nationality: g.nationality }, special_requests: g.special_requests, pay_now: g.pay_now, gateway: g.gateway }); setDone(r); } catch (e) { toast.err(e); } }}>{g.pay_now ? <><CreditCard className="h-4 w-4" />Pay {money((pick?.base_rate || 0) * n)} & confirm</> : 'Confirm — pay at hotel'}</button>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required><input className="input" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} /></Field>
          <Field label="Email" required><input className="input" type="email" value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} /></Field>
          <Field label="Country"><input className="input" value={g.nationality} onChange={(e) => setG({ ...g, nationality: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Special requests"><textarea className="input" value={g.special_requests} onChange={(e) => setG({ ...g, special_requests: e.target.value })} /></Field></div>
          <div className="space-y-2 sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="radio" checked={g.pay_now} onChange={() => setG({ ...g, pay_now: true })} />Pay now online (secure)</label>{g.pay_now && <select className="input" value={g.gateway} onChange={(e) => setG({ ...g, gateway: e.target.value })}>{['Stripe', 'PayHere', 'PayPal'].map((x) => <option key={x}>{x}</option>)}</select>}<label className="flex items-center gap-2 text-sm"><input type="radio" checked={!g.pay_now} onChange={() => setG({ ...g, pay_now: false })} />Pay at the hotel</label></div>
        </div>
      </Modal>
    </Shell>
  );
}

// ------------------------------------------------------------------ ONLINE STORE
export function StorePublic() {
  const { slug = '' } = useParams();
  const { data, error } = useAsync<any>(() => api.pub(slug, 'store'), [slug], { live: false });
  const [cat, setCat] = useState('all'); const [cart, setCart] = useState<Record<string, number>>({}); const [open, setOpen] = useState(false); const [done, setDone] = useState<any>(null);
  const [c, setC] = useState({ name: '', phone: '', email: '', address: '', delivery: false, pay_now: true });
  const toast = useToast();
  if (error) return <NotFound e={error} />;
  if (!data) return <Spinner />;
  if (done) return <Shell biz={data.business}><div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center shadow-card"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok"><Check className="h-7 w-7" /></div><h1 className="mt-3 text-2xl font-bold">Order placed</h1><p className="text-muted">Order <b className="text-ink">{done.number}</b> · {money(done.total)}</p><p className="mt-3 text-sm text-muted">{c.delivery ? 'We will call you to arrange delivery.' : 'We will message you when it is ready to collect.'}</p><button className="btn-secondary mt-5" onClick={() => { setDone(null); setCart({}); }}>Shop again</button></div></Shell>;
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ ...data.products.find((p: any) => p.id === id), qty: n }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const set = (id: string, d: number, max: number) => setCart({ ...cart, [id]: Math.min(max, Math.max(0, (cart[id] || 0) + d)) });
  return (
    <Shell biz={data.business} sub="Order online — pickup or delivery">
      <div className="thin-scroll -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">{[{ id: 'all', name: 'All', icon: '🛍️' }, ...data.categories].map((x: any) => <button key={x.id} onClick={() => setCat(x.id)} className={`btn-sm btn shrink-0 rounded-full ${cat === x.id ? 'bg-ink text-surface' : 'bg-surface shadow-card'}`}>{x.icon} {x.name}</button>)}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{data.products.filter((p: any) => cat === 'all' || p.category_id === cat).map((p: any) => <div key={p.id} className="flex flex-col rounded-2xl bg-surface p-3 shadow-card"><div className="grid h-24 place-items-center rounded-xl bg-paper text-5xl">{p.icon || '📦'}</div><div className="mt-2 line-clamp-2 flex-1 text-sm font-semibold">{p.name}</div><div className="mt-1 font-bold text-brand">{money(p.price)}</div>{p.stock > 0 ? (cart[p.id] ? <div className="mt-2 flex items-center justify-between"><button className="btn-secondary h-8 w-8 p-0" onClick={() => set(p.id, -1, p.stock)} aria-label="Less"><Minus className="h-4 w-4" /></button><b>{cart[p.id]}</b><button className="btn-primary h-8 w-8 p-0" onClick={() => set(p.id, 1, p.stock)} aria-label="More"><Plus className="h-4 w-4" /></button></div> : <button className="btn-primary btn-sm mt-2" onClick={() => set(p.id, 1, p.stock)}>Add to cart</button>) : <span className="mt-2 text-center text-xs text-muted">Out of stock</span>}</div>)}</div>
      {lines.length > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}><button className="btn-primary mx-auto flex w-full max-w-5xl justify-between py-3.5 text-base" onClick={() => setOpen(true)}><span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{lines.reduce((s, l) => s + l.qty, 0)} items</span><span>Checkout · {money(total)}</span></button></div>}
      <Modal open={open} onClose={() => setOpen(false)} title="Checkout" footer={<button className="btn-primary w-full py-3" onClick={async () => { try { const r = await api.pub(slug, 'storeOrder', { items: lines.map((l) => ({ ref: l.id, name: l.name, qty: l.qty, price: l.price })), customer: c, pay_now: c.pay_now }); setDone(r); setOpen(false); } catch (e) { toast.err(e); } }}>{c.pay_now ? `Pay ${money(total)}` : 'Place order'}</button>}>
        <div className="mb-3 space-y-1 text-sm">{lines.map((l) => <div key={l.id} className="flex justify-between"><span>{l.qty} × {l.name}</span><span>{money(l.qty * l.price)}</span></div>)}<div className="flex justify-between border-t border-line pt-2 font-bold"><span>Total</span><span>{money(total)}</span></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Name" required><input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field><Field label="Phone" required><input className="input" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field></div>
        <div className="mt-3 flex gap-2">{[[false, 'Pick up in store'], [true, 'Deliver to me']].map(([v, l]: any) => <button key={l} className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold ${c.delivery === v ? 'border-brand bg-brand-soft' : 'border-line'}`} onClick={() => setC({ ...c, delivery: v })}>{l}</button>)}</div>
        {c.delivery && <div className="mt-3"><Field label="Delivery address"><textarea className="input" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} /></Field></div>}
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={c.pay_now} onChange={(e) => setC({ ...c, pay_now: e.target.checked })} />Pay online now</label>
      </Modal>
    </Shell>
  );
}

// ------------------------------------------------------------------ PUBLIC FORM
export function PublicForm() {
  const { slug = '', id = '' } = useParams();
  const { data, error } = useAsync<any>(() => api.pub(slug, 'form', { id }), [id], { live: false });
  const [a, setA] = useState<Record<string, any>>({}); const [done, setDone] = useState(false); const toast = useToast();
  if (error) return <NotFound e={error} />;
  if (!data) return <Spinner />;
  return (
    <Shell biz={data.business}>
      <div className="mx-auto max-w-xl rounded-2xl bg-surface p-6 shadow-card">
        {done ? <div className="py-8 text-center"><Check className="mx-auto h-10 w-10 text-ok" /><h1 className="mt-2 text-xl font-bold">Thank you!</h1><p className="text-muted">Your answers were sent.</p></div> : <>
          <h1 className="text-2xl font-bold">{data.form.name}</h1><p className="mt-1 text-muted">{data.form.description}</p>
          <div className="mt-5 space-y-4">{data.form.fields.map((f: any) => <Field key={f.label} label={f.label}>{f.type === 'textarea' ? <textarea className="input" value={a[f.label] || ''} onChange={(e) => setA({ ...a, [f.label]: e.target.value })} /> : f.type === 'rating' ? <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setA({ ...a, [f.label]: n })} aria-label={`${n} stars`}><Star className={`h-7 w-7 ${n <= (a[f.label] || 0) ? 'fill-saffron text-saffron' : 'text-line'}`} /></button>)}</div> : f.type === 'yesno' ? <div className="flex gap-2">{['Yes', 'No'].map((v) => <button key={v} onClick={() => setA({ ...a, [f.label]: v })} className={`btn ${a[f.label] === v ? 'btn-primary' : 'btn-secondary'}`}>{v}</button>)}</div> : <input className="input" type={['email', 'number', 'date'].includes(f.type) ? f.type : 'text'} value={a[f.label] || ''} onChange={(e) => setA({ ...a, [f.label]: e.target.value })} />}</Field>)}</div>
          <button className="btn-primary mt-6 w-full py-3" onClick={async () => { try { await api.pub(slug, 'submitForm', { id, answers: a, name: a['Your name'] || a['Name'] }); setDone(true); } catch (e) { toast.err(e); } }}>Send answers</button>
        </>}
      </div>
    </Shell>
  );
}
export { X };
