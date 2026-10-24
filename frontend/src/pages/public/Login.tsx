import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Hotel, UtensilsCrossed, Store, Building2, Check, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';
import { DEMO_USERS, DEMO_PASSWORD, DEFAULT_ROLES } from '@shared/roles.js';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { api, MODE } from '@/lib/api';
import { Avatar, Spinner } from '@/components/ui';
import { money } from '@/lib/format';
import { P } from '@/lib/photos';

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
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [demo, setDemo] = useState('');
  const go = async (e?: string, p?: string) => {
    setErr(''); setBusy(true);
    try { await login(e ?? email, p ?? pw); nav('/app/dashboard'); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  const roleOf = (k: string) => DEFAULT_ROLES.find((r: any) => r.key === k);
  const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' };
  const showDemo = MODE === 'demo' || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true';
  return (
    <div className="grid min-h-screen lg:grid-cols-2" style={{ background: '#F6F1E7' }}>
      <div className="relative hidden overflow-hidden lg:block" style={{ background: '#0E2A22' }}>
        <img src={P.login} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,22,17,0.55) 0%,rgba(10,22,17,0.25) 40%,rgba(10,22,17,0.85) 100%)' }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-[#F6F1E7]">
          <Link to="/" className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#F3E3B8]"><Leaf className="h-6 w-6" /></span><span className="leading-tight"><span className="block text-3xl font-semibold" style={serif}>Ceylon Ayu</span><span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Resort · Kandy</span></span></Link>
          <div className="max-w-md pb-24">
            <h1 className="text-5xl font-semibold leading-tight" style={serif}>Welcome to work.</h1>
            <p className="mt-3 text-lg text-white/80">Sign in to see today’s rooms, tables and tasks. Your screen shows only what your job needs.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-base font-semibold text-[#1F3B2D] hover:underline"><ArrowLeft className="h-5 w-5" />Back to the website</Link>
          <h2 className="text-4xl font-semibold text-[#1B231E]" style={serif}>Staff sign in</h2>
          <p className="mt-2 text-base text-[#5B6B75]">Use the email and password your manager gave you.</p>
          <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <div><label className="mb-1.5 block text-base font-semibold" htmlFor="email">Email</label><input id="email" className="input h-14 rounded-xl text-lg" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@ceylonayu.lk" /></div>
            <div><label className="mb-1.5 block text-base font-semibold" htmlFor="pw">Password</label><div className="relative"><input id="pw" className="input h-14 rounded-xl pr-14 text-lg" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /><button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-lg text-[#5B6B75] hover:bg-black/5" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            {err && <div className="rounded-xl bg-bad/10 px-4 py-3 text-base text-bad" role="alert">{err}</div>}
            <button className="flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white shadow-md disabled:opacity-60" style={{ background: '#1F3B2D' }} disabled={busy}><LogIn className="h-5 w-5" />{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          {showDemo && (
            <div className="mt-8 rounded-2xl border border-[#1F3B2D1A] bg-white p-5 shadow-sm">
              <div className="text-base font-semibold">Try the demo</div>
              <p className="mt-1 text-sm text-[#5B6B75]">Pick a job role to see that person’s screens.</p>
              <div className="mt-3 flex gap-2">
                <select className="input h-12 flex-1 rounded-xl text-base" value={demo} onChange={(e) => setDemo(e.target.value)} aria-label="Demo role">
                  <option value="">Choose a role…</option>
                  {GROUPS.map(([g, f]) => <optgroup key={g} label={g}>{DEMO_USERS.filter(f).map((u: any) => <option key={u.email} value={u.email}>{roleOf(u.role)?.name} — {u.name}</option>)}</optgroup>)}
                </select>
                <button type="button" disabled={!demo || busy} onClick={() => { const u = DEMO_USERS.find((x: any) => x.email === demo); go(u.email, u.password || DEMO_PASSWORD); }} className="h-12 rounded-xl px-5 text-base font-semibold text-[#1B231E] disabled:opacity-50" style={{ background: '#E9C77E' }}>Open</button>
              </div>
              <p className="mt-3 text-xs text-[#5B6B75]">Demo passwords: <code className="rounded bg-[#F6F1E7] px-1">{DEMO_PASSWORD}</code> · Owner: <code className="rounded bg-[#F6F1E7] px-1">Admin@1234</code></p>
            </div>
          )}
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
