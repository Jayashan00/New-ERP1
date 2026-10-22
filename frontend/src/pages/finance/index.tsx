import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync, useList } from '@/lib/hooks';
import { PageHeader, Spinner, ErrorBox, Kpi, Card, Status, Help } from '@/components/ui';
import { ChartCard } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { money, date } from '@/lib/format';
import { useAuth } from '@/lib/auth';

const PrintBtn = () => <button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / PDF</button>;
const useReport = (name: string, opts: any = {}) => useAsync<any>(() => api.action('report', { name, ...opts }), [name, JSON.stringify(opts)]);

function Statement({ title, sub, sections, footer }: { title: string; sub: string; sections: { title: string; lines: { name: string; amount: number }[]; total: number; label: string }[]; footer?: { label: string; amount: number; good?: boolean } }) {
  const { me } = useAuth();
  return (
    <div className="print-area card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 text-center"><div className="text-sm text-muted">{me?.settings?.brand_name}</div><h2 className="text-xl font-bold">{title}</h2><div className="text-sm text-muted">{sub}</div></div>
      {sections.map((s) => (
        <div key={s.title} className="mb-6">
          <h3 className="mb-2 border-b-2 border-ink pb-1 text-sm font-bold">{s.title}</h3>
          {s.lines.map((l) => <div key={l.name} className="flex justify-between border-b border-line py-1.5 text-sm"><span>{l.name}</span><span className={`tabular-nums ${l.amount < 0 ? 'text-bad' : ''}`}>{money(l.amount)}</span></div>)}
          {!s.lines.length && <div className="py-2 text-sm text-muted">Nothing recorded.</div>}
          <div className="flex justify-between py-2 text-sm font-bold"><span>{s.label}</span><span className="tabular-nums">{money(s.total)}</span></div>
        </div>
      ))}
      {footer && <div className={`flex justify-between rounded-lg px-4 py-3 text-lg font-bold ${footer.good === false ? 'bg-bad/10 text-bad' : 'bg-ok/10 text-ok'}`}><span>{footer.label}</span><span>{money(footer.amount)}</span></div>}
    </div>
  );
}

export function ProfitLoss() {
  const [period, setPeriod] = useState('month');
  const { data: r, error } = useReport('profit-loss', { period });
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop">
      <PageHeader title="Profit & loss" icon="TrendingUp" desc="Everything you earned minus everything you spent, for the period you choose." actions={<><select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period"><option value="month">Last 30 days</option><option value="quarter">Last 90 days</option><option value="year">Last 12 months</option><option value="all">All time</option></select><PrintBtn /></>} help="Income comes from room charges, restaurant and shop sales, invoices and other revenue. Expenses include supplier bills, recorded expenses and paid salaries. Amounts exclude VAT." />
      {!r ? <Spinner /> : <>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Income" value={r.income} fmt="money" /><Kpi label="Expenses" value={r.expense} fmt="money" /><Kpi label="Gross profit" value={r.gross} fmt="money" /><Kpi label="Net profit" value={r.net} fmt="money" tone={r.net >= 0 ? 'ok' : 'bad'} /></div>
        <Statement title="Profit & loss statement" sub={`${date(r.from === '0000' ? '' : r.from)} — ${date(r.to === '9999' ? new Date().toISOString() : r.to)}`} sections={[{ title: 'Income', lines: r.incomeLines, total: r.income, label: 'Total income' }, { title: 'Expenses', lines: r.expenseLines, total: r.expense, label: 'Total expenses' }]} footer={{ label: r.net >= 0 ? 'Net profit' : 'Net loss', amount: r.net, good: r.net >= 0 }} />
      </>}
    </div>
  );
}

export function BalanceSheet() {
  const { data: r, error } = useReport('balance-sheet');
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop">
      <PageHeader title="Balance sheet" icon="FileSpreadsheet" desc="What the business owns, what it owes, and the owner’s share — as of today." actions={<PrintBtn />} />
      {!r ? <Spinner /> : <>
        <div className="mb-4 grid grid-cols-3 gap-3"><Kpi label="Assets" value={r.totalAssets} fmt="money" /><Kpi label="Liabilities" value={r.totalLiabilities} fmt="money" /><Kpi label="Equity" value={r.totalEquity} fmt="money" /></div>
        <Statement title="Balance sheet" sub={`As of ${date(r.asOf)}`} sections={[{ title: 'Assets', lines: r.assets, total: r.totalAssets, label: 'Total assets' }, { title: 'Liabilities', lines: r.liabilities, total: r.totalLiabilities, label: 'Total liabilities' }, { title: 'Equity', lines: r.equity, total: r.totalEquity, label: 'Total equity' }]} footer={{ label: 'Liabilities + equity', amount: r.totalLiabilities + r.totalEquity }} />
      </>}
    </div>
  );
}

