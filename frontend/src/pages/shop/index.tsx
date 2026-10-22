import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Minus, Plus, ScanBarcode, Trash2, PauseCircle, CreditCard, Printer, ShoppingCart, Search, PackagePlus } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Modal, Field, Tabs, Kpi, Card, Status, Empty, Help } from '@/components/ui';
import { PrintModal, ReceiptDoc } from '@/components/Printable';
import { ChartCard } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { PublicLinkCard } from '../hotel';
import { money, date, pretty, num } from '@/lib/format';

// ------------------------------------------------------------------ SHOP POS
export function ShopPOS() {
  const [sp] = useSearchParams();
  const prods = useList('products'); const cats = useList('product_categories', { optional: true }); const sales = useList('shop_sales', { optional: true });
  const { maps, lists } = useLookups(['customers']);
  const toast = useToast();
  const [cart, setCart] = useState<any[]>([]);
  const [scan, setScan] = useState(''); const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  const [customer, setCustomer] = useState(''); const [discount, setDiscount] = useState<any>(0);
  const [heldId, setHeldId] = useState(sp.get('sale') || '');
  const [checkout, setCheckout] = useState(false); const [receipt, setReceipt] = useState<any>(null);
  const [pay, setPay] = useState<any>({ method: 'Cash', tendered: '', gift: '' });
  const scanRef = useRef<HTMLInputElement>(null);
  useEffect(() => { scanRef.current?.focus(); }, [checkout, receipt]);
  useEffect(() => { if (heldId && sales.data) { const s = sales.data.find((x) => x.id === heldId); if (s) { setCart(s.items.map((i: any) => ({ ...i }))); setCustomer(s.customer_id || ''); } } }, [heldId, sales.data?.length]);
  if (prods.error) return <ErrorBox error={prods.error} />;
  if (!prods.data || !cats.data) return <Spinner />;
  const add = (p: any) => { if (p.stock <= 0) toast.info(`${p.name} shows 0 in stock.`); const i = cart.findIndex((c) => c.ref === p.id); if (i >= 0) setCart(cart.map((c, j) => (j === i ? { ...c, qty: c.qty + 1 } : c))); else setCart([...cart, { ref: p.id, name: p.name, price: p.price, qty: 1, discount: 0, stock: p.stock, unit: p.unit }]); };
  const onScan = (e: React.FormEvent) => { e.preventDefault(); const s = scan.trim(); if (!s) return; const p = prods.data!.find((x) => x.barcode === s || x.sku.toLowerCase() === s.toLowerCase()) || prods.data!.find((x) => x.name.toLowerCase().includes(s.toLowerCase())); if (p) { add(p); setScan(''); } else toast.err(`No product with barcode or name “${s}”.`); };
  const setQty = (i: number, v: number) => setCart(cart.map((c, j) => (j === i ? { ...c, qty: v } : c)).filter((c) => c.qty > 0));
  const sub = cart.reduce((s, c) => s + c.qty * c.price - (Number(c.discount) || 0), 0);
  const total = Math.max(0, sub - (Number(discount) || 0));
  const change = Number(pay.tendered) - total;
  const held = (sales.data || []).filter((s) => s.status === 'held');
  const reset = () => { setCart([]); setCustomer(''); setDiscount(0); setHeldId(''); setPay({ method: 'Cash', tendered: '', gift: '' }); };
  const finish = async (status = 'paid') => {
    try {
      const r = await api.action('shopCheckout', { items: cart, customer_id: customer || undefined, discount, payment_method: pay.method, tendered: pay.tendered, gift_card_code: pay.method === 'Gift card' ? pay.gift : undefined, status, sale_id: heldId || undefined });
      if (status === 'held') { toast.ok(`Sale ${r.number} put on hold.`); reset(); return; }
      toast.ok(`${r.number} paid — ${money(r.total)}`); setCheckout(false); setReceipt(r); reset();
    } catch (e) { toast.err(e); }
  };
  const shown = prods.data.filter((p) => p.status === 'active' && (cat === 'all' || p.category_id === cat) && (!q || (p.name + p.sku + p.barcode).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="anim-pop -mx-3 -my-5 flex h-[calc(100vh-64px)] flex-col sm:-mx-6 sm:-my-6 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="space-y-2 border-b border-line bg-surface p-3">
          <form onSubmit={onScan} className="flex gap-2">
            <div className="relative flex-1"><ScanBarcode className="absolute left-3 top-2.5 h-5 w-5 text-brand" /><input ref={scanRef} className="input h-11 pl-11 text-base" placeholder="Scan a barcode or type the product name, then press Enter" value={scan} onChange={(e) => setScan(e.target.value)} aria-label="Barcode" /></div>
            <button className="btn-primary">Add</button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Filter products…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {held.length > 0 && <select className="input w-auto" value="" onChange={(e) => setHeldId(e.target.value)} aria-label="Recall held sale"><option value="">Held sales ({held.length})</option>{held.map((h) => <option key={h.id} value={h.id}>{h.number} · {money(h.total)}</option>)}</select>}
          </div>
          <div className="thin-scroll flex gap-1.5 overflow-x-auto pb-1">{[{ id: 'all', name: 'All', icon: '🛍️' }, ...cats.data].map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`btn-sm btn shrink-0 rounded-full border ${cat === c.id ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'}`}>{c.icon} {c.name}</button>)}</div>
        </div>
        <div className="thin-scroll grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {shown.map((p) => (
            <button key={p.id} onClick={() => add(p)} className="rounded-xl border border-line bg-surface p-3 text-left shadow-sm hover:border-brand active:scale-[0.98]">
              <div className="flex items-start justify-between"><span className="text-2xl">{p.icon || '📦'}</span><span className={`chip text-[10px] ${p.stock <= 0 ? 'bg-bad/10 text-bad' : p.stock <= p.reorder ? 'bg-saffron/15 text-warn' : 'bg-paper text-muted'}`}>{num(p.stock)} {p.unit}</span></div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold leading-tight">{p.name}</div>
              <div className="mt-1 text-sm font-bold text-brand">{money(p.price)}</div>
            </button>
          ))}
          {!shown.length && <div className="col-span-full"><Empty title="No products found" icon="Package" /></div>}
        </div>
      </div>
      <aside className="flex max-h-[55vh] w-full shrink-0 flex-col border-t border-line bg-surface lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-line p-3"><h2 className="flex items-center gap-2 font-bold"><ShoppingCart className="h-4 w-4" />{heldId ? 'Recalled sale' : 'Current sale'}</h2><span className="text-sm text-muted">{cart.reduce((s, c) => s + c.qty, 0)} items</span></div>
        <div className="border-b border-line p-3"><select className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} aria-label="Customer"><option value="">Walk-in customer</option>{(lists.customers || []).map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className="thin-scroll flex-1 overflow-y-auto">
          {cart.map((c, i) => (
            <div key={i} className="border-b border-line px-3 py-2">
              <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{c.name}</span><span className="font-semibold">{money(c.qty * c.price - (Number(c.discount) || 0))}</span></div>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <button className="btn-secondary h-8 w-8 p-0" onClick={() => setQty(i, c.qty - 1)} aria-label="Less"><Minus className="h-4 w-4" /></button>
                <input className="input h-8 w-14 px-1 text-center" type="number" value={c.qty} step={c.unit === 'kg' ? 0.1 : 1} onChange={(e) => setQty(i, Number(e.target.value))} aria-label="Quantity" />
                <button className="btn-secondary h-8 w-8 p-0" onClick={() => setQty(i, c.qty + 1)} aria-label="More"><Plus className="h-4 w-4" /></button>
                <span className="text-xs text-muted">× {money(c.price)}</span>
                <input className="input ml-auto h-8 w-20 px-2 text-xs" type="number" placeholder="Disc." value={c.discount || ''} onChange={(e) => setCart(cart.map((x, j) => (j === i ? { ...x, discount: e.target.value } : x)))} aria-label="Line discount" />
                <button className="text-bad/70 hover:text-bad" onClick={() => setQty(i, 0)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {!cart.length && <Empty title="Scan the first item" text="Use a barcode scanner, or tap products on the left." icon="ScanBarcode" />}
        </div>
        <div className="space-y-2 border-t border-line p-3">
          <div className="flex items-center justify-between gap-2 text-sm"><span className="text-muted">Bill discount</span><input className="input h-8 w-28 text-right" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
          <div className="flex items-baseline justify-between"><span className="text-muted">Total <span className="text-xs">(VAT included)</span></span><span className="text-2xl font-bold">{money(total)}</span></div>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-secondary" disabled={!cart.length} onClick={() => finish('held')}><PauseCircle className="h-4 w-4" />Hold</button>
            <button className="btn-ghost" disabled={!cart.length} onClick={reset}>Clear</button>
            <button className="btn-primary" disabled={!cart.length} onClick={() => setCheckout(true)}><CreditCard className="h-4 w-4" />Pay</button>
          </div>
        </div>
      </aside>

      <Modal open={checkout} onClose={() => setCheckout(false)} title={`Take payment — ${money(total)}`} footer={<><button className="btn-secondary" onClick={() => setCheckout(false)}>Back</button><button className="btn-primary" disabled={pay.method === 'Cash' && pay.tendered !== '' && change < 0} onClick={() => finish()}>Complete sale</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{['Cash', 'Card', 'Online', 'Credit', 'Gift card'].map((m) => <button key={m} onClick={() => setPay({ ...pay, method: m })} className={`rounded-lg border-2 px-2 py-3 text-sm font-semibold ${pay.method === m ? 'border-brand bg-brand-soft text-brand' : 'border-line'}`}>{m}</button>)}</div>
          {pay.method === 'Cash' && <><Field label="Cash received"><input className="input text-lg" type="number" autoFocus value={pay.tendered} onChange={(e) => setPay({ ...pay, tendered: e.target.value })} placeholder={String(total)} /></Field><div className="flex flex-wrap gap-2">{[total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000].filter((v, i, a) => a.indexOf(v) === i).map((v) => <button key={v} className="btn-secondary btn-sm" onClick={() => setPay({ ...pay, tendered: v })}>{money(v)}</button>)}</div>{pay.tendered !== '' && <div className={`rounded-lg px-4 py-3 text-lg font-bold ${change >= 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'}`}>{change >= 0 ? `Give change: ${money(change)}` : `Still short by ${money(-change)}`}</div>}</>}
          {pay.method === 'Credit' && <Help>{customer ? <>The amount is added to <b>{maps.customers?.[customer]}</b>’s account. Their credit limit is checked.</> : 'Choose a customer on the sale first — credit sales need a named customer.'}</Help>}
          {pay.method === 'Gift card' && <Field label="Gift card code"><input className="input" value={pay.gift} onChange={(e) => setPay({ ...pay, gift: e.target.value })} placeholder="GC-123456" /></Field>}
        </div>
      </Modal>
      {receipt && <PrintModal open onClose={() => setReceipt(null)} title="Receipt" narrow><ReceiptDoc kind="shop" sale={receipt} party={maps.customers?.[receipt.customer_id]} /></PrintModal>}
    </div>
  );
}

// ------------------------------------------------------------------ STOCK LEVELS
export function StockLevels() {
  const { data: r, error } = useAsync<any>(() => api.action('report', { name: 'stock' }), []);
  const { hasModule, can } = useAuth();
  const [tab, setTab] = useState('low');
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  const P = r.products; const low = P.filter((p: any) => p.state !== 'ok');
  const rows = tab === 'low' ? low : tab === 'ingredients' ? r.ingredients : tab === 'items' ? r.items.map((i: any) => ({ ...i, stock: i.quantity, reorder: 10, state: i.quantity <= 10 ? 'low' : 'ok', value: i.quantity * i.purchase_price })) : P;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Stock levels & alerts" icon="PackageSearch" desc="What is running low, what is out, and how much your stock is worth." actions={<>{can('purchase_orders', 'c') && <Link to="/app/e/purchase_orders?new=1" className="btn-primary"><PackagePlus className="h-4 w-4" />Order from supplier</Link>}{can('stock_adjustments', 'c') && <Link to="/app/e/stock_adjustments?new=1" className="btn-secondary">Adjust stock</Link>}</>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Products" value={P.length} /><Kpi label="Low stock" value={P.filter((p: any) => p.state === 'low').length} tone="warn" /><Kpi label="Out of stock" value={P.filter((p: any) => p.state === 'out').length} tone="bad" /><Kpi label="Stock value (cost)" value={P.reduce((s: number, p: any) => s + p.value, 0)} fmt="money" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'low', label: 'Needs reorder', count: low.length }, { key: 'all', label: 'All products', count: P.length }, ...(hasModule('restaurant') ? [{ key: 'ingredients', label: 'Kitchen ingredients', count: r.ingredients.length }] : []), { key: 'items', label: 'Supplies & items', count: r.items.length }]} />
      <DataTable rows={rows} exportName={'stock-' + tab} cols={[{ key: 'name', label: 'Item', render: (x) => <b>{x.icon} {x.name}</b> }, { key: 'category', label: 'Category', render: (x) => x.category || x.unit || '—' }, { key: 'stock', label: 'In stock', render: (x) => <span className="tabular-nums">{num(x.stock)} {x.unit}</span>, className: 'text-right' }, { key: 'reorder', label: 'Reorder at', className: 'text-right' }, { key: 'value', label: 'Value', render: (x) => money(x.value), className: 'text-right' }, { key: 'state', label: 'State', render: (x) => <Status value={x.state === 'ok' ? 'ok' : x.state === 'low' ? 'pending' : 'out'} label={x.state === 'ok' ? 'Healthy' : x.state === 'low' ? 'Low' : 'Out of stock'} /> }]} />
      {r.batches.length > 0 && <Card title="Batches expiring" pad={false}><table className="w-full text-sm"><tbody>{r.batches.filter((b: any) => b.status !== 'ok').map((b: any) => <tr key={b.id} className="border-t border-line first:border-0"><td className="td font-medium">{b.batch_no}</td><td className="td">{P.find((p: any) => p.id === b.product_id)?.name}</td><td className="td">{b.quantity} units</td><td className="td">{date(b.expiry)}</td><td className="td"><Status value={b.status} /></td></tr>)}</tbody></table></Card>}
    </div>
  );
}

