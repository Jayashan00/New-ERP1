import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, Plane, Printer, Banknote, Check, BedDouble } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Kpi, Card, Status, Field, Modal, Empty, Tabs, Help, useConfirm } from '@/components/ui';
import { ChartCard } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { PrintModal, PayslipDoc, ReceiptDoc } from '@/components/Printable';
import { FolioDrawer } from '@/components/Folio';
import { money, date, pretty, today, nightsBetween, dateTime } from '@/lib/format';

const report = (name: string) => () => api.action('report', { name });

// ------------------------------------------------------------------ HR OVERVIEW
export function HrmDashboard() {
  const { data: r, error } = useAsync<any>(report('hrm'), []);
  const leaves = useList('leave_applications'); const { maps } = useLookups(['employees', 'leave_types']);
  const toast = useToast();
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  const pend = (leaves.data || []).filter((l) => l.status === 'pending');
  const decide = async (id: string, status: string) => { try { await api.action('decideLeave', { id, status }); toast.ok(`Leave ${status}.`); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="HR overview" icon="Users" desc="Headcount, attendance, leave and payroll at a glance." actions={<><Link to="/app/e/employees?new=1" className="btn-primary">Add employee</Link><Link to="/app/run-payroll" className="btn-secondary">Run payroll</Link></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Headcount" value={r.headcount} /><Kpi label="Active" value={r.active} tone="ok" /><Kpi label="Leave to approve" value={pend.length} tone={pend.length ? 'warn' : 'ok'} /><Kpi label="Exits (resigned / terminated)" value={`${r.turnover.resigned} / ${r.turnover.terminated}`} fmt="text" /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Attendance — 14 days', type: 'bar', stacked: true, data: r.attendance, series: [{ key: 'Present', label: 'Present' }, { key: 'Late', label: 'Late' }, { key: 'Absent', label: 'Absent' }], span: 2 }} />
        <ChartCard spec={{ title: 'By department', type: 'pie', data: r.departments }} />
        <ChartCard spec={{ title: 'Payroll cost', type: 'bar', data: r.payroll, series: [{ key: 'Payroll', label: 'Net pay' }], fmt: 'money' }} />
        <ChartCard spec={{ title: 'Gender', type: 'pie', data: r.gender }} />
        <Card title="Leave waiting for you" pad={false}>{pend.map((l) => <div key={l.id} className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-sm first:border-0"><span className="flex-1"><b>{maps.employees?.[l.employee_id]}</b><span className="block text-xs text-muted">{maps.leave_types?.[l.leave_type_id]} · {date(l.start)} · {l.days} days</span></span><button className="btn-ghost btn-sm text-bad" onClick={() => decide(l.id, 'rejected')}>Reject</button><button className="btn-primary btn-sm" onClick={() => decide(l.id, 'approved')}>Approve</button></div>)}{!pend.length && <p className="px-4 py-6 text-center text-sm text-muted">Nothing waiting.</p>}</Card>
      </div>
    </div>
  );
}

export function LeaveBalance() {
  const { data, error } = useAsync<any[]>(() => api.action('leaveBalance'), []);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const types = data[0]?.balances.map((b: any) => b.type) || [];
  return (
    <div className="anim-pop">
      <PageHeader title="Leave balance" icon="CalendarCheck" desc="Days each employee is entitled to, has used and has left this year." />
      <DataTable rows={data.map((d) => ({ id: d.employee.id, name: d.employee.name, ...Object.fromEntries(d.balances.map((b: any) => [b.type.id, b])) }))} exportName="leave-balance"
        cols={[{ key: 'name', label: 'Employee', render: (r) => <b>{r.name}</b> }, ...types.map((t: any) => ({ key: t.id, label: t.name, text: (r: any) => `${r[t.id].left}/${r[t.id].entitled}`, render: (r: any) => <span><b className={r[t.id].left <= 0 ? 'text-bad' : ''}>{r[t.id].left}</b><span className="text-muted"> / {r[t.id].entitled}</span></span> }))]} />
    </div>
  );
}

export function RunPayroll() {
  const slips = useList('payslips'); const { maps } = useLookups(['employees']);
  const toast = useToast(); const confirm = useConfirm();
  const months = Array.from({ length: 4 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2 + i); return d.toLocaleString('en', { month: 'long', year: 'numeric' }); });
  const [month, setMonth] = useState(months[2]);
  const [print, setPrint] = useState<any>(null);
  if (slips.error) return <ErrorBox error={slips.error} />;
  if (!slips.data) return <Spinner />;
  const these = slips.data.filter((s) => s.month === month);
  const drafts = these.filter((s) => s.status === 'draft');
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Run payroll" icon="Banknote" desc="Create payslips for everyone in one click, check them, then mark them paid." help={<>Step 1: choose the month and press <b>Generate payslips</b> — basic salary, recurring allowances and deductions (from <Link className="text-brand underline" to="/app/e/salary_components">Set salary</Link>) and overtime from attendance are calculated. Step 2: open any payslip to adjust it. Step 3: press <b>Mark all paid</b>; the total is recorded as a salary expense.</>} />
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <Field label="Month"><select className="input w-56" value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <button className="btn-primary" onClick={async () => { try { const r = await api.action('runPayroll', { month }); toast.ok(r.message); } catch (e) { toast.err(e); } }}><Banknote className="h-4 w-4" />Generate payslips</button>
        <button className="btn-secondary" disabled={!drafts.length} onClick={async () => { if (!(await confirm({ title: `Pay ${drafts.length} payslips?`, text: `Total ${money(drafts.reduce((s, x) => s + x.net, 0))} will be recorded as a salary expense.`, confirm: 'Mark all paid' }))) return; try { const r = await api.action('payPayroll', { month }); toast.ok(r.message); } catch (e) { toast.err(e); } }}><Check className="h-4 w-4" />Mark all paid ({drafts.length})</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Payslips" value={these.length} /><Kpi label="Gross pay" value={these.reduce((s, x) => s + x.basic + x.allowances + x.overtime + (x.service_charge || 0), 0)} fmt="money" /><Kpi label="Deductions" value={these.reduce((s, x) => s + x.deductions, 0)} fmt="money" /><Kpi label="Net to pay" value={these.reduce((s, x) => s + x.net, 0)} fmt="money" /></div>
      <DataTable rows={these} exportName={'payroll-' + month} onRowClick={setPrint} cols={[{ key: 'employee_id', label: 'Employee', render: (r) => <b>{maps.employees?.[r.employee_id]}</b>, text: (r) => maps.employees?.[r.employee_id] }, { key: 'basic', label: 'Basic', render: (r) => money(r.basic), className: 'text-right' }, { key: 'allowances', label: 'Allowances', render: (r) => money(r.allowances), className: 'text-right' }, { key: 'overtime', label: 'Overtime', render: (r) => money(r.overtime), className: 'text-right' }, { key: 'deductions', label: 'Deductions', render: (r) => money(r.deductions), className: 'text-right' }, { key: 'net', label: 'Net pay', render: (r) => <b>{money(r.net)}</b>, className: 'text-right' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]}
        empty={<Empty title={`No payslips for ${month}`} text="Press Generate payslips to create them." icon="Banknote" />} />
      {print && <PrintModal open onClose={() => setPrint(null)} title="Payslip"><PayslipDoc slip={print} employee={maps.employees?.[print.employee_id]} /></PrintModal>}
    </div>
  );
}

// ------------------------------------------------------------------ CRM & PROJECTS OVERVIEW
export function CrmDashboard() {
  const { data: r, error } = useAsync<any>(report('crm'), []);
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="CRM overview" icon="Target" desc="Your sales pipeline from first contact to won deal." actions={<><Link to="/app/e/leads?view=board" className="btn-primary">Leads board</Link><Link to="/app/e/deals?view=board" className="btn-secondary">Deals board</Link></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Kpi label="Open pipeline" value={r.pipeline} fmt="money" /><Kpi label="Won deals" value={r.won} fmt="money" tone="ok" /><Kpi label="Lead conversion" value={r.conversion} fmt="percent" /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Leads by stage', type: 'bar', data: r.stages, series: [{ key: 'Leads', label: 'Leads' }], span: 2 }} />
        <ChartCard spec={{ title: 'Lead sources', type: 'pie', data: r.sources }} />
        <ChartCard spec={{ title: 'Deal value by stage', type: 'bar', data: r.dealStages, series: [{ key: 'Value', label: 'Value' }], fmt: 'money', span: 2 }} />
        <ChartCard spec={{ title: 'Won by owner', type: 'pie', data: r.owners, fmt: 'money' }} />
      </div>
    </div>
  );
}
export function ProjectsDashboard() {
  const { data: r, error } = useAsync<any>(report('projects'), []);
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Projects overview" icon="FolderKanban" desc="Progress, hours and budget of every project." actions={<Link to="/app/e/tasks?view=board" className="btn-primary">Task board</Link>} />
      <div className="grid gap-4 lg:grid-cols-3"><ChartCard spec={{ title: 'Hours logged — 14 days', type: 'bar', data: r.hours, series: [{ key: 'Hours', label: 'Hours' }], span: 2 }} /><ChartCard spec={{ title: 'Tasks by status', type: 'pie', data: r.status }} /></div>
      <div className="grid gap-3 md:grid-cols-2">{r.projects.map((p: any) => <div key={p.id} className="card p-4"><div className="flex justify-between gap-2"><b>{p.name}</b><Status value={p.status} /></div><div className="mt-1 text-xs text-muted">{p.manager} · due {date(p.end)} · {p.done}/{p.tasks} tasks · {p.hours} h</div><div className="mt-3 h-2.5 rounded-full bg-paper"><div className="h-full rounded-full bg-brand" style={{ width: p.progress + '%' }} /></div><div className="mt-2 flex justify-between text-xs"><span>{p.progress}% done</span><span>{money(p.spent)} of {money(p.budget)} budget</span></div></div>)}</div>
    </div>
  );
}

// ------------------------------------------------------------------ MY SPACE (self-service)
export function MyAttendance() {
  const { data, error } = useAsync<any>(() => api.action('myAttendance'), []);
  const toast = useToast();
  const [now, setNow] = useState(new Date()); useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  if (!data.employee) return <Empty title="Your login is not linked to an employee" text="Ask HR to link your user to your employee record in Users & logins." />;
  const t = data.today; const clock = async (type: string) => { try { const r = await api.action('clock', { type }); toast.ok(type === 'in' ? `Clocked in at ${r.clock_in}${r.late_minutes ? ` — ${r.late_minutes} min late` : ''}` : `Clocked out at ${r.clock_out}. Have a good evening!`); } catch (e) { toast.err(e); } };
  const hist = data.history;
  return (
    <div className="anim-pop mx-auto max-w-3xl space-y-4">
      <PageHeader title="My attendance" icon="Clock" desc="Clock in when you start and clock out when you leave." />
      <div className="card flex flex-col items-center p-8 text-center">
        <div className="text-5xl font-bold tabular-nums tracking-tight">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="mt-1 text-muted">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="mt-6 flex gap-3">
          {!t?.clock_in && <button className="btn-primary px-8 py-4 text-lg" onClick={() => clock('in')}><LogIn className="h-5 w-5" />Clock in</button>}
          {t?.clock_in && !t?.clock_out && <button className="btn-primary px-8 py-4 text-lg" onClick={() => clock('out')}><LogOut className="h-5 w-5" />Clock out</button>}
          {t?.clock_out && <div className="rounded-xl bg-ok/10 px-6 py-4 font-semibold text-ok">Done for today: {t.clock_in} – {t.clock_out}</div>}
        </div>
        {t?.clock_in && !t.clock_out && <p className="mt-3 text-sm text-muted">You clocked in at <b>{t.clock_in}</b>{t.late_minutes ? ` (${t.late_minutes} min late)` : ''}.</p>}
      </div>
      <div className="grid grid-cols-3 gap-3"><Kpi label="Days present (31d)" value={hist.filter((h: any) => ['present', 'late'].includes(h.status)).length} tone="ok" /><Kpi label="Late arrivals" value={hist.filter((h: any) => h.late_minutes > 0).length} tone="warn" /><Kpi label="Overtime hours" value={Math.round(hist.reduce((s: number, h: any) => s + (h.overtime_minutes || 0), 0) / 60)} /></div>
      <DataTable rows={hist} pageSize={10} exportName="my-attendance" cols={[{ key: 'date', label: 'Date', render: (r) => date(r.date) }, { key: 'clock_in', label: 'In' }, { key: 'clock_out', label: 'Out' }, { key: 'late_minutes', label: 'Late (min)' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} />
    </div>
  );
}

export function MyLeaves() {
  const bal = useAsync<any[]>(() => api.action('leaveBalance', { mine: true }), []); const apps = useAsync<any[]>(() => api.action('myLeaves'), []); const lt = useAsync<any[]>(() => api.action('leaveTypes'), []); const lists: any = { leave_types: lt.data || [] }; const maps: any = { leave_types: Object.fromEntries((lt.data || []).map((x: any) => [x.id, x.label])) };
  const toast = useToast();
  const [form, setForm] = useState<any>(null);
  if (bal.error) return <ErrorBox error={bal.error} />;
  if (!bal.data || !apps.data) return <Spinner />;
  const b = bal.data[0]?.balances || [];
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="My leave" icon="Plane" desc="See how many days you have left and apply for leave. Your manager is notified straight away." actions={<button className="btn-primary" onClick={() => setForm({ leave_type_id: lists.leave_types?.[0]?.id, start: today(), end: today(), reason: '' })}><Plane className="h-4 w-4" />Apply for leave</button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{b.map((x: any) => <Kpi key={x.type.id} label={x.type.name} value={x.left} hint={`of ${x.entitled} days left`} tone={x.left <= 0 ? 'bad' : 'ok'} />)}</div>
      <DataTable rows={apps.data} exportName="my-leave" cols={[{ key: 'leave_type_id', label: 'Type', render: (r) => maps.leave_types?.[r.leave_type_id] }, { key: 'start', label: 'From', render: (r) => date(r.start) }, { key: 'end', label: 'To', render: (r) => date(r.end) }, { key: 'days', label: 'Days' }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} empty={<Empty title="No leave requests yet" />} />
      <Modal open={!!form} onClose={() => setForm(null)} title="Apply for leave" footer={<><button className="btn-secondary" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" onClick={async () => { try { await api.action('applyLeave', form); toast.ok('Leave request sent to your manager.'); setForm(null); } catch (e) { toast.err(e); } }}>Send request</button></>}>
        {form && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Leave type" required><select className="input" value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>{(lists.leave_types || []).map((t: any) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
          <div className="hidden sm:block" />
          <Field label="From" required><input type="date" className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value, end: e.target.value > form.end ? e.target.value : form.end })} /></Field>
          <Field label="To" required hint={`${Math.max(1, nightsBetween(form.start, form.end) + (form.end > form.start ? 1 : 0))} day(s)`}><input type="date" className="input" min={form.start} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Reason"><textarea className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field></div>
        </div>}
      </Modal>
    </div>
  );
}

export function MyPayslips() {
  const slips = useAsync<any[]>(() => api.action('myPayslips'), []); const { me } = useAuth();
  const [print, setPrint] = useState<any>(null);
  if (slips.error) return <ErrorBox error={slips.error} />;
  if (!slips.data) return <Spinner />;
  const mine = slips.data;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="My payslips" icon="Wallet" desc="Your salary slips. Open one to view or print it." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mine.map((s) => <button key={s.id} onClick={() => setPrint(s)} className="card p-4 text-left hover:shadow-pop"><div className="flex justify-between"><b>{s.month}</b><Status value={s.status} /></div><div className="mt-2 text-2xl font-bold">{money(s.net)}</div><div className="text-xs text-muted">Basic {money(s.basic)} · Deductions {money(s.deductions)}</div><div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"><Printer className="h-3.5 w-3.5" />View & print</div></button>)}</div>
      {!mine.length && <Empty title="No payslips yet" icon="Wallet" />}
      {print && <PrintModal open onClose={() => setPrint(null)} title="Payslip"><PayslipDoc slip={print} employee={me?.user?.name} /></PrintModal>}
    </div>
  );
}

export function MyTasks() {
  const tasks = useAsync<any[]>(() => api.action('myTasks'), []); const toast = useToast();
  if (tasks.error) return <ErrorBox error={tasks.error} />;
  if (!tasks.data) return <Spinner />;
  const mine = tasks.data; const maps: any = { projects: Object.fromEntries(mine.map((t) => [t.project_id, t.project])) };
  const cols = [['todo', 'To do'], ['in_progress', 'Doing'], ['review', 'In review'], ['done', 'Done']];
  return (
    <div className="anim-pop">
      <PageHeader title="My tasks" icon="ListChecks" desc="Work assigned to you. Move a task forward when you make progress." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cols.map(([k, l], ci) => <div key={k} className="rounded-xl bg-surface/60 p-3 shadow-card"><h2 className="mb-2 font-semibold">{l} <span className="text-muted">({mine.filter((t) => t.status === k).length})</span></h2><div className="space-y-2">{mine.filter((t) => t.status === k).map((t) => <div key={t.id} className="rounded-lg border border-line bg-surface p-3"><div className="font-semibold">{t.title}</div><div className="text-xs text-muted">{maps.projects?.[t.project_id]} · due {date(t.due)} · <Status value={t.priority} /></div>{ci < 3 && <button className="btn-secondary btn-sm mt-2 w-full" onClick={() => api.action('updateMyTask', { id: t.id, status: cols[ci + 1][0] }).then(() => toast.ok(`Moved to ${cols[ci + 1][1]}`)).catch(toast.err)}>Move to {cols[ci + 1][1]} →</button>}</div>)}</div></div>)}</div>
      {!mine.length && <Empty title="No tasks assigned to you" />}
    </div>
  );
}

export function MyBookings() {
  const { data, error } = useAsync<any[]>(() => api.action('myBookings'), []); const { me } = useAuth();
  const [folio, setFolio] = useState<string | null>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="My bookings" icon="BedDouble" desc="Your stays with us. Open a stay to see the bill." actions={<a href={`/book/${me?.business?.slug}`} target="_blank" className="btn-primary" rel="noreferrer">Book another stay</a>} />
      <div className="grid gap-3 md:grid-cols-2">{data.map((r) => <button key={r.id} onClick={() => setFolio(r.id)} className="card p-5 text-left hover:shadow-pop"><div className="flex justify-between"><b>{r.room_type?.name}</b><Status value={r.status} /></div><div className="mt-2 text-lg">{date(r.check_in)} → {date(r.check_out)}</div><div className="text-sm text-muted">{nightsBetween(r.check_in, r.check_out)} nights · Room {r.room?.number || 'to be assigned'} · {r.number}</div><div className="mt-2 font-semibold">{money(r.total)}</div></button>)}</div>
      {!data.length && <Empty title="No bookings yet" icon="BedDouble" />}
      <FolioDrawer id={folio} onClose={() => setFolio(null)} />
    </div>
  );
}

export function MyOrders() {
  const { data, error } = useAsync<any>(() => api.action('myOrders'), []);
  const [print, setPrint] = useState<any>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const c = data.customer; const tiers = (data.tiers || []).slice().sort((a: any, b: any) => a.min_points - b.min_points);
  const tier = [...tiers].reverse().find((t: any) => (c?.loyalty_points || 0) >= t.min_points); const next = tiers.find((t: any) => t.min_points > (c?.loyalty_points || 0));
  const all = [...data.restaurant.map((o: any) => ({ ...o, kind: 'restaurant' })), ...data.shop.map((o: any) => ({ ...o, kind: 'shop' }))].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="My orders & rewards" icon="ShoppingBag" desc="Your restaurant and shop purchases, and your loyalty points." />
      <div className="card flex flex-wrap items-center gap-6 p-5"><div><div className="text-sm text-muted">Loyalty points</div><div className="text-3xl font-bold">{c?.loyalty_points || 0}</div></div><div><div className="text-sm text-muted">Member tier</div><div className="text-xl font-bold" style={{ color: tier?.color }}>{tier?.name || '—'}</div><div className="text-xs text-muted">{tier?.perks}</div></div>{next && <div className="min-w-[200px] flex-1"><div className="text-sm text-muted">{next.min_points - (c?.loyalty_points || 0)} points to {next.name}</div><div className="mt-2 h-2 rounded-full bg-paper"><div className="h-full rounded-full bg-saffron" style={{ width: Math.min(100, ((c?.loyalty_points || 0) / next.min_points) * 100) + '%' }} /></div></div>}</div>
      <DataTable rows={all} onRowClick={setPrint} cols={[{ key: 'number', label: 'Receipt', render: (r) => <b>{r.number}</b> }, { key: 'kind', label: 'Where', render: (r) => pretty(r.kind) }, { key: 'date', label: 'Date', render: (r) => dateTime(r.date) }, { key: 'total', label: 'Total', render: (r) => money(r.total) }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} empty={<Empty title="No orders yet" icon="ShoppingBag" />} />
      {print && <PrintModal open onClose={() => setPrint(null)} title="Receipt" narrow><ReceiptDoc kind={print.kind} sale={print} /></PrintModal>}
    </div>
  );
}
export { Clock, BedDouble, Tabs, Help };
