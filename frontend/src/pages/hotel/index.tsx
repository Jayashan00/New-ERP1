import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, LogOut, CalendarPlus, Sparkles, Wrench, ChevronLeft, ChevronRight, MoonStar, Check, Copy, ExternalLink, BedDouble, Users } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { useAsync, useList, useLookups } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, Spinner, ErrorBox, Status, Kpi, Card, Field, Tabs, Empty, Help, useConfirm } from '@/components/ui';
import { FolioDrawer } from '@/components/Folio';
import { ChartCard } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { money, date, today, addDays, nightsBetween, pretty, num } from '@/lib/format';

const ROOM_STYLE: Record<string, string> = {
  available: 'border-ok/40 bg-ok/10 text-ok', occupied: 'border-info/40 bg-info/10 text-info', reserved: 'border-saffron/50 bg-saffron-soft text-warn',
  dirty: 'border-bad/40 bg-bad/10 text-bad', cleaning: 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#7C3AED]', out_of_order: 'border-muted/40 bg-muted/10 text-muted',
};
const STATUS_TEXT: Record<string, string> = { available: 'Clean & free', occupied: 'Guest in room', reserved: 'Arriving today', dirty: 'Needs cleaning', cleaning: 'Being cleaned', out_of_order: 'Out of order' };
export const Legend = () => <div className="flex flex-wrap gap-2 text-xs">{Object.entries(STATUS_TEXT).map(([k, v]) => <span key={k} className={`chip border ${ROOM_STYLE[k]}`}>{v}</span>)}</div>;

