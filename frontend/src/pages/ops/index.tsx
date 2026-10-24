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
      <PageHeader title="Channel manager" icon="Share2" desc="One place for room availability and prices on Booking.com, Agoda, Expedia, Google, Airbnb and your own website. When a room sells anywhere, every channel is updated." help={<>The grid shows how many rooms of each type are still free each night and the price sent to channels (from <Link className="text-brand underline" to="/app/e/rate_plans">Rate plans</Link>). <b>Push</b> sends the latest numbers to every connected channel. OTA bookings arrive in Reservations with the channel’s booking reference. <b>Demo note:</b> pushes are recorded and queued here; they reach the real channels once your channel-manager account (e.g. SiteMinder, STAAH, Cloudbeds) is connected in the backend phase.</>}
        actions={can('channels', 'e') && <><button className="btn-secondary" disabled={busy} onClick={() => push('Rate update')}>Push rates</button><button className="btn-primary" disabled={busy} onClick={() => push('Full sync')}><Send className="h-4 w-4" />Push availability & rates</button></>} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{data.channels.map((c: any) => <div key={c.id} className="card p-3"><div className="flex items-center justify-between"><b className="text-sm">{c.name}</b><Status value={c.status} /></div><div className="mt-1 text-xs text-muted">Commission {c.commission}% · synced {c.last_sync ? dateTime(c.last_sync) : 'never'}</div></div>)}</div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">Rooms free & price per night</h2><div className="flex gap-1"><button className="btn-ghost btn-sm" onClick={() => setStart(addDays(start, -7))} aria-label="Earlier"><ChevronLeft className="h-4 w-4" /></button><button className="btn-ghost btn-sm" onClick={() => setStart(today())}>Today</button><button className="btn-ghost btn-sm" onClick={() => setStart(addDays(start, 7))} aria-label="Later"><ChevronRight className="h-4 w-4" /></button></div></div>
        <div className="thin-scroll overflow-x-auto"><table className="w-full min-w-[900px] text-xs">
          <thead className="bg-paper/70"><tr><th className="th">Room type</th>{data.dates.map((d: string) => { const dt = new Date(d + 'T12:00'); return <th key={d} className={`th text-center ${[0, 6].includes(dt.getDay()) ? 'bg-paper' : ''}`}>{dt.toLocaleDateString('en', { weekday: 'short' })}<br />{dt.getDate()}</th>; })}</tr></thead>
          <tbody>{data.types.map((t: any) => <tr key={t.id} className="border-t border-line"><td className="td whitespace-nowrap font-semibold">{t.name}<div className="text-[11px] font-normal text-muted">{t.total} rooms</div></td>{t.cells.map((c: any) => <td key={c.date} className="px-1 py-1.5 text-center"><div className={`rounded-md px-1 py-1 font-bold ${c.available === 0 ? 'bg-bad/10 text-bad' : c.available <= 1 ? 'bg-saffron/15 text-warn' : 'bg-ok/10 text-ok'}`}>{c.available === 0 ? 'Full' : c.available}</div><div className="mt-0.5 text-[10px] text-muted">{money(c.rate, { short: true })}</div></td>)}</tr>)}</tbody>
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

