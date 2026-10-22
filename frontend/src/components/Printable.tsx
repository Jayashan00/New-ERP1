import { ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { Modal } from './ui';
import { useAuth } from '@/lib/auth';
import { money, date, dateTime, pretty } from '@/lib/format';

export function PrintModal({ open, onClose, title, children, narrow }: { open: boolean; onClose: () => void; title: string; children: ReactNode; narrow?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={narrow ? 'sm' : 'lg'} footer={<><button className="btn-secondary" onClick={onClose}>Close</button><button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button></>}>
      <div className={`print-area mx-auto bg-white text-[#111] ${narrow ? 'max-w-[300px] font-mono text-[12px]' : 'text-sm'}`}>{children}</div>
    </Modal>
  );
}

function Letterhead() {
  const { me } = useAuth(); const s = me?.settings || {};
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-[#0F6E66] pb-4">
      <div><div className="text-2xl">{s.logo_emoji}</div><div className="text-lg font-bold">{s.brand_name || me?.business?.name}</div><div className="text-xs text-[#555]">{s.address}<br />{s.phone} · {s.email}<br />{s.tax_number}</div></div>
    </div>
  );
}

export function DocBody({ title, number, rows, meta, totals, notes, party }: { title: string; number: string; rows: any[]; meta: [string, ReactNode][]; totals: [string, any, boolean?][]; notes?: string; party?: ReactNode }) {
  const { me } = useAuth();
  return (
    <div>
      <Letterhead />
      <div className="mb-5 flex flex-wrap justify-between gap-4">
        <div><div className="text-xs uppercase tracking-wide text-[#777]">Billed to</div><div className="font-semibold">{party || '—'}</div></div>
        <div className="text-right"><div className="text-xl font-bold">{title}</div><div className="font-semibold text-[#0F6E66]">{number}</div>{meta.map(([k, v]) => <div key={k} className="text-xs text-[#555]">{k}: {v}</div>)}</div>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b border-[#ccc] text-left text-xs text-[#555]"><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Amount</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#eee]"><td className="py-2">{r.name}{r.note ? <span className="block text-xs text-[#777]">{r.note}</span> : null}</td><td className="py-2 text-right">{r.qty}</td><td className="py-2 text-right">{money(r.price)}</td><td className="py-2 text-right">{money(r.total ?? r.qty * r.price)}</td></tr>)}</tbody>
      </table>
      <div className="ml-auto mt-4 w-full max-w-[280px] space-y-1">{totals.map(([k, v, bold]) => <div key={k} className={`flex justify-between ${bold ? 'border-t border-[#111] pt-2 text-base font-bold' : ''}`}><span>{k}</span><span>{money(v)}</span></div>)}</div>
      {notes && <p className="mt-6 text-xs text-[#555]">{notes}</p>}
      <p className="mt-8 text-center text-xs text-[#777]">{me?.settings?.invoice_footer}</p>
    </div>
  );
}

export function InvoiceDoc({ doc, title, party }: { doc: any; title: string; party?: string }) {
  const sub = (doc.items || []).reduce((s: number, x: any) => s + x.qty * x.price, 0);
  return <DocBody title={title} number={doc.number} party={party} rows={doc.items || []} meta={[['Date', date(doc.date)], ...(doc.due_date ? [['Due', date(doc.due_date)] as [string, any]] : []), ['Status', pretty(doc.status)]]} totals={[['Subtotal', sub], ['VAT 18%', doc.total - sub], ['Total', doc.total, true], ...(doc.paid ? [['Paid', doc.paid] as [string, any], ['Balance due', doc.total - doc.paid, true] as [string, any, boolean]] : [])]} notes={doc.notes} />;
}

export function ReceiptDoc({ sale, kind, party, tableName }: { sale: any; kind: 'restaurant' | 'shop'; party?: string; tableName?: string }) {
  const { me } = useAuth(); const s = me?.settings || {};
  return (
    <div>
      <div className="text-center"><div className="text-xl">{s.logo_emoji}</div><div className="font-bold">{s.brand_name}</div><div>{s.address}</div><div>{s.phone}</div><div>{s.tax_number}</div></div>
      <div className="my-2 border-t border-dashed border-[#999]" />
      <div className="flex justify-between"><span>{kind === 'shop' ? 'Receipt' : 'Bill'}</span><span>{sale.number}</span></div>
      <div className="flex justify-between"><span>{dateTime(sale.date)}</span><span>{tableName || pretty(sale.type || sale.channel || '')}</span></div>
      {party && <div>Customer: {party}</div>}
      <div>{kind === 'shop' ? 'Cashier' : 'Server'}: {sale.cashier || sale.waiter}</div>
      <div className="my-2 border-t border-dashed border-[#999]" />
      {(sale.items || []).map((i: any, k: number) => <div key={k}><div>{i.name}</div><div className="flex justify-between pl-2"><span>{i.qty} × {money(i.price)}</span><span>{money(i.total ?? i.qty * i.price)}</span></div></div>)}
      <div className="my-2 border-t border-dashed border-[#999]" />
      <div className="flex justify-between"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
      {sale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{money(sale.discount)}</span></div>}
      {sale.service_charge > 0 && <div className="flex justify-between"><span>Service charge</span><span>{money(sale.service_charge)}</span></div>}
      <div className="flex justify-between"><span>{kind === 'shop' ? 'VAT included' : 'VAT'}</span><span>{money(sale.tax)}</span></div>
      <div className="flex justify-between text-[14px] font-bold"><span>TOTAL</span><span>{money(sale.total)}</span></div>
      {sale.payment_method && <div className="flex justify-between"><span>Paid by</span><span>{sale.payment_method}</span></div>}
      {sale.tendered > 0 && <><div className="flex justify-between"><span>Cash given</span><span>{money(sale.tendered)}</span></div><div className="flex justify-between"><span>Change</span><span>{money(sale.change)}</span></div></>}
      <div className="my-2 border-t border-dashed border-[#999]" />
      <div className="text-center">{s.receipt_footer}</div>
      <div className="mt-1 text-center tracking-[0.3em]">||| {sale.number} |||</div>
    </div>
  );
}

export function KotDoc({ kot }: { kot: any }) {
  return (
    <div>
      <div className="text-center text-base font-bold">KITCHEN ORDER</div>
      <div className="text-center">{kot.station}</div>
      <div className="my-2 border-t border-dashed border-[#999]" />
      <div className="flex justify-between font-bold"><span>{kot.number}</span><span>{kot.table}</span></div>
      <div>{dateTime(kot.created)}</div>
      <div className="my-2 border-t border-dashed border-[#999]" />
      {(kot.items || []).map((i: any, k: number) => <div key={k} className="mb-1"><div className="text-[14px] font-bold">{i.qty} × {i.name}</div>{(i.note || i.mods) && <div className="pl-3">→ {[i.mods, i.note].filter(Boolean).join(', ')}</div>}</div>)}
    </div>
  );
}

export function PayslipDoc({ slip, employee }: { slip: any; employee: string }) {
  return (
    <div>
      <Letterhead />
      <div className="mb-4 flex justify-between"><div><div className="text-xs text-[#777]">Employee</div><div className="font-semibold">{employee}</div></div><div className="text-right"><div className="text-xl font-bold">Payslip</div><div>{slip.month}</div></div></div>
      <table className="w-full text-sm"><tbody>
        {[['Basic salary', slip.basic], ['Allowances', slip.allowances], ['Overtime', slip.overtime], ['Service charge share', slip.service_charge], ['Deductions', -(slip.deductions || 0)]].map(([k, v]) => <tr key={k as string} className="border-b border-[#eee]"><td className="py-2">{k}</td><td className="py-2 text-right">{money(v)}</td></tr>)}
        <tr className="text-base font-bold"><td className="py-3">Net pay</td><td className="py-3 text-right">{money(slip.net)}</td></tr>
      </tbody></table>
      <p className="mt-8 text-xs text-[#777]">This is a computer-generated payslip. Status: {pretty(slip.status)}.</p>
    </div>
  );
}
