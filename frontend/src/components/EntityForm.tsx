import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { ENTITIES } from '@shared/entities.js';
import { useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { Field, Toggle } from './ui';
import { money, pretty, today } from '@/lib/format';

export const ITEM_SOURCE: Record<string, string> = { restaurant_orders: 'menu_items', kots: 'menu_items', shop_sales: 'products' };
export const itemSource = (entity: string) => ITEM_SOURCE[entity] || 'items';
export const refCols = (entity: string) => { const e = ENTITIES[entity]; const s = new Set<string>(); e.fields.forEach((f: any) => f.ref && s.add(f.ref)); if (e.fields.some((f: any) => f.t === 'items')) s.add(itemSource(entity)); return [...s]; };

export function defaultsFor(entity: string, preset: any = {}) {
  const e = ENTITIES[entity]; const d: any = {};
  for (const f of e.fields) {
    if (f.k === 'number' && e.prefix) continue;
    if (f.t === 'select') d[f.k] = f.opts[0];
    else if (f.t === 'multi' || f.t === 'refs' || f.t === 'items') d[f.k] = [];
    else if (f.t === 'bool') d[f.k] = ['available', 'online', 'recurring', 'auto_sync', 'paid', 'in_footer'].includes(f.k);
    else if (f.t === 'date' && ['date', 'start', 'joined', 'reported', 'uploaded', 'notice_date', 'check_in'].includes(f.k)) d[f.k] = today();
    else d[f.k] = '';
  }
  return { ...d, ...preset };
}

function ItemsEditor({ value, onChange, source }: { value: any[]; onChange: (v: any[]) => void; source: string }) {
  const { lists } = useLookups([source]);
  const opts = lists[source] || [];
  const rows = value || [];
  const set = (i: number, patch: any) => { const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r)); next[i].total = (Number(next[i].qty) || 0) * (Number(next[i].price) || 0); onChange(next); };
  const add = () => onChange([...rows, { ref: '', name: '', qty: 1, price: 0, total: 0 }]);
  const sub = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);
  return (
    <div className="rounded-xl border border-line">
      <div className="hidden grid-cols-[1fr_70px_110px_100px_32px] gap-2 border-b border-line px-3 py-2 text-xs font-semibold text-muted sm:grid"><span>Item</span><span>Qty</span><span>Price</span><span className="text-right">Total</span><span /></div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px] gap-2 border-b border-line px-3 py-2 sm:grid-cols-[1fr_70px_110px_100px_32px]">
          <select className="input" value={r.ref} onChange={(e) => { const o = opts.find((x) => x.id === e.target.value); set(i, { ref: e.target.value, name: o?.label || '', price: o?.price ?? r.price }); }} aria-label="Item">
            <option value="">{r.name || 'Choose an item…'}</option>
            {opts.map((o) => <option key={o.id} value={o.id}>{o.label}{o.price ? ` — ${money(o.price)}` : ''}</option>)}
          </select>
          <input className="input" type="number" min={0} value={r.qty} onChange={(e) => set(i, { qty: e.target.value })} aria-label="Quantity" />
          <input className="input" type="number" min={0} value={r.price} onChange={(e) => set(i, { price: e.target.value })} aria-label="Price" />
          <div className="flex items-center justify-end text-sm font-semibold">{money((Number(r.qty) || 0) * (Number(r.price) || 0))}</div>
          <button type="button" className="btn-ghost p-1.5 text-bad" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove line"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <button type="button" className="btn-ghost btn-sm text-brand" onClick={add}><Plus className="h-4 w-4" />Add line</button>
        <div className="text-right text-sm"><span className="text-muted">Subtotal </span><b>{money(sub)}</b><span className="ml-3 text-muted">+ VAT 18% </span><b>{money(sub * 1.18)}</b></div>
      </div>
    </div>
  );
}

