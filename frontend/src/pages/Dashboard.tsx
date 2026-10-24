import { Link } from 'react-router-dom';
import { AlertTriangle, Info, XCircle, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { Kpi, Spinner, ErrorBox, Icon, Status, Card } from '@/components/ui';
import { ChartCard } from '@/components/Charts';
import { money, date, dateTime } from '@/lib/format';

export function Cell({ v }: { v: any }) {
  if (v && typeof v === 'object') {
    if ('status' in v) return <Status value={v.status} />;
    if ('money' in v) return <span className="font-medium tabular-nums">{money(v.money)}</span>;
    if ('date' in v) return <>{date(v.date)}</>;
    if ('datetime' in v) return <>{dateTime(v.datetime)}</>;
  }
  return <>{v ?? '—'}</>;
}

export function ListCard({ l }: { l: any }) {
  return (
    <Card title={l.title} pad={false} actions={l.link && <Link to={l.link} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">Open<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
      {l.rows.length ? (
        <div className="thin-scroll max-h-[340px] overflow-auto">
          <table className="w-full text-sm"><thead className="sticky top-0 bg-surface"><tr>{l.columns.map((c: string) => <th key={c} className="th">{c}</th>)}</tr></thead>
            <tbody>{l.rows.map((r: any[], i: number) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`td ${j === 0 ? 'font-medium' : ''}`}><Cell v={c} /></td>)}</tr>)}</tbody></table>
        </div>
      ) : <p className="px-4 py-8 text-center text-sm text-muted">{l.empty || 'Nothing to show.'}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const { me } = useAuth();
  const { data: d, error, loading, reload } = useAsync<any>(() => api.action('dashboard'), [me?.business?.id, me?.user?.id], { poll: 30000 });
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading || !d) return <Spinner label="Preparing your dashboard…" />;
  const toneIcon = { warn: AlertTriangle, bad: XCircle, info: Info } as any;
  return (
    <div className="anim-pop space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-side px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-saffron/20 blur-2xl" aria-hidden />
        <div className="relative">
          <div className="text-sm text-side-text">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {me?.role?.name}</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{d.hello}</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-side-text sm:text-base">{d.summary}</p>
        </div>
      </section>

      {d.actions?.length > 0 && (
        <section aria-labelledby="todo-title">
          <h2 id="todo-title" className="mb-3 text-lg font-bold">What would you like to do?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {d.actions.map((a: any, i: number) => (
              <Link key={a.label} to={a.to} className={`group flex min-h-[112px] flex-col justify-between rounded-2xl border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-pop ${i === 0 ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:border-brand'}`}>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${i === 0 ? 'bg-white/15' : 'bg-brand-soft text-brand'}`}><Icon name={a.icon} className="h-6 w-6" /></span>
                <span className="mt-3 text-base font-bold leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {d.alerts?.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {d.alerts.map((a: any, i: number) => { const I = toneIcon[a.tone] || Info; return (
            <Link key={i} to={a.to} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium hover:shadow-card ${a.tone === 'bad' ? 'border-bad/30 bg-bad/5' : a.tone === 'warn' ? 'border-saffron/40 bg-saffron-soft' : 'border-info/25 bg-info/5'}`}>
              <I className={`h-4 w-4 shrink-0 ${a.tone === 'bad' ? 'text-bad' : a.tone === 'warn' ? 'text-warn' : 'text-info'}`} /><span className="flex-1">{a.text}</span><ArrowUpRight className="h-4 w-4 text-muted" />
            </Link>); })}
        </div>
      )}

      {d.kpis?.length > 0 && <div className={`grid grid-cols-2 gap-3 ${d.kpis.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} ${d.kpis.length === 6 ? 'xl:grid-cols-6' : ''}`}>{d.kpis.map((k: any) => <Kpi key={k.label} {...k} />)}</div>}

      {d.charts?.length > 0 && <div className="grid gap-4 lg:grid-cols-3">{d.charts.map((c: any) => <ChartCard key={c.title} spec={c} />)}</div>}

      {d.lists?.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{d.lists.map((l: any) => <ListCard key={l.title} l={l} />)}</div>}
    </div>
  );
}
