import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Waves, ParkingSquare, Trees, UtensilsCrossed, TrainFront, Star, MapPin, Phone, Mail, MessageCircle, BedDouble, Users, Check, Minus, Plus, ShoppingBag, ChefHat, Sparkles, Menu as MenuIcon, X, CalendarDays, Clock, ArrowRight, Leaf } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { Spinner, Field, Modal } from '@/components/ui';
import { Floor3D, FloorLegend } from '@/components/Floor3D';
import { money, today, addDays, setCurrency, pretty, date } from '@/lib/format';

export const SLUG = 'ceylon-ayu';
const serif = { fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif' };
const C = { forest: '#1F3B2D', cream: '#F6F1E7', gold: '#B8914A', ink: '#1B231E' };

/** Photo with an elegant fallback panel when no image is uploaded */
function Photo({ src, alt, className = '', tone = C.forest, icon }: { src?: string; alt: string; className?: string; tone?: string; icon?: any }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) return <img src={src} alt={alt} onError={() => setBad(true)} className={`object-cover ${className}`} loading="lazy" />;
  const I = icon || Leaf;
  return <div role="img" aria-label={alt} className={`grid place-items-center ${className}`} style={{ background: `radial-gradient(circle at 30% 20%, ${tone}cc, ${tone})` }}><I className="h-10 w-10 text-white/70" /></div>;
}

