import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Hash, Plus, Trash2, ExternalLink, Save, Printer } from 'lucide-react';
import { ENTITIES } from '@shared/entities.js';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useMenu } from '@/components/Layout';
import { PageHeader, Spinner, ErrorBox, Kpi, Card, Avatar, Field, Modal, Empty, Icon, Status, Help } from '@/components/ui';
import { ChartCard } from '@/components/Charts';
import { MonthCalendar } from '../EntityPage';
import { DataTable } from '@/components/DataTable';
import { money, time, date, pretty } from '@/lib/format';
import { pathOf } from '@shared/modules.js';

// ------------------------------------------------------------------ CALENDAR (everything with a date)
const CAL_SOURCES: { col: string; field: string; label: string; color: string; title: (r: any, m: any) => string }[] = [
  { col: 'reservations', field: 'check_in', label: 'Hotel arrivals', color: '#2F6FB0', title: (r, m) => `Arrive: ${m.customers?.[r.guest_id] || r.number}` },
  { col: 'table_reservations', field: 'date', label: 'Table bookings', color: '#E8A33D', title: (r) => `${r.time} ${r.customer_name} (${r.guests})` },
  { col: 'events', field: 'date', label: 'Company events', color: '#8B5CF6', title: (r) => r.title },
  { col: 'holidays', field: 'date', label: 'Holidays', color: '#C2413B', title: (r) => r.name },
  { col: 'meetings', field: 'date', label: 'Meetings', color: '#0891B2', title: (r) => `${r.time || ''} ${r.title}` },
  { col: 'interviews', field: 'date', label: 'Interviews', color: '#DB2777', title: (r, m) => `Interview: ${m.candidates?.[r.candidate_id] || ''}` },
  { col: 'tasks', field: 'due', label: 'Tasks due', color: '#0F6E66', title: (r) => r.title },
  { col: 'leave_applications', field: 'start', label: 'Leave', color: '#64748B', title: (r, m) => `Leave: ${m.employees?.[r.employee_id] || ''}` },
  { col: 'activities', field: 'date', label: 'Sales follow-ups', color: '#65A30D', title: (r) => r.subject },
  { col: 'trainings', field: 'start', label: 'Trainings', color: '#B7791F', title: (r) => r.title },
];
export function CalendarPage() {
  const { can, hasModule } = useAuth();
  const allowed = CAL_SOURCES.filter((s) => can(s.col) && hasModule(ENTITIES[s.col].module));
  const [on, setOn] = useState<Record<string, boolean>>({});
  const { data, error } = useAsync<any[]>(async () => { const out: any[] = []; for (const s of allowed) { try { (await api.list(s.col)).forEach((r: any) => out.push({ ...r, _src: s.col })); } catch { /* not allowed */ } } return out; }, [allowed.map((a) => a.col).join()]);
  const { maps } = useLookups(['customers', 'employees', 'candidates']);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const vis = allowed.filter((s) => on[s.col] !== false);
  const rows = data.filter((r) => vis.some((s) => s.col === r._src)).map((r) => { const s = CAL_SOURCES.find((x) => x.col === r._src)!; return { ...r, _date: r[s.field] }; });
  return (
    <div className="anim-pop">
      <PageHeader title="Calendar" icon="CalendarDays" desc="Arrivals, bookings, meetings, interviews, leave and deadlines in one place. Switch sources on or off." />
      <div className="mb-3 flex flex-wrap gap-2">{allowed.map((s) => <button key={s.col} onClick={() => setOn({ ...on, [s.col]: on[s.col] === false })} className={`chip border px-2.5 py-1 ${on[s.col] === false ? 'border-line text-muted' : 'border-transparent text-white'}`} style={on[s.col] === false ? {} : { background: s.color }}>{s.label}</button>)}</div>
      <MonthCalendar rows={rows} field="_date" title={(r) => CAL_SOURCES.find((x) => x.col === r._src)!.title(r, maps)} colorOf={(r) => CAL_SOURCES.find((x) => x.col === r._src)!.color} />
    </div>
  );
}

