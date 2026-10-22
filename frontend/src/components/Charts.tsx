import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart } from 'recharts';
import { money, num } from '@/lib/format';
import { Card, Empty } from './ui';

export const PALETTE = ['#0F6E66', '#E8A33D', '#2F6FB0', '#8B5CF6', '#2F8F5B', '#C2413B', '#64748B', '#0891B2', '#DB2777', '#65A30D'];
export type ChartSpec = { title: string; type: 'area' | 'bar' | 'hbar' | 'line' | 'pie' | 'combo'; data: any[]; series?: { key: string; label: string; axis?: string }[]; fmt?: string; stacked?: boolean; span?: number; height?: number };

const tickStyle = { fontSize: 11, fill: 'rgb(var(--muted))' };
const fmtVal = (fmt?: string) => (v: any) => (fmt === 'money' ? money(v) : num(v));
const fmtAxis = (fmt?: string) => (v: any) => (fmt === 'money' ? money(v, { short: true }).replace(/^\S+ /, '') : num(v));
const TT = (fmt?: string) => ({ formatter: fmtVal(fmt), contentStyle: { borderRadius: 10, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))', fontSize: 12 }, labelStyle: { fontWeight: 600, color: 'rgb(var(--ink))' } });

export function Chart({ spec }: { spec: ChartSpec }) {
  const h = spec.height || (spec.type === 'hbar' ? Math.max(200, spec.data.length * 30 + 20) : 240);
  if (!spec.data?.length || spec.data.every((d) => Object.entries(d).every(([k, v]) => k === 'name' || !v))) return <Empty title="No data for this period" icon="BarChart3" />;
  const series = spec.series || [{ key: 'value', label: 'Value' }];
  if (spec.type === 'pie') {
    const total = spec.data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-[180px] w-full"><ResponsiveContainer><PieChart><Pie data={spec.data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none">{spec.data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Pie><Tooltip {...TT(spec.fmt)} /></PieChart></ResponsiveContainer></div>
        <ul className="w-full space-y-1.5 text-sm">
          {spec.data.slice(0, 8).map((d, i) => (
            <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="flex-1 truncate">{d.name}</span><span className="font-semibold">{spec.fmt === 'money' ? money(d.value, { short: true }) : num(d.value)}</span><span className="w-10 text-right text-xs text-muted">{total ? Math.round((d.value / total) * 100) : 0}%</span></li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer>
        {spec.type === 'area' ? (
          <AreaChart data={spec.data} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>{series.map((s, i) => <linearGradient key={s.key} id={'g' + s.key.replace(/\W/g, '')} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PALETTE[i]} stopOpacity={0.35} /><stop offset="100%" stopColor={PALETTE[i]} stopOpacity={0} /></linearGradient>)}</defs>
            <CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} minTickGap={16} /><YAxis tick={tickStyle} tickLine={false} axisLine={false} width={48} tickFormatter={fmtAxis(spec.fmt)} /><Tooltip {...TT(spec.fmt)} />
            {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[i]} strokeWidth={2} fill={`url(#g${s.key.replace(/\W/g, '')})`} />)}
          </AreaChart>
        ) : spec.type === 'line' ? (
          <LineChart data={spec.data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} /><YAxis tick={tickStyle} tickLine={false} axisLine={false} width={48} tickFormatter={fmtAxis(spec.fmt)} /><Tooltip {...TT(spec.fmt)} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[i]} strokeWidth={2.2} dot={false} />)}
          </LineChart>
        ) : spec.type === 'hbar' ? (
          <BarChart data={spec.data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={tickStyle} width={150} tickLine={false} axisLine={false} /><Tooltip {...TT(spec.fmt)} cursor={{ fill: 'rgb(var(--paper))' }} />
            {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={PALETTE[i]} radius={[0, 6, 6, 0]} barSize={16} />)}
          </BarChart>
        ) : spec.type === 'combo' ? (
          <ComposedChart data={spec.data} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} minTickGap={16} /><YAxis yAxisId="l" tick={tickStyle} tickLine={false} axisLine={false} width={48} tickFormatter={fmtAxis(spec.fmt)} /><YAxis yAxisId="r" orientation="right" tick={tickStyle} tickLine={false} axisLine={false} width={36} unit="%" /><Tooltip contentStyle={TT().contentStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (s.axis === 'right' ? <Line key={s.key} yAxisId="r" type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[1]} strokeWidth={2.2} dot={false} /> : <Bar key={s.key} yAxisId="l" dataKey={s.key} name={s.label} fill={PALETTE[i]} radius={[4, 4, 0, 0]} />))}
          </ComposedChart>
        ) : (
          <BarChart data={spec.data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} minTickGap={8} /><YAxis tick={tickStyle} tickLine={false} axisLine={false} width={48} tickFormatter={fmtAxis(spec.fmt)} /><Tooltip {...TT(spec.fmt)} cursor={{ fill: 'rgb(var(--paper))' }} />{series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} stackId={spec.stacked ? 'a' : undefined} fill={PALETTE[i]} radius={spec.stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) as any : [4, 4, 0, 0]} maxBarSize={36} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartCard({ spec, className = '' }: { spec: ChartSpec; className?: string }) {
  return <Card title={spec.title} className={`${spec.span === 2 ? 'lg:col-span-2' : ''} ${className}`}><Chart spec={spec} /></Card>;
}