// ------------------------------------------------------------------ BARCODE LABELS
function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => { if (ref.current && value) try { JsBarcode(ref.current, value, { format: 'CODE128', height: 40, width: 1.4, fontSize: 11, margin: 0 }); } catch { /* invalid */ } }, [value]);
  return <svg ref={ref} className="mx-auto max-w-full" />;
}
export function BarcodeLabels() {
  const prods = useList('products'); const { me } = useAuth();
  const [sel, setSel] = useState<Record<string, number>>({});
  const [showPrice, setShowPrice] = useState(true);
  if (!prods.data) return <Spinner />;
  const labels = prods.data.flatMap((p) => Array.from({ length: sel[p.id] || 0 }, () => p));
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Barcode labels" icon="Barcode" desc="Choose products and how many labels, then print on A4 sticker sheets or a label printer." actions={<button className="btn-primary" disabled={!labels.length} onClick={() => window.print()}><Printer className="h-4 w-4" />Print {labels.length} labels</button>} />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card title="Products" pad={false} actions={<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />Show price</label>}>
          <ul className="thin-scroll max-h-[65vh] overflow-y-auto">{prods.data.map((p) => <li key={p.id} className="flex items-center gap-2 border-t border-line px-4 py-2 text-sm first:border-0"><span className="flex-1 truncate">{p.icon} {p.name}</span><input type="number" min={0} className="input h-8 w-16 text-center" value={sel[p.id] || ''} placeholder="0" onChange={(e) => setSel({ ...sel, [p.id]: Math.max(0, Number(e.target.value)) })} aria-label={`Labels for ${p.name}`} /></li>)}</ul>
        </Card>
        <div className="print-area card grid content-start grid-cols-2 gap-2 p-4 sm:grid-cols-3 xl:grid-cols-4">
          {labels.map((p, i) => <div key={i} className="break-inside-avoid rounded border border-dashed border-line p-2 text-center text-[11px] text-black"><div className="truncate font-semibold">{me?.settings?.brand_name}</div><div className="truncate">{p.name}</div><Barcode value={p.barcode || p.sku} />{showPrice && <div className="text-sm font-bold">{money(p.price)}</div>}</div>)}
          {!labels.length && <div className="col-span-full"><Empty title="No labels yet" text="Enter how many labels you need next to each product." icon="Barcode" /></div>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ONLINE STORE (admin)
export function OnlineStore() {
  const { me } = useAuth(); const prods = useList('products'); const sales = useList('shop_sales', { optional: true });
  const online = (sales.data || []).filter((s) => s.channel === 'online');
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Online store page" icon="Globe" desc="Customers order from their phone for pickup or delivery. Orders take stock and appear in Sales & receipts." />
      <PublicLinkCard title="Your online store" path={`/store/${me?.business?.slug}`} desc="Shows every product marked “Show in online store”, with live stock. Customers can pay online or on pickup." icon={<ShoppingCart className="h-5 w-5 text-brand" />} />
      <div className="grid gap-3 sm:grid-cols-3"><Kpi label="Products online" value={(prods.data || []).filter((p) => p.online).length} /><Kpi label="Online orders" value={online.length} /><Kpi label="Online revenue" value={online.reduce((s, x) => s + x.total, 0)} fmt="money" /></div>
      <DataTable rows={online} exportName="online-orders" cols={[{ key: 'number', label: 'Order', render: (r) => <b>{r.number}</b> }, { key: 'date', label: 'Date', render: (r) => date(r.date) }, { key: 'total', label: 'Total', render: (r) => money(r.total) }, { key: 'payment_method', label: 'Paid by' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} />
    </div>
  );
}

// ------------------------------------------------------------------ SHOP REPORTS
export function ShopReports() {
  const [days, setDays] = useState('30');
  const { data: r, error } = useAsync<any>(() => api.action('report', { name: 'shop', days }), [days]);
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Shop reports" icon="PieChart" desc="Sales, margins, best sellers, cashier and payment summaries." actions={<><select className="input w-auto" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Period"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Revenue" value={r.totals.revenue} fmt="money" /><Kpi label="Receipts" value={r.totals.receipts} /><Kpi label="Average basket" value={r.totals.avg} fmt="money" /><Kpi label="Units sold" value={r.totals.units} /><Kpi label="Gross margin" value={r.totals.margin} fmt="money" tone="ok" /><Kpi label="Refunds" value={r.totals.refunds} fmt="money" tone="warn" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Daily sales', type: 'area', data: r.daily, series: [{ key: 'Sales', label: 'Sales' }], fmt: 'money', span: 2 }} />
        <ChartCard spec={{ title: 'Sales by category', type: 'pie', data: r.categories, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Payment methods', type: 'pie', data: r.payments, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Sales by cashier', type: 'pie', data: r.cashiers, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Counter vs online', type: 'pie', data: r.channels, fmt: 'money' }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2"><Kpi label="Stock value at cost" value={r.stockValue.cost} fmt="money" /><Kpi label="Stock value at selling price" value={r.stockValue.retail} fmt="money" /></div>
      <h2 className="font-semibold">Product sales & margin</h2>
      <DataTable rows={r.products.map((x: any, i: number) => ({ ...x, id: String(i) }))} exportName="product-sales" cols={[{ key: 'name', label: 'Product', render: (x) => <b>{x.name}</b> }, { key: 'category', label: 'Category' }, { key: 'qty', label: 'Units', className: 'text-right' }, { key: 'revenue', label: 'Revenue', render: (x) => money(x.revenue), className: 'text-right' }, { key: 'cost', label: 'Cost', render: (x) => money(x.cost), className: 'text-right' }, { key: 'margin', label: 'Margin', render: (x) => `${x.margin}%`, className: 'text-right' }]} />
    </div>
  );
}
export { pretty };
