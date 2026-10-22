import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, Search, Download, Trash2, Star } from 'lucide-react';
import { Status, Empty } from './ui';
import { money, num, pct, date, dateTime, pretty } from '@/lib/format';

/** Render any field value nicely, by field type */
export function fmtValue(f: any, v: any, maps: Record<string, Record<string, string>> = {}): ReactNode {
  if (v === undefined || v === null || v === '') return <span className="text-muted">—</span>;
  switch (f.t) {
    case 'money': return <span className="font-medium tabular-nums">{money(v)}</span>;
    case 'number': return <span className="tabular-nums">{num(v)}</span>;
    case 'percent': return pct(v);
    case 'date': return date(v);
    case 'datetime': return dateTime(v);
    case 'bool': return v ? <span className="chip bg-ok/10 text-ok">Yes</span> : <span className="chip bg-muted/10 text-muted">No</span>;
    case 'select': return f.k === 'status' || f.k === 'stage' || /status|stage|priority|result|severity/.test(f.k) ? <Status value={v} /> : pretty(v);
    case 'multi': return (v || []).map(pretty).join(', ');
    case 'ref': return maps[f.ref]?.[v] ?? <span className="text-muted">—</span>;
    case 'refs': return (v || []).map((x: string) => maps[f.ref]?.[x]).filter(Boolean).join(', ') || <span className="text-muted">—</span>;
    case 'rating': return <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= v ? 'fill-saffron text-saffron' : 'text-line'}`} />)}</span>;
    case 'color': return <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded" style={{ background: v }} />{v}</span>;
    case 'items': return `${(v || []).length} item${(v || []).length === 1 ? '' : 's'}`;
    case 'url': return <a className="text-brand underline" href={v} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open</a>;
    case 'textarea': return <span className="line-clamp-2 whitespace-pre-line">{String(v)}</span>;
    default: return String(v);
  }
}
export const plainValue = (f: any, v: any, maps: any = {}) => {
  if (v === undefined || v === null) return '';
  if (f.t === 'ref') return maps[f.ref]?.[v] ?? '';
  if (f.t === 'refs') return (v || []).map((x: string) => maps[f.ref]?.[x]).join('; ');
  if (f.t === 'multi') return (v || []).join('; ');
  if (f.t === 'items') return (v || []).map((i: any) => `${i.qty}x ${i.name}`).join('; ');
  return String(v);
};

export type Col = { key: string; label: string; render?: (row: any) => ReactNode; sort?: (row: any) => any; className?: string; text?: (row: any) => string };

export function DataTable({ rows, cols, onRowClick, selectable, onBulkDelete, exportName, searchKeys, toolbar, pageSize = 25, empty }: {
  rows: any[]; cols: Col[]; onRowClick?: (r: any) => void; selectable?: boolean; onBulkDelete?: (ids: string[]) => void; exportName?: string; searchKeys?: (r: any) => string; toolbar?: ReactNode; pageSize?: number; empty?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  useEffect(() => setPage(0), [q, rows.length]);
  const filtered = useMemo(() => {
    let r = rows;
    if (q.trim()) { const s = q.toLowerCase(); r = r.filter((x) => (searchKeys ? searchKeys(x) : JSON.stringify(x)).toLowerCase().includes(s)); }
    if (sort) { const c = cols.find((c) => c.key === sort.key); const get = c?.sort || ((x: any) => x[sort.key]); r = [...r].sort((a, b) => { const A = get(a), B = get(b); return (A > B ? 1 : A < B ? -1 : 0) * sort.dir; }); }
    return r;
  }, [rows, q, sort, cols, searchKeys]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const exportCsv = () => {
    const head = cols.map((c) => c.label);
    const body = filtered.map((r) => cols.map((c) => (c.text ? c.text(r) : r[c.key] ?? '')));
    const csv = [head, ...body].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = (exportName || 'export') + '.csv'; a.click();
  };
  const allOnPage = view.length > 0 && view.every((r) => sel.has(r.id));
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search this list" /></div>
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {selectable && sel.size > 0 && onBulkDelete && <button className="btn-sm btn border border-bad/30 text-bad hover:bg-bad/5" onClick={() => { onBulkDelete([...sel]); setSel(new Set()); }}><Trash2 className="h-4 w-4" />Delete {sel.size}</button>}
          {exportName && <button className="btn-secondary btn-sm" onClick={exportCsv} title="Download as a spreadsheet (CSV)"><Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>}
        </div>
      </div>
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-paper/60"><tr>
            {selectable && <th className="w-10 px-3"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={() => { const n = new Set(sel); view.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id))); setSel(n); }} /></th>}
            {cols.map((c) => <th key={c.key} className={`th ${c.className || ''}`}><button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: (sort.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 })}>{c.label}<ArrowUpDown className="h-3 w-3 opacity-50" /></button></th>)}
          </tr></thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className={`border-t border-line ${onRowClick ? 'cursor-pointer hover:bg-brand-soft/40' : ''} ${sel.has(r.id) ? 'bg-brand-soft/50' : ''}`}>
                {selectable && <td className="px-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Select row" checked={sel.has(r.id)} onChange={() => { const n = new Set(sel); n.has(r.id) ? n.delete(r.id) : n.add(r.id); setSel(n); }} /></td>}
                {cols.map((c) => <td key={c.key} className={`td ${c.className || ''}`}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!view.length && (empty || <Empty title={q ? 'No matches' : 'Nothing here yet'} text={q ? `Nothing matches “${q}”. Try a shorter word.` : undefined} />)}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-sm text-muted">
          <span>{page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}</span>
          <div className="flex gap-1"><button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span className="px-2 py-1.5">Page {page + 1} of {pages}</span><button className="btn-ghost btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div>
        </div>
      )}
      {filtered.length <= pageSize && filtered.length > 0 && <div className="border-t border-line px-3 py-2 text-xs text-muted">{filtered.length} record{filtered.length === 1 ? '' : 's'}</div>}
    </div>
  );
}
