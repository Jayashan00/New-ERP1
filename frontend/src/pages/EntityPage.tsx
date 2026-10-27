import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Printer, Table2, Columns3, CalendarDays, ChevronLeft, ChevronRight, Filter, ExternalLink } from 'lucide-react';
import { ENTITIES } from '@shared/entities.js';
import { api } from '@/lib/api';
import { useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { DataTable, fmtValue, plainValue, Col } from '@/components/DataTable';
import { EntityForm, defaultsFor, validateClient, refCols } from '@/components/EntityForm';
import { PageHeader, Drawer, Spinner, ErrorBox, Tabs, Modal, Field, useConfirm, Status, Empty } from '@/components/ui';
import { PrintModal, InvoiceDoc, ReceiptDoc, KotDoc, PayslipDoc } from '@/components/Printable';
import { FolioDrawer } from '@/components/Folio';
import { money, pretty, today } from '@/lib/format';
import { MODULES } from '@shared/modules.js';

const iconFor = (key: string) => { for (const m of MODULES as any[]) if (m.items.some((i: any) => i.entity === key)) return m.icon; return 'Layers'; };
const DOC_TITLE: Record<string, string> = { proposals: 'Proposal', quotations: 'Quotation', sales_invoices: 'Tax invoice', sales_returns: 'Sales return', purchase_orders: 'Purchase order', grns: 'Goods received note', purchase_invoices: 'Supplier bill', purchase_returns: 'Purchase return' };

export default function EntityPage({ entityKey, embedded }: { entityKey?: string; embedded?: boolean }) {
  const params = useParams();
  const key = entityKey || params.entity!;
  const e = ENTITIES[key];
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { can, me } = useAuth();
  const toast = useToast(); const confirm = useConfirm();
  const list = useList(key);
  const { maps, lists } = useLookups(e ? refCols(key) : []);
  const [view, setView] = useState<string>(sp.get('view') === 'board' ? 'board' : sp.get('view') === 'calendar' ? 'calendar' : 'table');
  const [tab, setTab] = useState('all');
  const [filter, setFilter] = useState<{ k: string; v: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState<any>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [payDoc, setPayDoc] = useState<any>(null);
  const [ret, setRet] = useState<any>(null);

  useEffect(() => { setTab('all'); setFilter(null); setViewing(null); setEditing(null); setView(sp.get('view') === 'board' ? 'board' : 'table'); }, [key]);
  useEffect(() => { if (sp.get('new') === '1' && e && can(key, 'c')) { setEditing(defaultsFor(key)); setErrors({}); sp.delete('new'); setSp(sp, { replace: true }); } }, [sp, key]);

  if (!e) return <ErrorBox error={{ message: 'This screen does not exist.' }} />;
  if (!can(key)) return <ErrorBox error={{ status: 403 }} />;

  const rows = list.data || [];
  const statusField = e.status ? e.fields.find((f: any) => f.k === e.status) : null;
  const tabs = statusField ? [{ key: 'all', label: 'All', count: rows.length }, ...statusField.opts.map((o: string) => ({ key: o, label: pretty(o), count: rows.filter((r: any) => r[e.status] === o).length })).filter((t: any) => t.count > 0)] : null;
  const shown = rows.filter((r: any) => (tab === 'all' || r[e.status] === tab) && (!filter || String(Array.isArray(r[filter.k]) ? r[filter.k].join() : r[filter.k]) .includes(filter.v)));
  const filterable = e.fields.filter((f: any) => (f.t === 'select' || f.t === 'ref') && f.k !== e.status);
  const canC = can(key, 'c') && !e.readonly, canE = can(key, 'e') && !e.readonly, canD = can(key, 'd');

  const cols: Col[] = e.cols.map((k: string) => { const f = e.fields.find((x: any) => x.k === k); return { key: k, label: f.l, render: (r: any) => (k === e.title ? <span className="font-semibold">{fmtValue(f, r[k], maps)}</span> : fmtValue(f, r[k], maps)), sort: (r: any) => (f.t === 'ref' ? maps[f.ref]?.[r[k]] : r[k]) ?? '', text: (r: any) => plainValue(f, r[k], maps), className: ['money', 'number'].includes(f.t) ? 'text-right' : '' }; });

  const save = async () => {
    const errs = validateClient(key, editing); setErrors(errs);
    if (Object.keys(errs).length) { toast.err('Please fill in the highlighted fields.'); return; }
    setSaving(true);
    try { const r = editing.id ? await api.update(key, editing.id, editing) : await api.create(key, editing); toast.ok(`${e.singular} ${editing.id ? 'saved' : 'added'}.`); setEditing(null); if (viewing) setViewing(r); }
    catch (err) { toast.err(err); } finally { setSaving(false); }
  };
  const del = async (r: any) => { if (!(await confirm({ title: `Delete this ${e.singular.toLowerCase()}?`, text: 'This cannot be undone.', confirm: 'Delete', danger: true }))) return; try { await api.remove(key, r.id); toast.ok('Deleted.'); setViewing(null); } catch (err) { toast.err(err); } };
  const bulkDel = async (ids: string[]) => { if (!(await confirm({ title: `Delete ${ids.length} records?`, text: 'This cannot be undone.', confirm: 'Delete all', danger: true }))) return; let n = 0; for (const id of ids) { try { await api.remove(key, id); n++; } catch { /* skip */ } } toast.ok(`${n} deleted.`); };
  const act = async (name: string, payload: any, msg?: string) => { try { const r = await api.action(name, payload); toast.ok(r?.message || msg || 'Done.'); setViewing(null); return r; } catch (err) { toast.err(err); } };

  // ---------- record actions specific to some screens
  const extra = (r: any) => {
    const b: any[] = [];
    const btn = (label: string, fn: () => void, primary = false) => b.push(<button key={label} className={primary ? 'btn-primary' : 'btn-secondary'} onClick={fn}>{label}</button>);
    if (key === 'reservations') btn('Open guest folio', () => { setFolio(r.id); setViewing(null); }, true);
    if (DOC_TITLE[key]) btn('Print / PDF', () => setPrinting({ kind: 'doc', r }));
    if (key === 'sales_invoices' && r.status !== 'paid' && r.status !== 'draft' && can('customer_payments', 'c')) btn('Record payment', () => setPayDoc({ kind: 'invoice', r, amount: r.total - (r.paid || 0), method: 'Bank transfer' }), true);
    if (key === 'purchase_invoices' && r.status !== 'paid' && can('vendor_payments', 'c')) btn('Pay this bill', () => setPayDoc({ kind: 'bill', r, amount: r.total - (r.paid || 0), method: 'Bank transfer' }), true);
    if (['proposals', 'quotations'].includes(key) && !['converted', 'rejected', 'expired'].includes(r.status) && can('sales_invoices', 'c')) btn('Convert to invoice', () => act('convertToInvoice', { from: key, id: r.id }), true);
    if (key === 'purchase_orders' && !['received', 'cancelled', 'draft'].includes(r.status) && can('grns', 'c')) btn('Receive goods (GRN)', () => act('receivePO', { po_id: r.id }), true);
    if (key === 'leads' && !['won', 'lost'].includes(r.stage) && can('deals', 'c')) btn('Convert to deal', () => act('convertLead', { lead_id: r.id }), true);
    if (key === 'leave_applications' && r.status === 'pending' && canE && !me?.role?.self) { btn('Reject', () => act('decideLeave', { id: r.id, status: 'rejected' }, 'Leave rejected.')); btn('Approve', () => act('decideLeave', { id: r.id, status: 'approved' }, 'Leave approved.'), true); }
    if (key === 'bank_transfers' && r.status === 'pending') { btn('Reject', () => act('approveBankTransfer', { id: r.id, status: 'rejected' }, 'Rejected.')); btn('Approve & activate plan', () => act('approveBankTransfer', { id: r.id, status: 'approved' }, 'Approved — plan activated.'), true); }
    if (key === 'restaurant_orders') { btn('Print bill', () => setPrinting({ kind: 'receipt-r', r })); if (!['paid', 'cancelled'].includes(r.status) && canE) btn('Open in POS', () => nav('/app/restaurant-pos?order=' + r.id), true); }
    if (key === 'shop_sales') { btn('Print receipt', () => setPrinting({ kind: 'receipt-s', r })); if (['paid', 'partially_refunded'].includes(r.status) && can('shop_returns', 'c')) btn('Return an item', () => setRet({ sale: r, product_id: r.items[0]?.ref, quantity: 1, reason: 'Changed mind', type: 'refund' })); if (r.status === 'held') btn('Recall in POS', () => nav('/app/shop-pos?sale=' + r.id), true); }
    if (key === 'kots') btn('Print KOT', () => setPrinting({ kind: 'kot', r }));
    if (key === 'payslips') btn('Print payslip', () => setPrinting({ kind: 'payslip', r }));
    if (key === 'forms') btn('Open public form', () => window.open(`/f/${me?.business?.slug}/${r.id}`, '_blank'));
    if (key === 'housekeeping' && canE && r.status !== 'inspected') { const next = { pending: 'in_progress', in_progress: 'done', done: 'inspected' }[r.status as string]; if (next) btn(`Mark ${pretty(next).toLowerCase()}`, () => api.update(key, r.id, { status: next }).then(() => { toast.ok('Updated.'); setViewing(null); }), true); }
    if (key === 'meetings' && r.join_url) btn('Join meeting', () => window.open(r.join_url, '_blank'), true);
    return b;
  };

  const header = !embedded && (
    <PageHeader title={e.label} desc={e.desc} icon={iconFor(key)}
      help={<><p><b>How to use this page:</b> click any row to see full details{canE ? ', edit it' : ''}{canD ? ' or delete it' : ''}. Use the coloured tabs to filter by status, the search box to find anything, and <b>Export</b> to download a spreadsheet.</p>{e.kanban && <p className="mt-1">Switch to <b>Board</b> view to drag cards between stages.</p>}{e.calendar && <p className="mt-1">Switch to <b>Calendar</b> view to see records by date.</p>}</>}
      actions={<>
        {(e.kanban || e.calendar) && <div className="flex rounded-lg border border-line bg-surface p-0.5">
          <button className={`btn-sm btn ${view === 'table' ? 'bg-paper text-ink' : 'text-muted'}`} onClick={() => setView('table')}><Table2 className="h-4 w-4" />List</button>
          {e.kanban && <button className={`btn-sm btn ${view === 'board' ? 'bg-paper text-ink' : 'text-muted'}`} onClick={() => setView('board')}><Columns3 className="h-4 w-4" />Board</button>}
          {e.calendar && <button className={`btn-sm btn ${view === 'calendar' ? 'bg-paper text-ink' : 'text-muted'}`} onClick={() => setView('calendar')}><CalendarDays className="h-4 w-4" />Calendar</button>}
        </div>}
        {canC && <button className="btn-primary" onClick={() => { setEditing(defaultsFor(key)); setErrors({}); }}><Plus className="h-4 w-4" />Add {e.singular.toLowerCase()}</button>}
      </>} />
  );

  return (
    <div className="anim-pop">
      {header}
      {list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Spinner /> : (
        <>
          {tabs && tabs.length > 2 && view !== 'board' && <div className="mb-3"><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>}
          {view === 'table' && (
            <DataTable rows={shown} cols={cols} onRowClick={setViewing} selectable={canD} onBulkDelete={bulkDel} exportName={e.label.toLowerCase().replace(/\W+/g, '-')} searchKeys={(r) => e.fields.map((f: any) => plainValue(f, r[f.k], maps)).join(' ')}
              toolbar={filterable.length > 0 && <div className="flex items-center gap-1"><Filter className="h-4 w-4 text-muted" /><select className="input w-auto py-1.5" value={filter ? filter.k + '::' + filter.v : ''} onChange={(ev) => { const [k, v] = ev.target.value.split('::'); setFilter(k ? { k, v } : null); }} aria-label="Filter">
                <option value="">All records</option>
                {filterable.slice(0, 3).map((f: any) => <optgroup key={f.k} label={f.l}>{(f.t === 'select' ? f.opts.map((o: string) => [o, pretty(o)]) : (lists[f.ref] || []).slice(0, 40).map((o: any) => [o.id, o.label])).map(([v, l]: any) => <option key={v} value={f.k + '::' + v}>{l}</option>)}</optgroup>)}
              </select></div>}
              empty={<Empty title={`No ${e.label.toLowerCase()} yet`} text={e.desc} action={canC && <button className="btn-primary" onClick={() => setEditing(defaultsFor(key))}><Plus className="h-4 w-4" />Add the first one</button>} />} />
          )}
          {view === 'board' && e.kanban && <Board e={e} rows={shown} maps={maps} canE={canE} onOpen={setViewing} />}
          {view === 'calendar' && e.calendar && <MonthCalendar rows={shown} field={e.calendar} title={(r: any) => plainValue(e.fields.find((f: any) => f.k === e.title), r[e.title], maps)} onOpen={setViewing} />}
        </>
      )}

      {/* detail */}
      <Drawer open={!!viewing && !editing} onClose={() => setViewing(null)} title={viewing ? `${e.singular} · ${plainValue(e.fields.find((f: any) => f.k === e.title), viewing[e.title], maps) || viewing.number || ''}` : ''} wide={e.fields.some((f: any) => f.t === 'items')}
        footer={viewing && <>
          {canD && <button className="btn-ghost text-bad" onClick={() => del(viewing)}><Trash2 className="h-4 w-4" />Delete</button>}
          <div className="flex-1" />
          {extra(viewing)}
          {canE && <button className="btn-secondary" onClick={() => { setEditing({ ...viewing }); setErrors({}); }}><Pencil className="h-4 w-4" />Edit</button>}
        </>}>
        {viewing && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {e.fields.map((f: any) => f.t === 'items' ? (
              <div key={f.k} className="sm:col-span-2"><dt className="mb-1 text-xs font-medium text-muted">{f.l}</dt>
                <table className="w-full overflow-hidden rounded-lg border border-line text-sm"><thead className="bg-paper"><tr><th className="th">Item</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Total</th></tr></thead>
                  <tbody>{(viewing[f.k] || []).map((i: any, n: number) => <tr key={n} className="border-t border-line"><td className="td">{i.name}{i.note && <span className="block text-xs text-muted">{i.note}</span>}</td><td className="td text-right">{i.qty}</td><td className="td text-right">{money(i.price)}</td><td className="td text-right font-medium">{money(i.total ?? i.qty * i.price)}</td></tr>)}</tbody></table>
              </div>
            ) : (
              <div key={f.k} className={['textarea', 'multi', 'refs', 'image'].includes(f.t) ? 'sm:col-span-2' : ''}><dt className="text-xs font-medium text-muted">{f.l}</dt><dd className="mt-0.5 whitespace-pre-line text-sm">{f.t === 'image' && viewing[f.k] ? <img src={viewing[f.k]} alt="" className="max-h-64 w-full rounded-xl object-cover" /> : fmtValue(f, viewing[f.k], maps)}</dd></div>
            ))}
            {viewing.created_at && <div className="text-xs text-muted sm:col-span-2">Created {viewing.created_at.replace('T', ' ')}{viewing.updated_at ? ` · last changed ${viewing.updated_at.replace('T', ' ')}` : ''}</div>}
          </dl>
        )}
      </Drawer>

      {/* create / edit */}
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${e.singular.toLowerCase()}` : `Add ${e.singular.toLowerCase()}`} wide={e.fields.some((f: any) => f.t === 'items')}
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : editing?.id ? 'Save changes' : `Add ${e.singular.toLowerCase()}`}</button></>}>
        {editing && <><p className="mb-4 text-sm text-muted">Fields marked <span className="text-bad">*</span> are required.</p><EntityForm entity={key} value={editing} onChange={setEditing} errors={errors} /></>}
      </Drawer>

      <FolioDrawer id={folio} onClose={() => setFolio(null)} />

      <Modal open={!!payDoc} onClose={() => setPayDoc(null)} title={payDoc?.kind === 'invoice' ? `Record payment for ${payDoc?.r.number}` : `Pay ${payDoc?.r.number}`} footer={<><button className="btn-secondary" onClick={() => setPayDoc(null)}>Cancel</button><button className="btn-primary" onClick={async () => { if (await act(payDoc.kind === 'invoice' ? 'recordInvoicePayment' : 'payBill', payDoc.kind === 'invoice' ? { invoice_id: payDoc.r.id, amount: payDoc.amount, method: payDoc.method, account_id: payDoc.account_id } : { bill_id: payDoc.r.id, amount: payDoc.amount, method: payDoc.method, account_id: payDoc.account_id })) setPayDoc(null); }}>Save payment</button></>}>
        {payDoc && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" hint={`Still due: ${money(payDoc.r.total - (payDoc.r.paid || 0))}`}><input className="input" type="number" value={payDoc.amount} onChange={(ev) => setPayDoc({ ...payDoc, amount: ev.target.value })} /></Field>
          <Field label="Method"><select className="input" value={payDoc.method} onChange={(ev) => setPayDoc({ ...payDoc, method: ev.target.value })}>{['Bank transfer', 'Cash', 'Card', 'Cheque', 'Online'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <BankSelect value={payDoc.account_id} onChange={(v) => setPayDoc({ ...payDoc, account_id: v })} />
        </div>}
      </Modal>

      <Modal open={!!ret} onClose={() => setRet(null)} title={`Return from ${ret?.sale.number}`} footer={<><button className="btn-secondary" onClick={() => setRet(null)}>Cancel</button><button className="btn-primary" onClick={async () => { if (await act('shopReturn', { sale_id: ret.sale.id, product_id: ret.product_id, quantity: ret.quantity, reason: ret.reason, type: ret.type }, 'Return recorded.')) setRet(null); }}>Process return</button></>}>
        {ret && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product"><select className="input" value={ret.product_id} onChange={(ev) => setRet({ ...ret, product_id: ev.target.value })}>{ret.sale.items.map((i: any) => <option key={i.ref} value={i.ref}>{i.name} (bought {i.qty})</option>)}</select></Field>
          <Field label="Quantity"><input className="input" type="number" min={1} value={ret.quantity} onChange={(ev) => setRet({ ...ret, quantity: ev.target.value })} /></Field>
          <Field label="Reason" hint="Damaged and expired items are not put back into stock."><select className="input" value={ret.reason} onChange={(ev) => setRet({ ...ret, reason: ev.target.value })}>{['Changed mind', 'Damaged', 'Wrong item', 'Size issue', 'Expired'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Give back as"><select className="input" value={ret.type} onChange={(ev) => setRet({ ...ret, type: ev.target.value })}><option value="refund">Cash / card refund</option><option value="exchange">Exchange</option><option value="store_credit">Store credit</option></select></Field>
        </div>}
      </Modal>

      {printing && (
        <PrintModal open onClose={() => setPrinting(null)} title="Print preview" narrow={printing.kind !== 'doc' && printing.kind !== 'payslip'}>
          {printing.kind === 'doc' && <InvoiceDoc doc={printing.r} title={DOC_TITLE[key]} party={maps.customers?.[printing.r.customer_id] || maps.vendors?.[printing.r.vendor_id] || maps.sales_invoices?.[printing.r.invoice_id] || maps.purchase_invoices?.[printing.r.invoice_id]} />}
          {printing.kind === 'receipt-r' && <ReceiptDoc kind="restaurant" sale={printing.r} party={maps.customers?.[printing.r.customer_id]} tableName={maps.tables?.[printing.r.table_id]} />}
          {printing.kind === 'receipt-s' && <ReceiptDoc kind="shop" sale={printing.r} party={maps.customers?.[printing.r.customer_id]} />}
          {printing.kind === 'kot' && <KotDoc kot={printing.r} />}
          {printing.kind === 'payslip' && <PayslipDoc slip={printing.r} employee={maps.employees?.[printing.r.employee_id]} />}
        </PrintModal>
      )}
    </div>
  );
}

function BankSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lists } = useLookups(['bank_accounts']);
  return <Field label="Bank account" hint="The balance of this account is updated."><select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}><option value="">— Not linked —</option>{(lists.bank_accounts || []).map((b: any) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></Field>;
}

function Board({ e, rows, maps, canE, onOpen }: any) {
  const f = e.fields.find((x: any) => x.k === e.kanban);
  const toast = useToast();
  const [drag, setDrag] = useState<string | null>(null);
  const move = async (id: string, v: string) => { try { await api.update(e.key, id, { [e.kanban]: v }); toast.ok(`Moved to ${pretty(v)}.`); } catch (err) { toast.err(err); } };
  const titleF = e.fields.find((x: any) => x.k === e.title);
  const sub = e.fields.find((x: any) => ['money'].includes(x.t)) || e.fields.find((x: any) => x.t === 'ref' && x.k !== e.title);
  return (
    <div className="thin-scroll flex gap-3 overflow-x-auto pb-3">
      {f.opts.map((o: string) => {
        const col = rows.filter((r: any) => r[e.kanban] === o);
        return (
          <div key={o} className={`w-72 shrink-0 rounded-xl bg-surface/60 p-2 shadow-card ${drag ? 'ring-1 ring-dashed ring-brand/30' : ''}`} onDragOver={(ev) => ev.preventDefault()} onDrop={() => { if (drag) move(drag, o); setDrag(null); }}>
            <div className="mb-2 flex items-center justify-between px-1.5 py-1"><Status value={o} /><span className="text-xs font-semibold text-muted">{col.length}</span></div>
            <div className="space-y-2">
              {col.map((r: any) => (
                <div key={r.id} draggable={canE} onDragStart={() => setDrag(r.id)} onDragEnd={() => setDrag(null)} onClick={() => onOpen(r)} className="cursor-pointer rounded-lg border border-line bg-surface p-3 text-sm shadow-sm hover:border-brand/50">
                  <div className="font-semibold">{plainValue(titleF, r[e.title], maps)}</div>
                  {sub && r[sub.k] !== undefined && <div className="mt-1 text-xs text-muted">{fmtValue(sub, r[sub.k], maps)}</div>}
                  {canE && <select className="mt-2 w-full rounded border border-line bg-paper px-1.5 py-1 text-xs md:hidden" value={o} onClick={(ev) => ev.stopPropagation()} onChange={(ev) => move(r.id, ev.target.value)} aria-label="Move to">{f.opts.map((x: string) => <option key={x} value={x}>{pretty(x)}</option>)}</select>}
                </div>
              ))}
              {!col.length && <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">Drop cards here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthCalendar({ rows, field, title, onOpen, colorOf }: { rows: any[]; field: string; title: (r: any) => string; onOpen?: (r: any) => void; colorOf?: (r: any) => string }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days = useMemo(() => { const start = new Date(cur); start.setDate(1 - ((cur.getDay() + 6) % 7)); return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; }); }, [cur]);
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const t = today();
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <button className="btn-ghost btn-sm" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex items-center gap-2 font-semibold">{cur.toLocaleDateString('en', { month: 'long', year: 'numeric' })}<button className="btn-ghost btn-sm" onClick={() => { const d = new Date(); setCur(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</button></div>
        <button className="btn-ghost btn-sm" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-paper/60 text-center text-xs font-semibold text-muted">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-2">{d}</div>)}</div>
      <div className="grid grid-cols-7">
        {days.map((d) => { const k = key(d); const items = rows.filter((r) => String(r[field] || '').slice(0, 10) === k); const out = d.getMonth() !== cur.getMonth(); return (
          <div key={k} className={`min-h-[96px] border-b border-r border-line p-1.5 ${out ? 'bg-paper/50 text-muted' : ''}`}>
            <div className={`mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${k === t ? 'bg-brand text-white' : ''}`}>{d.getDate()}</div>
            <div className="space-y-1">{items.slice(0, 3).map((r) => <button key={r.id} onClick={() => onOpen?.(r)} className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white" style={{ background: colorOf?.(r) || 'rgb(var(--brand))' }}>{title(r)}</button>)}{items.length > 3 && <div className="text-[11px] text-muted">+{items.length - 3} more</div>}</div>
          </div>); })}
      </div>
    </div>
  );
}
export { ExternalLink, Printer };