// ------------------------------------------------------------------ FRONT DESK
export function FrontDesk() {
  const rooms = useList('rooms'); const res = useList('reservations');
  const { maps } = useLookups(['customers', 'room_types']);
  const { can } = useAuth(); const nav = useNavigate(); const toast = useToast();
  const [folio, setFolio] = useState<string | null>(null);
  const [tab, setTab] = useState('arrivals');
  const [floor, setFloor] = useState('all');
  if (rooms.error || res.error) return <ErrorBox error={rooms.error || res.error} />;
  if (!rooms.data || !res.data) return <Spinner />;
  const t = today();
  const R = res.data;
  const arrivals = R.filter((r) => r.check_in === t && ['confirmed', 'tentative'].includes(r.status));
  const departures = R.filter((r) => r.check_out <= t && r.status === 'checked_in');
  const inHouse = R.filter((r) => r.status === 'checked_in');
  const resOfRoom = (id: string) => inHouse.find((r) => r.room_id === id) || arrivals.find((r) => r.room_id === id);
  const floors = [...new Set(rooms.data.map((r) => r.floor))].sort();
  const list = tab === 'arrivals' ? arrivals : tab === 'departures' ? departures : inHouse;
  const counts = rooms.data.reduce((m: any, r: any) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
  const quick = async (room: any, status: string) => { try { await api.action('setRoomStatus', { room_id: room.id, status }); toast.ok(`Room ${room.number} → ${STATUS_TEXT[status]}`); } catch (e) { toast.err(e); } };
  return (
    <div className="anim-pop">
      <PageHeader title="Front desk" icon="ConciergeBell" desc="Every room at a glance. Click a room to open the guest’s bill, check them in or out." help={<>Colours show each room’s state. <b>Green</b> rooms can be sold right now. Arrivals and departures for today are listed on the right — click a name to open the folio, then use <b>Check in</b> / <b>Check out</b>.</>}
        actions={<>{can('reservations', 'c') && <button className="btn-primary" onClick={() => nav('/app/new-booking')}><CalendarPlus className="h-4 w-4" />New booking</button>}<button className="btn-secondary" onClick={() => nav('/app/room-chart')}>Room chart</button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Arrivals today" value={arrivals.length} icon="LogIn" />
        <Kpi label="Departures today" value={departures.length} icon="LogOut" />
        <Kpi label="In-house" value={inHouse.length} icon="BedDouble" />
        <Kpi label="Clean & free" value={counts.available || 0} tone="ok" />
        <Kpi label="Occupancy" value={Math.round((inHouse.length / rooms.data.length) * 100)} fmt="percent" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card title={<div className="flex flex-wrap items-center gap-3">Rooms <select className="input w-auto py-1 text-xs" value={floor} onChange={(e) => setFloor(e.target.value)} aria-label="Floor"><option value="all">All floors</option>{floors.map((f) => <option key={f} value={f}>Floor {f}</option>)}</select></div>} actions={<span className="hidden md:block"><Legend /></span>}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
            {rooms.data.filter((r) => floor === 'all' || String(r.floor) === floor).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((room) => {
              const rr = resOfRoom(room.id);
              return (
                <div key={room.id} className={`group relative rounded-xl border-2 p-2.5 ${ROOM_STYLE[room.status]}`}>
                  <button className="block w-full text-left" onClick={() => (rr ? setFolio(rr.id) : room.status === 'available' && can('reservations', 'c') ? nav('/app/new-booking?room=' + room.id) : null)}>
                    <div className="flex items-center justify-between"><span className="text-lg font-bold text-ink">{room.number}</span>{rr?.status === 'checked_in' && rr.check_out <= t && <LogOut className="h-4 w-4 text-bad" aria-label="Leaving today" />}</div>
                    <div className="truncate text-[11px] text-muted">{maps.room_types?.[room.room_type_id]}</div>
                    <div className="mt-1 truncate text-xs font-semibold">{rr ? maps.customers?.[rr.guest_id] : STATUS_TEXT[room.status]}</div>
                  </button>
                  {can('rooms', 'e') && <select aria-label={`Change status of room ${room.number}`} className="mt-1.5 w-full rounded-md border border-line bg-surface px-1 py-0.5 text-[11px] text-ink opacity-80 group-hover:opacity-100" value={room.status} onChange={(e) => quick(room, e.target.value)}>{Object.keys(STATUS_TEXT).map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}</select>}
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Today" pad={false}>
          <div className="p-3"><Tabs value={tab} onChange={setTab} tabs={[{ key: 'arrivals', label: 'Arriving', count: arrivals.length }, { key: 'departures', label: 'Leaving', count: departures.length }, { key: 'inhouse', label: 'In-house', count: inHouse.length }]} /></div>
          <ul className="thin-scroll max-h-[560px] overflow-y-auto">
            {list.map((r) => (
              <li key={r.id} className="flex items-center gap-3 border-t border-line px-4 py-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setFolio(r.id)}>
                  <div className="truncate text-sm font-semibold">{maps.customers?.[r.guest_id]}</div>
                  <div className="text-xs text-muted">Room {rooms.data!.find((x) => x.id === r.room_id)?.number || '—'} · {nightsBetween(r.check_in, r.check_out)} nights · {r.source}</div>
                </button>
                {tab === 'arrivals' && can('reservations', 'e') && <button className="btn-primary btn-sm" onClick={async () => { try { const x = await api.action('checkIn', { reservation_id: r.id }); toast.ok(x.message); } catch (e) { toast.err(e); } }}><LogIn className="h-4 w-4" />Check in</button>}
                {tab === 'departures' && <button className="btn-secondary btn-sm" onClick={() => setFolio(r.id)}><LogOut className="h-4 w-4" />Check out</button>}
              </li>
            ))}
            {!list.length && <li className="px-4 py-10 text-center text-sm text-muted">Nobody {tab === 'arrivals' ? 'arriving' : tab === 'departures' ? 'leaving' : 'in-house'} right now.</li>}
          </ul>
        </Card>
      </div>
      <FolioDrawer id={folio} onClose={() => setFolio(null)} />
    </div>
  );
}

// ------------------------------------------------------------------ ROOM CHART (tape chart)
export function RoomChart() {
  const rooms = useList('rooms'); const res = useList('reservations');
  const { maps } = useLookups(['customers', 'room_types']);
  const [start, setStart] = useState(() => addDays(today(), -2));
  const [folio, setFolio] = useState<string | null>(null);
  const nav = useNavigate(); const { can } = useAuth();
  const DAYS = 21;
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(start, i)), [start]);
  if (rooms.error || res.error) return <ErrorBox error={rooms.error || res.error} />;
  if (!rooms.data || !res.data) return <Spinner />;
  const color: Record<string, string> = { confirmed: 'bg-saffron text-ink', tentative: 'bg-saffron/50 text-ink', checked_in: 'bg-info text-white', checked_out: 'bg-muted/50 text-white' };
  const end = addDays(start, DAYS);
  const live = res.data.filter((r) => !['cancelled', 'no_show'].includes(r.status) && r.check_in < end && r.check_out > start);
  const W = 44;
  return (
    <div className="anim-pop">
      <PageHeader title="Room chart" icon="CalendarRange" desc="Bookings per room across the next three weeks. Click an empty cell to book that room from that date." help={<>Each bar is a stay. <b>Blue</b> = guest in house, <b>gold</b> = confirmed, light gold = tentative, grey = already left. Click a bar to open the bill.</>}
        actions={<><button className="btn-secondary btn-sm" onClick={() => setStart(addDays(start, -7))} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button><button className="btn-secondary btn-sm" onClick={() => setStart(addDays(today(), -2))}>Today</button><button className="btn-secondary btn-sm" onClick={() => setStart(addDays(start, 7))} aria-label="Next week"><ChevronRight className="h-4 w-4" /></button></>} />
      <div className="card thin-scroll overflow-x-auto">
        <div style={{ minWidth: 110 + DAYS * W }}>
          <div className="sticky top-0 z-10 flex border-b border-line bg-surface">
            <div className="w-[110px] shrink-0 px-3 py-2 text-xs font-semibold text-muted">Room</div>
            {days.map((d) => { const dt = new Date(d + 'T12:00'); const we = [0, 6].includes(dt.getDay()); return <div key={d} style={{ width: W }} className={`shrink-0 border-l border-line py-1 text-center text-[11px] ${d === today() ? 'bg-brand text-white' : we ? 'bg-paper' : ''}`}><div className="font-semibold">{dt.getDate()}</div><div className="opacity-70">{dt.toLocaleDateString('en', { weekday: 'narrow' })}</div></div>; })}
          </div>
          {rooms.data.slice().sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((room) => (
            <div key={room.id} className="relative flex h-10 border-b border-line">
              <div className="flex w-[110px] shrink-0 items-center gap-2 px-3 text-sm"><b>{room.number}</b><span className="truncate text-[11px] text-muted">{maps.room_types?.[room.room_type_id]?.split(' ')[0]}</span></div>
              {days.map((d) => <button key={d} style={{ width: W }} className="shrink-0 border-l border-line hover:bg-brand-soft" aria-label={`Book room ${room.number} from ${d}`} onClick={() => can('reservations', 'c') && d >= today() && nav(`/app/new-booking?room=${room.id}&in=${d}`)} />)}
              {live.filter((r) => r.room_id === room.id).map((r) => {
                const s = Math.max(0, nightsBetween(start, r.check_in) * (r.check_in < start ? -1 : 1)); const from = r.check_in < start ? 0 : Math.round((+new Date(r.check_in) - +new Date(start)) / 864e5);
                const to = Math.min(DAYS, Math.round((+new Date(r.check_out) - +new Date(start)) / 864e5)); void s;
                return <button key={r.id} onClick={() => setFolio(r.id)} className={`absolute top-1.5 h-7 truncate rounded-md px-2 text-left text-[11px] font-semibold shadow-sm ${color[r.status] || 'bg-brand text-white'}`} style={{ left: 110 + from * W + W / 2, width: Math.max(20, (to - from) * W - 4) }} title={`${maps.customers?.[r.guest_id]} · ${r.number}`}>{maps.customers?.[r.guest_id]}</button>;
              })}
            </div>
          ))}
        </div>
      </div>
      <FolioDrawer id={folio} onClose={() => setFolio(null)} />
    </div>
  );
}

// ------------------------------------------------------------------ NEW BOOKING (wizard)
export function NewBooking() {
  const params = new URLSearchParams(location.search);
  const [step, setStep] = useState(1);
  const [f, setF] = useState<any>({ check_in: params.get('in') || today(), check_out: addDays(params.get('in') || today(), 1), adults: 2, children: 0, meal_plan: 'BB', source: 'Walk-in', room_id: params.get('room') || '', guest_id: '', guest: { title: 'Mr', first_name: '', last_name: '', phone: '', email: '', nationality: 'Sri Lankan', country: 'Sri Lanka', id_type: 'NIC', id_number: '', address: '', date_of_birth: '', purpose: 'Leisure' }, ota_ref: '', arrival_time: '', vehicle_no: '', parking_slot_id: '', advance: 0, advance_method: 'Card', special_requests: '', check_in_now: false, status: 'confirmed' });
  const parking = useList('parking_slots', { optional: true });
  const types = useList('room_types', { optional: true });
  const custs = useLookups(['customers', 'travel_agents']);
  const avail = useAsync<any[]>(() => (f.check_out > f.check_in ? api.action('availableRooms', { check_in: f.check_in, check_out: f.check_out }) : Promise.resolve([])), [f.check_in, f.check_out]);
  const toast = useToast(); const nav = useNavigate();
  const [folio, setFolio] = useState<string | null>(null);
  const n = f.check_out > f.check_in ? nightsBetween(f.check_in, f.check_out) : 0;
  const room = avail.data?.find((r) => r.id === f.room_id);
  const rt = types.data?.find((t) => t.id === room?.room_type_id);
  const rate = Number(f.rate || rt?.base_rate || 0);
  const isToday = f.check_in === today();
  const submit = async () => {
    try { const r = await api.action('createBooking', { ...f, rate, guest_id: f.guest_id || undefined, guest: f.guest_id ? undefined : f.guest }); toast.ok(`Booking ${r.number} saved${f.check_in_now ? ' and guest checked in' : ''}.`); setFolio(r.id); setStep(1); setF({ ...f, room_id: '', guest_id: '', guest: { ...f.guest, first_name: '', last_name: '', phone: '', email: '', id_number: '', address: '' }, ota_ref: '', vehicle_no: '', parking_slot_id: '', advance: 0, special_requests: '' }); }
    catch (e) { toast.err(e); }
  };
  const steps = ['Dates & guests', 'Choose a room', 'Guest details', 'Confirm'];
  return (
    <div className="anim-pop mx-auto max-w-4xl">
      <PageHeader title="New booking" icon="CalendarPlus" desc="Four short steps. Only rooms free for the whole stay are shown." />
      <ol className="mb-5 grid grid-cols-4 gap-2">{steps.map((s, i) => <li key={s}><button disabled={i + 1 > step} onClick={() => setStep(i + 1)} className={`w-full rounded-lg border-b-4 px-2 pb-2 pt-1 text-left text-xs font-semibold sm:text-sm ${step === i + 1 ? 'border-brand text-ink' : i + 1 < step ? 'border-brand/40 text-muted' : 'border-line text-muted'}`}><span className="mr-1 text-muted">{i + 1}.</span>{s}</button></li>)}</ol>
      <div className="card p-5">
        {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in" required><input type="date" className="input" min={today()} value={f.check_in} onChange={(e) => setF({ ...f, check_in: e.target.value, check_out: e.target.value >= f.check_out ? addDays(e.target.value, 1) : f.check_out, room_id: '' })} /></Field>
          <Field label="Check-out" required hint={n ? `${n} night${n > 1 ? 's' : ''}` : 'Must be after check-in'}><input type="date" className="input" min={addDays(f.check_in, 1)} value={f.check_out} onChange={(e) => setF({ ...f, check_out: e.target.value, room_id: '' })} /></Field>
          <Field label="Adults"><input type="number" min={1} className="input" value={f.adults} onChange={(e) => setF({ ...f, adults: e.target.value })} /></Field>
          <Field label="Children"><input type="number" min={0} className="input" value={f.children} onChange={(e) => setF({ ...f, children: e.target.value })} /></Field>
          <Field label="Meal plan"><select className="input" value={f.meal_plan} onChange={(e) => setF({ ...f, meal_plan: e.target.value })}>{[['RO', 'Room only'], ['BB', 'Bed & breakfast'], ['HB', 'Half board'], ['FB', 'Full board'], ['AI', 'All inclusive']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Booked via"><select className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{['Walk-in', 'Phone', 'Website', 'Booking.com', 'Agoda', 'Expedia', 'Airbnb', 'Travel agent', 'Corporate'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          {['Travel agent', 'Corporate'].includes(f.source) && <Field label="Agent / company"><select className="input" value={f.agent_id || ''} onChange={(e) => setF({ ...f, agent_id: e.target.value })}><option value="">Choose…</option>{(custs.lists.travel_agents || []).map((a: any) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Field>}
          <div className="flex justify-end sm:col-span-2"><button className="btn-primary" disabled={!n} onClick={() => setStep(2)}>Show free rooms</button></div>
        </div>}
        {step === 2 && (avail.loading ? <Spinner /> : <div>
          <p className="mb-4 text-sm text-muted">{avail.data?.length} rooms free from {date(f.check_in)} to {date(f.check_out)}.</p>
          {(types.data || []).map((t) => { const rs = (avail.data || []).filter((r) => r.room_type_id === t.id); if (!rs.length) return null; return (
            <div key={t.id} className="mb-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{t.name}</h3><span className="text-sm text-muted">{money(t.base_rate)} / night · up to {t.max_adults} adults · {(t.amenities || []).join(', ')}</span></div>
              <div className="flex flex-wrap gap-2">{rs.map((r) => <button key={r.id} onClick={() => setF({ ...f, room_id: r.id, rate: '' })} className={`min-w-[72px] rounded-lg border-2 px-3 py-2 text-center ${f.room_id === r.id ? 'border-brand bg-brand text-white' : 'border-line hover:border-brand'}`}><div className="font-bold">{r.number}</div><div className="text-[11px] opacity-80">{STATUS_TEXT[r.status]?.split(' ')[0]} · {r.view}</div></button>)}</div>
            </div>); })}
          {!avail.data?.length && <Empty title="No rooms free" text="Try different dates." />}
          <div className="mt-4 flex justify-between"><button className="btn-secondary" onClick={() => setStep(1)}>Back</button><button className="btn-primary" disabled={!f.room_id} onClick={() => setStep(3)}>Continue</button></div>
        </div>)}
        {step === 3 && <div className="space-y-4">
          <Field label="Returning guest?" hint="Pick an existing guest, or leave empty and fill in a new one below."><select className="input" value={f.guest_id} onChange={(e) => setF({ ...f, guest_id: e.target.value })}><option value="">New guest</option>{(custs.lists.customers || []).map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
          {!f.guest_id && <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Title"><select className="input" value={f.guest.title} onChange={(e) => setF({ ...f, guest: { ...f.guest, title: e.target.value } })}>{['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Rev'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            {[['first_name', 'First name', true], ['last_name', 'Last name', true], ['phone', 'Phone'], ['email', 'Email'], ['nationality', 'Nationality'], ['country', 'Country of residence']].map(([k, l, req]: any) => <Field key={k} label={l} required={req}><input className="input" value={f.guest[k]} onChange={(e) => setF({ ...f, guest: { ...f.guest, [k]: e.target.value } })} /></Field>)}
            <Field label="ID type"><select className="input" value={f.guest.id_type} onChange={(e) => setF({ ...f, guest: { ...f.guest, id_type: e.target.value } })}>{['NIC', 'Passport', 'Driving licence', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="ID / passport number" hint="Required by law at check-in."><input className="input" value={f.guest.id_number} onChange={(e) => setF({ ...f, guest: { ...f.guest, id_number: e.target.value } })} /></Field>
            <Field label="Date of birth"><input type="date" className="input" value={f.guest.date_of_birth} onChange={(e) => setF({ ...f, guest: { ...f.guest, date_of_birth: e.target.value } })} /></Field>
            <Field label="Purpose of visit"><select className="input" value={f.guest.purpose} onChange={(e) => setF({ ...f, guest: { ...f.guest, purpose: e.target.value } })}>{['Leisure', 'Business', 'Wedding', 'Pilgrimage', 'Medical / Ayurveda', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="Home address"><input className="input" value={f.guest.address} onChange={(e) => setF({ ...f, guest: { ...f.guest, address: e.target.value } })} /></Field></div>
          </div>}
          <div className="grid gap-4 rounded-xl bg-paper p-3 sm:grid-cols-3">
            <Field label="Expected arrival time"><input type="time" className="input" value={f.arrival_time} onChange={(e) => setF({ ...f, arrival_time: e.target.value })} /></Field>
            <Field label="Vehicle number (if driving)"><input className="input uppercase" value={f.vehicle_no} onChange={(e) => setF({ ...f, vehicle_no: e.target.value })} placeholder="CAB-1234" /></Field>
            <Field label="Parking bay" hint={f.vehicle_no ? 'Held for the guest until check-in.' : 'Enter a vehicle number first.'}><select className="input" disabled={!f.vehicle_no} value={f.parking_slot_id} onChange={(e) => setF({ ...f, parking_slot_id: e.target.value })}><option value="">No parking needed</option>{(parking.data || []).filter((x: any) => x.status === 'free').map((x: any) => <option key={x.id} value={x.id}>{x.code} · {x.zone} · {x.type}</option>)}</select></Field>
            {['Booking.com', 'Agoda', 'Expedia', 'Airbnb', 'Travel agent', 'Corporate'].includes(f.source) && <Field label={`${f.source} booking reference`}><input className="input" value={f.ota_ref} onChange={(e) => setF({ ...f, ota_ref: e.target.value })} /></Field>}
          </div>
          <Field label="Special requests"><textarea className="input" value={f.special_requests} onChange={(e) => setF({ ...f, special_requests: e.target.value })} placeholder="Late arrival, extra bed, honeymoon setup…" /></Field>
          <div className="flex justify-between"><button className="btn-secondary" onClick={() => setStep(2)}>Back</button><button className="btn-primary" disabled={!f.guest_id && (!f.guest.first_name || !f.guest.last_name)} onClick={() => setStep(4)}>Continue</button></div>
        </div>}
        {step === 4 && <div className="space-y-4">
          <div className="grid gap-3 rounded-xl bg-paper p-4 text-sm sm:grid-cols-2">
            <div><span className="text-muted">Guest:</span> <b>{f.guest_id ? custs.maps.customers?.[f.guest_id] : `${f.guest.title} ${f.guest.first_name} ${f.guest.last_name}`}</b>{!f.guest_id && f.guest.id_number && <span className="text-muted"> · {f.guest.id_type} {f.guest.id_number}</span>}</div>
            <div><span className="text-muted">Room:</span> <b>{room?.number}</b> · {rt?.name}</div>
            <div><span className="text-muted">Stay:</span> {date(f.check_in)} → {date(f.check_out)} ({n} nights)</div>
            <div><span className="text-muted">Guests:</span> {f.adults} adults, {f.children} children · {f.meal_plan}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rate per night" hint={`Standard: ${money(rt?.base_rate)}`}><input type="number" className="input" value={f.rate ?? ''} placeholder={String(rt?.base_rate || '')} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
            <Field label="Advance paid now"><input type="number" className="input" value={f.advance} onChange={(e) => setF({ ...f, advance: e.target.value })} /></Field>
            <Field label="Paid with"><select className="input" value={f.advance_method} onChange={(e) => setF({ ...f, advance_method: e.target.value })}>{['Card', 'Cash', 'Bank transfer', 'Online'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Booking status"><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="confirmed">Confirmed</option><option value="tentative">Tentative (not guaranteed)</option></select></Field>
          </div>
          <div className="flex items-center justify-between rounded-xl border-2 border-brand/30 bg-brand-soft px-4 py-3"><span className="text-sm">Room total for {n} nights <span className="text-muted">(taxes added on the bill)</span></span><b className="text-xl">{money(rate * n)}</b></div>
          {isToday && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.check_in_now} onChange={(e) => setF({ ...f, check_in_now: e.target.checked })} />Guest is here — check them in now</label>}
          <div className="flex justify-between"><button className="btn-secondary" onClick={() => setStep(3)}>Back</button><button className="btn-primary" onClick={submit}><Check className="h-4 w-4" />{f.check_in_now ? 'Book & check in' : 'Confirm booking'}</button></div>
        </div>}
      </div>
      <FolioDrawer id={folio} onClose={() => { setFolio(null); nav('/app/front-desk'); }} />
    </div>
  );
}

// ------------------------------------------------------------------ HOUSEKEEPING BOARD
export function HousekeepingBoard() {
  const rooms = useList('rooms'); const tasks = useList('housekeeping');
  const { maps } = useLookups(['employees', 'room_types']);
  const { can, me } = useAuth(); const toast = useToast();
  const [mine, setMine] = useState(me?.role?.key === 'housekeeping');
  if (rooms.error || tasks.error) return <ErrorBox error={rooms.error || tasks.error} />;
  if (!rooms.data || !tasks.data) return <Spinner />;
  const open = tasks.data.filter((t) => t.status !== 'inspected' && (!mine || !t.assigned_to || t.assigned_to === me?.user?.employeeId));
  const roomNo = (id: string) => rooms.data!.find((r) => r.id === id)?.number;
  const step = async (t: any, status: string) => { try { await api.update('housekeeping', t.id, { status }); toast.ok(`Room ${roomNo(t.room_id)}: ${pretty(status)}`); } catch (e) { toast.err(e); } };
  const cols = [['pending', 'To clean'], ['in_progress', 'Cleaning now'], ['done', 'Done — to inspect']];
  return (
    <div className="anim-pop">
      <PageHeader title="Housekeeping board" icon="Sparkles" desc="Cleaning jobs move left to right. When a job is done the room turns green and can be sold again." help={<>Tap <b>Start</b> when you begin a room, <b>Done</b> when it is clean. A supervisor taps <b>Inspected</b>. Rooms are added here automatically when a guest checks out.</>}
        actions={<><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />Only my jobs</label>{can('housekeeping', 'c') && <Link className="btn-primary" to="/app/e/housekeeping?new=1">Add a job</Link>}{can('maintenance', 'c') && <Link className="btn-secondary" to="/app/e/maintenance?new=1"><Wrench className="h-4 w-4" />Report a repair</Link>}</>} />
      <div className="mb-4"><Legend /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map(([k, label]) => (
          <div key={k} className="rounded-xl bg-surface/60 p-3 shadow-card">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{label}</h2><span className="chip bg-paper text-muted">{open.filter((t) => t.status === k).length}</span></div>
            <div className="space-y-2">
              {open.filter((t) => t.status === k).map((t) => (
                <div key={t.id} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-start justify-between gap-2"><div><div className="text-xl font-bold">Room {roomNo(t.room_id)}</div><div className="text-sm text-muted">{t.task}</div></div>{t.priority === 'high' && <span className="chip bg-bad/10 text-bad">Urgent</span>}</div>
                  <div className="mt-1 text-xs text-muted">{t.assigned_to ? maps.employees?.[t.assigned_to] : 'Not assigned'}{t.notes ? ` · ${t.notes}` : ''}</div>
                  {can('housekeeping', 'e') && <div className="mt-3 flex gap-2">
                    {k === 'pending' && <button className="btn-primary btn-sm flex-1" onClick={() => step(t, 'in_progress')}>Start cleaning</button>}
                    {k === 'in_progress' && <button className="btn-primary btn-sm flex-1" onClick={() => step(t, 'done')}><Check className="h-4 w-4" />Done</button>}
                    {k === 'done' && <button className="btn-primary btn-sm flex-1" onClick={() => step(t, 'inspected')}><Sparkles className="h-4 w-4" />Inspected — ready</button>}
                  </div>}
                </div>
              ))}
              {!open.filter((t) => t.status === k).length && <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-sm text-muted">Nothing here.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ NIGHT AUDIT
export function NightAudit() {
  const res = useList('reservations'); const audits = useList('night_audits', { optional: true });
  const toast = useToast(); const confirm = useConfirm();
  const [result, setResult] = useState<any>(null);
  if (res.error) return <ErrorBox error={res.error} />;
  if (!res.data || !audits.data) return <Spinner />;
  const t = today(); const done = audits.data.some((a) => a.date === t);
  const inHouse = res.data.filter((r) => r.status === 'checked_in');
  const noShows = res.data.filter((r) => ['confirmed', 'tentative'].includes(r.status) && r.check_in < t);
  const leaving = inHouse.filter((r) => r.check_out < t);
  return (
    <div className="anim-pop mx-auto max-w-4xl">
      <PageHeader title="Night audit" icon="MoonStar" desc="Close the business day: post tonight’s room charges, mark no-shows and save the day’s figures." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Room charges to post" value={inHouse.length} hint="one per in-house guest" />
        <Kpi label="Will become no-shows" value={noShows.length} tone={noShows.length ? 'warn' : 'ok'} hint="didn’t arrive on their date" />
        <Kpi label="Overstaying guests" value={leaving.length} tone={leaving.length ? 'bad' : 'ok'} hint="past check-out, still in room" />
      </div>
      <div className="card mt-4 p-5">
        <h2 className="font-semibold">Before you close the day</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">{['All guests who left today are checked out', 'All restaurant and bar bills charged to rooms are posted', 'Cash drawer is counted'].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-ok" />{x}</li>)}</ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">{done ? <span className="chip bg-ok/10 text-ok">Today is already closed</span> : <>Business date: <b>{date(t)}</b></>}</span>
          <button className="btn-primary" disabled={done} onClick={async () => { if (!(await confirm({ title: 'Close the day?', text: `${inHouse.length} room charges will be posted and ${noShows.length} bookings marked as no-show.`, confirm: 'Run night audit' }))) return; try { const r = await api.action('nightAudit'); setResult(r); toast.ok(r.message); } catch (e) { toast.err(e); } }}><MoonStar className="h-4 w-4" />Run night audit</button>
        </div>
        {result && <div className="mt-4 rounded-xl bg-ok/10 p-4 text-sm"><b>{result.message}</b><br />Occupancy {result.occupancy}% · Room revenue {money(result.room_revenue)} · Other revenue {money(result.other_revenue)}</div>}
      </div>
      <h2 className="mb-2 mt-6 font-semibold">Recent closings</h2>
      <DataTable rows={audits.data.slice().sort((a, b) => b.date.localeCompare(a.date))} exportName="night-audits" cols={[{ key: 'date', label: 'Date', render: (r) => date(r.date) }, { key: 'occupied', label: 'Rooms sold' }, { key: 'occupancy', label: 'Occupancy', render: (r) => r.occupancy + '%' }, { key: 'room_revenue', label: 'Room revenue', render: (r) => money(r.room_revenue) }, { key: 'other_revenue', label: 'Other revenue', render: (r) => money(r.other_revenue) }, { key: 'closed_by', label: 'Closed by' }]} pageSize={10} />
    </div>
  );
}

// ------------------------------------------------------------------ HOTEL REPORTS
export function HotelReports() {
  const { data: r, error } = useAsync<any>(() => api.action('report', { name: 'hotel' }), []);
  if (error) return <ErrorBox error={error} />;
  if (!r) return <Spinner />;
  const last = r.occupancy.slice(-30);
  const avgOcc = last.length ? Math.round(last.reduce((s: number, x: any) => s + x.Occupancy, 0) / last.length) : 0;
  const rev = last.reduce((s: number, x: any) => s + x.Revenue, 0);
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Hotel reports" icon="PieChart" desc="Occupancy, average rate, booking sources and room-type performance for the last 30–60 days." actions={<button className="btn-secondary" onClick={() => window.print()}>Print</button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Average occupancy (30d)" value={avgOcc} fmt="percent" />
        <Kpi label="Room revenue (30d)" value={rev} fmt="money" />
        <Kpi label="Cancellations (60d)" value={r.cancellations.cancelled} hint={`of ${r.cancellations.total} bookings`} />
        <Kpi label="No-shows (60d)" value={r.cancellations.noShow} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard spec={{ title: 'Occupancy & room revenue', type: 'combo', data: last, series: [{ key: 'Revenue', label: 'Room revenue' }, { key: 'Occupancy', label: 'Occupancy %', axis: 'right' }], fmt: 'money', span: 2 }} />
        <ChartCard spec={{ title: 'Revenue by booking source', type: 'pie', data: r.sources, fmt: 'money' }} />
        <ChartCard spec={{ title: 'Average daily rate (ADR)', type: 'line', data: last, series: [{ key: 'ADR', label: 'ADR' }], fmt: 'money', span: 2 }} />
        <ChartCard spec={{ title: 'Guest nationality', type: 'pie', data: r.nationality }} />
        <ChartCard spec={{ title: 'Extra charges by type (30d)', type: 'pie', data: r.charges, fmt: 'money' }} />
        <Card title="Room type performance (60d)" className="lg:col-span-2" pad={false}><table className="w-full text-sm"><thead><tr><th className="th">Room type</th><th className="th text-right">Bookings</th><th className="th text-right">Room nights</th><th className="th text-right">Revenue</th></tr></thead><tbody>{r.roomTypes.map((x: any) => <tr key={x.name} className="border-t border-line"><td className="td font-medium">{x.name}</td><td className="td text-right">{x.bookings}</td><td className="td text-right">{x.nights}</td><td className="td text-right">{money(x.revenue)}</td></tr>)}</tbody></table></Card>
        <Card title="Top guests by spend" pad={false}><ul>{r.guests.map((g: any) => <li key={g.name} className="flex justify-between border-t border-line px-4 py-2 text-sm first:border-0"><span>{g.name}</span><b>{money(g.value)}</b></li>)}</ul></Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ONLINE BOOKING PAGE (admin view)
export function PublicLinkCard({ title, path, desc, icon }: { title: string; path: string; desc: string; icon?: any }) {
  const url = location.origin + path;
  const qr = useAsync<string>(() => QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#0E2A2D' } }), [url]);
  const toast = useToast();
  return (
    <div className="card grid gap-5 p-5 md:grid-cols-[1fr_auto]">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">{icon}{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-paper p-2"><code className="min-w-0 flex-1 truncate px-1 text-sm">{url}</code><button className="btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(url); toast.ok('Link copied.'); }}><Copy className="h-4 w-4" />Copy</button><a className="btn-primary btn-sm" href={path} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open</a></div>
        <Help>Put this link on your website, Google profile, Facebook and Instagram. Print the QR code for flyers and your reception desk.</Help>
      </div>
      {qr.data && <div className="text-center"><img src={qr.data} alt={`QR code for ${title}`} className="mx-auto h-44 w-44 rounded-lg border border-line" /><a download={title.replace(/\W+/g, '-') + '-qr.png'} href={qr.data} className="mt-2 inline-block text-xs font-semibold text-brand">Download QR</a></div>}
    </div>
  );
}
export function BookingEngine() {
  const { me } = useAuth(); const types = useList('room_types', { optional: true }); const res = useList('reservations');
  const web = (res.data || []).filter((r) => r.source === 'Website');
  return (
    <div className="anim-pop space-y-4">
      <PageHeader title="Online booking page" icon="Globe" desc="Guests book and pay on your own website — no commission. Bookings land straight in Reservations." />
      <PublicLinkCard title="Your booking page" path={`/book/${me?.business?.slug}`} desc="Shows live availability for every room type, takes the guest’s details and an optional online payment." icon={<BedDouble className="h-5 w-5 text-brand" />} />
      <div className="grid gap-3 sm:grid-cols-3"><Kpi label="Website bookings" value={web.length} /><Kpi label="Website revenue" value={web.reduce((s, r) => s + (r.total || 0), 0)} fmt="money" /><Kpi label="Room types online" value={types.data?.length || 0} /></div>
      <Card title="Prices shown online" actions={<Link to="/app/e/room_types" className="text-xs font-semibold text-brand">Edit room types</Link>} pad={false}><table className="w-full text-sm"><tbody>{(types.data || []).map((t) => <tr key={t.id} className="border-t border-line first:border-0"><td className="td font-medium">{t.name}</td><td className="td text-muted">{(t.amenities || []).join(', ')}</td><td className="td text-right"><Users className="mr-1 inline h-3.5 w-3.5" />{t.max_adults}</td><td className="td text-right font-semibold">{money(t.base_rate)}</td></tr>)}</tbody></table></Card>
    </div>
  );
}
export { num };