export function FieldInput({ f, value, onChange, maps, lists, entity }: { f: any; value: any; onChange: (v: any) => void; maps: any; lists: any; entity: string }) {
  switch (f.t) {
    case 'textarea': return <textarea className="input min-h-[84px]" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number': case 'money': case 'percent': return <div className="relative"><input className="input" type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />{f.t === 'percent' && <span className="pointer-events-none absolute right-3 top-2 text-sm text-muted">%</span>}</div>;
    case 'date': return <input className="input" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'datetime': return <input className="input" type="datetime-local" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'time': return <input className="input" type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'email': return <input className="input" type="email" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'phone': return <input className="input" type="tel" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'url': return <input className="input" type="url" placeholder="https://" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'password': return <input className="input" type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'color': return <div className="flex items-center gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface" value={value || '#0F6E66'} onChange={(e) => onChange(e.target.value)} /><span className="text-sm text-muted">{value}</span></div>;
    case 'bool': return <Toggle checked={!!value} onChange={onChange} label={value ? 'Yes' : 'No'} />;
    case 'rating': return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} stars`}><Star className={`h-6 w-6 ${n <= (value || 0) ? 'fill-saffron text-saffron' : 'text-line'}`} /></button>)}</div>;
    case 'select': return <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{!f.req && <option value="">—</option>}{f.opts.map((o: string) => <option key={o} value={o}>{pretty(o)}</option>)}</select>;
    case 'multi': return <div className="flex flex-wrap gap-1.5">{f.opts.map((o: string) => { const on = (value || []).includes(o); return <button type="button" key={o} onClick={() => onChange(on ? value.filter((x: string) => x !== o) : [...(value || []), o])} className={`chip border px-2.5 py-1 ${on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted'}`}>{pretty(o)}</button>; })}</div>;
    case 'ref': return <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">{f.req ? 'Choose…' : '— None —'}</option>{(lists[f.ref] || []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>;
    case 'refs': return <div className="thin-scroll flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">{(lists[f.ref] || []).map((o: any) => { const on = (value || []).includes(o.id); return <button type="button" key={o.id} onClick={() => onChange(on ? value.filter((x: string) => x !== o.id) : [...(value || []), o.id])} className={`chip border px-2.5 py-1 ${on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted'}`}>{o.label}</button>; })}{!(lists[f.ref] || []).length && <span className="text-sm text-muted">Nothing to choose yet.</span>}</div>;
    case 'items': return <ItemsEditor value={value} onChange={onChange} source={itemSource(entity)} />;
    default: return <input className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function EntityForm({ entity, value, onChange, errors = {} }: { entity: string; value: any; onChange: (v: any) => void; errors?: Record<string, string> }) {
  const e = ENTITIES[entity];
  const { me } = useAuth();
  const { lists, maps } = useLookups(refCols(entity));
  const hide = (f: any) => (f.k === 'number' && e.prefix) || (me?.role?.self && e.ownerField === f.k) || ['total'].includes(f.k) && e.fields.some((x: any) => x.t === 'items');
  const fields = useMemo(() => e.fields.filter((f: any) => !hide(f)), [entity, me]);
  const wide = (f: any) => ['textarea', 'items', 'multi', 'refs'].includes(f.t);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f: any) => (
        <div key={f.k} className={wide(f) ? 'sm:col-span-2' : ''}>
          <Field label={f.l} required={f.req} error={errors[f.k]}>
            <FieldInput f={f} value={value[f.k]} onChange={(v) => onChange({ ...value, [f.k]: v })} maps={maps} lists={lists} entity={entity} />
          </Field>
        </div>
      ))}
    </div>
  );
}

export function validateClient(entity: string, v: any) {
  const errs: Record<string, string> = {};
  for (const f of ENTITIES[entity].fields) {
    const x = v[f.k];
    if (f.req && (x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length))) errs[f.k] = `${f.l} is required`;
    if (f.t === 'email' && x && !/^\S+@\S+\.\S+$/.test(x)) errs[f.k] = 'Enter a valid email address';
    if (f.t === 'items' && Array.isArray(x) && x.some((r: any) => !r.name || !(Number(r.qty) > 0))) errs[f.k] = 'Every line needs an item and a quantity — remove empty lines';
  }
  return errs;
}

export function useFormState(initial: any) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return [v, setV] as const;
}