// ------------------------------------------------------------------ WEBSITE
export function HotelSite() {
  const { data, error } = useAsync<any>(() => api.pub(SLUG, 'site'), [], { live: false });
  const nav = useNavigate();
  const [q, setQ] = useState({ in: addDays(today(), 1), out: addDays(today(), 3), g: 2 });
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (data?.business?.currency) setCurrency(data.business.currency); }, [data]);
  if (error) return <div className="grid min-h-screen place-items-center p-6 text-center">The website could not load. Please refresh.</div>;
  if (!data) return <Spinner />;
  const w = data.website || {}; const ph = w.photos || {}; const b = data.business;
  const title = w.hero_title || b.name;
  const highlights = [[Waves, 'Outdoor swimming pool'], [ParkingSquare, 'Free private parking'], [Trees, 'Garden & terrace'], [UtensilsCrossed, 'Sri Lankan, seafood & Irish dining'], [TrainFront, '3 km from Kandy railway station']];
  const explore = [['🛕', 'Temple of the Sacred Tooth Relic', 'Sri Lanka’s most revered temple, beside Kandy Lake. Evening puja is unforgettable.'], ['🌊', 'Kandy Lake', 'A gentle walk around the historic lake in the heart of the city.'], ['🌺', 'Royal Botanical Gardens, Peradeniya', 'Orchid house, giant bamboo and the famous avenue of royal palms.'], ['🍃', 'Ceylon Tea Museum & tea estates', 'See how Ceylon tea is made, then taste it where it is grown.'], ['💃', 'Kandyan cultural dance', 'Drums, fire-walking and costumes from the Kandyan kingdom.'], ['🌳', 'Udawatta Kele forest', 'A royal forest reserve with birds and monkeys right above the city.']];
  const nl = [['#rooms', 'Rooms'], ['#dining', 'Dining'], ['#experiences', 'Experiences'], ['#explore', 'Explore Kandy'], ['#contact', 'Contact']];
  return (
    <div style={{ background: C.cream, color: C.ink }} className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-black/5 backdrop-blur" style={{ background: 'rgba(246,241,231,0.92)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: C.forest }}><Leaf className="h-5 w-5" /></span><span className="leading-tight"><span className="block text-xl font-semibold" style={serif}>Ceylon Ayu</span><span className="block text-[10px] uppercase tracking-[0.25em] text-black/60">Resort · Kandy</span></span></a>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">{nl.map(([h, l]) => <a key={h} href={h} className="hover:opacity-70">{l}</a>)}</nav>
          <div className="flex items-center gap-2"><Link to={`/dine/${SLUG}`} className="hidden rounded-full border px-4 py-2 text-sm font-semibold sm:inline-block" style={{ borderColor: C.forest, color: C.forest }}>Book a table</Link><Link to={`/book/${SLUG}`} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: C.forest }}>Book your stay</Link><button className="p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X /> : <MenuIcon />}</button></div>
        </div>
        {menuOpen && <nav className="border-t border-black/5 px-5 py-3 md:hidden">{nl.map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block py-2 font-medium">{l}</a>)}<Link to={`/dine/${SLUG}`} className="block py-2 font-medium">Book a table</Link></nav>}
      </header>

      <section id="top" className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm"><Star className="h-3.5 w-3.5" style={{ fill: C.gold, color: C.gold }} />Rated “Wonderful” by our guests</div>
          <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl" style={serif}>{title}</h1>
          <p className="mt-5 max-w-xl text-lg text-black/70">{w.hero_subtitle || 'A peaceful garden resort with an outdoor pool, 3 km from Kandy railway station.'}</p>
          <form onSubmit={(e) => { e.preventDefault(); nav(`/book/${SLUG}?in=${q.in}&out=${q.out}&g=${q.g}`); }} className="mt-8 grid gap-2 rounded-2xl bg-white p-3 shadow-lg sm:grid-cols-[1fr_1fr_90px_auto]">
            <label className="px-2 text-xs font-semibold text-black/60">Check-in<input type="date" min={today()} value={q.in} onChange={(e) => setQ({ ...q, in: e.target.value, out: e.target.value >= q.out ? addDays(e.target.value, 1) : q.out })} className="mt-0.5 block w-full bg-transparent text-sm font-semibold text-black outline-none" /></label>
            <label className="px-2 text-xs font-semibold text-black/60">Check-out<input type="date" min={addDays(q.in, 1)} value={q.out} onChange={(e) => setQ({ ...q, out: e.target.value })} className="mt-0.5 block w-full bg-transparent text-sm font-semibold text-black outline-none" /></label>
            <label className="px-2 text-xs font-semibold text-black/60">Guests<select value={q.g} onChange={(e) => setQ({ ...q, g: Number(e.target.value) })} className="mt-0.5 block w-full bg-transparent text-sm font-semibold text-black outline-none">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
            <button className="rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: C.forest }}>Check availability</button>
          </form>
          <p className="mt-3 text-sm text-black/60">Best rate when you book direct · Pay online or at the hotel</p>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-3 rounded-t-[999px] border" style={{ borderColor: C.gold }} aria-hidden />
          <div className="relative overflow-hidden rounded-t-[999px] shadow-2xl" style={{ aspectRatio: '4 / 5' }}><Photo src={ph.hero || '/images/room-deluxe.webp'} alt="Ceylon Ayu Resort room with four-poster bed" className="h-full w-full" /></div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white px-4 py-3 shadow-xl"><div className="text-xs text-black/60">Rooms from</div><div className="text-xl font-bold" style={{ color: C.forest }}>{money(Math.min(...data.rooms.map((r: any) => r.base_rate)))}<span className="text-xs font-normal text-black/60"> / night</span></div></div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-6 sm:grid-cols-3 lg:grid-cols-5">{highlights.map(([I, t]: any) => <div key={t} className="flex items-center gap-3 text-sm font-medium"><I className="h-5 w-5 shrink-0" style={{ color: C.gold }} />{t}</div>)}</div></section>

      <section className="mx-auto max-w-6xl px-5 py-16"><div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Welcome</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>A calm garden retreat in Sri Lanka’s hill capital</h2><p className="mt-4 leading-relaxed text-black/70">{w.about}</p></div><div className="grid grid-cols-2 gap-3"><Photo src={ph.pool} alt="Outdoor swimming pool" icon={Waves} tone="#2B6A73" className="aspect-square w-full rounded-2xl" /><Photo src={ph.garden} alt="Garden and terrace" icon={Trees} tone="#3E6B47" className="mt-8 aspect-square w-full rounded-2xl" /></div></div></section>

      <section id="rooms" className="py-16" style={{ background: C.forest, color: '#F3EEE2' }}>
        <div className="mx-auto max-w-6xl px-5"><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Stay</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>Rooms & suites</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.rooms.map((r: any, i: number) => (
            <div key={r.id} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Photo src={w.room_photos?.[r.id] || (i === data.rooms.length - 1 ? '/images/room-deluxe.webp' : '')} alt={r.name} icon={BedDouble} tone={['#2E5240', '#3C5A4A', '#4A5E44', '#35554F', '#5A4A32'][i % 5]} className="aspect-[4/3] w-full" />
              <div className="p-5"><h3 className="text-2xl font-semibold" style={serif}>{r.name}</h3><div className="mt-1 flex items-center gap-3 text-sm text-white/70"><span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />Up to {r.max_adults} adults</span><span>{r.bed} bed</span><span>{r.size} sq ft</span></div>
                <div className="mt-3 flex flex-wrap gap-1.5">{(r.amenities || []).slice(0, 6).map((a: string) => <span key={a} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{a}</span>)}</div>
                <div className="mt-4 flex items-end justify-between"><div><div className="text-xs text-white/60">From</div><div className="text-xl font-bold">{money(r.base_rate)}<span className="text-xs font-normal text-white/60"> / night</span></div></div><Link to={`/book/${SLUG}`} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: C.gold, color: C.ink }}>Book</Link></div>
              </div>
            </div>))}</div>
        </div>
      </section>

      <section id="dining" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Photo src={ph.restaurant} alt="Ceylon Ayu restaurant" icon={UtensilsCrossed} tone="#7A4A2A" className="aspect-[4/3] w-full rounded-3xl" />
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Dine</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>Sri Lankan, seafood & Irish favourites</h2><p className="mt-4 text-black/70">Start the day with an à la carte, continental or Asian breakfast. Later, enjoy Kandyan rice and curry, fresh seafood from the grill or a hearty Irish stew on the terrace. Vegetarian, dairy-free and halal options on request.</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">{data.menu.slice(0, 8).map((m: any) => <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm"><span>{m.icon} {m.name}</span><b>{money(m.price)}</b></li>)}</ul>
            <div className="mt-6 flex flex-wrap gap-3"><Link to={`/dine/${SLUG}`} className="rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ background: C.forest }}>Book a table — pick it in 3D</Link><Link to={`/menu/${SLUG}`} className="rounded-full border px-5 py-3 text-sm font-semibold" style={{ borderColor: C.forest, color: C.forest }}>See the full menu</Link></div>
          </div>
        </div>
      </section>

      <section id="experiences" className="bg-white py-16"><div className="mx-auto max-w-6xl px-5"><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Relax & discover</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>Wellness, tours & transfers</h2><p className="mt-2 max-w-2xl text-black/70">Arrange everything at reception or from the QR card in your room — airport transfers, temple visits, tea estate tours and Ayurvedic treatments.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.services.map((s: any) => <div key={s.id} className="rounded-2xl border border-black/10 p-5"><div className="text-2xl">{({ Spa: '🌿', Tour: '🗺️', Transport: '🚐', Dining: '🕯️', Activity: '🎭' } as any)[s.category] || '✨'}</div><h3 className="mt-2 font-semibold">{s.name}</h3><div className="mt-1 text-sm text-black/60">{money(s.price)} per {s.unit}</div></div>)}</div>
      </div></section>

      <section id="explore" className="mx-auto max-w-6xl px-5 py-16"><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Kandy</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>Explore the hill capital</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{explore.map(([e, t, d]) => <div key={t} className="rounded-2xl bg-white p-6 shadow-sm"><div className="text-3xl">{e}</div><h3 className="mt-3 text-xl font-semibold" style={serif}>{t}</h3><p className="mt-1 text-sm text-black/65">{d}</p></div>)}</div>
      </section>

      {data.reviews.length > 0 && <section className="py-16" style={{ background: C.forest, color: '#F3EEE2' }}><div className="mx-auto max-w-6xl px-5"><h2 className="text-4xl font-semibold" style={serif}>What our guests say</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{data.reviews.slice(0, 3).map((r: any) => <figure key={r.id} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-4 w-4" style={n <= r.rating ? { fill: C.gold, color: C.gold } : { color: '#ffffff40' }} />)}</div><blockquote className="mt-3 text-lg leading-snug" style={serif}>“{r.comment}”</blockquote><figcaption className="mt-3 text-sm text-white/60">— {r.customer_name}</figcaption></figure>)}</div></div></section>}

      <section id="contact" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: C.gold }}>Find us</p><h2 className="mt-2 text-4xl font-semibold" style={serif}>{b.name}</h2>
          <ul className="mt-6 space-y-3 text-black/75"><li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0" style={{ color: C.gold }} />{b.address}</li>{(w.phone || b.phone) && <li className="flex gap-3"><Phone className="h-5 w-5" style={{ color: C.gold }} /><a href={`tel:${w.phone || b.phone}`}>{w.phone || b.phone}</a></li>}{(w.email || b.email) && <li className="flex gap-3"><Mail className="h-5 w-5" style={{ color: C.gold }} /><a href={`mailto:${w.email || b.email}`}>{w.email || b.email}</a></li>}{w.whatsapp && <li className="flex gap-3"><MessageCircle className="h-5 w-5" style={{ color: C.gold }} /><a href={`https://wa.me/${w.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a></li>}</ul>
          <div className="mt-6 flex flex-wrap gap-3"><Link to={`/book/${SLUG}`} className="rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ background: C.forest }}>Book your stay</Link><Link to={`/dine/${SLUG}`} className="rounded-full border px-5 py-3 text-sm font-semibold" style={{ borderColor: C.forest, color: C.forest }}>Book a table</Link></div>
        </div>
        <iframe title="Map to Ceylon Ayu Resort Kandy" className="h-80 w-full rounded-2xl border-0 shadow-sm" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(w.map_query || 'Ceylon Ayu Resort Kandy')}&output=embed`} />
      </section>

      <footer className="border-t border-black/10 py-8 text-center text-sm text-black/60" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>© {new Date().getFullYear()} {b.name} · <Link to="/login" className="underline">Staff login</Link></footer>
    </div>
  );
}

// ------------------------------------------------------------------ SHARED GUEST SHELL
function GuestShell({ biz, sub, children }: any) {
  useEffect(() => { if (biz?.currency) setCurrency(biz.currency); }, [biz?.currency]);
  return (
    <div className="min-h-screen" style={{ background: C.cream, color: C.ink }}>
      <header className="sticky top-0 z-30 border-b border-black/5 backdrop-blur" style={{ background: 'rgba(246,241,231,0.95)', paddingTop: 'env(safe-area-inset-top, 0px)' }}><div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3"><Link to="/" className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: C.forest }}><Leaf className="h-4 w-4" /></Link><div><div className="text-lg font-semibold leading-tight" style={serif}>{biz?.name || 'Ceylon Ayu Resort Kandy'}</div><div className="text-xs text-black/60">{sub}</div></div></div></header>
      <main className="mx-auto max-w-4xl px-4 py-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>{children}</main>
    </div>
  );
}

// ------------------------------------------------------------------ ROOM QR (room service + requests)
const REQUESTS: [string, string][] = [['Extra towels', '🧺'], ['Room cleaning', '🧹'], ['Drinking water', '💧'], ['Extra pillow / blanket', '🛏️'], ['Toiletries', '🧴'], ['Maintenance / repair', '🔧'], ['Late check-out', '🕐'], ['Wake-up call', '⏰'], ['Laundry pick-up', '👕'], ['Doctor / pharmacy', '💊']];
export function RoomQR() {
  const { slug = SLUG, room = '' } = useParams();
  const { data, error, reload } = useAsync<any>(() => api.pub(slug, 'roomInfo', { room }), [room], { poll: 10000, live: false });
  const toast = useToast();
  const [tab, setTab] = useState('menu'); const [cat, setCat] = useState('all');
  const [cart, setCart] = useState<Record<string, number>>({}); const [note, setNote] = useState(''); const [open, setOpen] = useState(false);
  const [req, setReq] = useState<string | null>(null); const [details, setDetails] = useState('');
  if (error) return <GuestShell sub={`Room ${room}`}><div className="py-20 text-center">{error.message}</div></GuestShell>;
  if (!data) return <Spinner />;
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ ...data.items.find((m: any) => m.id === id), qty: n }));
  const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const set = (id: string, d: number) => setCart({ ...cart, [id]: Math.max(0, (cart[id] || 0) + d) });
  const order = async () => { try { const r = await api.pub(slug, 'roomOrder', { room, items: lines.map((l) => ({ ref: l.id, qty: l.qty })), note }); setCart({}); setOpen(false); setTab('orders'); toast.ok(`Order ${r.number} sent to the kitchen. It will be added to your room bill.`); reload(); } catch (e) { toast.err(e); } };
  const send = async () => { try { await api.pub(slug, 'roomRequest', { room, type: req, details }); toast.ok('Request sent. Our team has been notified.'); setReq(null); setDetails(''); reload(); } catch (e) { toast.err(e); } };
  const steps = ['preparing', 'ready', 'served', 'paid'];
  return (
    <GuestShell biz={data.business} sub={`Room ${data.room}${data.occupied ? ` · Welcome${data.guest_first_name ? ', ' + data.guest_first_name : ''}` : ''}`}>
      {!data.occupied && <div className="mb-4 rounded-2xl bg-white p-4 text-sm shadow-sm">Ordering opens once you are checked in. You can still browse the menu.</div>}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">{[['menu', 'Room service'], ['requests', 'Requests'], ['orders', 'My orders']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="rounded-xl py-2.5 text-sm font-semibold" style={tab === k ? { background: C.forest, color: 'white' } : {}}>{l}</button>)}</div>
      {tab === 'menu' && <>
        <div className="thin-scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">{[{ id: 'all', name: 'All', icon: '🍽️' }, ...data.categories].map((c: any) => <button key={c.id} onClick={() => setCat(c.id)} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm" style={cat === c.id ? { background: C.ink, color: 'white' } : { background: 'white' }}>{c.icon} {c.name}</button>)}</div>
        <div className="grid gap-3 sm:grid-cols-2">{data.items.filter((m: any) => cat === 'all' || m.category_id === cat).map((m: any) => <div key={m.id} className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ${m.available === false ? 'opacity-50' : ''}`}><div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-3xl" style={{ background: C.cream }}>{m.icon}</div><div className="min-w-0 flex-1"><div className="font-semibold">{m.name}</div>{m.veg && <span className="text-[11px] font-semibold text-green-700">Vegetarian</span>}<div className="mt-1 flex items-center justify-between"><b style={{ color: C.forest }}>{money(m.price)}</b>{data.occupied && m.available !== false && (cart[m.id] ? <span className="flex items-center gap-2"><button className="grid h-8 w-8 place-items-center rounded-full border" onClick={() => set(m.id, -1)} aria-label="Less"><Minus className="h-4 w-4" /></button><b>{cart[m.id]}</b><button className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: C.forest }} onClick={() => set(m.id, 1)} aria-label="More"><Plus className="h-4 w-4" /></button></span> : <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: C.forest }} onClick={() => set(m.id, 1)}>Add</button>)}{m.available === false && <span className="text-xs">Sold out</span>}</div></div></div>)}</div>
      </>}
      {tab === 'requests' && <><p className="mb-3 text-sm text-black/70">Tap what you need. Reception and housekeeping see it immediately.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{REQUESTS.map(([t, e]) => <button key={t} disabled={!data.occupied} onClick={() => setReq(t)} className="rounded-2xl bg-white p-4 text-left shadow-sm disabled:opacity-50"><div className="text-2xl">{e}</div><div className="mt-1 text-sm font-semibold">{t}</div></button>)}<a href={`tel:${data.business.phone}`} className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-2xl">🚕</div><div className="mt-1 text-sm font-semibold">Taxi / airport transfer — call reception</div></a></div>
        {data.requests.length > 0 && <div className="mt-5"><h3 className="mb-2 font-semibold">Your open requests</h3>{data.requests.map((r: any) => <div key={r.id} className="mb-2 flex justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm"><span>{r.type}</span><b>{pretty(r.status)}</b></div>)}</div>}</>}
      {tab === 'orders' && <div className="space-y-3">{data.orders.map((o: any) => <div key={o.number} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex justify-between"><b>{o.number}</b><span>{money(o.total)}</span></div><div className="mt-1 text-sm text-black/60">{o.items.map((i: any) => `${i.qty}× ${i.name}`).join(', ')}</div><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">{steps.map((s, i) => <div key={s}><div className="mx-auto mb-1 h-1.5 rounded-full" style={{ background: steps.indexOf(o.status) >= i ? C.gold : '#e5e0d4' }} />{['Cooking', 'Ready', 'Delivered', 'On your bill'][i]}</div>)}</div></div>)}{!data.orders.length && <p className="py-10 text-center text-sm text-black/60">No orders today yet.</p>}</div>}
      {lines.length > 0 && tab === 'menu' && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}><button className="mx-auto flex w-full max-w-4xl justify-between rounded-xl px-4 py-3.5 font-semibold text-white" style={{ background: C.forest }} onClick={() => setOpen(true)}><span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{lines.reduce((s, l) => s + l.qty, 0)} items</span><span>Review · {money(sub)}</span></button></div>}
      <Modal open={open} onClose={() => setOpen(false)} title={`Room service · Room ${data.room}`} footer={<button className="btn-primary w-full py-3" onClick={order}><ChefHat className="h-4 w-4" />Send to kitchen</button>}>
        {lines.map((l) => <div key={l.id} className="flex justify-between py-1 text-sm"><span>{l.qty} × {l.name}</span><span>{money(l.qty * l.price)}</span></div>)}
        <div className="mt-2 border-t border-line pt-2 text-sm"><div className="flex justify-between font-bold"><span>Food total</span><span>{money(sub)}</span></div><p className="mt-1 text-xs text-muted">Service charge and VAT are added. Charged to your room bill when delivered.</p></div>
        <div className="mt-3"><Field label="Note for the kitchen (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, no onion…" /></Field></div>
      </Modal>
      <Modal open={!!req} onClose={() => setReq(null)} title={req || ''} footer={<button className="btn-primary w-full py-3" onClick={send}><Sparkles className="h-4 w-4" />Send request</button>}><Field label="Anything to add? (optional)"><textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} /></Field></Modal>
    </GuestShell>
  );
}

