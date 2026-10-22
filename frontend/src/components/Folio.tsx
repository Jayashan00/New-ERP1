import { useState } from 'react';
import { LogIn, LogOut, Plus, CreditCard, Printer, ArrowLeftRight, Ban } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync, useList } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { Drawer, Modal, Spinner, Status, Field, useConfirm } from './ui';
import { PrintModal, DocBody } from './Printable';
import { money, date, nightsBetween, pretty } from '@/lib/format';

export function FolioDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: f, loading } = useAsync<any>(() => (id ? api.action('folio', { reservation_id: id }) : Promise.resolve(null)), [id]);
  const services = useList('extra_services', { optional: true });
  const { can } = useAuth(); const toast = useToast(); const confirm = useConfirm();
  const [charge, setCharge] = useState<any>(null);
  const [pay, setPay] = useState<any>(null);
  const [out, setOut] = useState<any>(null);
  const [move, setMove] = useState<any>(null);
  const [print, setPrint] = useState(false); const [grc, setGrc] = useState(false);
  const run = async (fn: () => Promise<any>, msg?: string) => { try { const r = await fn(); toast.ok(r?.message || msg || 'Done.'); return r; } catch (e) { toast.err(e); } };
  if (!id) return null;
  const r = f?.reservation;
  return (
    <Drawer open={!!id} onClose={onClose} wide title={r ? `${r.number} · ${f.guest?.name}` : 'Guest folio'}
      footer={r && <>
        <button className="btn-secondary" onClick={() => setGrc(true)}>Registration card</button>
        <button className="btn-secondary" onClick={() => setPrint(true)}><Printer className="h-4 w-4" />Print bill</button>
        {['confirmed', 'tentative'].includes(r.status) && can('reservations', 'e') && <button className="btn-secondary text-bad" onClick={async () => { if (await confirm({ title: 'Cancel this booking?', text: 'The room will be released for other guests.', confirm: 'Cancel booking', danger: true })) run(() => api.action('cancelBooking', { reservation_id: r.id }), 'Booking cancelled.'); }}><Ban className="h-4 w-4" />Cancel booking</button>}
        {['confirmed', 'tentative'].includes(r.status) && can('reservations', 'e') && <button className="btn-primary" onClick={() => run(() => api.action('checkIn', { reservation_id: r.id }))}><LogIn className="h-4 w-4" />Check in</button>}
        {r.status === 'checked_in' && can('reservations', 'e') && <button className="btn-primary" onClick={() => setOut({ method: 'Card' })}><LogOut className="h-4 w-4" />Check out</button>}
      </>}>
      {loading || !f ? <Spinner /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Status', <Status value={r.status} />], ['Room', f.room ? `${f.room.number}` : '—'], ['Stay', `${date(r.check_in)} → ${date(r.check_out)}`], ['Nights', nightsBetween(r.check_in, r.check_out)], ['Guests', `${r.adults || 1} adult${r.adults > 1 ? 's' : ''}${r.children ? `, ${r.children} child` : ''}`], ['Meal plan', r.meal_plan], ['Booked via', r.source], ['Rate / night', money(r.rate)]].map(([k, v]: any) => <div key={k} className="rounded-lg bg-paper px-3 py-2"><div className="text-xs text-muted">{k}</div><div className="text-sm font-semibold">{v}</div></div>)}
          </div>
          {r.special_requests && <div className="rounded-lg border border-saffron/40 bg-saffron-soft px-3 py-2 text-sm"><b>Special request:</b> {r.special_requests}</div>}
          <div className="rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5"><h3 className="text-sm font-semibold">Charges</h3>{r.status === 'checked_in' && can('folio_charges', 'c') && <button className="btn-ghost btn-sm text-brand" onClick={() => setCharge({ category: 'Restaurant', description: '', amount: '' })}><Plus className="h-4 w-4" />Post a charge</button>}</div>
            <table className="w-full text-sm"><tbody>
              {f.charges.map((c: any) => <tr key={c.id} className="border-b border-line last:border-0"><td className="px-4 py-2 text-muted">{date(c.date)}</td><td className="px-2 py-2">{c.description}<span className="ml-2 text-xs text-muted">{c.category}</span></td><td className="px-4 py-2 text-right font-medium">{money(c.amount)}</td></tr>)}
              {f.roomPending > 0 && <tr className="text-muted"><td className="px-4 py-2" colSpan={2}>Remaining room nights (posted at night audit / check-out)</td><td className="px-4 py-2 text-right">{money(f.roomPending)}</td></tr>}
              {!f.charges.length && !f.roomPending && <tr><td className="px-4 py-4 text-center text-muted" colSpan={3}>No charges yet.</td></tr>}
            </tbody></table>
          </div>
          <div className="rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5"><h3 className="text-sm font-semibold">Payments</h3>{can('folio_payments', 'c') && r.status !== 'cancelled' && <button className="btn-ghost btn-sm text-brand" onClick={() => setPay({ amount: Math.max(0, f.balance), method: 'Card', type: r.status === 'checked_in' ? 'settlement' : 'advance' })}><CreditCard className="h-4 w-4" />Take a payment</button>}</div>
            <table className="w-full text-sm"><tbody>
              {f.payments.map((p: any) => <tr key={p.id} className="border-b border-line last:border-0"><td className="px-4 py-2 text-muted">{date(p.date)}</td><td className="px-2 py-2">{pretty(p.type)} · {p.method}<span className="ml-2 text-xs text-muted">{p.reference}</span></td><td className="px-4 py-2 text-right font-medium">{money(p.amount)}</td></tr>)}
              {!f.payments.length && <tr><td className="px-4 py-4 text-center text-muted" colSpan={3}>No payments yet.</td></tr>}
            </tbody></table>
          </div>
          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted">Charges</span><span>{money(f.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Service charge</span><span>{money(f.service_charge)}</span></div>
            {f.tdl > 0 && <div className="flex justify-between"><span className="text-muted">Tourism development levy</span><span>{money(f.tdl)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">VAT</span><span>{money(f.vat)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{money(f.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Paid</span><span>{money(f.paid)}</span></div>
            <div className={`flex justify-between rounded-lg px-3 py-2 text-base font-bold ${f.balance > 0 ? 'bg-saffron-soft' : 'bg-ok/10 text-ok'}`}><span>{f.balance > 0 ? 'Balance due' : 'Fully paid'}</span><span>{money(Math.abs(f.balance))}</span></div>
          </div>
          {['confirmed', 'tentative', 'checked_in'].includes(r.status) && can('reservations', 'e') && <button className="btn-ghost btn-sm" onClick={() => setMove({ room_id: '' })}><ArrowLeftRight className="h-4 w-4" />Move to another room</button>}
        </div>
      )}

      <Modal open={!!charge} onClose={() => setCharge(null)} title="Post a charge to the room bill" footer={<><button className="btn-secondary" onClick={() => setCharge(null)}>Cancel</button><button className="btn-primary" onClick={async () => { if (await run(() => api.action('postCharge', { reservation_id: r.id, ...charge }), 'Charge posted.')) setCharge(null); }}>Post charge</button></>}>
        {charge && <div className="space-y-4">
          <div><div className="label">Quick add</div><div className="flex flex-wrap gap-1.5">{(services.data || []).map((s: any) => <button key={s.id} className="chip border border-line bg-surface px-2.5 py-1 hover:border-brand" onClick={() => setCharge({ category: s.category === 'Dining' ? 'Restaurant' : s.category === 'Activity' ? 'Tour' : s.category, description: s.name, amount: s.price })}>{s.name} · {money(s.price)}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Description" required><input className="input" value={charge.description} onChange={(e) => setCharge({ ...charge, description: e.target.value })} /></Field>
            <Field label="Category"><select className="input" value={charge.category} onChange={(e) => setCharge({ ...charge, category: e.target.value })}>{['Restaurant', 'Bar', 'Minibar', 'Laundry', 'Spa', 'Transport', 'Tour', 'Telephone', 'Other'].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Amount" required><input className="input" type="number" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} /></Field>
          </div>
        </div>}
      </Modal>

      <Modal open={!!pay} onClose={() => setPay(null)} title="Take a payment" footer={<><button className="btn-secondary" onClick={() => setPay(null)}>Cancel</button><button className="btn-primary" onClick={async () => { if (await run(() => api.action('addPayment', { reservation_id: r.id, ...pay }), 'Payment recorded.')) setPay(null); }}>Record {money(pay?.amount)}</button></>}>
        {pay && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required><input className="input" type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Paid with"><select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{['Cash', 'Card', 'Bank transfer', 'Online', 'City ledger'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Type"><select className="input" value={pay.type} onChange={(e) => setPay({ ...pay, type: e.target.value })}><option value="advance">Advance / deposit</option><option value="settlement">Settlement</option><option value="refund">Refund to guest</option></select></Field>
          <Field label="Reference (optional)"><input className="input" value={pay.reference || ''} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
        </div>}
      </Modal>

      <Modal open={!!out} onClose={() => setOut(null)} title="Check out guest" footer={<><button className="btn-secondary" onClick={() => setOut(null)}>Not yet</button><button className="btn-primary" onClick={async () => { const res = await run(() => api.action('checkOut', { reservation_id: r.id, method: out.method })); if (res) { setOut(null); setPrint(true); } }}><LogOut className="h-4 w-4" />Settle & check out</button></>}>
        {out && f && <div className="space-y-4 text-sm">
          <p>All remaining room nights are posted and the balance is settled. The room is sent to housekeeping automatically and loyalty points are added.</p>
          <div className="rounded-lg bg-paper px-4 py-3 text-base">Balance to settle now: <b>{money(Math.max(0, f.balance + f.roomPending * (1 + (f.service_charge / Math.max(1, f.subtotal))) * 0))}</b> <span className="text-xs text-muted">(plus any remaining nights)</span></div>
          <Field label="Guest pays with"><select className="input" value={out.method} onChange={(e) => setOut({ method: e.target.value })}>{['Card', 'Cash', 'Bank transfer', 'Online', 'City ledger'].map((m) => <option key={m}>{m}</option>)}</select></Field>
        </div>}
      </Modal>

      <MoveRoom r={r} open={!!move} onClose={() => setMove(null)} onDone={() => setMove(null)} />

      {f && <PrintModal open={print} onClose={() => setPrint(false)} title="Guest bill">
        <DocBody title={r.status === 'checked_out' ? 'Tax invoice' : 'Guest folio'} number={r.number} party={<>{f.guest?.name}<div className="text-xs font-normal text-[#555]">{f.guest?.phone} · {f.guest?.nationality}</div></>} meta={[['Room', f.room?.number], ['Arrival', date(r.check_in)], ['Departure', date(r.check_out)]]} rows={f.charges.map((c: any) => ({ name: `${date(c.date)} — ${c.description}`, qty: 1, price: c.amount }))} totals={[['Charges', f.subtotal], ['Service charge', f.service_charge], ...(f.tdl ? [['Tourism levy', f.tdl] as [string, any]] : []), ['VAT', f.vat], ['Total', f.total, true], ['Paid', f.paid], ['Balance', f.balance, true]]} />
      </PrintModal>}
      {f && <PrintModal open={grc} onClose={() => setGrc(false)} title="Guest registration card">
        <div><div className="mb-4 border-b-2 border-[#1F3B2D] pb-3 text-center"><div className="text-xl font-bold">Ceylon Ayu Resort Kandy</div><div className="text-sm">GUEST REGISTRATION CARD · {r.number}</div></div>
          <table className="w-full text-sm"><tbody>{[['Title & name', `${f.guest?.title || ''} ${f.guest?.first_name || ''} ${f.guest?.last_name || f.guest?.name || ''}`], ['Nationality', f.guest?.nationality], ['Country of residence', f.guest?.country], [f.guest?.id_type || 'ID / passport', f.guest?.id_number], ['Date of birth', f.guest?.date_of_birth], ['Address', f.guest?.address], ['Phone / email', `${f.guest?.phone || ''} ${f.guest?.email || ''}`], ['Room', f.room?.number], ['Arrival → departure', `${date(r.check_in)} → ${date(r.check_out)}`], ['Guests', `${r.adults || 1} adults, ${r.children || 0} children`], ['Meal plan / rate', `${r.meal_plan} · ${money(r.rate)} per night`], ['Booked via', `${r.source}${r.ota_ref ? ' · ref ' + r.ota_ref : ''}`], ['Vehicle', r.vehicle_no || '—'], ['Purpose of visit', f.guest?.purpose]].map(([k, v]: any) => <tr key={k} className="border-b border-[#ddd]"><td className="w-48 py-2 font-semibold">{k}</td><td className="py-2">{v || '—'}</td></tr>)}</tbody></table>
          <p className="mt-4 text-xs">I agree to settle all charges on departure. The hotel is not responsible for valuables not kept in the room safe. Check-out time is 12:00 noon.</p>
          <div className="mt-10 grid grid-cols-2 gap-10 text-xs"><div className="border-t border-black pt-1">Guest signature</div><div className="border-t border-black pt-1">Receptionist</div></div></div>
      </PrintModal>}
    </Drawer>
  );
}

function MoveRoom({ r, open, onClose, onDone }: any) {
  const toast = useToast();
  const { data } = useAsync<any[]>(() => (open && r ? api.action('availableRooms', { check_in: r.check_in, check_out: r.check_out, exclude: r.id }) : Promise.resolve([])), [open, r?.id]);
  const [room, setRoom] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Move to another room" footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!room} onClick={async () => { try { const x = await api.action('moveRoom', { reservation_id: r.id, room_id: room }); toast.ok(x.message); onDone(); } catch (e) { toast.err(e); } }}>Move guest</button></>}>
      <p className="mb-3 text-sm text-muted">Rooms free for the whole stay:</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{(data || []).map((x: any) => <button key={x.id} onClick={() => setRoom(x.id)} className={`rounded-lg border px-2 py-3 text-center text-sm font-semibold ${room === x.id ? 'border-brand bg-brand text-white' : 'border-line hover:border-brand'}`}>{x.number}</button>)}</div>
      {data && !data.length && <p className="text-sm text-muted">No other room is free for these dates.</p>}
    </Modal>
  );
}
