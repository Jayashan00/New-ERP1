import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Waves, ParkingSquare, Trees, UtensilsCrossed, TrainFront, Star, MapPin, Phone, Mail, MessageCircle, BedDouble, Users, Check, Minus, Plus, ShoppingBag, ChefHat, Sparkles, Menu as MenuIcon, X, CalendarDays, Clock, ArrowRight, Leaf, LogIn, Car } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { Spinner, Field, Modal } from '@/components/ui';
import { FloorPlan2D, Legend2D } from '@/components/FloorPlan2D';
import { P, EXPLORE, serviceImg } from '@/lib/photos';
import { money, today, addDays, setCurrency, pretty, date } from '@/lib/format';

export const SLUG = 'ceylon-ayu';
const serif = { fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif' };
const C = { forest: '#1F3B2D', cream: '#F6F1E7', gold: '#B8914A', ink: '#1B231E' };

/** Photo with an elegant fallback panel when no image is uploaded */
function Photo({ src, alt, className = '', tone = C.forest, icon }: { src?: string; alt: string; className?: string; tone?: string; icon?: any }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) return <img src={src} alt={alt} onError={() => setBad(true)} className={`bg-[#E7E0D2] object-cover ${className}`} loading="lazy" />;
  const I = icon || Leaf;
  return <div role="img" aria-label={alt} className={`grid place-items-center ${className}`} style={{ background: `radial-gradient(circle at 30% 20%, ${tone}cc, ${tone})` }}><I className="h-10 w-10 text-white/70" /></div>;
}

// ------------------------------------------------------------------ WEBSITE
const ICONS_EXP: Record<string, any> = { Spa: Sparkles, Tour: MapPin, Transport: Car, Dining: UtensilsCrossed, Activity: Star };
function useReveal(dep: any) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const vh = window.innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('rv-hide'); });
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('rv-hide'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    const t = setTimeout(() => els.forEach((el) => el.classList.remove('rv-hide')), 6000);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [dep]);
}
const Eyebrow = ({ children, light }: any) => <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: light ? '#E9C77E' : C.gold }}>{children}</p>;

