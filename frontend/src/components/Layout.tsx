import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, Menu, Search, Moon, Sun, LogOut, ChevronDown, X, Building2, KeyRound, UserCircle, RefreshCw, Users, Command } from 'lucide-react';
import { MODULES, permKeyOf, pathOf } from '@shared/modules.js';
import { DEMO_USERS, DEMO_PASSWORD, DEFAULT_ROLES } from '@shared/roles.js';
import { useAuth } from '@/lib/auth';
import { api, MODE } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { Icon, Avatar, Dropdown, MenuItem, useConfirm } from './ui';
import { ago, pretty } from '@/lib/format';

export function useMenu() {
  const { me, can, isSuper, hasModule } = useAuth();
  return useMemo(() => {
    if (!me) return [];
    const u = me.user;
    return MODULES.map((m: any) => {
      if (m.key === 'platform' && !isSuper) return null;
      if (!m.always && m.key !== 'customers' && !hasModule(m.needs || m.key)) return null;
      if (m.key === 'customers' && !m.requires.some((r: string) => hasModule(r))) return null;
      if (['admin', 'me'].includes(m.key) && !me.business) return null;
      const items = m.items.filter((it: any) => {
        const k = permKeyOf(it);
        if (m.key === 'me') {
          if (['my-bookings', 'my-orders'].includes(it.page)) return !!u.customerId && can(k);
          return !!u.employeeId && can(k);
        }
        if (k === 'page:booking-engine' || k === 'page:online-store') return can(k) || can('page:settings');
        return can(k);
      });
      return items.length ? { ...m, items } : null;
    }).filter(Boolean);
  }, [me, can, isSuper, hasModule]);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const menu = useMenu();
  const loc = useLocation();
  const { me } = useAuth();
  const activeModule = menu.find((m: any) => m.items.some((it: any) => loc.pathname.startsWith(pathOf(it))))?.key;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => { if (activeModule) setOpen((o) => ({ ...o, [activeModule]: true })); }, [activeModule]);
  const brand = me?.settings?.brand_name || me?.platform?.app_name || 'NexaERP';
  return (
    <div className="flex h-full flex-col bg-side text-side-text">
      <Link to="/app/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-4 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-lg">{me?.settings?.logo_emoji || '✦'}</span>
        <span className="min-w-0"><span className="block truncate text-[15px] font-bold leading-tight text-white">{brand}</span><span className="block truncate text-[11px] text-side-text/70">Hotel & restaurant ERP · Kandy</span></span>
      </Link>
      <nav className="side-scroll flex-1 overflow-y-auto px-2 pb-6" aria-label="Main">
        {menu.map((m: any) => {
          const single = m.items.length === 1 || m.key === 'overview';
          const isOpen = open[m.key] ?? m.key === 'overview';
          return (
            <div key={m.key} className="mt-1">
              {!single && (
                <button onClick={() => setOpen({ ...open, [m.key]: !isOpen })} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-side-hover ${activeModule === m.key ? 'text-white' : ''}`} aria-expanded={isOpen}>
                  <Icon name={m.icon} className="h-4 w-4 opacity-80" /><span className="flex-1 truncate">{m.label}</span><ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
              {(single || isOpen) && (
                <div className={single ? '' : 'ml-3 border-l border-white/10 pl-2'}>
                  {m.items.map((it: any) => (
                    <NavLink key={pathOf(it)} to={pathOf(it)} onClick={onNavigate} className={({ isActive }) => `relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors ${isActive ? 'bg-white/10 font-semibold text-white' : 'hover:bg-side-hover hover:text-white'}`}>
                      {({ isActive }) => (<>{isActive && <span className="absolute -left-[9px] top-1.5 bottom-1.5 w-[3px] rounded-full bg-saffron" />}{single && <Icon name={it.icon || m.icon} className="h-4 w-4 opacity-80" />}<span className="truncate">{it.label}</span></>)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {MODE === 'demo' && <div className="mx-3 mb-3 rounded-lg bg-saffron/15 px-3 py-2 text-[11px] leading-snug text-saffron">Demo — changes are saved in this browser and update live across open tabs.</div>}
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const menu = useMenu(); const nav = useNavigate(); const [q, setQ] = useState(''); const [i, setI] = useState(0);
  const items = useMemo(() => menu.flatMap((m: any) => m.items.map((it: any) => ({ label: it.label, group: m.label, to: pathOf(it), icon: it.icon || m.icon }))), [menu]);
  const res = items.filter((x) => (x.label + ' ' + x.group).toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  useEffect(() => { setI(0); }, [q]); useEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const go = (to: string) => { nav(to); onClose(); };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div className="anim-pop w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-pop" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4"><Search className="h-4 w-4 text-muted" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'ArrowDown') setI(Math.min(i + 1, res.length - 1)); if (e.key === 'ArrowUp') setI(Math.max(i - 1, 0)); if (e.key === 'Enter' && res[i]) go(res[i].to); if (e.key === 'Escape') onClose(); }} placeholder="Go to a page — try “booking”, “payroll”, “menu”…" className="h-12 flex-1 bg-transparent text-sm outline-none" /></div>
        <ul className="thin-scroll max-h-[50vh] overflow-y-auto p-2">
          {res.map((r, idx) => <li key={r.to}><button onMouseEnter={() => setI(idx)} onClick={() => go(r.to)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${idx === i ? 'bg-brand-soft text-ink' : ''}`}><Icon name={r.icon} className="h-4 w-4 text-brand" /><span className="flex-1">{r.label}</span><span className="text-xs text-muted">{r.group}</span></button></li>)}
          {!res.length && <li className="px-3 py-6 text-center text-sm text-muted">No page matches “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}

function beep() { try { const C = (window as any).AudioContext || (window as any).webkitAudioContext; const ctx = new C(); [0, 0.18].forEach((t, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = i ? 1320 : 880; g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.18); }); } catch { /* no audio */ } }
function Notifications() {
  const { data, reload } = useAsync<any[]>(() => api.action('notifications'), [], { poll: 6000 });
  const seen = useRef<Set<string> | null>(null); const toast = useToast();
  useEffect(() => { if (!data) return; if (!seen.current) { seen.current = new Set(data.map((n) => n.id)); return; } const fresh = data.filter((n) => !seen.current!.has(n.id) && !n.read); fresh.forEach((n) => seen.current!.add(n.id)); if (fresh.length) { beep(); fresh.slice(0, 2).forEach((n) => toast.info(`${n.title}: ${n.body}`)); } }, [data]);
  const unread = (data || []).filter((n) => !n.read).length;
  const nav = useNavigate();
  const go: Record<string, string> = { hotel: '/app/front-desk', restaurant: '/app/service-board', shop: '/app/stock-levels', hrm: '/app/e/leave_applications', sales: '/app/e/sales_invoices', customers: '/app/e/feedback' };
  return (
    <Dropdown button={<button className="btn-ghost relative p-2" aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`}><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-saffron px-1 text-[10px] font-bold text-ink">{unread}</span>}</button>}>
      <div className="flex items-center justify-between px-4 py-2"><span className="text-sm font-semibold">Notifications</span>{unread > 0 && <button className="text-xs font-semibold text-brand" onClick={async (e) => { e.stopPropagation(); await api.action('markNotificationsRead'); reload(); }}>Mark all read</button>}</div>
      <div className="thin-scroll max-h-96 w-[340px] overflow-y-auto">
        {(data || []).slice(0, 12).map((n) => (
          <button key={n.id} onClick={() => go[n.module] && nav(go[n.module])} className="flex w-full gap-3 border-t border-line px-4 py-3 text-left hover:bg-paper">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-line' : 'bg-saffron'}`} />
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{n.title}</span><span className="block text-xs text-muted">{n.body}</span><span className="block text-[11px] text-muted/80">{ago(n.date)}</span></span>
          </button>
        ))}
        {!data?.length && <p className="px-4 py-6 text-center text-sm text-muted">You are all caught up.</p>}
      </div>
    </Dropdown>
  );
}