export function TrialBalance() {
  const { data: r, error } = useReport('trial-balance');
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop">
      <PageHeader title="Trial balance" icon="Scale" desc="Every account’s debit or credit balance. Both columns must be equal." actions={<PrintBtn />} />
      {!r ? <Spinner /> : <div className="print-area card mx-auto max-w-4xl overflow-hidden"><table className="w-full text-sm"><thead className="bg-paper"><tr><th className="th">Account</th><th className="th">Type</th><th className="th text-right">Debit</th><th className="th text-right">Credit</th></tr></thead><tbody>
        {r.rows.map((x: any) => <tr key={x.account} className="border-t border-line"><td className="td">{x.account}</td><td className="td text-muted">{x.type}</td><td className="td text-right tabular-nums">{x.debit ? money(x.debit) : ''}</td><td className="td text-right tabular-nums">{x.credit ? money(x.credit) : ''}</td></tr>)}
        <tr className="border-t-2 border-ink font-bold"><td className="td" colSpan={2}>Total</td><td className="td text-right">{money(r.totalDebit)}</td><td className="td text-right">{money(r.totalCredit)}</td></tr>
      </tbody></table><div className="bg-ok/10 px-4 py-2 text-center text-sm font-semibold text-ok">Balanced ✓</div></div>}
    </div>
  );
}

export function Ledger() {
  const { data: r, error } = useReport('ledger');
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Ledger summary" icon="BookOpen" desc="Account balances from journal entries, and every posting." actions={<><Link to="/app/e/journal_entries?new=1" className="btn-primary">New journal entry</Link><PrintBtn /></>} />
      {!r ? <Spinner /> : <>
        <DataTable rows={r.accounts} exportName="ledger" cols={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Account', render: (x) => <b>{x.name}</b> }, { key: 'type', label: 'Type' }, { key: 'debit', label: 'Debits', render: (x) => money(x.debit), className: 'text-right' }, { key: 'credit', label: 'Credits', render: (x) => money(x.credit), className: 'text-right' }, { key: 'balance', label: 'Balance', render: (x) => <b>{money(x.balance)}</b>, className: 'text-right' }]} />
        <h2 className="font-semibold">Journal postings</h2>
        <DataTable rows={r.entries} exportName="journal" cols={[{ key: 'number', label: 'Entry' }, { key: 'date', label: 'Date', render: (x) => date(x.date) }, { key: 'debit', label: 'Debit account' }, { key: 'credit', label: 'Credit account' }, { key: 'amount', label: 'Amount', render: (x) => money(x.amount), className: 'text-right' }, { key: 'memo', label: 'Memo' }]} />
      </>}
    </div>
  );
}

export function TaxReport() {
  const { data: r, error } = useReport('tax');
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Tax report (VAT)" icon="Percent" desc="VAT you collected on sales minus VAT you paid on purchases, month by month." actions={<PrintBtn />} />
      {!r ? <Spinner /> : <>
        <ChartCard spec={{ title: 'VAT collected vs paid', type: 'bar', data: r.months.map((m: any) => ({ name: m.month, Collected: m.output, Paid: m.input })), series: [{ key: 'Collected', label: 'Collected (output)' }, { key: 'Paid', label: 'Paid (input)' }], fmt: 'money' }} />
        <div className="print-area card overflow-hidden"><table className="w-full text-sm"><thead className="bg-paper"><tr><th className="th">Month</th><th className="th text-right">VAT collected</th><th className="th text-right">VAT paid</th><th className="th text-right">Payable</th></tr></thead><tbody>{r.months.map((m: any) => <tr key={m.month} className="border-t border-line"><td className="td font-medium">{m.month}</td><td className="td text-right">{money(m.output)}</td><td className="td text-right">{money(m.input)}</td><td className="td text-right font-bold">{money(m.payable)}</td></tr>)}</tbody></table></div>
        <Help>Rates come from Administration → Taxes and Business settings. Check figures with your tax adviser before filing.</Help>
      </>}
    </div>
  );
}

