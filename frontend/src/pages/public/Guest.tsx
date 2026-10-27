import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { P } from '@/lib/photos';
import { Minus, Plus, ShoppingBag, Bell, Receipt, Check, Star, BedDouble, Users, CreditCard, Search, X, Leaf, ArrowLeft, CalendarDays, ShieldCheck, ParkingSquare, Maximize2, Snowflake, Wifi, Tv, Wine, Sun, Waves, Bath, Lock, Wind, UtensilsCrossed, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { Spinner, Field, Modal, Empty } from '@/components/ui';
import { money, today, addDays, nightsBetween, date, pretty, setCurrency } from '@/lib/format';

function Shell({ biz, children, sub }: { biz: any; children: any; sub?: string }) {
  useEffect(() => { if (biz?.currency) setCurrency(biz.currency); }, [biz?.currency]);
  return (
    <div className="min-h-screen" style={{ background: '#F6F1E7', color: '#1B231E' }}>
      <header className="sticky top-0 z-20 border-b border-black/5 backdrop-blur" style={{ background: 'rgba(246,241,231,0.95)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3"><Link to="/" className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: '#1F3B2D' }} aria-label="Back to the website"><Leaf className="h-5 w-5" /></Link><div className="min-w-0"><div className="truncate text-xl font-semibold" style={SERIF}>{biz?.name || 'Ceylon Ayu Resort Kandy'}</div><div className="truncate text-xs text-black/60">{sub || biz?.city}</div></div></div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>{children}</main>
    </div>
  );
}
const NotFound = ({ e }: any) => <div className="grid min-h-screen place-items-center p-6 text-center"><div><div className="text-4xl">🔎</div><h1 className="mt-2 text-xl font-bold">{e?.message || 'This page does not exist.'}</h1><p className="text-muted">Check the link or ask the staff for help.</p></div></div>;

// ------------------------------------------------------------------ QR MENU
export function QRMenu() {
  const { slug = '', table } = useParams();
  const { data, error } = useAsync<any>(() => api.pub(slug, 'menu'), [slug], { live: true, poll: 20000 });
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
            {m.image ? <img src={m.image} alt={m.name} className="h-24 w-24 shrink-0 rounded-xl bg-[#E7E0D2] object-cover" loading="lazy" /> : <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-paper text-4xl">{m.icon || '🍽️'}</div>}
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
const SERIF = { fontFamily: '"Cormorant Garamond", Georgia, serif' };
const FOREST = '#1F3B2D', GOLD = '#D9B36A';
const AMENITY_ICON: Record<string, any> = { AC: Snowflake, 'Wi-Fi': Wifi, TV: Tv, Minibar: Wine, Balcony: Sun, 'Sea view': Waves, Bathtub: Bath, Safe: Lock, 'Hair dryer': Wind, Kitchenette: UtensilsCrossed };
export function BookOnline() {
  const { slug = '' } = useParams();
  const site = useAsync<any>(() => api.pub(slug, 'site'), [slug], { live: true });
  const cal = useAsync<any>(() => api.pub(slug, 'calendar', { days: 92 }), [slug], { live: true });
  const qp = new URLSearchParams(location.search);
  const [q, setQ] = useState({ check_in: qp.get('in') || addDays(today(), 1), check_out: qp.get('out') || addDays(today(), 3), guests: Number(qp.get('g') || 2) });
  const [res, setRes] = useState<any>(null); const [busy, setBusy] = useState(false); const [pick, setPick] = useState<any>(null); const [done, setDone] = useState<any>(null);
  const [g, setG] = useState({ first: '', last: '', email: '', phone: '', country: '', arrival: '', special_requests: '', pay_now: true, gateway: 'PayHere' });
  const toast = useToast();
  const search = async () => { setBusy(true); try { setRes(await api.pub(slug, 'rooms', q)); setPick(null); } catch (e) { toast.err(e); } finally { setBusy(false); } };
  useEffect(() => { if (site.data) search(); }, [site.data]);
  if (site.error) return <NotFound e={site.error} />;
  if (!site.data) return <Spinner />;
  const biz = site.data.business; const w = site.data.website || {};
  const order: string[] = site.data.rooms.map((r: any) => r.id);
  const photo = (t: any) => t.image || w.room_photos?.[t.id] || P.rooms[Math.max(0, order.indexOf(t.id)) % P.rooms.length];
  const n = nightsBetween(q.check_in, q.check_out);
  const total = pick ? pick.base_rate * n : 0;
  const book = async () => {
    if (!g.first || !g.last || !g.email) return toast.err('Please enter your first name, last name and email.');
    try { const r = await api.pub(slug, 'book', { room_type_id: pick.id, check_in: q.check_in, check_out: q.check_out, adults: q.guests, guest: { first_name: g.first, last_name: g.last, name: `${g.first} ${g.last}`, email: g.email, phone: g.phone, nationality: g.country, country: g.country }, special_requests: [g.arrival && `Arriving around ${g.arrival}`, g.special_requests].filter(Boolean).join('. '), pay_now: g.pay_now, gateway: g.gateway }); setDone({ ...r, photo: photo(pick) }); window.scrollTo(0, 0); } catch (e) { toast.err(e); }
  };
  const Header = ({ title, text }: any) => (
    <header className="relative overflow-hidden text-white" style={{ background: '#0E2A22' }}>
      <img src={P.hero} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(10,22,17,0.88),rgba(10,22,17,0.45))' }} />
      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}>
        <div className="flex items-center justify-between"><Link to="/" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/40"><Leaf className="h-5 w-5 text-[#F3E3B8]" /></span><span className="leading-none"><span className="block text-2xl font-semibold" style={SERIF}>Ceylon Ayu</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">Resort · Kandy</span></span></Link><Link to="/" className="hidden items-center gap-2 text-sm font-semibold text-white/85 hover:text-white sm:flex"><ArrowLeft className="h-4 w-4" />Back to the website</Link></div>
        <h1 className="mt-12 text-5xl font-semibold sm:text-6xl" style={SERIF}>{title}</h1><p className="mt-3 max-w-xl text-lg text-white/80">{text}</p>
      </div>
    </header>
  );
  if (done) return (
    <div className="min-h-screen" style={{ background: '#F6F1E7', color: '#1B231E' }}>
      <Header title="You’re booked!" text="Thank you for choosing Ceylon Ayu Resort. We look forward to welcoming you to Kandy." />
      <div className="relative mx-auto -mt-14 max-w-2xl px-5 pb-16">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-xl">
          <img src={done.photo} alt="" className="aspect-[16/7] w-full bg-[#E7E0D2] object-cover" />
          <div className="p-7">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-green-100 text-green-700"><Check className="h-6 w-6" /></span><div><div className="text-sm text-black/60">Booking number</div><div className="text-2xl font-bold">{done.number}</div></div></div>
            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl p-4 text-sm" style={{ background: '#F6F1E7' }}><div><dt className="text-black/55">Room</dt><dd className="font-semibold">{done.room_type}</dd></div><div><dt className="text-black/55">Dates</dt><dd className="font-semibold">{date(done.check_in)} → {date(done.check_out)}</dd></div><div><dt className="text-black/55">Check-in</dt><dd className="font-semibold">from {biz.check_in_time}</dd></div><div><dt className="text-black/55">Payment</dt><dd className="font-semibold">{done.paid ? `Paid ${money(done.paid)} by ${done.gateway}` : `${money(done.total)} at the hotel`}</dd></div></dl>
            <p className="mt-5 text-sm text-black/65">A confirmation has been sent to your email. Need anything before you arrive? Call us on <a className="font-semibold underline" href={`tel:${biz.phone}`}>{biz.phone}</a>.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link to="/" className="rounded-full px-6 py-3 font-semibold text-white" style={{ background: FOREST }}>Back to the website</Link><Link to={`/dine/${slug}`} className="rounded-full border px-6 py-3 font-semibold" style={{ borderColor: FOREST, color: FOREST }}>Reserve a dinner table</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen" style={{ background: '#F6F1E7', color: '#1B231E' }}>
      <Header title="Book your stay" text="Choose your dates and pick a room. Best rate when you book direct — pay online now or at the hotel." />
      <div className="relative mx-auto -mt-14 max-w-6xl px-5 pb-24">
        <form onSubmit={(e) => { e.preventDefault(); search(); }} className="grid gap-1 rounded-[26px] bg-white p-2.5 shadow-xl sm:grid-cols-[1fr_1fr_130px_auto]">
          <label className="rounded-[18px] px-5 py-2.5 hover:bg-black/[0.03]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><CalendarDays className="h-3.5 w-3.5" />Check-in</span><input type="date" min={today()} value={q.check_in} onChange={(e) => setQ({ ...q, check_in: e.target.value, check_out: e.target.value >= q.check_out ? addDays(e.target.value, 1) : q.check_out })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none" /></label>
          <label className="rounded-[18px] px-5 py-2.5 hover:bg-black/[0.03]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><CalendarDays className="h-3.5 w-3.5" />Check-out</span><input type="date" min={addDays(q.check_in, 1)} value={q.check_out} onChange={(e) => setQ({ ...q, check_out: e.target.value })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none" /></label>
          <label className="rounded-[18px] px-5 py-2.5 hover:bg-black/[0.03]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><Users className="h-3.5 w-3.5" />Guests</span><select value={q.guests} onChange={(e) => setQ({ ...q, guests: Number(e.target.value) })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none">{[1, 2, 3, 4, 5, 6].map((x) => <option key={x} value={x}>{x} {x === 1 ? 'guest' : 'guests'}</option>)}</select></label>
          <button className="flex items-center justify-center gap-2 rounded-[18px] px-8 py-4 text-base font-semibold text-white" style={{ background: FOREST }}><Search className="h-4 w-4" />{busy ? 'Searching…' : 'Check availability'}</button>
        </form>
        {cal.data && <AvailabilityCalendar days={cal.data.days} q={q} onPick={(ci: string, co: string) => { setQ({ ...q, check_in: ci, check_out: co }); }} onSearch={search} />}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70">{[[ShieldCheck, 'Best rate when you book direct'], [CreditCard, 'Pay online or at the hotel'], [ParkingSquare, 'Free private parking'], [Check, 'Instant confirmation']].map(([I, t]: any) => <span key={t} className="inline-flex items-center gap-2"><I className="h-4 w-4" style={{ color: FOREST }} />{t}</span>)}</div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-3xl font-semibold" style={SERIF}>{res ? `${res.types.filter((t: any) => t.available).length} rooms available` : 'Finding rooms…'}</h2>{res && <span className="text-black/60">{n} night{n > 1 ? 's' : ''} · {date(q.check_in)} – {date(q.check_out)} · {q.guests} guest{q.guests > 1 ? 's' : ''}</span>}</div>
        <div className="mt-5 space-y-5">
          {(res?.types || []).map((t: any) => (
            <article key={t.id} className={`grid overflow-hidden rounded-[26px] bg-white shadow-sm transition md:grid-cols-[340px_1fr_auto] ${pick?.id === t.id ? 'ring-2' : 'hover:shadow-lg'} ${!t.available ? 'opacity-60' : ''}`} style={pick?.id === t.id ? { ['--tw-ring-color' as any]: GOLD } : {}}>
              <div className="relative"><img src={photo(t)} alt={t.name} className="h-full min-h-[220px] w-full bg-[#E7E0D2] object-cover" loading="lazy" />{t.available > 0 && t.available <= 2 && <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow" style={{ background: GOLD, color: '#1B231E' }}>Only {t.available} left</span>}</div>
              <div className="p-6">
                <h3 className="text-3xl font-semibold leading-tight" style={SERIF}>{t.name}</h3>
                <p className="mt-2 text-black/65">{t.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-black/75"><span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />Up to {t.max_adults} adults{t.max_children ? ` + ${t.max_children} child` : ''}</span><span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{t.bed} bed</span><span className="inline-flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{t.size} sq ft</span></div>
                <div className="mt-4 flex flex-wrap gap-2">{(t.amenities || []).map((a: string) => { const I = AMENITY_ICON[a] || Check; return <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-sm"><I className="h-3.5 w-3.5" style={{ color: FOREST }} />{a}</span>; })}</div>
              </div>
              <div className="flex flex-col justify-between gap-4 border-t border-black/5 p-6 md:w-64 md:border-l md:border-t-0">
                <div className="md:text-right"><div className="text-xs uppercase tracking-wider text-black/50">Per night</div><div className="text-3xl font-bold">{money(t.base_rate)}</div><div className="text-sm text-black/60">{money(t.base_rate * n)} for {n} night{n > 1 ? 's' : ''}</div><div className="text-xs text-black/45">+ taxes & service charge</div></div>
                {t.available ? <button onClick={() => { setPick(t); setTimeout(() => document.getElementById('guest-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} className="rounded-2xl px-5 py-3.5 text-base font-semibold text-white transition hover:brightness-110" style={{ background: pick?.id === t.id ? '#8A6A2E' : FOREST }}>{pick?.id === t.id ? 'Selected ✓' : 'Select this room'}</button> : <span className="rounded-2xl bg-black/5 px-5 py-3.5 text-center font-semibold text-black/50">Sold out for these dates</span>}
              </div>
            </article>
          ))}
          {res && !res.types.length && <div className="rounded-[26px] bg-white p-10 text-center text-black/60">No room fits {q.guests} guests. Try fewer guests or call us — we’ll find a solution.</div>}
        </div>

        {pick && (
          <section id="guest-details" className="mt-10 grid gap-6 scroll-mt-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[26px] bg-white p-7 shadow-sm">
              <h2 className="text-3xl font-semibold" style={SERIF}>Your details</h2><p className="mt-1 text-sm text-black/60">We only use these to manage your booking.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="First name" required><input className="input h-12 rounded-xl text-base" value={g.first} onChange={(e) => setG({ ...g, first: e.target.value })} /></Field>
                <Field label="Last name" required><input className="input h-12 rounded-xl text-base" value={g.last} onChange={(e) => setG({ ...g, last: e.target.value })} /></Field>
                <Field label="Email" required><input type="email" className="input h-12 rounded-xl text-base" value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} /></Field>
                <Field label="Phone (with country code)"><input className="input h-12 rounded-xl text-base" value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} placeholder="+94 77 123 4567" /></Field>
                <Field label="Country"><input className="input h-12 rounded-xl text-base" value={g.country} onChange={(e) => setG({ ...g, country: e.target.value })} /></Field>
                <Field label="Expected arrival time"><input type="time" className="input h-12 rounded-xl text-base" value={g.arrival} onChange={(e) => setG({ ...g, arrival: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Field label="Special requests (optional)"><textarea className="input min-h-[90px] rounded-xl text-base" value={g.special_requests} onChange={(e) => setG({ ...g, special_requests: e.target.value })} placeholder="Airport pick-up, honeymoon set-up, extra bed…" /></Field></div>
              </div>
              <h3 className="mt-8 text-xl font-semibold">How would you like to pay?</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[[true, 'Pay now online', 'Secure card payment. Your room is guaranteed.', CreditCard], [false, 'Pay at the hotel', 'Pay by cash or card when you arrive.', Building2]].map(([v, t, d, I]: any) => <button type="button" key={t} onClick={() => setG({ ...g, pay_now: v })} className="flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition" style={{ borderColor: g.pay_now === v ? FOREST : 'rgba(0,0,0,0.1)', background: g.pay_now === v ? '#F1F5F1' : 'white' }}><I className="mt-0.5 h-5 w-5" style={{ color: FOREST }} /><span><span className="block font-semibold">{t}</span><span className="block text-sm text-black/60">{d}</span></span></button>)}
              </div>
              {g.pay_now && <div className="mt-3 flex flex-wrap gap-2">{['PayHere', 'Visa / Mastercard', 'Amex', 'PayPal'].map((x) => <button type="button" key={x} onClick={() => setG({ ...g, gateway: x })} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: g.gateway === x ? FOREST : 'rgba(0,0,0,0.12)', background: g.gateway === x ? FOREST : 'white', color: g.gateway === x ? 'white' : '#1B231E' }}>{x}</button>)}</div>}
            </div>
            <aside className="h-fit overflow-hidden rounded-[26px] bg-white shadow-sm lg:sticky lg:top-6">
              <img src={photo(pick)} alt="" className="aspect-[16/10] w-full bg-[#E7E0D2] object-cover" />
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-black/50">Your stay</div>
                <div className="mt-1 text-2xl font-semibold" style={SERIF}>{pick.name}</div>
                <div className="mt-3 space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-black/60">Check-in</span><b>{date(q.check_in)}</b></div><div className="flex justify-between"><span className="text-black/60">Check-out</span><b>{date(q.check_out)}</b></div><div className="flex justify-between"><span className="text-black/60">Guests</span><b>{q.guests}</b></div><div className="flex justify-between"><span className="text-black/60">{money(pick.base_rate)} × {n} night{n > 1 ? 's' : ''}</span><b>{money(total)}</b></div></div>
                <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-4"><span className="font-semibold">Room total</span><span className="text-2xl font-bold">{money(total)}</span></div>
                <p className="mt-1 text-xs text-black/50">Service charge, VAT and tourism levy are added on your final bill.</p>
                <button onClick={book} className="mt-5 w-full rounded-2xl px-5 py-4 text-base font-semibold shadow-md transition hover:brightness-105" style={{ background: GOLD, color: '#1B231E' }}>{g.pay_now ? `Pay ${money(total)} & confirm` : 'Confirm booking'}</button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-black/50"><Lock className="h-3.5 w-3.5" />Secure booking</p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ AVAILABILITY CALENDAR
function AvailabilityCalendar({ days, q, onPick, onSearch }: any) {
  const toast = useToast(); const [open, setOpen] = useState(true); const [first, setFirst] = useState<string | null>(null);
  const map: Record<string, number> = Object.fromEntries(days.map((d: any) => [d.date, d.free]));
  const months = [0, 1].map((k) => { const d = new Date(days[0].date + 'T12:00'); d.setDate(1); d.setMonth(d.getMonth() + k); return d; });
  const iso2 = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const click = (ds: string) => {
    if (!(map[ds] > 0)) return;
    if (!first || ds <= first) { setFirst(ds); onPick(ds, addDays(ds, 1)); return; }
    for (let d = first; d < ds; d = addDays(d, 1)) if (!(map[d] > 0)) { toast.err(`Sorry — we are fully booked on ${date(d)}. Please choose other dates.`); setFirst(ds); onPick(ds, addDays(ds, 1)); return; }
    onPick(first, ds); setFirst(null); setTimeout(onSearch, 0);
  };
  return (
    <div className="mt-5 rounded-[26px] bg-white p-5 shadow-sm">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)}><span><span className="text-xl font-semibold" style={SERIF}>Availability calendar</span><span className="ml-3 text-sm text-black/60">{first ? 'Now tap your check-out date' : 'Tap your check-in date, then your check-out date'}</span></span><span className="text-sm font-semibold" style={{ color: FOREST }}>{open ? 'Hide' : 'Show'}</span></button>
      {open && <><div className="mt-4 grid gap-6 md:grid-cols-2">{months.map((m) => { const first0 = new Date(m); const lead = (first0.getDay() + 6) % 7; const n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(); return (
        <div key={m.toISOString()}><div className="mb-2 text-center font-semibold">{m.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-black/45">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => <div key={x}>{x}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: lead }, (_, i) => <div key={'e' + i} />)}{Array.from({ length: n }, (_, i) => { const d = new Date(m.getFullYear(), m.getMonth(), i + 1); const ds = iso2(d); const free = map[ds]; const past = ds < today() || free === undefined; const full = !past && !(free > 0); const inRange = ds >= q.check_in && ds < q.check_out; const isIn = ds === q.check_in || ds === first;
            return <button key={ds} disabled={past || full} onClick={() => click(ds)} title={full ? 'Fully booked' : free ? `${free} rooms free` : ''} className={`relative aspect-square rounded-lg text-sm font-semibold transition ${past ? 'text-black/20' : full ? 'cursor-not-allowed bg-red-50 text-red-300 line-through' : isIn ? 'text-white' : inRange ? 'text-[#1B231E]' : 'hover:bg-black/5'}`} style={isIn ? { background: FOREST } : inRange ? { background: '#E9DFC6' } : {}}>{i + 1}{!past && !full && free <= 2 && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: GOLD }} />}</button>; })}</div>
        </div>); })}</div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-black/60"><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: FOREST }} />Your check-in</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: '#E9DFC6' }} />Your stay</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />Fully booked — cannot be chosen</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />Last rooms</span></div></>}
    </div>
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
