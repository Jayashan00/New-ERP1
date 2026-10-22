let SYMBOL = 'Rs';
export const setCurrency = (s: string) => { SYMBOL = s || 'Rs'; };
export const currency = () => SYMBOL;
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export const num = (v: any) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? '—' : nf.format(Number(v)));
export const money = (v: any, opts: { short?: boolean } = {}) => {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—';
  const n = Number(v);
  if (opts.short && Math.abs(n) >= 1e6) return `${SYMBOL} ${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (opts.short && Math.abs(n) >= 1e4) return `${SYMBOL} ${(n / 1e3).toFixed(0)}k`;
  return `${SYMBOL} ${Math.abs(n) >= 1000 ? nf0.format(n) : nf.format(n)}`;
};
export const pct = (v: any) => (v === null || v === undefined || v === '' ? '—' : `${Math.round(Number(v))}%`);
export const date = (v: any) => { if (!v) return '—'; const d = new Date(String(v).length <= 10 ? v + 'T12:00' : v); return isNaN(+d) ? String(v) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
export const dateTime = (v: any) => { if (!v) return '—'; const d = new Date(v); return isNaN(+d) ? String(v) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
export const time = (v: any) => { if (!v) return '—'; const d = new Date(v); return isNaN(+d) ? String(v) : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
export const ago = (v: any) => { if (!v) return ''; const m = Math.round((Date.now() - +new Date(v)) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; return `${Math.round(h / 24)} d ago`; };
export const minutesSince = (v: any) => Math.max(0, Math.round((Date.now() - +new Date(v)) / 60000));
export const pretty = (s: any) => String(s ?? '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const nightsBetween = (a: string, b: string) => Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 864e5));
export const initials = (n: string) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

const TONE: Record<string, string> = {};
const set = (tone: string, words: string) => words.split(' ').forEach((w) => (TONE[w] = tone));
set('ok', 'active paid completed approved available done inspected delivered served connected success published visible enabled won accepted achieved resolved closed present hired ok received ready returned on_track open_ok in_stock online acknowledged posted subscribed applied replied converted sent_ok');
set('warn', 'pending draft tentative new reserved partially_paid partially_received dirty preparing waiting scheduled held trial late in_transit expiring at_risk planned proposal negotiation submitted interview offer screening on_hold half_day notified sent contacted qualified todo review processing stored upcoming bill_requested open investigating');
set('bad', 'cancelled rejected overdue out_of_order failed suspended expired no_show lost terminated blacklisted error disconnected absent behind missed refunded critical urgent left disposed out');
set('info', 'occupied checked_in in_progress cleaning confirmed sent_info on_delivery on_leave ongoing discovery live in_use partially_refunded credit');
set('mute', 'checked_out inactive disabled closed_mute off_duty free unsubscribed none not_started');
export const toneOf = (s: any) => TONE[String(s)] || 'mute';
export const TONE_CLASS: Record<string, string> = {
  ok: 'bg-ok/10 text-ok', warn: 'bg-saffron/15 text-warn', bad: 'bg-bad/10 text-bad', info: 'bg-info/10 text-info', mute: 'bg-muted/10 text-muted',
};