// ------------------------------------------------------------------ WEBSITE & PHOTOS
const PHOTO_SLOTS: [string, string][] = [['hero', 'Main banner (hero)'], ['pool', 'Swimming pool'], ['restaurant', 'Restaurant'], ['spa', 'Ayurveda & spa'], ['garden', 'Garden & terrace'], ['kandy', 'Kandy / surroundings']];
function resize(file: File, max = 1400): Promise<string> {
  return new Promise((resolve, reject) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.78)); }; img.onerror = reject; img.src = url; });
}
export function WebsiteSettings() {
  const { me, refresh } = useAuth(); const toast = useToast(); const types = useList('room_types');
  const [w, setW] = useState<any>(null);
  useEffect(() => { if (me?.settings && !w) setW({ hero_title: 'Ceylon Ayu Resort Kandy', hero_subtitle: 'A peaceful garden resort with an outdoor pool, just 3 km from Kandy railway station — close to the Temple of the Tooth, Kandy Lake and the Royal Botanical Gardens.', about: 'Set among gardens on the edge of Kandy, Ceylon Ayu Resort is a calm base for exploring Sri Lanka’s hill capital. Relax by the outdoor pool, enjoy our terrace and garden, and dine on Sri Lankan, seafood and Irish favourites at our restaurant. Free private parking for every guest.', phone: me.settings.phone, whatsapp: '', email: me.settings.email, map_query: 'Ceylon Ayu Resort Kandy', photos: {}, room_photos: {}, ...(me.settings.website || {}) }); }, [me?.settings]);
  if (!w) return <Spinner />;
  const save = async (next = w) => { try { await api.action('saveSettings', { website: next }); await refresh(); toast.ok('Website saved.'); } catch (e: any) { toast.err(e?.message?.includes('quota') ? 'Not enough browser space for more photos. Use fewer or smaller photos.' : e); } };
  const upload = async (file: File | undefined, apply: (url: string) => any) => { if (!file) return; try { const url = await resize(file); const next = apply(url); setW(next); await save(next); } catch { toast.err('That file could not be read as an image.'); } };
  const Slot = ({ label, url, onFile, onClear }: any) => (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="relative grid aspect-video place-items-center bg-paper">{url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-muted" />}</div>
      <div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-sm font-medium">{label}</span><span className="flex gap-1"><label className="btn-secondary btn-sm cursor-pointer"><Upload className="h-4 w-4" />{url ? 'Change' : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>{url && <button className="btn-ghost btn-sm text-bad" onClick={onClear} aria-label="Remove photo"><Trash2 className="h-4 w-4" /></button>}</span></div>
    </div>
  );
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Website & photos" icon="Image" desc="Edit the public website guests see — the headline, description, contact details and photos for every section and room type." actions={<><a href="/" target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink className="h-4 w-4" />View website</a><button className="btn-primary" onClick={() => save()}><Save className="h-4 w-4" />Save text</button></>} />
      <Help>The website starts with high-quality free photos of Kandy and resort life (Unsplash licence — free for commercial use). Replace any of them with your own resort photos: tap <b>Change</b> and choose a photo from your phone or computer. Photos are resized automatically. In the demo, photos are stored in this browser; after the backend is connected they are stored on the server for everyone.</Help>
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Headline"><input className="input" value={w.hero_title} onChange={(e) => setW({ ...w, hero_title: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="Short introduction (under the headline)"><textarea className="input" value={w.hero_subtitle} onChange={(e) => setW({ ...w, hero_subtitle: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="About the resort"><textarea className="input min-h-[110px]" value={w.about} onChange={(e) => setW({ ...w, about: e.target.value })} /></Field></div>
        <Field label="Phone"><input className="input" value={w.phone || ''} onChange={(e) => setW({ ...w, phone: e.target.value })} /></Field>
        <Field label="WhatsApp number (with country code)"><input className="input" value={w.whatsapp || ''} onChange={(e) => setW({ ...w, whatsapp: e.target.value })} placeholder="94771234567" /></Field>
        <Field label="Email"><input className="input" value={w.email || ''} onChange={(e) => setW({ ...w, email: e.target.value })} /></Field>
        <Field label="Google Maps search text"><input className="input" value={w.map_query || ''} onChange={(e) => setW({ ...w, map_query: e.target.value })} /></Field>
      </div>
      <h2 className="font-semibold">Section photos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PHOTO_SLOTS.map(([k, l]) => <Slot key={k} label={l} url={w.photos?.[k] || (DEF as any)[k] || ''} onFile={(f: File) => upload(f, (u) => ({ ...w, photos: { ...w.photos, [k]: u } }))} onClear={() => { const n = { ...w, photos: { ...w.photos, [k]: '' } }; setW(n); save(n); }} />)}</div>
      <h2 className="font-semibold">Room type photos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(types.data || []).map((t, i) => <Slot key={t.id} label={t.name} url={w.room_photos?.[t.id] || P.rooms[i % P.rooms.length]} onFile={(f: File) => upload(f, (u) => ({ ...w, room_photos: { ...w.room_photos, [t.id]: u } }))} onClear={() => { const n = { ...w, room_photos: { ...w.room_photos, [t.id]: '' } }; setW(n); save(n); }} />)}</div>
      {void Globe}{void Receipt}{void useConfirm}{void useMemo}{void Empty}
    </div>
  );
}
