import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Hotel, UtensilsCrossed, Store, Building2, Check, ArrowRight } from 'lucide-react';
import { DEMO_USERS, DEMO_PASSWORD, DEFAULT_ROLES } from '@shared/roles.js';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { api, MODE } from '@/lib/api';
import { Avatar, Spinner } from '@/components/ui';
import { money } from '@/lib/format';

const GROUPS: [string, (u: any) => boolean][] = [
  ['Management', (u) => ['super_admin', 'business_owner'].includes(u.role)],
  ['Front office & rooms', (u) => ['hotel_manager', 'front_office', 'reservations_agent', 'housekeeping', 'concierge'].includes(u.role)],
  ['Restaurant & kitchen', (u) => ['restaurant_manager', 'cashier', 'waiter', 'chef'].includes(u.role)],
  ['Back office', (u) => ['storekeeper', 'accountant', 'hr_manager'].includes(u.role)],
  ['Staff & guest self-service', (u) => ['employee', 'customer'].includes(u.role)],
];
export function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [show, setShow] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async (e?: string, p?: string) => {
    setErr(''); setBusy(true);
    try { await login(e ?? email, p ?? pw); nav('/app/dashboard'); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const roleOf = (k: string) => DEFAULT_ROLES.find((r: any) => r.key === k);
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-side p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link to="/" className="flex items-center gap-3"><img src="/favicon.svg" alt="" className="h-10 w-10" /><span className="leading-tight"><span className="block text-2xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Ceylon Ayu Resort</span><span className="block text-[11px] uppercase tracking-[0.25em] text-side-text">Kandy · Hotel & restaurant system</span></span></Link>
        <div className="my-auto max-w-md">
          <img src="/images/room-deluxe.webp" alt="" className="mb-6 h-40 w-full rounded-t-[120px] object-cover opacity-90" /><h1 className="text-4xl font-bold leading-tight tracking-tight">Every room, table and kitchen ticket — in one place.</h1>
          <p className="mt-4 text-side-text">Each team member sees only what their job needs — reception sees rooms, a waiter sees tables, the chef sees tickets, the owner sees everything.</p>
          <ul className="mt-8 space-y-3 text-sm">{[[Hotel, 'Front desk, bookings, billing, channel manager'], [UtensilsCrossed, 'Restaurant POS, KOT, kitchen display, QR ordering'], [Store, 'Room service, guest requests, taxis, parking'], [Building2, 'Accounts, stores, HR & payroll']].map(([I, t]: any) => <li key={t} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><I className="h-4 w-4" /></span>{t}</li>)}</ul>
        </div>
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-saffron/20 blur-3xl" aria-hidden />
      </div>
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-xl">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden"><img src="/favicon.svg" alt="" className="h-8 w-8" /><b>NexaERP</b></Link>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use the email and password your administrator gave you.</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <div><label className="label" htmlFor="email">Email</label><input id="email" className="input h-11" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><label className="label" htmlFor="pw">Password</label><div className="relative"><input id="pw" className="input h-11 pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            {err && <div className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{err}</div>}
            <button className="btn-primary h-11 w-full text-base" disabled={busy}><LogIn className="h-4 w-4" />{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          {MODE === 'demo' || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' ? (
            <div className="mt-8">
              <div className="flex items-center gap-3"><div className="h-px flex-1 bg-line" /><span className="text-xs font-semibold text-muted">Or try a demo role — one click</span><div className="h-px flex-1 bg-line" /></div>
              <div className="mt-4 space-y-4">
                {GROUPS.map(([g, f]) => { const us = DEMO_USERS.filter(f); return (
                  <div key={g}><div className="mb-1.5 text-xs font-semibold text-muted">{g}</div>
                    <div className="grid gap-2 sm:grid-cols-2">{us.map((u: any) => <button key={u.email} disabled={busy} onClick={() => go(u.email, u.password || DEMO_PASSWORD)} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 text-left hover:border-brand hover:shadow-card"><Avatar name={u.name} size="sm" color={roleOf(u.role)?.color} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{roleOf(u.role)?.name}</span><span className="block truncate text-xs text-muted">{u.name}</span></span></button>)}</div>
                  </div>); })}
              </div>
              <p className="mt-4 text-xs text-muted">All demo passwords are <code className="rounded bg-paper px-1">{DEMO_PASSWORD}</code> (owner / super admin: <code className="rounded bg-paper px-1">Admin@1234</code>). <Link to="/" className="text-brand underline">← Back to the website</Link></p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const { data, loading } = useAsync<any>(() => api.landing(), []);
  if (loading || !data) return <Spinner />;
  const sec = (k: string) => data.sections.find((s: any) => s.section === k);
  const hero = sec('hero'); const cta = sec('cta'); const testi = sec('testimonials');
  const name = data.platform?.app_name || 'NexaERP';
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/" className="flex items-center gap-2"><img src="/favicon.svg" alt="" className="h-9 w-9" /><b className="text-lg">{name}</b></Link><nav className="flex items-center gap-2"><a href="#pricing" className="btn-ghost hidden sm:inline-flex">Pricing</a><Link to="/login" className="btn-primary">Sign in</Link></nav></header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pt-14">
        <div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{hero?.title}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{hero?.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/login" className="btn-primary px-5 py-3 text-base">{hero?.button_text || 'Get started'}<ArrowRight className="h-4 w-4" /></Link><a href="#pricing" className="btn-secondary px-5 py-3 text-base">See plans</a></div>
        </div>
        <div className="relative">
          <div className="rounded-2xl bg-side p-5 text-white shadow-pop">
            <div className="text-sm text-side-text">Today · Front office</div>
            <div className="mt-1 text-2xl font-bold">Good morning, Kasun</div>
            <p className="mt-1 text-sm text-side-text">2 guests arrive today, 6 check out, and 17 are in-house.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">{['101', '102', '103', '104', '201', '202', '203', '204'].map((n, i) => <div key={n} className={`rounded-lg p-2 text-center text-sm font-bold ${['bg-info/40', 'bg-ok/40', 'bg-info/40', 'bg-bad/40', 'bg-saffron/50', 'bg-info/40', 'bg-ok/40', 'bg-info/40'][i]}`}>{n}</div>)}</div>
          </div>
          <div className="absolute -bottom-6 -left-4 w-56 rounded-xl bg-surface p-3 shadow-pop"><div className="text-xs text-muted">Kitchen · Hot station</div><div className="font-bold">T4 — 2× Chicken kottu</div><div className="mt-1 text-xs font-semibold text-bad">→ extra spicy</div></div>
        </div>
      </section>
      <section className="bg-surface py-16"><div className="mx-auto max-w-6xl px-5"><h2 className="text-3xl font-bold tracking-tight">{sec('features')?.title}</h2><p className="mt-2 max-w-2xl text-muted">{sec('features')?.subtitle}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[Hotel, 'Hotels & resorts', 'Front desk, room chart, online booking engine, channel manager, housekeeping, folios and night audit.'], [UtensilsCrossed, 'Restaurants & bars', 'Touch POS, tables, split bills, kitchen display, QR menu ordering, recipes and food cost.'], [Store, 'Shops & supermarkets', 'Barcode POS, held sales, returns, batches & expiry, labels, online store, loyalty.'], [Building2, 'Any company', 'Accounting, payroll, HR, recruitment, CRM, projects, contracts and support tickets.']].map(([I, t, d]: any) => <div key={t} className="rounded-xl border border-line p-5"><I className="h-6 w-6 text-brand" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div></div></section>
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16"><h2 className="text-3xl font-bold tracking-tight">{sec('pricing')?.title}</h2><p className="mt-2 text-muted">{sec('pricing')?.subtitle}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{data.plans.map((p: any, i: number) => <div key={p.id} className={`flex flex-col rounded-2xl bg-surface p-6 shadow-card ${i === 2 ? 'ring-2 ring-brand' : ''}`}><h3 className="text-lg font-bold">{p.name}</h3><div className="mt-2 text-3xl font-bold">{money(p.price_monthly)}<span className="text-sm font-normal text-muted">/mo</span></div><p className="mt-1 text-sm text-muted">{p.description}</p><ul className="mt-4 flex-1 space-y-1.5 text-sm">{[`Up to ${p.max_users} users`, `${p.max_branches} branches`, `${p.trial_days}-day free trial`, `${p.modules.length} modules`].map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-ok" />{x}</li>)}</ul><Link to="/login" className={`${i === 2 ? 'btn-primary' : 'btn-secondary'} mt-5`}>Start free trial</Link></div>)}</div></section>
      {testi && <section className="bg-side py-14 text-center text-white"><p className="mx-auto max-w-3xl px-5 text-2xl font-semibold leading-snug">{testi.subtitle}</p><p className="mt-3 text-side-text">{testi.title}</p></section>}
      {cta && <section className="mx-auto max-w-6xl px-5 py-16 text-center"><h2 className="text-3xl font-bold">{cta.title}</h2><p className="mt-2 text-muted">{cta.subtitle}</p><Link to="/login" className="btn-primary mt-6 px-6 py-3 text-base">{cta.button_text}</Link></section>}
      <footer className="border-t border-line py-8 text-center text-sm text-muted"><div className="flex flex-wrap justify-center gap-4">{data.pages.map((p: any) => <span key={p.id}>{p.title}</span>)}</div><div className="mt-2">© {new Date().getFullYear()} {name}</div></footer>
    </div>
  );
}