// ------------------------------------------------------------------ 3D TABLE BOOKING
export function DineBooking() {
  const { slug = SLUG } = useParams();
  const [q, setQ] = useState({ date: today(), time: '19:30', guests: 2 });
  const { data, error } = useAsync<any>(() => api.pub(slug, 'tablesAvailability', q), [q.date, q.time, q.guests], { live: false });
  const [area, setArea] = useState(''); const [sel, setSel] = useState<any>(null); const [done, setDone] = useState<any>(null);
  const [f, setF] = useState({ name: '', phone: '', occasion: 'None', notes: '' }); const toast = useToast();
  useEffect(() => { if (data?.areas?.length && !area) setArea(data.areas[0].id); }, [data]);
  const tables = useMemo(() => (data?.tables || []).filter((t: any) => t.area_id === area).map((t: any) => ({ ...t, tone: t.available ? 'free' : 'off', sub: t.available ? `${t.seats} seats` : 'Taken' })), [data, area]);
  if (error) return <GuestShell sub="Book a table"><div className="py-20 text-center">{error.message}</div></GuestShell>;
  if (done) return <GuestShell biz={data?.business} sub="Table booked"><div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700"><Check className="h-7 w-7" /></div><h1 className="mt-3 text-3xl font-semibold" style={serif}>See you soon!</h1><p className="mt-2 text-black/70">Table <b>{done.table}</b> on {date(done.date)} at {done.time}.</p><Link to="/" className="mt-6 inline-block text-sm font-semibold underline">Back to the website</Link></div></GuestShell>;
  return (
    <GuestShell biz={data?.business} sub="Book a table — choose your table in 3D">
      <div className="grid gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-3">
        <label className="text-xs font-semibold text-black/60"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Date<input type="date" min={today()} className="input mt-1" value={q.date} onChange={(e) => { setQ({ ...q, date: e.target.value }); setSel(null); }} /></label>
        <label className="text-xs font-semibold text-black/60"><Clock className="mr-1 inline h-3.5 w-3.5" />Time<select className="input mt-1" value={q.time} onChange={(e) => { setQ({ ...q, time: e.target.value }); setSel(null); }}>{['07:30', '08:30', '12:00', '12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs font-semibold text-black/60"><Users className="mr-1 inline h-3.5 w-3.5" />Guests<select className="input mt-1" value={q.guests} onChange={(e) => { setQ({ ...q, guests: Number(e.target.value) }); setSel(null); }}>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
      </div>
      {!data ? <Spinner /> : <>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5">{data.areas.map((a: any) => <button key={a.id} onClick={() => setArea(a.id)} className="rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm" style={area === a.id ? { background: C.ink, color: 'white' } : { background: 'white' }}>{a.name} <span className="opacity-60">({data.tables.filter((t: any) => t.area_id === a.id && t.available).length})</span></button>)}</div><FloorLegend items={[['free', 'Available — tap to choose'], ['off', 'Taken or too small'], ['pick', 'Your table']]} /></div>
        <Floor3D tables={tables} selectedId={sel?.id} onSelect={setSel} height={460} />
        <p className="mt-2 text-center text-xs text-black/60">Use <b>Turn</b> to look at the room from another side, or <b>Top view</b> for a flat plan.</p>
        {sel && <div className="anim-pop mt-4 rounded-2xl bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><b className="text-lg">Table {sel.name} · {sel.seats} seats</b><span className="text-sm text-black/60">{date(q.date)} · {q.time} · {q.guests} guests</span></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Your name" required><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Phone" required><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Occasion"><select className="input" value={f.occasion} onChange={(e) => setF({ ...f, occasion: e.target.value })}>{['None', 'Birthday', 'Anniversary', 'Business', 'Date'].map((o) => <option key={o}>{o}</option>)}</select></Field><Field label="Notes"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="High chair, allergies…" /></Field></div>
          <button className="mt-4 w-full rounded-xl py-3.5 font-semibold text-white" style={{ background: C.forest }} onClick={async () => { try { setDone(await api.pub(slug, 'bookTable', { table_id: sel.id, ...q, ...f })); } catch (e) { toast.err(e); } }}>Confirm booking <ArrowRight className="ml-1 inline h-4 w-4" /></button></div>}
      </>}
    </GuestShell>
  );
}