function RoleSwitcher() {
  const { login, me } = useAuth(); const toast = useToast(); const nav = useNavigate();
  if (MODE !== 'demo') return null;
  const roleName = (k: string) => DEFAULT_ROLES.find((r: any) => r.key === k)?.name || k;
  return (
    <Dropdown button={<button className="btn-secondary btn-sm hidden md:inline-flex" title="Sign in as a different role to see what they see"><Users className="h-4 w-4" />Try another role<ChevronDown className="h-3.5 w-3.5" /></button>}>
      <div className="px-4 py-2 text-xs text-muted">Sign in instantly as any demo role</div>
      <div className="thin-scroll max-h-[60vh] w-[320px] overflow-y-auto">
        {DEMO_USERS.map((u: any) => (
          <button key={u.email} onClick={async () => { try { await login(u.email, u.password || DEMO_PASSWORD); nav('/app/dashboard'); toast.ok(`Now viewing as ${roleName(u.role)}`); } catch (e) { toast.err(e); } }} className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-paper ${me?.user?.email === u.email ? 'bg-brand-soft' : ''}`}>
            <Avatar name={u.name} size="sm" color={DEFAULT_ROLES.find((r: any) => r.key === u.role)?.color} />
            <span className="min-w-0"><span className="block truncate text-sm font-medium">{roleName(u.role)}</span><span className="block truncate text-xs text-muted">{u.name}</span></span>
          </button>
        ))}
      </div>
    </Dropdown>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { me, isSuper, switchBusiness, logout } = useAuth();
  const nav = useNavigate(); const toast = useToast(); const confirm = useConfirm();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleDark = () => { const d = !dark; setDark(d); document.documentElement.classList.toggle('dark', d); localStorage.setItem('nexa-theme', d ? 'dark' : 'light'); };
  const role = me?.role;
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur sm:px-5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <button className="btn-ghost p-2 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      <button onClick={onSearch} className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-left text-sm text-muted hover:border-brand/40 sm:max-w-sm">
        <Search className="h-4 w-4 shrink-0" /><span className="truncate">Search pages…</span><kbd className="ml-auto hidden items-center gap-0.5 rounded border border-line bg-surface px-1.5 text-[11px] sm:inline-flex"><Command className="h-3 w-3" />K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {isSuper && (me?.businesses || []).length > 1 && (
          <Dropdown button={<button className="btn-secondary btn-sm max-w-[220px]"><Building2 className="h-4 w-4 shrink-0" /><span className="truncate">{me?.business?.name || 'Choose business'}</span><ChevronDown className="h-3.5 w-3.5" /></button>}>
            <div className="px-4 py-2 text-xs text-muted">Open a business to manage its data</div>
            {(me?.businesses || []).map((b: any) => <MenuItem key={b.id} icon="Building2" onClick={() => { switchBusiness(b.id); toast.info('Switched to ' + b.name); }}>{b.name}<span className="ml-auto text-xs text-muted">{pretty(b.type)}</span></MenuItem>)}
          </Dropdown>
        )}
        <RoleSwitcher />
        <button className="btn-ghost p-2" onClick={toggleDark} aria-label="Toggle dark mode">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        {me?.business && <Notifications />}
        <Dropdown button={<button className="flex items-center gap-2 rounded-lg p-1 hover:bg-paper" aria-label="Account menu"><Avatar name={me?.user?.name || '?'} color={role?.color} /><span className="hidden text-left leading-tight xl:block"><span className="block max-w-[150px] truncate text-sm font-semibold">{me?.user?.name}</span><span className="block max-w-[150px] truncate text-xs text-muted">{role?.name}</span></span></button>}>
          <div className="border-b border-line px-4 py-3"><div className="text-sm font-semibold">{me?.user?.name}</div><div className="text-xs text-muted">{me?.user?.email}</div><div className="mt-1.5"><span className="chip text-white" style={{ background: role?.color }}>{role?.name}</span></div></div>
          <MenuItem icon="UserCircle" onClick={() => nav('/app/profile')}>My profile</MenuItem>
          <MenuItem icon="KeyRound" onClick={() => nav('/app/profile#password')}>Change password</MenuItem>
          {isSuper && <MenuItem icon="RefreshCw" onClick={async () => { if (await confirm({ title: 'Reset all data?', text: 'Every change will be lost and the demo data restored for all businesses.', confirm: 'Reset data', danger: true })) { await api.resetDemo(); toast.ok('Demo data restored.'); nav('/app/dashboard'); } }}>Reset demo data</MenuItem>}
          <MenuItem icon="LogOut" danger onClick={() => { logout(); nav('/login'); }}>Sign out</MenuItem>
        </Dropdown>
      </div>
    </header>
  );
}

export function AppLayout() {
  const [mobile, setMobile] = useState(false);
  const [palette, setPalette] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMobile(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="flex min-h-full">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Sidebar /></aside>
      {mobile && <div className="no-print fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-ink/50" onClick={() => setMobile(false)} /><div className="anim-slide absolute inset-y-0 left-0 w-72 max-w-[85vw]"><button onClick={() => setMobile(false)} className="absolute right-2 top-3 z-10 rounded-lg p-2 text-side-text" aria-label="Close menu"><X className="h-5 w-5" /></button><Sidebar onNavigate={() => setMobile(false)} /></div></div>}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar onMenu={() => setMobile(true)} onSearch={() => setPalette(true)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-5 sm:px-6 sm:py-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}><Outlet /></main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

export const Page = ({ children }: { children: ReactNode }) => <div className="anim-pop">{children}</div>;
export { UserCircle, KeyRound, RefreshCw, LogOut };