// ------------------------------------------------------------------ MESSENGER
const CHANNELS = [['general', 'Everyone'], ['front-office', 'Front office'], ['kitchen', 'Kitchen & service'], ['store', 'Stores & purchasing'], ['management', 'Management']];
export function Messenger() {
  const [ch, setCh] = useState('general');
  const { data, error } = useAsync<any[]>(() => api.action('messages', { channel: ch }), [ch], { poll: 8000 });
  const { me } = useAuth(); const toast = useToast();
  const [text, setText] = useState(''); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [data?.length]);
  if (error) return <ErrorBox error={error} />;
  const send = async (e: React.FormEvent) => { e.preventDefault(); if (!text.trim()) return; try { await api.action('sendMessage', { channel: ch, text }); setText(''); } catch (err) { toast.err(err); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Messages" icon="MessagesSquare" desc="Team chat by department. Everyone in the business can read the channels." />
      <div className="card grid h-[70vh] overflow-hidden md:grid-cols-[220px_1fr]">
        <div className="hidden border-r border-line p-2 md:block">{CHANNELS.map(([k, l]) => <button key={k} onClick={() => setCh(k)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${ch === k ? 'bg-brand-soft font-semibold' : 'hover:bg-paper'}`}><Hash className="h-4 w-4 text-muted" />{l}</button>)}</div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3"><Hash className="h-4 w-4 text-muted" /><select className="bg-transparent font-semibold md:hidden" value={ch} onChange={(e) => setCh(e.target.value)}>{CHANNELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><span className="hidden font-semibold md:inline">{CHANNELS.find((c) => c[0] === ch)?.[1]}</span></div>
          <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
            {!data ? <Spinner /> : data.map((m) => { const mine = m.from === me?.user?.name; return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}><Avatar name={m.from} size="sm" /><div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-brand text-white' : 'bg-paper'}`}>{!mine && <div className="text-xs font-semibold">{m.from}</div>}{m.text}<div className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>{time(m.date)}</div></div></div>); })}
            {data && !data.length && <Empty title="No messages yet" text="Start the conversation." icon="MessagesSquare" />}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3"><input className="input" placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" /><button className="btn-primary" aria-label="Send"><Send className="h-4 w-4" /></button></form>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ REPORTS CENTRE
export function ReportsCentre() {
  const { data: r, error } = useAsync<any>(() => api.action('report', { name: 'overview' }), []);
  const menu = useMenu();
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  const reportPages = menu.flatMap((m: any) => m.items.filter((it: any) => /report|profit|balance|trial|ledger|tax|monitor|overview|levels/i.test(it.label) || /reports|dashboard/.test(it.page || '')).map((it: any) => ({ ...it, group: m.label, icon: it.icon || m.icon }))).filter((x: any) => x.page !== 'reports' && x.page !== 'dashboard');
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Reports centre" icon="BarChart3" desc="All your reports in one place, plus the business-wide picture for the last 30 days." actions={<button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Income (30d)" value={r.pl.income} fmt="money" /><Kpi label="Expenses (30d)" value={r.pl.expense} fmt="money" /><Kpi label="Net profit (30d)" value={r.pl.net} fmt="money" tone={r.pl.net >= 0 ? 'ok' : 'bad'} /><Kpi label="Profit margin" value={r.pl.income ? (r.pl.net / r.pl.income) * 100 : 0} fmt="percent" /></div>
      <ChartCard spec={{ title: 'Revenue by outlet — 30 days', type: 'bar', stacked: true, data: r.revenue, series: r.keys, fmt: 'money' }} />
      <h2 className="font-semibold">Open a detailed report</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{reportPages.map((p: any) => <Link key={pathOf(p)} to={pathOf(p)} className="card flex items-center gap-3 p-4 hover:shadow-pop"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Icon name={p.icon} /></span><span><span className="block text-sm font-semibold">{p.label}</span><span className="block text-xs text-muted">{p.group}</span></span></Link>)}</div>
      <Help>Every list in the system also has an <b>Export</b> button that downloads a spreadsheet of exactly what you see, including your search and filters.</Help>
    </div>
  );
}