export function BudgetMonitor() {
  const { data: r, error } = useReport('budget');
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Budget monitoring" icon="Gauge" desc="Planned versus actual for every budget. Red bars are over budget." actions={<Link to="/app/e/budgets?new=1" className="btn-primary">New budget</Link>} />
      {!r ? <Spinner /> : <div className="grid gap-3 md:grid-cols-2">{r.budgets.map((b: any) => (
        <div key={b.id} className="card p-4">
          <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{b.name}</div><div className="text-xs text-muted">{b.department || '—'} · {b.category}</div></div><Status value={b.used > 100 ? 'overdue' : b.used > 85 ? 'at_risk' : 'on_track'} label={b.used > 100 ? 'Over budget' : b.used > 85 ? 'Close to limit' : 'On track'} /></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-paper"><div className={`h-full rounded-full ${b.used > 100 ? 'bg-bad' : b.used > 85 ? 'bg-saffron' : 'bg-brand'}`} style={{ width: Math.min(100, b.used) + '%' }} /></div>
          <div className="mt-2 flex justify-between text-sm"><span>{money(b.actual)} spent</span><span className="text-muted">of {money(b.planned)} · {b.used}%</span></div>
        </div>))}</div>}
    </div>
  );
}

export function AccountingDashboard() {
  const pl = useReport('profit-loss', { period: 'month' }); const bs = useReport('balance-sheet');
  const inv = useList('sales_invoices', { optional: true }); const bills = useList('purchase_invoices', { optional: true }); const banks = useList('bank_accounts', { optional: true });
  if (pl.error) return <ErrorBox error={pl.error} />;
  if (!pl.data || !bs.data) return <Spinner />;
  const due = (inv.data || []).filter((i) => !['paid', 'draft'].includes(i.status));
  const owe = (bills.data || []).filter((i) => !['paid', 'draft'].includes(i.status));
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Finance overview" icon="TrendingUp" desc="Cash, what customers owe you, what you owe suppliers, and profit for the last 30 days." actions={<><Link to="/app/e/sales_invoices?new=1" className="btn-primary">New invoice</Link><Link to="/app/e/expenses?new=1" className="btn-secondary">Record expense</Link></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Cash & bank" value={(banks.data || []).reduce((s, b) => s + (b.balance || 0), 0)} fmt="money" />
        <Kpi label="Customers owe you" value={due.reduce((s, i) => s + i.total - (i.paid || 0), 0)} fmt="money" hint={`${due.length} invoices`} />
        <Kpi label="You owe suppliers" value={owe.reduce((s, i) => s + i.total - (i.paid || 0), 0)} fmt="money" hint={`${owe.length} bills`} />
        <Kpi label="Income (30d)" value={pl.data.income} fmt="money" />
        <Kpi label="Net profit (30d)" value={pl.data.net} fmt="money" tone={pl.data.net >= 0 ? 'ok' : 'bad'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Income by source (30d)', type: 'pie', data: pl.data.incomeLines.filter((l: any) => l.amount > 0).map((l: any) => ({ name: l.name, value: Math.round(l.amount) })), fmt: 'money' }} />
        <ChartCard spec={{ title: 'Expenses by category (30d)', type: 'pie', data: pl.data.expenseLines.map((l: any) => ({ name: l.name, value: Math.round(l.amount) })), fmt: 'money' }} />
        <Card title="Bank accounts" pad={false}>{(banks.data || []).map((b) => <div key={b.id} className="flex justify-between border-t border-line px-4 py-2.5 text-sm first:border-0"><span><b>{b.name}</b><span className="block text-xs text-muted">{b.bank} · {b.number}</span></span><b className="tabular-nums">{money(b.balance)}</b></div>)}</Card>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[['Profit & loss', '/app/profit-loss'], ['Balance sheet', '/app/balance-sheet'], ['Trial balance', '/app/trial-balance'], ['Ledger', '/app/ledger'], ['Tax report', '/app/tax-report']].map(([l, to]) => <Link key={to} to={to} className="card p-4 text-sm font-semibold hover:shadow-pop">{l} →</Link>)}</div>
    </div>
  );
}
