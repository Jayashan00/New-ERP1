import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Check, Send, Printer, Upload, Trash2, Save, ExternalLink, BellRing, ChefHat, Hand, Receipt, ChevronLeft, ChevronRight, Globe, Image as ImageIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Kpi, Card, Status, Field, Modal, Empty, Help, Tabs, Toggle, useConfirm } from '@/components/ui';
import { DataTable } from '@/components/DataTable';
import { ImageInput } from '@/components/ImageInput';
import { P } from '@/lib/photos';
const DEF = { hero: P.hero, pool: P.pool, restaurant: P.restaurant, spa: P.spa, garden: P.garden, kandy: P.kandy };
import { FolioDrawer } from '@/components/Folio';
import { money, date, dateTime, minutesSince, pretty, today, addDays } from '@/lib/format';

// ------------------------------------------------------------------ PARKING
const SLOT_STYLE: Record<string, string> = { free: 'border-ok/50 bg-ok/10', occupied: 'border-info/50 bg-info/10', reserved: 'border-saffron/60 bg-saffron-soft', out_of_service: 'border-muted/40 bg-muted/10 opacity-70' };
export function Parking() {
  const slots = useList('parking_slots'); const logs = useList('parking_logs'); const res = useList('reservations', { optional: true });
  const { maps } = useLookups(['customers', 'rooms']); const toast = useToast(); const { can } = useAuth();
  const [sel, setSel] = useState<any>(null); const [f, setF] = useState<any>({});
  if (slots.error) return <ErrorBox error={slots.error} />;
  if (!slots.data || !logs.data) return <Spinner />;
  const S = slots.data; const zones = [...new Set(S.map((x) => x.zone))];
  const inHouse = (res.data || []).filter((r) => r.status === 'checked_in' || (r.status === 'confirmed' && r.check_in === today()));
  const open = (s: any) => { setSel(s); setF({ vehicle_no: '', vehicle_type: s.type === 'Motorbike' ? 'Motorbike' : s.type === 'Coach / bus' ? 'Coach / bus' : 'Car', driver: '', reservation_id: '', purpose: 'Hotel guest', fee: 0, charge_to_room: false }); };
  const log = sel ? logs.data.find((l) => l.slot_id === sel.id && l.status === 'parked') : null;
  const run = async (name: string, payload: any) => { try { const r = await api.action(name, payload); toast.ok(r.message); setSel(null); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Parking" icon="ParkingSquare" desc="Every parking bay at a glance. Tap a green bay to park a vehicle, a blue bay to let it out." help="Guests’ vehicles are linked to their room booking, so you always know whose car it is. Bays reserved at booking turn blue automatically at check-in and are released at check-out." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Free bays" value={S.filter((x) => x.status === 'free').length} tone="ok" hint={`of ${S.length}`} />
        <Kpi label="Occupied" value={S.filter((x) => x.status === 'occupied').length} />
        <Kpi label="Reserved for arrivals" value={S.filter((x) => x.status === 'reserved').length} tone="warn" />
        <Kpi label="Vehicles in today" value={logs.data.filter((l) => String(l.time_in).slice(0, 10) === today()).length} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">{Object.entries({ free: 'Free', occupied: 'Parked', reserved: 'Reserved', out_of_service: 'Out of service' }).map(([k, v]) => <span key={k} className={`chip border ${SLOT_STYLE[k]}`}>{v}</span>)}</div>
      <div className="space-y-4">
        {zones.map((z) => (
          <Card key={z} title={z}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
              {S.filter((x) => x.zone === z).map((s) => (
                <button key={s.id} onClick={() => can('parking_logs', 'c') && open(s)} className={`relative flex aspect-[3/4] flex-col items-center justify-between rounded-xl border-2 border-dashed p-2 text-center ${SLOT_STYLE[s.status]}`}>
                  <span className="text-xs font-bold">{s.code}</span>
                  <span className="text-2xl" aria-hidden>{s.status === 'occupied' ? (s.type === 'Motorbike' ? '🏍️' : s.type === 'Coach / bus' ? '🚌' : '🚗') : s.status === 'reserved' ? '🅿️' : s.type === 'EV charging' ? '⚡' : ''}</span>
                  <span className="w-full truncate text-[10px] font-semibold">{s.vehicle_no || (s.status === 'out_of_service' ? 'Closed' : 'Free')}</span>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-semibold">Vehicle log</h2>
      <DataTable rows={logs.data} exportName="parking-log" pageSize={10} cols={[{ key: 'vehicle_no', label: 'Vehicle', render: (r) => <b>{r.vehicle_no}</b> }, { key: 'slot_id', label: 'Bay', render: (r) => S.find((x) => x.id === r.slot_id)?.code }, { key: 'purpose', label: 'Who' }, { key: 'driver', label: 'Name' }, { key: 'time_in', label: 'In', render: (r) => dateTime(r.time_in) }, { key: 'time_out', label: 'Out', render: (r) => (r.time_out ? dateTime(r.time_out) : '—') }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status === 'parked' ? 'occupied' : 'checked_out'} label={pretty(r.status)} /> }]} />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Bay ${sel.code} · ${sel.zone}` : ''} footer={sel && (sel.status === 'free' || sel.status === 'reserved' ? <><button className="btn-secondary" onClick={() => setSel(null)}>Cancel</button>{sel.status === 'reserved' && <button className="btn-secondary" onClick={() => run('releaseVehicle', { slot_id: sel.id })}>Cancel reservation</button>}<button className="btn-primary" onClick={() => run('parkVehicle', { slot_id: sel.id, ...f, vehicle_no: f.vehicle_no || sel.vehicle_no })}><Car className="h-4 w-4" />Park vehicle</button></> : sel.status === 'occupied' ? <><button className="btn-secondary" onClick={() => setSel(null)}>Close</button><button className="btn-primary" onClick={() => run('releaseVehicle', { slot_id: sel.id, fee: f.fee, charge_to_room: f.charge_to_room })}>Vehicle left — free the bay</button></> : <button className="btn-secondary" onClick={() => api.update('parking_slots', sel.id, { status: 'free', notes: '' }).then(() => { toast.ok('Bay reopened.'); setSel(null); })}>Reopen this bay</button>)}>
        {sel && (sel.status === 'occupied' ? <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-paper p-4"><div className="text-2xl font-bold">{sel.vehicle_no}</div>{log && <div className="text-muted">{log.purpose} · {log.driver} · in since {dateTime(log.time_in)} ({Math.round(minutesSince(log.time_in) / 60)} h){log.reservation_id ? ` · Room ${maps.rooms?.[(res.data || []).find((r) => r.id === log.reservation_id)?.room_id] || ''}` : ''}</div>}</div>
          <Field label="Parking fee (leave 0 for hotel guests)"><input className="input" type="number" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></Field>
          {log?.reservation_id && <Toggle checked={f.charge_to_room} onChange={(v) => setF({ ...f, charge_to_room: v })} label="Add the fee to the guest’s room bill" />}
        </div> : sel.status === 'out_of_service' ? <p className="text-sm text-muted">This bay is closed{sel.notes ? `: ${sel.notes}` : ''}.</p> : <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Vehicle number" required><input className="input uppercase" autoFocus value={f.vehicle_no || (sel.status === 'reserved' ? sel.vehicle_no : '')} onChange={(e) => setF({ ...f, vehicle_no: e.target.value })} placeholder="CAB-1234" /></Field>
          <Field label="Vehicle"><select className="input" value={f.vehicle_type} onChange={(e) => setF({ ...f, vehicle_type: e.target.value })}>{['Car', 'Van', 'Coach / bus', 'Motorbike', 'Tuk-tuk'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Who is it"><select className="input" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })}>{['Hotel guest', 'Restaurant guest', 'Visitor', 'Taxi / driver', 'Supplier', 'Staff'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Driver / owner name"><input className="input" value={f.driver} onChange={(e) => setF({ ...f, driver: e.target.value })} /></Field>
          {f.purpose === 'Hotel guest' && <div className="sm:col-span-2"><Field label="Link to room"><select className="input" value={f.reservation_id} onChange={(e) => setF({ ...f, reservation_id: e.target.value })}><option value="">— Choose the guest —</option>{inHouse.map((r) => <option key={r.id} value={r.id}>Room {maps.rooms?.[r.room_id]} — {maps.customers?.[r.guest_id]}</option>)}</select></Field></div>}
        </div>)}
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------ CHANNEL MANAGER
export function ChannelManager() {
  const [start, setStart] = useState(today());
  const { data, error } = useAsync<any>(() => api.action('channelGrid', { start, days: 14 }), [start]);
  const logs = useList('channel_sync_logs'); const toast = useToast(); const { can } = useAuth();
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const push = async (action: string) => { setBusy(true); try { const r = await api.action('channelPush', { action }); toast.ok(r.message); } catch (e) { toast.err(e); } finally { setBusy(false); } };
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Channel manager" icon="Share2" desc="One place for room availability and prices on your website, Booking.com, Agoda, Expedia, Trip.com, Airbnb and Google. A booking from any one of them updates all the others, so the same room can never be sold twice." help={<>The grid shows how many rooms of each type are still free each night and the price sent to channels (from <Link className="text-brand underline" to="/app/e/rate_plans">Rate plans</Link>). <b>Push</b> sends the latest numbers to every connected channel. OTA bookings arrive in Reservations with the channel’s booking reference. <b>Demo note:</b> pushes are recorded and queued here; they reach the real channels once your channel-manager account (e.g. SiteMinder, STAAH, Cloudbeds) is connected in the backend phase.</>}
        actions={can('channels', 'e') && <><button className="btn-secondary" disabled={busy} onClick={() => push('Rate update')}>Push rates</button><button className="btn-primary" disabled={busy} onClick={() => push('Full sync')}><Send className="h-4 w-4" />Push availability & rates</button></>} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{data.channels.map((c: any) => <div key={c.id} className="card p-3"><div className="flex items-center justify-between"><b className="text-sm">{c.name}</b><Status value={c.status} /></div><div className="mt-1 text-xs text-muted">Commission {c.commission}% · synced {c.last_sync ? dateTime(c.last_sync) : 'never'}</div></div>)}</div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">Rooms free & price per night <span className="font-normal text-muted">— tap a day to close or reopen it everywhere</span></h2><div className="flex gap-1"><button className="btn-ghost btn-sm" onClick={() => setStart(addDays(start, -7))} aria-label="Earlier"><ChevronLeft className="h-4 w-4" /></button><button className="btn-ghost btn-sm" onClick={() => setStart(today())}>Today</button><button className="btn-ghost btn-sm" onClick={() => setStart(addDays(start, 7))} aria-label="Later"><ChevronRight className="h-4 w-4" /></button></div></div>
        <div className="thin-scroll overflow-x-auto"><table className="w-full min-w-[900px] text-xs">
          <thead className="bg-paper/70"><tr><th className="th">Room type</th>{data.dates.map((d: string) => { const dt = new Date(d + 'T12:00'); return <th key={d} className={`th text-center ${[0, 6].includes(dt.getDay()) ? 'bg-paper' : ''}`}>{dt.toLocaleDateString('en', { weekday: 'short' })}<br />{dt.getDate()}</th>; })}</tr></thead>
          <tbody>{data.types.map((t: any) => <tr key={t.id} className="border-t border-line"><td className="td whitespace-nowrap font-semibold">{t.name}<div className="text-[11px] font-normal text-muted">{t.total} rooms</div></td>{t.cells.map((c: any) => <td key={c.date} className="px-1 py-1.5 text-center"><button type="button" disabled={!can('room_closures', 'c')} title={c.closed ? 'Closed — tap to open for sale again' : 'Tap to close this date (stop sell)'} onClick={async () => { try { const r = await api.action('toggleClosure', { room_type_id: t.id, date: c.date }); toast.ok(r.message); } catch (e) { toast.err(e); } }} className={`w-full rounded-md px-1 py-1 font-bold transition hover:ring-2 hover:ring-brand/30 ${c.closed ? 'bg-ink text-surface' : c.available === 0 ? 'bg-bad/10 text-bad' : c.available <= 1 ? 'bg-saffron/15 text-warn' : 'bg-ok/10 text-ok'}`}>{c.closed ? 'Closed' : c.available === 0 ? 'Full' : c.available}</button><div className="mt-0.5 text-[10px] text-muted">{money(c.rate, { short: true })}</div></td>)}</tr>)}</tbody>
        </table></div>
      </div>
      <h2 className="font-semibold">Sync history</h2>
      <DataTable rows={(logs.data || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))} pageSize={8} cols={[{ key: 'date', label: 'When', render: (r) => dateTime(r.date) }, { key: 'channel', label: 'Channel', render: (r) => <b>{r.channel}</b> }, { key: 'action', label: 'What' }, { key: 'details', label: 'Details' }, { key: 'by', label: 'By' }, { key: 'status', label: 'Result', render: (r) => <Status value={r.status === 'queued' ? 'pending' : r.status} label={pretty(r.status)} /> }]} />
    </div>
  );
}

// ------------------------------------------------------------------ WAITER SERVICE BOARD
export function ServiceBoard() {
  const orders = useList('restaurant_orders', { poll: 5000 }); const kots = useList('kots', { poll: 5000 }); const calls = useList('service_calls', { poll: 5000 });
  const { maps } = useLookups(['tables']); const toast = useToast(); const { me } = useAuth();
  if (orders.error) return <ErrorBox error={orders.error} />;
  if (!orders.data || !kots.data || !calls.data) return <Spinner />;
  const ready = kots.data.filter((k) => k.status === 'ready');
  const cooking = kots.data.filter((k) => ['new', 'preparing'].includes(k.status));
  const openCalls = calls.data.filter((c) => c.status !== 'done').sort((a, b) => String(a.created).localeCompare(String(b.created)));
  const serve = async (k: any) => { try { await api.action('kotStatus', { kot_id: k.id, status: 'served' }); toast.ok(`${k.table}: served${orders.data!.find((o) => o.id === k.order_id)?.type === 'room_service' ? ' — charged to the room bill' : ''}.`); } catch (e) { toast.err(e); } };
  const handle = async (c: any, status: string) => { try { await api.action('handleCall', { id: c.id, status }); toast.ok(status === 'acknowledged' ? `On my way to ${c.place}.` : `${c.place}: done.`); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Waiter service board" icon="BellRing" desc="Everything a waiter needs right now: dishes ready at the pass, tables calling, and what the kitchen is cooking. Updates by itself every few seconds with a sound." help={<>1. When the kitchen marks a dish <b>Ready</b>, it appears in the first column and you hear a chime. Collect it and tap <b>Served</b>. 2. When a guest taps <b>Call waiter</b> or <b>Ask for the bill</b> on the QR menu, it appears in the middle. Tap <b>I’m going</b>, then <b>Done</b>. Room-service orders are added to the guest’s room bill automatically when served.</>} actions={<Link to="/app/restaurant-pos" className="btn-primary">Take an order</Link>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface/60 p-3 shadow-card"><h2 className="mb-3 flex items-center gap-2 font-bold"><Hand className="h-4 w-4 text-ok" />Ready — collect & serve <span className="chip bg-ok/10 text-ok">{ready.length}</span></h2>
          <div className="space-y-2">{ready.map((k) => <div key={k.id} className="rounded-xl border-2 border-ok bg-surface p-3"><div className="flex justify-between"><b className="text-lg">{k.table}</b><span className="text-xs text-muted">{k.station} · {minutesSince(k.ready_at || k.created)} min</span></div><ul className="my-2 text-sm">{k.items.map((i: any, n: number) => <li key={n}><b>{i.qty}×</b> {i.name}</li>)}</ul><button className="btn-primary w-full py-2.5" onClick={() => serve(k)}><Check className="h-4 w-4" />Served</button></div>)}{!ready.length && <p className="py-8 text-center text-sm text-muted">Nothing waiting at the pass.</p>}</div></div>
        <div className="rounded-xl bg-surface/60 p-3 shadow-card"><h2 className="mb-3 flex items-center gap-2 font-bold"><BellRing className="h-4 w-4 text-bad" />Table & room calls <span className="chip bg-bad/10 text-bad">{openCalls.length}</span></h2>
          <div className="space-y-2">{openCalls.map((c) => <div key={c.id} className={`rounded-xl border-2 bg-surface p-3 ${c.status === 'open' ? 'border-bad pulse-ring' : 'border-saffron'}`}><div className="flex justify-between"><b className="text-lg">{c.place}</b><span className="text-xs text-muted">{minutesSince(c.created)} min ago</span></div><div className="my-1 text-sm font-semibold">{c.kind === 'Bill' ? 'Wants the bill' : c.kind === 'Water' ? 'Needs water' : 'Calling a waiter'}{c.handled_by && <span className="font-normal text-muted"> · {c.handled_by}</span>}</div><div className="mt-2 flex gap-2">{c.status === 'open' && <button className="btn-secondary flex-1" onClick={() => handle(c, 'acknowledged')}>I’m going</button>}<button className="btn-primary flex-1" onClick={() => handle(c, 'done')}>Done</button></div></div>)}{!openCalls.length && <p className="py-8 text-center text-sm text-muted">No one is calling.</p>}</div></div>
        <div className="rounded-xl bg-surface/60 p-3 shadow-card"><h2 className="mb-3 flex items-center gap-2 font-bold"><ChefHat className="h-4 w-4 text-info" />In the kitchen <span className="chip bg-info/10 text-info">{cooking.length}</span></h2>
          <div className="space-y-2">{cooking.map((k) => <div key={k.id} className="rounded-xl border border-line bg-surface p-3 text-sm"><div className="flex justify-between"><b>{k.table}</b><Status value={k.status === 'new' ? 'pending' : 'preparing'} label={k.status === 'new' ? 'Waiting for chef' : 'Cooking'} /></div><div className="mt-1 text-muted">{k.items.map((i: any) => `${i.qty}× ${i.name}`).join(', ')}</div><div className="text-xs text-muted">{minutesSince(k.created)} min since ordered</div></div>)}{!cooking.length && <p className="py-8 text-center text-sm text-muted">Kitchen is clear.</p>}</div></div>
      </div>
      {void me}{void maps}
    </div>
  );
}

// ------------------------------------------------------------------ GUEST BILLING
export function GuestBilling() {
  const { data, error } = useAsync<any[]>(() => api.action('guestBilling'), []);
  const [tab, setTab] = useState('checked_in'); const [folio, setFolio] = useState<string | null>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const rows = data.filter((r) => tab === 'all' || r.status === tab);
  const due = data.filter((r) => r.status === 'checked_in').reduce((s, r) => s + Math.max(0, r.balance), 0);
  return (
    <div className="anim-pop">
      <PageHeader title="Guest billing & invoices" icon="Receipt" desc="Every guest’s room bill: charges, payments, taxes (service charge, TDL and VAT) and what is still due. Open one to take payment, print the bill or check out." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="In-house bills" value={data.filter((r) => r.status === 'checked_in').length} /><Kpi label="Still to collect" value={due} fmt="money" tone="warn" /><Kpi label="Invoiced (checked out)" value={data.filter((r) => r.status === 'checked_out').reduce((s, r) => s + r.total, 0)} fmt="money" /><Kpi label="Advance deposits held" value={data.filter((r) => r.status === 'confirmed').reduce((s, r) => s + r.paid, 0)} fmt="money" /></div>
      <div className="mb-3"><Tabs value={tab} onChange={setTab} tabs={[{ key: 'checked_in', label: 'In-house', count: data.filter((r) => r.status === 'checked_in').length }, { key: 'confirmed', label: 'Upcoming (deposits)', count: data.filter((r) => r.status === 'confirmed').length }, { key: 'checked_out', label: 'Invoiced', count: data.filter((r) => r.status === 'checked_out').length }, { key: 'all', label: 'All' }]} /></div>
      <DataTable rows={rows} exportName="guest-billing" onRowClick={(r) => setFolio(r.id)} cols={[{ key: 'number', label: tab === 'checked_out' ? 'Invoice' : 'Booking', render: (r) => <b>{r.status === 'checked_out' ? 'INV-' + r.number.replace('BK-', '') : r.number}</b> }, { key: 'guest', label: 'Guest' }, { key: 'room', label: 'Room' }, { key: 'check_in', label: 'Stay', render: (r) => `${date(r.check_in)} → ${date(r.check_out)}` }, { key: 'total', label: 'Total', render: (r) => money(r.total), className: 'text-right' }, { key: 'paid', label: 'Paid', render: (r) => money(r.paid), className: 'text-right' }, { key: 'balance', label: 'Balance', render: (r) => <b className={r.balance > 0 ? 'text-bad' : 'text-ok'}>{r.balance > 0 ? money(r.balance) : 'Paid'}</b>, className: 'text-right' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> }]} />
      <FolioDrawer id={folio} onClose={() => setFolio(null)} />
    </div>
  );
}

// ------------------------------------------------------------------ ROOM QR CODES
export function RoomQRCodes() {
  const rooms = useList('rooms'); const { me } = useAuth(); const slug = me?.business?.slug;
  const codes = useAsync<Record<string, string>>(async () => { const out: any = {}; for (const r of rooms.data || []) out[r.id] = await QRCode.toDataURL(`${location.origin}/room/${slug}/${r.number}`, { margin: 1, width: 260, color: { dark: '#0E2A2D' } }); return out; }, [rooms.data?.length, slug]);
  if (!rooms.data) return <Spinner />;
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Room QR codes" icon="QrCode" desc="Put one card in each room. Guests scan it to order room service from the menu and to ask for towels, cleaning, repairs, late check-out or a taxi." actions={<button className="btn-primary no-print" onClick={() => window.print()}><Printer className="h-4 w-4" />Print all room cards</button>} />
      <Help>Orders go straight to the kitchen display and are added to the guest’s room bill when served. Requests appear on the Front desk, Housekeeping and Guest requests screens with a sound alert. Only checked-in rooms can order.</Help>
      <div className="print-area grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {rooms.data.slice().sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((r) => (
          <div key={r.id} className="card break-inside-avoid p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">{me?.settings?.brand_name}</div>
            <div className="text-2xl font-bold">Room {r.number}</div>
            {codes.data?.[r.id] ? <img src={codes.data[r.id]} alt={`QR code for room ${r.number}`} className="mx-auto my-2 h-36 w-36" /> : <div className="mx-auto my-2 h-36 w-36 animate-pulse rounded bg-paper" />}
            <div className="text-xs text-muted">Scan for room service, requests & taxis</div>
            <a className="no-print mt-2 inline-block text-xs font-semibold text-brand" href={`/room/${slug}/${r.number}`} target="_blank" rel="noreferrer">Test it</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ WEBSITE EDITOR
export function WebsiteSettings() {
  const { me, refresh } = useAuth(); const toast = useToast();
  const rooms = useList('room_types'); const services = useList('extra_services'); const menu = useList('menu_items');
  const [w, setW] = useState<any>(null); const [tab, setTab] = useState('hero'); const [dirty, setDirty] = useState(false);
  useEffect(() => { if (me?.settings && !w) setW(JSON.parse(JSON.stringify(me.settings.website || {}))); }, [me?.settings]);
  if (!w || !rooms.data || !services.data) return <Spinner />;
  const set = (patch: any) => { setW({ ...w, ...patch }); setDirty(true); };
  const save = async () => { try { await api.action('saveSettings', { website: w }); await refresh(); setDirty(false); toast.ok('Website updated — guests see the changes now.'); } catch (e: any) { toast.err(/quota|storage/i.test(e?.message || '') ? 'Not enough space for that many large photos in the demo. Use fewer photos or web links.' : e); } };
  const upd = async (col: string, id: string, patch: any, msg = 'Saved.') => { try { await api.update(col, id, patch); toast.ok(msg); } catch (e) { toast.err(e); } };
  const T = (k: string, l: string, rows = 0) => <Field label={l}>{rows ? <textarea className="input" rows={rows} value={w[k] || ''} onChange={(e) => set({ [k]: e.target.value })} /> : <input className="input" value={w[k] || ''} onChange={(e) => set({ [k]: e.target.value })} />}</Field>;
  const listImg = (k: string, i: number, v: string) => { const arr = [...(w[k] || [])]; if (v) arr[i] = v; else arr.splice(i, 1); set({ [k]: arr }); };
  const tabs = [['hero', 'Top banner'], ['welcome', 'Welcome'], ['rooms', 'Rooms'], ['dining', 'Dining & menu'], ['exp', 'Wellness & tours'], ['explore', 'Explore Kandy'], ['reviews', 'Reviews'], ['contact', 'Contact & map']];
  return (
    <div className="anim-pop">
      <PageHeader title="Website editor" icon="Image" desc="Change any text or photo on the public website. Press Save — guests see it straight away." help={<>Pick a section from the tabs. Change the words in the boxes and upload photos from your phone or computer (or paste a web link). <b>Rooms</b>, <b>menu</b> and <b>services</b> save as soon as you change them. Other sections save when you press <b>Save website</b>.</>}
        actions={<><a href="/" target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink className="h-4 w-4" />Open website</a><button className="btn-primary" disabled={!dirty} onClick={save}><Save className="h-4 w-4" />{dirty ? 'Save website' : 'Saved'}</button></>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={tabs.map(([k, l]) => ({ key: k, label: l }))} /></div>
      {tab === 'hero' && <div className="space-y-4"><div className="card grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2">{T('hero_title', 'Big headline')}</div>{T('hero_tagline', 'Line under the headline (gold italic)')}<div />{<div className="sm:col-span-2">{T('hero_subtitle', 'Short introduction', 3)}</div>}</div>
        <Card title={`Slideshow photos (${(w.hero_slides || []).length} of 6)`} actions={(w.hero_slides || []).length < 6 && <button className="btn-secondary btn-sm" onClick={() => set({ hero_slides: [...(w.hero_slides || []), ''] })}>Add a photo</button>}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(w.hero_slides || []).map((src: string, i: number) => <div key={i}><div className="mb-1 text-xs font-semibold text-muted">Photo {i + 1}</div><ImageInput value={src} onChange={(v) => listImg('hero_slides', i, v)} /></div>)}</div><p className="mt-3 text-xs text-muted">Wide landscape photos look best. The first photo shows first.</p></Card></div>}
      {tab === 'welcome' && <div className="space-y-4"><div className="card grid gap-4 p-5">{T('welcome_title', 'Section title')}{T('about', 'About the resort', 5)}</div><Card title="Three photos"><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <ImageInput key={i} value={(w.welcome_photos || [])[i]} onChange={(v) => { const a = [...(w.welcome_photos || [])]; a[i] = v; set({ welcome_photos: a }); }} />)}</div></Card></div>}
      {tab === 'rooms' && <div className="space-y-4"><div className="card p-5">{T('rooms_title', 'Section title')}</div>{rooms.data.map((r) => <RoomEditor key={r.id} r={r} onSave={(patch: any) => upd('room_types', r.id, patch, `${r.name} updated.`)} />)}</div>}
      {tab === 'dining' && <div className="space-y-4"><div className="card grid gap-4 p-5">{T('dining_title', 'Section title')}{T('dining_text', 'Text', 4)}</div><Card title="Dining photos"><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <ImageInput key={i} value={(w.dining_photos || [])[i]} onChange={(v) => { const a = [...(w.dining_photos || [])]; a[i] = v; set({ dining_photos: a }); }} />)}</div></Card>
        <Card title="Menu photos & descriptions" actions={<Link to="/app/e/menu_items" className="text-xs font-semibold text-brand">Open full menu editor →</Link>}><p className="mb-3 text-sm text-muted">The chef and restaurant manager can also change these from Restaurant → Menu items. Changes appear on the website and QR menus immediately.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(menu.data || []).slice(0, 12).map((m) => <div key={m.id} className="rounded-xl border border-line p-2"><ImageInput value={m.image} aspect="aspect-[4/3]" label="dish photo" onChange={(v) => upd('menu_items', m.id, { image: v }, `${m.name} photo updated.`)} /><div className="mt-2 px-1 text-sm font-semibold">{m.name}</div></div>)}</div></Card></div>}
      {tab === 'exp' && <div className="space-y-4"><div className="card grid gap-4 p-5">{T('exp_title', 'Section title')}{T('exp_text', 'Text', 2)}</div><div className="grid gap-3 md:grid-cols-2">{services.data.map((sv) => <div key={sv.id} className="card space-y-2 p-3"><ImageInput value={sv.image} aspect="aspect-[16/9]" onChange={(v) => upd('extra_services', sv.id, { image: v }, 'Photo updated.')} /><div className="grid grid-cols-[1fr_120px] gap-2"><input className="input" defaultValue={sv.name} onBlur={(e) => e.target.value !== sv.name && upd('extra_services', sv.id, { name: e.target.value })} aria-label="Service name" /><input className="input" type="number" defaultValue={sv.price} onBlur={(e) => Number(e.target.value) !== sv.price && upd('extra_services', sv.id, { price: Number(e.target.value) })} aria-label="Price" /></div></div>)}</div></div>}
      {tab === 'explore' && <div className="space-y-4"><div className="card p-5">{T('explore_title', 'Section title')}</div>{(w.explore || []).map((x: any, i: number) => <div key={i} className="card grid gap-4 p-4 md:grid-cols-[260px_1fr]"><ImageInput value={x.image} onChange={(v) => { const a = [...w.explore]; a[i] = { ...x, image: v }; set({ explore: a }); }} /><div className="space-y-3"><Field label="Place"><input className="input" value={x.title} onChange={(e) => { const a = [...w.explore]; a[i] = { ...x, title: e.target.value }; set({ explore: a }); }} /></Field><Field label="Short description"><textarea className="input" rows={3} value={x.text} onChange={(e) => { const a = [...w.explore]; a[i] = { ...x, text: e.target.value }; set({ explore: a }); }} /></Field><button className="btn-ghost btn-sm text-bad" onClick={() => set({ explore: w.explore.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-4 w-4" />Remove this place</button></div></div>)}<button className="btn-secondary" onClick={() => set({ explore: [...(w.explore || []), { title: 'New place', text: '', image: '' }] })}>Add a place</button></div>}
      {tab === 'reviews' && <div className="space-y-4"><div className="card p-5">{T('reviews_title', 'Section title')}</div><Card title="Background photo"><div className="max-w-xl"><ImageInput value={w.reviews_photo} onChange={(v) => set({ reviews_photo: v })} /></div></Card><Help>The website shows your latest 4- and 5-star reviews from <Link className="text-brand underline" to="/app/e/feedback">Guest feedback</Link>. Edit or hide reviews there.</Help></div>}
      {tab === 'contact' && <div className="card grid gap-4 p-5 sm:grid-cols-2">{T('phone', 'Phone')}{T('whatsapp', 'WhatsApp number (e.g. 94771234567)')}{T('email', 'Email')}{T('map_query', 'Google Maps search text')}<div className="sm:col-span-2"><Help>The address shown on the website comes from <Link className="text-brand underline" to="/app/settings">Hotel settings</Link>.</Help></div></div>}
      {void Upload}{void ImageIcon}{void Globe}{void Receipt}{void useConfirm}{void useMemo}{void Empty}
    </div>
  );
}
function RoomEditor({ r, onSave }: any) {
  const [d, setD] = useState({ name: r.name, description: r.description || '', base_rate: r.base_rate });
  const changed = d.name !== r.name || d.description !== (r.description || '') || Number(d.base_rate) !== r.base_rate;
  return (
    <div className="card grid gap-4 p-4 md:grid-cols-[300px_1fr]">
      <ImageInput value={r.image} aspect="aspect-[4/3]" label="room photo" onChange={(v) => onSave({ image: v })} />
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><Field label="Room name"><input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field><Field label="Price per night"><input className="input" type="number" value={d.base_rate} onChange={(e) => setD({ ...d, base_rate: e.target.value })} /></Field></div>
        <Field label="Description"><textarea className="input" rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
        <button className="btn-primary btn-sm" disabled={!changed} onClick={() => onSave({ ...d, base_rate: Number(d.base_rate) })}><Save className="h-4 w-4" />Save room</button>
      </div>
    </div>
  );
}