// ------------------------------------------------------------------ FORM BUILDER
const FIELD_TYPES = [['text', 'Short answer'], ['textarea', 'Long answer'], ['email', 'Email'], ['number', 'Number'], ['date', 'Date'], ['rating', 'Star rating'], ['yesno', 'Yes / No']];
export function FormBuilder() {
  const forms = useList('forms'); const resp = useList('form_responses');
  const { me, can } = useAuth(); const toast = useToast();
  const [sel, setSel] = useState<any>(null);
  if (forms.error) return <ErrorBox error={forms.error} />;
  if (!forms.data) return <Spinner />;
  const parse = (f: any) => String(f.fields || '').split('\n').filter(Boolean).map((l) => { const i = l.lastIndexOf(':'); return { label: l.slice(0, i), type: l.slice(i + 1) }; });
  const open = (f: any) => setSel({ ...f, list: parse(f) });
  const save = async () => { const data = { name: sel.name, description: sel.description, status: sel.status, fields: sel.list.filter((x: any) => x.label).map((x: any) => `${x.label}:${x.type}`).join('\n') }; try { if (sel.id) await api.update('forms', sel.id, data); else { const r = await api.create('forms', { ...data, responses: 0 }); setSel({ ...sel, id: r.id }); } toast.ok('Form saved.'); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Form builder" icon="ClipboardList" desc="Make feedback forms, event enquiries or surveys. Share the link; answers appear in Form responses." actions={can('forms', 'c') && <button className="btn-primary" onClick={() => setSel({ name: 'New form', description: '', status: 'active', list: [{ label: 'Your name', type: 'text' }] })}><Plus className="h-4 w-4" />New form</button>} />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">{forms.data.map((f) => <button key={f.id} onClick={() => open(f)} className={`card block w-full p-4 text-left ${sel?.id === f.id ? 'ring-2 ring-brand' : ''}`}><div className="flex justify-between gap-2"><b className="text-sm">{f.name}</b><Status value={f.status} /></div><div className="text-xs text-muted">{parse(f).length} questions · {(resp.data || []).filter((r) => r.form_id === f.id).length} responses</div></button>)}</div>
        {sel ? <div className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Form name"><input className="input" value={sel.name} onChange={(e) => setSel({ ...sel, name: e.target.value })} /></Field><Field label="Status"><select className="input" value={sel.status} onChange={(e) => setSel({ ...sel, status: e.target.value })}><option value="active">Open — accepting answers</option><option value="closed">Closed</option></select></Field><div className="sm:col-span-2"><Field label="Intro text"><input className="input" value={sel.description} onChange={(e) => setSel({ ...sel, description: e.target.value })} /></Field></div></div>
          <div className="space-y-2"><div className="label">Questions</div>{sel.list.map((q: any, i: number) => <div key={i} className="flex gap-2"><input className="input" value={q.label} placeholder="Question" onChange={(e) => setSel({ ...sel, list: sel.list.map((x: any, j: number) => (j === i ? { ...x, label: e.target.value } : x)) })} /><select className="input w-44" value={q.type} onChange={(e) => setSel({ ...sel, list: sel.list.map((x: any, j: number) => (j === i ? { ...x, type: e.target.value } : x)) })}>{FIELD_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><button className="btn-ghost p-2 text-bad" onClick={() => setSel({ ...sel, list: sel.list.filter((_: any, j: number) => j !== i) })} aria-label="Remove question"><Trash2 className="h-4 w-4" /></button></div>)}<button className="btn-ghost btn-sm text-brand" onClick={() => setSel({ ...sel, list: [...sel.list, { label: '', type: 'text' }] })}><Plus className="h-4 w-4" />Add question</button></div>
          <div className="flex flex-wrap gap-2"><button className="btn-primary" onClick={save}><Save className="h-4 w-4" />Save form</button>{sel.id && <a className="btn-secondary" href={`/f/${me?.business?.slug}/${sel.id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open public link</a>}</div>
          {sel.id && <><h3 className="pt-2 font-semibold">Responses</h3><DataTable rows={(resp.data || []).filter((r) => r.form_id === sel.id)} exportName={'responses-' + sel.name} pageSize={8} cols={[{ key: 'submitted_by', label: 'From' }, { key: 'date', label: 'When', render: (r) => date(r.date) }, { key: 'answers', label: 'Answers', render: (r) => <span className="whitespace-pre-line text-xs">{r.answers}</span> }]} /></>}
        </div> : <Empty title="Choose a form or create a new one" icon="ClipboardList" />}
      </div>
    </div>
  );
}
export { money, pretty, Card, Modal };
