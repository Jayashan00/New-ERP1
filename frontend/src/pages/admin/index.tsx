import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ShieldCheck, Copy, Save, KeyRound, Check, Eye, EyeOff, Send } from 'lucide-react';
import { MODULES, permKeyOf, PAYMENT_GATEWAYS, INTEGRATIONS } from '@shared/modules.js';
import { DEFAULT_ROLES } from '@shared/roles.js';
import { api, MODE } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Drawer, Field, Toggle, Status, Avatar, Tabs, Card, Kpi, Help, Empty, Modal, Icon, useConfirm } from '@/components/ui';
import { DataTable } from '@/components/DataTable';
import { money, dateTime, pretty, date } from '@/lib/format';

// ------------------------------------------------------------------ USERS
export function Users({ all }: { all?: boolean }) {
  const { data, error, loading } = useAsync<any[]>(() => api.action('users', { all }), [all]);
  const roles = useAsync<any[]>(() => api.action('roles'), []);
  const { me, isSuper, can } = useAuth();
  const { lists } = useLookups(all ? [] : ['employees', 'customers']);
  const bz = me?.businesses || [];
  const toast = useToast(); const confirm = useConfirm();
  const [edit, setEdit] = useState<any>(null); const [show, setShow] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  if (error) return <ErrorBox error={error} />;
  if (loading || !data) return <Spinner />;
  const roleOf = (k: string) => (roles.data || []).find((r) => r.key === k);
  const rows = data.filter((u) => roleFilter === 'all' || u.role === roleFilter);
  const save = async () => { try { await api.action('saveUser', { ...edit, ...(all ? { businessId: edit.businessId || null } : {}) }); toast.ok(edit.id ? 'Login updated.' : `Login created for ${edit.name}.`); setEdit(null); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title={all ? 'All users' : 'Users & logins'} icon="UserCog" desc={all ? 'Every login on the platform, across all businesses.' : 'Who can sign in to this business and what role they have. Their role decides which pages they see.'}
        help={<>Each person gets their own login. Pick the <b>role</b> that matches their job — they only see the pages that role allows. Link a login to an <b>employee</b> so they can clock in and see their payslips, or to a <b>customer</b> for the guest portal. Change what a role can do in <Link className="text-brand underline" to="/app/roles">Roles & permissions</Link>.</>}
        actions={(all || can('page:users', 'c')) && <button className="btn-primary" onClick={() => { setEdit({ name: '', email: '', password: '', role: all ? 'business_owner' : 'employee', status: 'active', businessId: all ? me?.business?.id : undefined }); setShow(false); }}><Plus className="h-4 w-4" />Add user</button>} />
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4"><Kpi label="Logins" value={data.length} /><Kpi label="Active" value={data.filter((u) => u.status === 'active').length} tone="ok" /><Kpi label="Disabled" value={data.filter((u) => u.status !== 'active').length} /><Kpi label="Roles in use" value={new Set(data.map((u) => u.role)).size} /></div>
      <DataTable rows={rows} exportName="users" onRowClick={(u) => setEdit({ ...u, password: '' })}
        toolbar={<select className="input w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role"><option value="all">All roles</option>{(roles.data || []).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</select>}
        cols={[
          { key: 'name', label: 'Name', render: (u) => <span className="flex items-center gap-2.5"><Avatar name={u.name} size="sm" color={roleOf(u.role)?.color} /><span><b>{u.name}</b><span className="block text-xs text-muted">{u.email}</span></span></span>, text: (u) => u.name },
          { key: 'role', label: 'Role', render: (u) => <span className="chip text-white" style={{ background: roleOf(u.role)?.color || '#64748B' }}>{roleOf(u.role)?.name || u.role}</span>, text: (u) => roleOf(u.role)?.name },
          ...(all ? [{ key: 'businessId', label: 'Business', render: (u: any) => bz.find((b: any) => b.id === u.businessId)?.name || 'Platform', text: (u: any) => bz.find((b: any) => b.id === u.businessId)?.name || 'Platform' }] : []),
          { key: 'last_login', label: 'Last sign-in', render: (u) => dateTime(u.last_login) },
          { key: 'status', label: 'Status', render: (u) => <Status value={u.status} /> },
        ]} />
      <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.name}` : 'Add a login'}
        footer={edit && <>{edit.id && <button className="btn-ghost text-bad" onClick={async () => { if (await confirm({ title: `Delete ${edit.name}’s login?`, text: 'They will not be able to sign in any more. Their past work stays.', confirm: 'Delete login', danger: true })) { try { await api.action('deleteUser', { id: edit.id }); toast.ok('Login deleted.'); setEdit(null); } catch (e) { toast.err(e); } } }}><Trash2 className="h-4 w-4" />Delete</button>}<div className="flex-1" /><button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>{edit.id ? 'Save changes' : 'Create login'}</button></>}>
        {edit && <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email (used to sign in)" required><input className="input" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label={edit.id ? 'New password' : 'Password'} required={!edit.id} hint={edit.id ? 'Leave empty to keep the current password.' : 'At least 6 characters.'}><div className="relative"><input className="input pr-10" type={show ? 'text' : 'password'} value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /><button type="button" className="absolute right-2 top-2 text-muted" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></Field>
            <Field label="Phone"><input className="input" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            {all && <Field label="Business"><select className="input" value={edit.businessId || ''} onChange={(e) => setEdit({ ...edit, businessId: e.target.value })}><option value="">Platform (no business)</option>{bz.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}
            <Field label="Status"><select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option value="active">Active — can sign in</option><option value="disabled">Disabled — cannot sign in</option></select></Field>
          </div>
          <div><div className="label">Role</div><div className="grid gap-2 sm:grid-cols-2">{(roles.data || []).filter((r) => isSuper || r.key !== 'super_admin').map((r) => <button key={r.key} type="button" onClick={() => setEdit({ ...edit, role: r.key })} className={`rounded-lg border-2 p-3 text-left ${edit.role === r.key ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/40'}`}><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />{r.name}</div><div className="mt-0.5 text-xs text-muted">{r.desc}</div></button>)}</div></div>
          {!all && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Linked employee" hint="Needed for clock-in, leave and payslips."><select className="input" value={edit.employeeId || ''} onChange={(e) => setEdit({ ...edit, employeeId: e.target.value || null })}><option value="">— None —</option>{(lists.employees || []).map((x: any) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
            <Field label="Linked customer" hint="Only for the guest / customer portal."><select className="input" value={edit.customerId || ''} onChange={(e) => setEdit({ ...edit, customerId: e.target.value || null })}><option value="">— None —</option>{(lists.customers || []).map((x: any) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
          </div>}
        </div>}
      </Drawer>
    </div>
  );
}

// ------------------------------------------------------------------ ROLES & PERMISSIONS
export function Roles() {
  const { data, error, reload } = useAsync<any[]>(() => api.action('roles'), []);
  const users = useAsync<any[]>(() => api.action('users', {}).catch(() => []), []);
  const { isSuper, can } = useAuth(); const toast = useToast(); const confirm = useConfirm();
  const [sel, setSel] = useState<any>(null);
  useEffect(() => { if (data && !sel) setSel(JSON.parse(JSON.stringify(data.find((r) => r.key !== 'super_admin') || data[0]))); }, [data]);
  if (error) return <ErrorBox error={error} />;
  if (!data || !sel) return <Spinner />;
  const locked = sel.key === 'super_admin' || (!sel.businessId && !isSuper) || !can('page:roles', 'e');
  const g = sel.grants || {};
  const has = (k: string, a: string, mod: string) => (g[k] || '').includes(a) || (g['mod:' + mod] || '').includes(a) || (g['*'] || '').includes(a);
  const toggle = (k: string, a: string, mod: string) => {
    if (locked) return;
    const next = { ...g };
    if ((next['mod:' + mod] || '').includes(a) || (next['*'] || '').includes(a)) { // expand module grant into per-item grants
      const m = MODULES.find((x: any) => x.key === mod);
      m.items.forEach((it: any) => { const kk = permKeyOf(it); next[kk] = Array.from(new Set(((next[kk] || '') + (next['mod:' + mod] || '') + (next['*'] || '')).split(''))).join(''); });
      delete next['mod:' + mod];
    }
    const cur = next[k] || '';
    next[k] = cur.includes(a) ? cur.replace(a, '') : cur + a;
    if (a !== 'v' && !cur.includes(a) && !next[k].includes('v')) next[k] += 'v';
    if (a === 'v' && cur.includes('v')) next[k] = '';
    if (!next[k]) delete next[k];
    setSel({ ...sel, grants: next });
  };
  const setModule = (mod: string, on: boolean) => { if (locked) return; const next = { ...g }; const m = MODULES.find((x: any) => x.key === mod); m.items.forEach((it: any) => delete next[permKeyOf(it)]); if (on) next['mod:' + mod] = 'vced'; else delete next['mod:' + mod]; setSel({ ...sel, grants: next }); };
  const save = async () => { try { const r = await api.action('saveRole', sel); toast.ok(`Role “${r.name}” saved.`); reload(); setSel(r); } catch (e) { toast.err(e); } };
  const copy = () => setSel({ ...JSON.parse(JSON.stringify(sel)), id: undefined, key: undefined, system: false, businessId: 'new', name: sel.name + ' (copy)' });
  const count = (k: string) => (users.data || []).filter((u: any) => u.role === k).length;
  return (
    <div className="anim-pop">
      <PageHeader title="Roles & permissions" icon="ShieldCheck" desc="Decide exactly what each job role can see and do. Tick View to show a page, then Add, Edit or Delete to allow changes."
        help={<>Built-in roles cover the usual hotel, restaurant, shop and office jobs. {isSuper ? 'As super admin you can change any role.' : 'To change a built-in role, press Copy and edit the copy — then give users the new role.'} <b>Own records only</b> means staff see only their own leave, attendance, payslips and tasks.</>}
        actions={<>{can('page:roles', 'c') && <button className="btn-secondary" onClick={copy}><Copy className="h-4 w-4" />Copy this role</button>}{can('page:roles', 'c') && <button className="btn-secondary" onClick={() => setSel({ name: 'New role', desc: '', grants: { 'page:dashboard': 'v' }, dashboard: 'employee', color: '#64748B', businessId: 'new' })}><Plus className="h-4 w-4" />New role</button>}<button className="btn-primary" disabled={locked} onClick={save}><Save className="h-4 w-4" />Save role</button></>} />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card thin-scroll max-h-[75vh] overflow-y-auto p-2">
          {data.map((r) => <button key={r.id} onClick={() => setSel(JSON.parse(JSON.stringify(r)))} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left ${sel.id === r.id ? 'bg-brand-soft' : 'hover:bg-paper'}`}><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.name}</span><span className="block text-xs text-muted">{count(r.key)} user{count(r.key) === 1 ? '' : 's'}{r.businessId ? ' · custom' : ''}</span></span></button>)}
        </div>
        <div className="space-y-4">
          <div className="card grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Role name"><input className="input" disabled={locked} value={sel.name} onChange={(e) => setSel({ ...sel, name: e.target.value })} /></Field>
            <Field label="Dashboard shown"><select className="input" disabled={locked} value={sel.dashboard} onChange={(e) => setSel({ ...sel, dashboard: e.target.value })}>{[...new Set(DEFAULT_ROLES.map((r: any) => r.dashboard))].map((d: any) => <option key={d} value={d}>{pretty(d)}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="What this role is for"><input className="input" disabled={locked} value={sel.desc || ''} onChange={(e) => setSel({ ...sel, desc: e.target.value })} /></Field></div>
            <Toggle checked={!!sel.self} onChange={(v) => !locked && setSel({ ...sel, self: v })} label="Own records only" hint="Leave, attendance, payslips, tasks and reviews are limited to the user’s own." />
            <Field label="Colour"><input type="color" disabled={locked} className="h-10 w-16 rounded-lg border border-line" value={sel.color} onChange={(e) => setSel({ ...sel, color: e.target.value })} /></Field>
          </div>
          {locked && <Help>{sel.key === 'super_admin' ? 'The super admin always has full access to everything.' : 'This is a built-in role. Press “Copy this role” to make your own version you can change.'}</Help>}
          {sel.key !== 'super_admin' && <div className="card overflow-hidden">
            <div className="thin-scroll max-h-[60vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_rgb(var(--line))]"><tr><th className="th">Page</th>{['View', 'Add', 'Edit', 'Delete'].map((x) => <th key={x} className="th w-16 text-center">{x}</th>)}</tr></thead>
                <tbody>{MODULES.filter((m: any) => m.key !== 'platform' || isSuper).map((m: any) => {
                  const full = (g['mod:' + m.key] || '').length === 4 || (g['*'] || '').length === 4;
                  return [<tr key={m.key} className="bg-paper/70"><td className="px-3 py-2 font-semibold" colSpan={5}><div className="flex items-center gap-2"><Icon name={m.icon} />{m.label}<label className="ml-auto flex items-center gap-1.5 text-xs font-normal"><input type="checkbox" disabled={locked} checked={full} onChange={(e) => setModule(m.key, e.target.checked)} />Full access</label></div></td></tr>,
                    ...m.items.map((it: any) => { const k = permKeyOf(it); return <tr key={k} className="border-t border-line"><td className="px-3 py-1.5 pl-9">{it.label}{it.type === 'page' && <span className="ml-1 text-[11px] text-muted">screen</span>}</td>{['v', 'c', 'e', 'd'].map((a) => <td key={a} className="text-center">{it.type === 'page' && a !== 'v' && !['page:users', 'page:roles', 'page:settings'].includes(k) ? <span className="text-line">·</span> : <input type="checkbox" aria-label={`${it.label} ${a}`} disabled={locked} checked={has(k, a, m.key)} onChange={() => toggle(k, a, m.key)} />}</td>)}</tr>; })];
                })}</tbody>
              </table>
            </div>
          </div>}
          {sel.businessId && sel.id && <button className="btn-ghost text-bad" onClick={async () => { if (await confirm({ title: `Delete role “${sel.name}”?`, confirm: 'Delete role', danger: true })) { try { await api.action('deleteRole', { id: sel.id }); toast.ok('Role deleted.'); setSel(null); reload(); } catch (e) { toast.err(e); } } }}><Trash2 className="h-4 w-4" />Delete this role</button>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SETTINGS
function useSettingsForm() {
  const { me, refresh } = useAuth(); const toast = useToast();
  const [s, setS] = useState<any>(null);
  useEffect(() => { if (me?.settings && !s) setS(JSON.parse(JSON.stringify(me.settings))); }, [me?.settings]);
  const save = async (patch?: any) => { try { await api.action('saveSettings', patch || s); await refresh(); toast.ok('Settings saved.'); } catch (e) { toast.err(e); } };
  return { s, setS, save };
}
export function Settings() {
  const { s, setS, save } = useSettingsForm(); const { hasModule } = useAuth();
  const [tab, setTab] = useState('general');
  if (!s) return <Spinner />;
  const F = (k: string, l: string, type = 'text', hint?: string) => <Field label={l} hint={hint}><input className="input" type={type} value={s[k] ?? ''} onChange={(e) => setS({ ...s, [k]: type === 'number' ? Number(e.target.value) : e.target.value })} /></Field>;
  const T = (k: string, l: string, hint?: string) => <Toggle checked={!!s[k]} onChange={(v) => setS({ ...s, [k]: v })} label={l} hint={hint} />;
  const tabs = [{ key: 'general', label: 'Business & brand' }, { key: 'regional', label: 'Currency & tax' }, { key: 'documents', label: 'Invoices & receipts' }, ...(hasModule('hotel') ? [{ key: 'hotel', label: 'Hotel' }] : []), ...(hasModule('restaurant') ? [{ key: 'restaurant', label: 'Restaurant' }] : []), ...(hasModule('shop') ? [{ key: 'shop', label: 'Shop & stock' }] : []), { key: 'loyalty', label: 'Loyalty' }, { key: 'email', label: 'Email notifications' }];
  return (
    <div className="anim-pop">
      <PageHeader title="Business settings" icon="Settings" desc="Your brand, money, tax and how each part of the system behaves." actions={<button className="btn-primary" onClick={() => save()}><Save className="h-4 w-4" />Save settings</button>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={tabs} /></div>
      <div className="card max-w-3xl space-y-4 p-5">
        {tab === 'general' && <div className="grid gap-4 sm:grid-cols-2">{F('brand_name', 'Business name (shown on bills)')}{F('tagline', 'Tagline')}<Field label="Logo (emoji)" hint="Shown in the menu and on receipts."><input className="input text-2xl" value={s.logo_emoji} onChange={(e) => setS({ ...s, logo_emoji: e.target.value })} maxLength={4} /></Field><Field label="Brand colour"><div className="flex items-center gap-2"><input type="color" className="h-10 w-16 rounded-lg border border-line" value={s.primary_color} onChange={(e) => setS({ ...s, primary_color: e.target.value })} /><button className="btn-ghost btn-sm" onClick={() => setS({ ...s, primary_color: '#0F6E66' })}>Reset</button></div></Field>{F('email', 'Email', 'email')}{F('phone', 'Phone')}<div className="sm:col-span-2">{F('address', 'Address')}</div>{F('tax_number', 'Tax / VAT number')}<Field label="Language"><select className="input" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })}>{['English', 'Sinhala', 'Tamil', 'Arabic', 'French', 'German', 'Chinese'].map((l) => <option key={l}>{l}</option>)}</select></Field></div>}
        {tab === 'regional' && <div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><select className="input" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value, currency_symbol: { LKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'AED' }[e.target.value as string] })}>{['LKR', 'USD', 'EUR', 'GBP', 'INR', 'AED'].map((c) => <option key={c}>{c}</option>)}</select></Field>{F('currency_symbol', 'Currency symbol')}{F('vat', 'VAT %', 'number')}{F('service_charge', 'Service charge %', 'number')}{F('tdl', 'Tourism levy %', 'number')}<Field label="Time zone"><select className="input" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })}>{['Asia/Colombo', 'Asia/Dubai', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'Asia/Singapore'].map((z) => <option key={z}>{z}</option>)}</select></Field><div className="sm:col-span-2"><Help>More tax rates (per product type) are in <Link className="text-brand underline" to="/app/e/taxes">Administration → Taxes</Link>.</Help></div></div>}
        {tab === 'documents' && <div className="grid gap-4 sm:grid-cols-2">{F('invoice_prefix', 'Invoice number prefix')}{F('date_format', 'Date format')}<div className="sm:col-span-2">{F('invoice_footer', 'Invoice footer text')}</div><div className="sm:col-span-2">{F('receipt_footer', 'Receipt footer text')}</div></div>}
        {tab === 'hotel' && <div className="grid gap-4 sm:grid-cols-2">{F('check_in_time', 'Standard check-in time', 'time')}{F('check_out_time', 'Standard check-out time', 'time')}{F('night_audit_time', 'Night audit time', 'time')}</div>}
        {tab === 'restaurant' && <div className="space-y-2">{T('kot_auto_print', 'Print KOT automatically', 'Sends tickets to kitchen printers as soon as an order is placed.')}{T('qr_ordering', 'Allow ordering from table QR codes', 'Guests can scan and order without a waiter.')}{T('qr_payment_required', 'Guests must pay online when ordering by QR')}{T('table_service_charge', 'Add service charge on dine-in orders')}</div>}
        {tab === 'shop' && <div className="space-y-2">{T('low_stock_alert', 'Alert me when products reach their reorder level')}{T('allow_negative_stock', 'Allow selling when stock shows zero', 'Turn on if your stock counts are not exact yet.')}</div>}
        {tab === 'loyalty' && <div className="space-y-4">{T('loyalty_enabled', 'Give loyalty points on every sale and stay')}<div className="grid gap-4 sm:grid-cols-2">{F('points_per_100', 'Points per 100 spent', 'number')}{F('point_value', 'Value of 1 point when redeemed', 'number')}</div><Help>Tiers and discounts are set in <Link className="text-brand underline" to="/app/e/loyalty_tiers">Loyalty program</Link>.</Help></div>}
        {tab === 'email' && <div className="space-y-2">{Object.entries({ new_booking: 'New booking received', check_out_invoice: 'Send invoice to guest at check-out', low_stock: 'Low stock alert', leave_request: 'New leave request', payslip: 'Email payslips to staff', order_ready: 'Tell customer when order is ready' }).map(([k, l]) => <Toggle key={k} checked={!!s.email_notifications?.[k]} onChange={(v) => setS({ ...s, email_notifications: { ...s.email_notifications, [k]: v } })} label={l} />)}<Help>Email sending is set up in <Link className="text-brand underline" to="/app/integrations">Integrations → Email (SMTP)</Link>. Wording is in Email templates (super admin).</Help></div>}
      </div>
    </div>
  );
}

export function PaymentGateways({ platform }: { platform?: boolean }) {
  const biz = useSettingsForm();
  const plat = useAsync<any>(() => (platform ? api.action('getPlatformSettings') : Promise.resolve(null)), [platform]);
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const src = platform ? plat.data : biz.s;
  if (!src) return <Spinner />;
  const gw = src.gateways || {};
  const set = (name: string, patch: any) => { const next = { ...src, gateways: { ...gw, [name]: { ...gw[name], ...patch } } }; platform ? plat.setData(next) : biz.setS(next); };
  const save = async () => { try { if (platform) await api.action('savePlatformSettings', { gateways: src.gateways }); else await biz.save({ gateways: src.gateways }); if (platform) toast.ok('Saved.'); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Payment gateways" icon="CreditCard" desc={platform ? 'Gateways businesses use to pay for their plan.' : 'Online payment providers for bookings, the online store and QR orders. Switch on the ones you have an account with.'} actions={<button className="btn-primary" onClick={save}><Save className="h-4 w-4" />Save</button>} help="Start in Test (sandbox) mode with the test keys from your provider. When you are ready to take real money, switch to Live and paste the live keys." />
      <div className="mb-3 text-sm text-muted">{Object.values(gw).filter((x: any) => x?.enabled).length} of {PAYMENT_GATEWAYS.length} switched on</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PAYMENT_GATEWAYS.map((name: string) => { const g = gw[name] || {}; return (
          <div key={name} className={`card p-4 ${g.enabled ? 'ring-2 ring-brand/40' : ''}`}>
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-paper text-sm font-bold">{name.slice(0, 2)}</span><div><div className="font-semibold">{name}</div><div className="text-xs text-muted">{g.enabled ? (g.mode === 'live' ? 'Live — taking real payments' : 'Test mode') : 'Off'}</div></div></div><Toggle checked={!!g.enabled} onChange={(v) => set(name, { enabled: v })} /></div>
            {g.enabled && <button className="btn-ghost btn-sm mt-2 text-brand" onClick={() => setOpen(open === name ? null : name)}><KeyRound className="h-4 w-4" />{open === name ? 'Hide keys' : 'Set up keys'}</button>}
            {open === name && <div className="mt-2 space-y-3">{name === 'Bank transfer' ? <Field label="Bank details shown to customers"><textarea className="input" value={g.details || ''} onChange={(e) => set(name, { details: e.target.value })} placeholder="Bank, account name, account number, branch" /></Field> : <><Field label="Mode"><select className="input" value={g.mode || 'sandbox'} onChange={(e) => set(name, { mode: e.target.value })}><option value="sandbox">Test (sandbox)</option><option value="live">Live</option></select></Field><Field label="Public / merchant key"><input className="input" value={g.key || ''} onChange={(e) => set(name, { key: e.target.value })} /></Field><Field label="Secret key"><input className="input" type="password" value={g.secret || ''} onChange={(e) => set(name, { secret: e.target.value })} /></Field></>}</div>}
          </div>); })}
      </div>
    </div>
  );
}

export function Integrations() {
  const { s, setS, save } = useSettingsForm(); const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  if (!s) return <Spinner />;
  const ig = s.integrations || {};
  const set = (k: string, patch: any) => setS({ ...s, integrations: { ...ig, [k]: { ...(ig[k] || { values: {} }), ...patch } } });
  return (
    <div className="anim-pop">
      <PageHeader title="Integrations" icon="Plug" desc="Connect messaging, email, meetings, storage and other services." actions={<button className="btn-primary" onClick={() => save({ integrations: s.integrations })}><Save className="h-4 w-4" />Save</button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {INTEGRATIONS.map((x: any) => { const c = ig[x.key] || { values: {} }; return (
          <div key={x.key} className="card p-4">
            <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{x.name}</div><p className="text-sm text-muted">{x.desc}</p></div><Toggle checked={!!c.enabled} onChange={(v) => set(x.key, { enabled: v })} /></div>
            {c.enabled && <><button className="btn-ghost btn-sm mt-2 text-brand" onClick={() => setOpen(open === x.key ? null : x.key)}>{open === x.key ? 'Hide settings' : 'Settings'}</button>
              {open === x.key && <div className="mt-2 grid gap-3 sm:grid-cols-2">{x.fields.map((f: string) => <Field key={f} label={f}><input className="input" type={/secret|token|password|key/i.test(f) ? 'password' : 'text'} value={c.values?.[f] || ''} onChange={(e) => set(x.key, { values: { ...c.values, [f]: e.target.value } })} /></Field>)}<div className="sm:col-span-2"><button className="btn-secondary btn-sm" onClick={() => toast.info(MODE === 'demo' ? 'Test messages are not sent in demo mode.' : 'Test sent — check the connected service.')}><Send className="h-4 w-4" />Send a test</button></div></div>}</>}
          </div>); })}
      </div>
    </div>
  );
}

export function Subscription() {
  const { me, refresh } = useAuth(); const plans = useAsync<any[]>(() => api.action('lookups', { cols: ['plans'] }).then((r) => r.plans), []);
  const subs = useAsync<any[]>(() => api.list('subscriptions').catch(() => []), []);
  const toast = useToast(); const confirm = useConfirm();
  const [full, setFull] = useState<any[]>([]);
  useEffect(() => { api.landing().then((l: any) => setFull(l.plans)).catch(() => {}); }, []);
  const cur = me?.business?.plan_id;
  return (
    <div className="anim-pop">
      <PageHeader title="My subscription" icon="BadgeCheck" desc="Your current plan, what it includes, and upgrades." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {full.map((p) => <div key={p.id} className={`card flex flex-col p-5 ${p.id === cur ? 'ring-2 ring-brand' : ''}`}>
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{p.name}</h2>{p.id === cur && <span className="chip bg-brand text-white">Current</span>}</div>
          <div className="mt-2 text-3xl font-bold">{money(p.price_monthly)}<span className="text-sm font-normal text-muted">/month</span></div>
          <p className="mt-1 text-sm text-muted">{p.description}</p>
          <ul className="mt-3 flex-1 space-y-1 text-sm">{[`${p.max_users} users`, `${p.max_branches} branches`, `${p.storage_gb} GB storage`, `${p.modules.length} modules`].map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-ok" />{x}</li>)}</ul>
          {p.id !== cur && <button className="btn-primary mt-4" onClick={async () => { if (await confirm({ title: `Switch to ${p.name}?`, text: `${money(p.price_monthly)} per month, charged to your card on file.`, confirm: 'Switch plan' })) { try { const r = await api.action('changePlan', { plan_id: p.id }); toast.ok(r.message); refresh(); } catch (e) { toast.err(e); } } }}>Switch to {p.name}</button>}
        </div>)}
      </div>
      {(subs.data || []).length > 0 && <><h2 className="mb-2 mt-6 font-semibold">Payment history</h2><DataTable rows={(subs.data || []).filter((s) => s.business_id === me?.business?.id)} cols={[{ key: 'number', label: 'Order' }, { key: 'date', label: 'Date', render: (r) => date(r.date) }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) }, { key: 'gateway', label: 'Paid with' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} /></>}
      {void plans}
    </div>
  );
}

export function HelpdeskRequest() {
  const { data, reload } = useAsync<any[]>(() => api.action('helpdeskMine'), []);
  const toast = useToast(); const [f, setF] = useState({ subject: '', message: '', priority: 'medium' });
  return (
    <div className="anim-pop">
      <PageHeader title="Ask platform support" icon="LifeBuoy" desc="Something not working or need help? Send a ticket to the platform team." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-4 p-5"><Field label="Subject" required><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field><Field label="How urgent?"><select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low — when you can</option><option value="medium">Medium</option><option value="high">High — affecting work</option><option value="urgent">Urgent — we cannot work</option></select></Field><Field label="What happened?"><textarea className="input min-h-[120px]" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field><button className="btn-primary" onClick={async () => { try { await api.action('helpdeskCreate', f); toast.ok('Ticket sent. We will reply soon.'); setF({ subject: '', message: '', priority: 'medium' }); reload(); } catch (e) { toast.err(e); } }}><Send className="h-4 w-4" />Send ticket</button></div>
        <Card title="Your tickets" pad={false}>{(data || []).map((t) => <div key={t.id} className="border-t border-line px-4 py-3 first:border-0"><div className="flex justify-between gap-2"><b className="text-sm">{t.subject}</b><Status value={t.status} /></div><div className="text-xs text-muted">{t.number} · {pretty(t.priority)}</div>{t.reply && <div className="mt-2 rounded-lg bg-paper p-2 text-sm">{t.reply}</div>}</div>)}{!data?.length && <p className="px-4 py-8 text-center text-sm text-muted">No tickets yet.</p>}</Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ PLATFORM SETTINGS
export function PlatformSettings() {
  const { data, setData, error } = useAsync<any>(() => api.action('getPlatformSettings'), []);
  const toast = useToast(); const { refresh } = useAuth(); const confirm = useConfirm();
  const [tab, setTab] = useState('brand');
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const F = (k: string, l: string, hint?: string) => <Field label={l} hint={hint}><input className="input" value={data[k] ?? ''} onChange={(e) => setData({ ...data, [k]: e.target.value })} /></Field>;
  const T = (k: string, l: string, hint?: string) => <Toggle checked={!!data[k]} onChange={(v) => setData({ ...data, [k]: v })} label={l} hint={hint} />;
  return (
    <div className="anim-pop">
      <PageHeader title="Platform settings" icon="SlidersHorizontal" desc="Settings that apply to every business on the platform." actions={<button className="btn-primary" onClick={async () => { try { await api.action('savePlatformSettings', data); await refresh(); toast.ok('Platform settings saved.'); } catch (e) { toast.err(e); } }}><Save className="h-4 w-4" />Save</button>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={['brand', 'system', 'cookies', 'seo', 'storage', 'realtime', 'gateways', 'data'].map((k) => ({ key: k, label: { brand: 'Brand', system: 'System', cookies: 'Cookies', seo: 'SEO', storage: 'Storage & cache', realtime: 'Real-time (Pusher)', gateways: 'Plan payments', data: 'Data' }[k] as string }))} /></div>
      {tab === 'gateways' ? <PaymentGateways platform /> : <div className="card max-w-3xl space-y-4 p-5">
        {tab === 'brand' && <div className="grid gap-4 sm:grid-cols-2">{F('app_name', 'Platform name')}{F('support_email', 'Support email')}{F('default_language', 'Default language')}{F('default_currency', 'Default currency')}</div>}
        {tab === 'system' && <div className="space-y-2">{T('allow_signup', 'Allow new businesses to sign up', 'Shows the sign-up button on the landing page.')}{T('email_verification', 'Require email verification')}{T('maintenance_mode', 'Maintenance mode', 'Only super admins can sign in.')}</div>}
        {tab === 'cookies' && <div className="space-y-3">{T('cookie_consent', 'Show cookie banner')}{F('cookie_text', 'Banner text')}</div>}
        {tab === 'seo' && <div className="space-y-3">{F('seo_title', 'Page title')}<Field label="Description"><textarea className="input" value={data.seo_description || ''} onChange={(e) => setData({ ...data, seo_description: e.target.value })} /></Field></div>}
        {tab === 'storage' && <div className="grid gap-4 sm:grid-cols-2"><Field label="File storage"><select className="input" value={data.storage} onChange={(e) => setData({ ...data, storage: e.target.value })}><option>Local</option><option>Amazon S3</option><option>Wasabi</option></select></Field><Field label="Cache"><select className="input" value={data.cache_driver} onChange={(e) => setData({ ...data, cache_driver: e.target.value })}><option value="file">File</option><option value="redis">Redis</option></select></Field><div className="sm:col-span-2"><button className="btn-secondary" onClick={() => toast.ok('Cache cleared.')}>Clear cache now</button></div></div>}
        {tab === 'realtime' && <div className="space-y-2">{T('pusher_enabled', 'Use Pusher for live updates', 'Kitchen display, messages and notifications update instantly without refreshing.')}<Help>Enter keys under the business Integrations page → Pusher.</Help></div>}
        {tab === 'data' && <div className="space-y-3"><p className="text-sm text-muted">Restore all businesses to the original demo data. Use this before showing the system to a new client.</p><button className="btn-danger" onClick={async () => { if (await confirm({ title: 'Reset all data?', text: 'Every change in every business will be lost.', confirm: 'Reset everything', danger: true })) { await api.resetDemo(); toast.ok('Demo data restored.'); } }}>Reset to demo data</button></div>}
      </div>}
    </div>
  );
}

// ------------------------------------------------------------------ PROFILE
export function Profile() {
  const { me, refresh } = useAuth(); const toast = useToast();
  const [p, setP] = useState({ name: me?.user?.name || '', phone: me?.user?.phone || '' });
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  return (
    <div className="anim-pop mx-auto max-w-2xl space-y-4">
      <PageHeader title="My profile" icon="UserCircle" desc="Your name, contact details and password." />
      <div className="card flex items-center gap-4 p-5"><Avatar name={me?.user?.name} size="lg" color={me?.role?.color} /><div><div className="text-lg font-bold">{me?.user?.name}</div><div className="text-sm text-muted">{me?.user?.email}</div><span className="chip mt-1 text-white" style={{ background: me?.role?.color }}>{me?.role?.name}</span></div></div>
      <div className="card space-y-4 p-5"><h2 className="font-semibold">Details</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field><Field label="Phone"><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field></div><button className="btn-primary" onClick={async () => { try { await api.updateProfile(p); await refresh(); toast.ok('Profile saved.'); } catch (e) { toast.err(e); } }}>Save details</button></div>
      <div id="password" className="card space-y-4 p-5"><h2 className="font-semibold">Change password</h2><div className="grid gap-4 sm:grid-cols-3"><Field label="Current password"><input className="input" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field><Field label="New password"><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field><Field label="Repeat new password" error={pw.again && pw.again !== pw.next ? 'Passwords do not match' : undefined}><input className="input" type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} /></Field></div><button className="btn-primary" disabled={!pw.next || pw.next !== pw.again} onClick={async () => { try { await api.changePassword(pw.current, pw.next); toast.ok('Password changed.'); setPw({ current: '', next: '', again: '' }); } catch (e) { toast.err(e); } }}><KeyRound className="h-4 w-4" />Change password</button></div>
    </div>
  );
}
export { Pencil, ShieldCheck, Empty, Modal };