export function HotelSite() {
  const { data, error } = useAsync<any>(() => api.pub(SLUG, 'site'), [], { live: true });
  const nav = useNavigate();
  const [q, setQ] = useState({ in: addDays(today(), 1), out: addDays(today(), 3), g: 2 });
  const [menuOpen, setMenuOpen] = useState(false); const [solid, setSolid] = useState(false); const [slide, setSlide] = useState(0);
  useEffect(() => { if (data?.business?.currency) setCurrency(data.business.currency); }, [data]);
  useEffect(() => { const f = () => setSolid(window.scrollY > 60); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const w = data?.website || {}; const ph = w.photos || {};
  const slides: string[] = (w.hero_slides || []).filter(Boolean).length ? w.hero_slides.filter(Boolean) : P.heroSlides;
  useEffect(() => { const t = setInterval(() => setSlide((x) => (x + 1) % slides.length), 6500); return () => clearInterval(t); }, [slides.length]);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const el = document.querySelector(`[data-slide="${slide}"] img`); if (el) gsap.fromTo(el, { scale: 1.14 }, { scale: 1, duration: 8, ease: 'none' }); }, [slide, data]);
  useEffect(() => { if (!data || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; gsap.from('.hx-in', { y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 }); }, [data]);
  useReveal(data);
  if (error) return <div className="grid min-h-screen place-items-center p-6 text-center">The website could not load. Please refresh.</div>;
  if (!data) return <Spinner />;
  const b = data.business;
  const about = w.about || 'Set among gardens on the edge of Kandy, Ceylon Ayu Resort is a calm base for exploring Sri Lanka’s hill capital. Relax by the outdoor pool, enjoy the terrace and garden, and dine on Sri Lankan, seafood and Irish favourites.';
  const highlights = [[Waves, 'Outdoor pool'], [ParkingSquare, 'Free private parking'], [Trees, 'Garden & terrace'], [UtensilsCrossed, 'Restaurant & bar'], [TrainFront, '3 km to Kandy station']];
  const nl = [['#rooms', 'Rooms'], ['#dining', 'Dining'], ['#experiences', 'Experiences'], ['#explore', 'Explore Kandy'], ['#contact', 'Contact']];
  const minRate = Math.min(...data.rooms.map((r: any) => r.base_rate));
  const roomImg = (r: any, i: number) => r.image || w.room_photos?.[r.id] || P.rooms[i % P.rooms.length];
  const navLight = !solid;
  return (
    <div style={{ background: C.cream, color: C.ink }} className="min-h-screen overflow-x-hidden">
      <style>{`.reveal{transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}.rv-hide{opacity:0;transform:translateY(34px)}@media (prefers-reduced-motion:reduce){.reveal{transition:none}.rv-hide{opacity:1;transform:none}}`}</style>
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${solid ? 'shadow-[0_1px_0_rgba(0,0,0,0.06)]' : ''}`} style={{ background: solid ? 'rgba(246,241,231,0.97)' : 'linear-gradient(180deg,rgba(0,0,0,0.45),transparent)', backdropFilter: solid ? 'blur(10px)' : undefined, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
          <a href="#top" className="flex items-center gap-3" style={{ color: navLight ? '#fff' : C.ink }}><span className="grid h-11 w-11 place-items-center rounded-full border" style={{ borderColor: navLight ? 'rgba(255,255,255,0.5)' : '#1F3B2D33' }}><Leaf className="h-5 w-5" style={{ color: navLight ? '#F3E3B8' : C.forest }} /></span><span className="leading-none"><span className="block text-[26px] font-semibold" style={serif}>Ceylon Ayu</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.35em] opacity-75">Resort · Kandy</span></span></a>
          <nav className="hidden items-center gap-8 text-[15px] font-medium lg:flex" style={{ color: navLight ? '#fff' : C.ink }}>{nl.map(([h, l]) => <a key={h} href={h} className="relative opacity-90 transition hover:opacity-100 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all hover:after:w-full">{l}</a>)}</nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:inline-flex" style={{ borderColor: navLight ? 'rgba(255,255,255,0.55)' : '#1F3B2D40', color: navLight ? '#fff' : C.forest }}><LogIn className="h-4 w-4" />Staff login</Link>
            <Link to={`/book/${SLUG}`} className="rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:brightness-105" style={{ background: '#D9B36A', color: C.ink }}>Book your stay</Link>
            <button className="rounded-full p-2 lg:hidden" style={{ color: navLight ? '#fff' : C.ink }} onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X /> : <MenuIcon />}</button>
          </div>
        </div>
        {menuOpen && <nav className="mx-3 mb-3 rounded-2xl bg-white p-3 shadow-xl lg:hidden">{nl.map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-black/5">{l}</a>)}<Link to={`/dine/${SLUG}`} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-black/5">Book a table</Link><Link to="/login" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-3 text-base font-semibold" style={{ color: C.forest }}><LogIn className="h-5 w-5" />Staff login</Link></nav>}
      </header>

      <section id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden bg-black">
        {slides.map((src, i) => <div key={src + i} data-slide={i} className="absolute inset-0 transition-opacity duration-[1600ms]" style={{ opacity: i === slide ? 1 : 0 }}><img src={src} alt="" className="h-full w-full object-cover" loading={i ? 'lazy' : 'eager'} /></div>)}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(10,22,17,0.82) 0%,rgba(10,22,17,0.45) 45%,rgba(10,22,17,0.1) 75%), linear-gradient(0deg,rgba(10,22,17,0.7) 0%,transparent 40%)' }} />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-36 pt-24 text-white">
          <div className="max-w-2xl">
            <div className="hx-in mb-6 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur"><span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-3.5 w-3.5" style={{ fill: n <= 4 ? '#E9C77E' : 'transparent', color: '#E9C77E' }} />)}</span><b>4.7</b><span className="text-white/75">Google rating · Kandy</span></div>
            <h1 className="hx-in text-6xl font-semibold leading-[0.95] sm:text-8xl" style={serif}>{w.hero_title || 'Ceylon Ayu Resort'}</h1>
            <p className="hx-in mt-3 text-2xl italic sm:text-3xl" style={{ ...serif, color: '#E9C77E' }}>{w.hero_tagline || 'a garden retreat in the hills of Kandy'}</p>
            <p className="hx-in mt-6 max-w-xl text-lg leading-relaxed text-white/85">{w.hero_subtitle || 'A peaceful garden resort with an outdoor pool, minutes from the Temple of the Tooth and Kandy Lake.'}</p>
            <div className="hx-in mt-9 flex flex-wrap gap-3"><Link to={`/book/${SLUG}`} className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold shadow-xl transition hover:brightness-105" style={{ background: '#D9B36A', color: C.ink }}>Book your stay <ArrowRight className="h-4 w-4" /></Link><Link to={`/dine/${SLUG}`} className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15">Reserve a table</Link></div>
          </div>
          <div className="absolute bottom-36 right-5 hidden gap-2 sm:flex">{slides.map((_, i) => <button key={i} onClick={() => setSlide(i)} aria-label={`Show photo ${i + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: i === slide ? 36 : 14, background: i === slide ? '#E9C77E' : 'rgba(255,255,255,0.5)' }} />)}</div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/book/${SLUG}?in=${q.in}&out=${q.out}&g=${q.g}`); }} className="absolute inset-x-0 bottom-8 mx-auto grid w-[min(1040px,calc(100%-2.5rem))] gap-1 rounded-[28px] bg-white/95 p-2.5 shadow-2xl backdrop-blur sm:grid-cols-[1fr_1fr_120px_auto]">
          <label className="rounded-[20px] px-5 py-2.5 transition hover:bg-black/[0.035]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><CalendarDays className="h-3.5 w-3.5" />Check-in</span><input type="date" min={today()} value={q.in} onChange={(e) => setQ({ ...q, in: e.target.value, out: e.target.value >= q.out ? addDays(e.target.value, 1) : q.out })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none" /></label>
          <label className="rounded-[20px] px-5 py-2.5 transition hover:bg-black/[0.035]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><CalendarDays className="h-3.5 w-3.5" />Check-out</span><input type="date" min={addDays(q.in, 1)} value={q.out} onChange={(e) => setQ({ ...q, out: e.target.value })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none" /></label>
          <label className="rounded-[20px] px-5 py-2.5 transition hover:bg-black/[0.035]"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50"><Users className="h-3.5 w-3.5" />Guests</span><select value={q.g} onChange={(e) => setQ({ ...q, g: Number(e.target.value) })} className="mt-0.5 block w-full bg-transparent text-base font-semibold outline-none">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
          <button className="rounded-[20px] px-8 py-4 text-base font-semibold text-white transition hover:brightness-110" style={{ background: C.forest }}>Check availability</button>
        </form>
      </section>

      <section className="border-b border-black/5 bg-white"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-5 py-7 sm:grid-cols-3 lg:grid-cols-5">{highlights.map(([I, t]: any) => <div key={t} className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: '#D9B36A', color: C.forest }}><I className="h-5 w-5" strokeWidth={1.6} /></span><span className="text-[15px] font-semibold">{t}</span></div>)}</div></section>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="reveal"><Eyebrow>Welcome</Eyebrow><h2 className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-6xl" style={serif}>{w.welcome_title || 'A calm garden retreat in Sri Lanka’s hill capital'}</h2><p className="mt-6 text-lg leading-relaxed text-black/70">{about}</p>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-black/10 pt-6">{[[`${data.rooms.length}`, 'room types'], ['3 km', 'to Kandy station'], ['4.7★', 'Google rating']].map(([n, l]) => <div key={l}><div className="text-3xl font-semibold" style={{ ...serif, color: C.forest }}>{n}</div><div className="text-sm text-black/60">{l}</div></div>)}</div>
        </div>
        <div className="reveal relative grid grid-cols-5 gap-4">
          <Photo src={w.welcome_photos?.[0] || P.pool} alt="Outdoor swimming pool" icon={Waves} className="col-span-3 aspect-[3/4] w-full rounded-[28px] shadow-xl" />
          <div className="col-span-2 flex flex-col gap-4 pt-16"><Photo src={w.welcome_photos?.[1] || P.garden} alt="Garden terrace" icon={Trees} className="aspect-square w-full rounded-[24px] shadow-lg" /><Photo src={w.welcome_photos?.[2] || '/images/room-deluxe.webp'} alt="Room with a four-poster bed at Ceylon Ayu Resort" icon={BedDouble} className="aspect-square w-full rounded-[24px] shadow-lg" /></div>
        </div>
      </section>

      <section id="rooms" className="py-24" style={{ background: C.forest, color: '#F3EEE2' }}>
        <div className="mx-auto max-w-7xl px-5"><div className="reveal flex flex-wrap items-end justify-between gap-4"><div><Eyebrow light>Stay</Eyebrow><h2 className="mt-4 text-4xl font-semibold sm:text-6xl" style={serif}>{w.rooms_title || 'Rooms & suites'}</h2></div><Link to={`/book/${SLUG}`} className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">See prices for your dates →</Link></div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.rooms.map((r: any, i: number) => (
            <article key={r.id} className="reveal group overflow-hidden rounded-[28px] bg-white/[0.05] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1.5 hover:bg-white/[0.08]">
              <div className="relative overflow-hidden"><Photo src={roomImg(r, i)} alt={r.name} icon={BedDouble} className="aspect-[4/3] w-full transition duration-[1200ms] group-hover:scale-105" /><span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold backdrop-blur">from {money(r.base_rate)}</span></div>
              <div className="p-6"><h3 className="text-2xl font-semibold leading-tight" style={serif}>{r.name}</h3><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70"><span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{r.max_adults} adults</span><span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{r.bed}</span><span>{r.size} sq ft</span></div>
                <div className="mt-4 flex flex-wrap gap-1.5">{(r.amenities || []).slice(0, 5).map((a: string) => <span key={a} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/80">{a}</span>)}</div>
                <Link to={`/book/${SLUG}`} className="mt-6 flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold transition" style={{ background: '#D9B36A', color: C.ink }}>Check availability <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>))}</div>
        </div>
      </section>

      <section id="dining" className="mx-auto max-w-7xl px-5 py-24">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="reveal grid grid-cols-2 gap-4"><Photo src={w.dining_photos?.[0] || P.restaurant} alt="Sri Lankan curries" icon={UtensilsCrossed} className="col-span-2 aspect-[16/10] w-full rounded-[28px] shadow-xl" /><Photo src={w.dining_photos?.[1] || P.seafood} alt="Grilled dishes" icon={UtensilsCrossed} className="aspect-[4/3] w-full rounded-[22px]" /><Photo src={w.dining_photos?.[2] || P.curry} alt="Curry pot" icon={UtensilsCrossed} className="aspect-[4/3] w-full rounded-[22px]" /></div>
          <div className="reveal"><Eyebrow>Dine</Eyebrow><h2 className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-6xl" style={serif}>{w.dining_title || 'Sri Lankan, seafood & Irish favourites'}</h2><p className="mt-5 text-lg text-black/70">{w.dining_text || 'Kandyan rice and curry, seafood from the grill and a hearty Irish stew on the terrace.'}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">{data.menu.slice(0, 6).map((m: any) => <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-sm"><Photo src={m.image} alt={m.name} icon={UtensilsCrossed} className="h-16 w-16 shrink-0 rounded-xl" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{m.name}</span><span className="text-sm font-semibold" style={{ color: C.forest }}>{money(m.price)}</span></span></li>)}</ul>
            <div className="mt-9 flex flex-wrap gap-3"><Link to={`/dine/${SLUG}`} className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white transition hover:brightness-110" style={{ background: C.forest }}>Reserve a table <ArrowRight className="h-4 w-4" /></Link><Link to={`/menu/${SLUG}`} className="rounded-full border px-6 py-3.5 font-semibold transition hover:bg-black/5" style={{ borderColor: C.forest, color: C.forest }}>View the full menu</Link></div>
          </div>
        </div>
      </section>

      <section id="experiences" className="bg-white py-24"><div className="mx-auto max-w-7xl px-5"><div className="reveal flex flex-wrap items-end justify-between gap-6"><div className="max-w-2xl"><Eyebrow>Relax & discover</Eyebrow><h2 className="mt-4 text-4xl font-semibold sm:text-6xl" style={serif}>{w.exp_title || 'Wellness, tours & transfers'}</h2></div><p className="max-w-md text-black/65">{w.exp_text || 'Arrange it at reception or from the QR card in your room.'}</p></div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.services.map((s: any) => { const I = ICONS_EXP[s.category] || Sparkles; return (
          <article key={s.id} className="reveal group relative aspect-[4/5] overflow-hidden rounded-[26px] shadow-md"><Photo src={s.image || serviceImg(s)} alt={s.name} className="absolute inset-0 h-full w-full transition duration-[1200ms] group-hover:scale-110" /><div className="absolute inset-0" style={{ background: 'linear-gradient(0deg,rgba(10,22,17,0.9) 0%,rgba(10,22,17,0.25) 55%,transparent 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur"><I className="h-5 w-5" strokeWidth={1.6} /></span><h3 className="text-lg font-semibold leading-snug">{s.name}</h3><div className="mt-1 text-sm text-white/75">{money(s.price)} per {s.unit}</div></div></article>); })}</div>
      </div></section>

      <section id="explore" className="mx-auto max-w-7xl px-5 py-24"><div className="reveal"><Eyebrow>Kandy</Eyebrow><h2 className="mt-4 text-4xl font-semibold sm:text-6xl" style={serif}>{w.explore_title || 'Explore the hill capital'}</h2></div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{(w.explore?.length ? w.explore : EXPLORE.map((x) => ({ ...x, image: x.img }))).map((x: any, i: number) => <article key={x.title + i} className="reveal group overflow-hidden rounded-[26px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative overflow-hidden"><Photo src={x.image} alt={x.title} icon={MapPin} className="aspect-[16/11] w-full transition duration-[1200ms] group-hover:scale-105" /><span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-sm font-bold" style={{ color: C.forest }}>{String(i + 1).padStart(2, '0')}</span></div><div className="p-6"><h3 className="text-2xl font-semibold leading-tight" style={serif}>{x.title}</h3><p className="mt-2 text-black/65">{x.text}</p></div></article>)}</div>
      </section>

      {data.reviews.length > 0 && <section className="relative overflow-hidden py-24 text-white"><img src={w.reviews_photo || P.tea} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /><div className="absolute inset-0" style={{ background: 'rgba(12,28,21,0.78)' }} /><div className="relative mx-auto max-w-7xl px-5"><div className="reveal text-center"><Eyebrow light>Guest stories</Eyebrow><h2 className="mt-4 text-4xl font-semibold sm:text-6xl" style={serif}>{w.reviews_title || 'What our guests say'}</h2></div><div className="mt-12 grid gap-6 md:grid-cols-3">{data.reviews.slice(0, 3).map((r: any) => <figure key={r.id} className="reveal rounded-[26px] border border-white/15 bg-white/[0.07] p-8 backdrop-blur"><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-4 w-4" style={n <= r.rating ? { fill: '#E9C77E', color: '#E9C77E' } : { color: '#ffffff40' }} />)}</div><blockquote className="mt-5 text-2xl leading-snug" style={serif}>“{r.comment}”</blockquote><figcaption className="mt-5 text-sm text-white/70">— {r.customer_name}</figcaption></figure>)}</div></div></section>}

      <section id="contact" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2">
        <div className="reveal"><Eyebrow>Find us</Eyebrow><h2 className="mt-4 text-4xl font-semibold sm:text-6xl" style={serif}>{b.name}</h2>
          <ul className="mt-8 space-y-5 text-lg text-black/75">
            <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: '#D9B36A', color: C.forest }}><MapPin className="h-5 w-5" strokeWidth={1.6} /></span><span className="pt-2">{b.address}</span></li>
            {(w.phone || b.phone) && <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: '#D9B36A', color: C.forest }}><Phone className="h-5 w-5" strokeWidth={1.6} /></span><a className="pt-2" href={`tel:${w.phone || b.phone}`}>{w.phone || b.phone}</a></li>}
            {(w.email || b.email) && <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: '#D9B36A', color: C.forest }}><Mail className="h-5 w-5" strokeWidth={1.6} /></span><a className="pt-2" href={`mailto:${w.email || b.email}`}>{w.email || b.email}</a></li>}
            {w.whatsapp && <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: '#D9B36A', color: C.forest }}><MessageCircle className="h-5 w-5" strokeWidth={1.6} /></span><a className="pt-2" href={`https://wa.me/${w.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a></li>}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3"><Link to={`/book/${SLUG}`} className="rounded-full px-6 py-3.5 font-semibold text-white" style={{ background: C.forest }}>Book your stay</Link><Link to={`/dine/${SLUG}`} className="rounded-full border px-6 py-3.5 font-semibold" style={{ borderColor: C.forest, color: C.forest }}>Reserve a table</Link></div>
        </div>
        <iframe title="Map to Ceylon Ayu Resort Kandy" className="reveal h-[420px] w-full rounded-[28px] border-0 shadow-lg" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(w.map_query || 'Ceylon Ayu Resort, Kandy')}&output=embed`} />
      </section>

      <footer style={{ background: '#0E2A22', color: '#F6F1E7', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}><div className="mx-auto grid max-w-7xl gap-8 px-5 pt-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div><div className="text-3xl font-semibold" style={serif}>Ceylon Ayu Resort</div><p className="mt-2 max-w-sm text-sm text-white/65">{b.address}</p></div>
        <div className="space-y-2 text-sm text-white/75"><a href="#rooms" className="block hover:text-white">Rooms & suites</a><a href="#dining" className="block hover:text-white">Dining</a><a href="#explore" className="block hover:text-white">Explore Kandy</a></div>
        <div className="space-y-2 text-sm text-white/75"><Link to={`/book/${SLUG}`} className="block hover:text-white">Book your stay</Link><Link to={`/dine/${SLUG}`} className="block hover:text-white">Reserve a table</Link><Link to="/login" className="flex items-center gap-2 font-semibold text-white"><LogIn className="h-4 w-4" />Staff login</Link></div>
      </div><div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-5 pt-5 text-xs text-white/50">© {new Date().getFullYear()} {b.name}</div></footer>
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
  const { data, error, reload } = useAsync<any>(() => api.pub(slug, 'roomInfo', { room }), [room], { poll: 10000, live: true });
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
        <div className="grid gap-3 sm:grid-cols-2">{data.items.filter((m: any) => cat === 'all' || m.category_id === cat).map((m: any) => <div key={m.id} className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ${m.available === false ? 'opacity-50' : ''}`}><Photo src={m.image} alt={m.name} icon={UtensilsCrossed} className="h-20 w-20 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><div className="font-semibold">{m.name}</div>{m.veg && <span className="text-[11px] font-semibold text-green-700">Vegetarian</span>}<div className="mt-1 flex items-center justify-between"><b style={{ color: C.forest }}>{money(m.price)}</b>{data.occupied && m.available !== false && (cart[m.id] ? <span className="flex items-center gap-2"><button className="grid h-8 w-8 place-items-center rounded-full border" onClick={() => set(m.id, -1)} aria-label="Less"><Minus className="h-4 w-4" /></button><b>{cart[m.id]}</b><button className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: C.forest }} onClick={() => set(m.id, 1)} aria-label="More"><Plus className="h-4 w-4" /></button></span> : <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: C.forest }} onClick={() => set(m.id, 1)}>Add</button>)}{m.available === false && <span className="text-xs">Sold out</span>}</div></div></div>)}</div>
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
  useEffect(() => { if (data?.areas?.length && !area) { const best = [...data.areas].sort((x: any, y: any) => data.tables.filter((t: any) => t.area_id === y.id && t.available).length - data.tables.filter((t: any) => t.area_id === x.id && t.available).length)[0]; setArea(best.id); } }, [data]);
  const tables = useMemo(() => (data?.tables || []).filter((t: any) => t.area_id === area).map((t: any) => ({ ...t, tone: t.available ? 'free' : 'off', sub: t.available ? `${t.seats} seats` : 'Taken' })), [data, area]);
  if (error) return <GuestShell sub="Book a table"><div className="py-20 text-center">{error.message}</div></GuestShell>;
  if (done) return <GuestShell biz={data?.business} sub="Table booked"><div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700"><Check className="h-7 w-7" /></div><h1 className="mt-3 text-3xl font-semibold" style={serif}>See you soon!</h1><p className="mt-2 text-black/70">Table <b>{done.table}</b> on {date(done.date)} at {done.time}.</p><Link to="/" className="mt-6 inline-block text-sm font-semibold underline">Back to the website</Link></div></GuestShell>;
  return (
    <GuestShell biz={data?.business} sub="Book a table — choose your table on the floor plan">
      <div className="grid gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-3">
        <label className="text-xs font-semibold text-black/60"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Date<input type="date" min={today()} className="input mt-1" value={q.date} onChange={(e) => { setQ({ ...q, date: e.target.value }); setSel(null); }} /></label>
        <label className="text-xs font-semibold text-black/60"><Clock className="mr-1 inline h-3.5 w-3.5" />Time<select className="input mt-1" value={q.time} onChange={(e) => { setQ({ ...q, time: e.target.value }); setSel(null); }}>{['07:30', '08:30', '12:00', '12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs font-semibold text-black/60"><Users className="mr-1 inline h-3.5 w-3.5" />Guests<select className="input mt-1" value={q.guests} onChange={(e) => { setQ({ ...q, guests: Number(e.target.value) }); setSel(null); }}>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
      </div>
      {!data ? <Spinner /> : <>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5">{data.areas.map((a: any) => <button key={a.id} onClick={() => setArea(a.id)} className="rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm" style={area === a.id ? { background: C.ink, color: 'white' } : { background: 'white' }}>{a.name} <span className="opacity-60">({data.tables.filter((t: any) => t.area_id === a.id && t.available).length})</span></button>)}</div><Legend2D tones={['free', 'off', 'pick']} /></div>
        <FloorPlan2D tables={tables} selectedId={sel?.id} onSelect={setSel} />
        <p className="mt-2 text-center text-sm text-black/60">Green tables are free at your time. Tap one to choose it.</p>
        {sel && <div className="anim-pop mt-4 rounded-2xl bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><b className="text-lg">Table {sel.name} · {sel.seats} seats</b><span className="text-sm text-black/60">{date(q.date)} · {q.time} · {q.guests} guests</span></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Your name" required><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Phone" required><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Occasion"><select className="input" value={f.occasion} onChange={(e) => setF({ ...f, occasion: e.target.value })}>{['None', 'Birthday', 'Anniversary', 'Business', 'Date'].map((o) => <option key={o}>{o}</option>)}</select></Field><Field label="Notes"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="High chair, allergies…" /></Field></div>
          <button className="mt-4 w-full rounded-xl py-3.5 font-semibold text-white" style={{ background: C.forest }} onClick={async () => { try { setDone(await api.pub(slug, 'bookTable', { table_id: sel.id, ...q, ...f })); } catch (e) { toast.err(e); } }}>Confirm booking <ArrowRight className="ml-1 inline h-4 w-4" /></button></div>}
      </>}
    </GuestShell>
  );
}
