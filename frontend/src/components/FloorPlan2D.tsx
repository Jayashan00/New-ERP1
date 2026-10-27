import { useRef, useState } from 'react';
import { Plus, Minus, Trash2, RotateCw, Move, Save, Circle, Square, RectangleHorizontal } from 'lucide-react';

export type Table2D = { id: string; name: string; seats: number; shape: string; pos_x: number; pos_y: number; rotation?: string | number; area_id?: string; tone?: string; sub?: string };
export const TONE2D: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
  free: { fill: '#E7F4EC', stroke: '#22A061', text: '#145A35', label: 'Free' },
  busy: { fill: '#E3EDF8', stroke: '#2F6FB0', text: '#1E4A78', label: 'Guests seated' },
  reserved: { fill: '#FCF1DE', stroke: '#D69A2D', text: '#7A520C', label: 'Reserved' },
  alert: { fill: '#FBE4E2', stroke: '#D9443C', text: '#7F2420', label: 'Wants the bill' },
  cleaning: { fill: '#EEF0F2', stroke: '#8A97A0', text: '#4B5560', label: 'Needs clearing' },
  off: { fill: '#F1F1EF', stroke: '#C9CCC8', text: '#9AA09C', label: 'Not available' },
  pick: { fill: '#1F3B2D', stroke: '#D9B36A', text: '#FFFFFF', label: 'Your choice' },
};
const U = 100; const W = 12, H = 7.2;
const dims = (t: Table2D) => { const long = t.shape === 'long'; const big = t.seats > 6; const w = long ? (t.seats > 6 ? 2.6 : 2) : t.shape === 'round' ? (big ? 1.4 : t.seats > 4 ? 1.2 : 1) : big ? 1.4 : 1.1; const h = long ? 1 : w; return String(t.rotation) === '90' ? { w: h, h: w } : { w, h }; };
function chairs(t: Table2D) {
  const { w, h } = dims(t); const n = Math.min(12, Math.max(1, t.seats)); const out: { x: number; y: number; r: number }[] = [];
  if (t.shape === 'round') { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; out.push({ x: Math.cos(a) * (w / 2 + 0.22), y: Math.sin(a) * (w / 2 + 0.22), r: (a * 180) / Math.PI + 90 }); } return out; }
  const horiz = w >= h; const along = horiz ? w : h; const per = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) { const side = i < per ? -1 : 1; const k = i % per; const cnt = side < 0 ? per : n - per; const p = ((k + 0.5) / cnt - 0.5) * along; out.push(horiz ? { x: p, y: side * (h / 2 + 0.22), r: side < 0 ? 0 : 180 } : { x: side * (w / 2 + 0.22), y: p, r: side < 0 ? -90 : 90 }); }
  return out;
}

/** Top-down restaurant floor. Read-only (pick a table) or edit mode (drag, add, change, delete). */
export function FloorPlan2D({ tables, selectedId, onSelect, editable, onMove, height }: { tables: Table2D[]; selectedId?: string; onSelect?: (t: Table2D) => void; editable?: boolean; onMove?: (id: string, x: number, y: number) => void; height?: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; x: number; y: number } | null>(null);
  const toUnits = (e: React.PointerEvent) => { const p = svg.current!.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.current!.getScreenCTM()!.inverse()); return { x: q.x / U, y: q.y / U }; };
  const snap = (v: number) => Math.round(v * 4) / 4;
  return (
    <div className="overflow-hidden rounded-2xl border border-line shadow-card" style={{ background: '#F4EEE2' }}>
      <svg ref={svg} viewBox={`0 0 ${W * U} ${H * U}`} className="block w-full touch-none select-none" style={height ? { height } : { aspectRatio: `${W}/${H}` }}
        onPointerMove={(e) => { if (!drag) return; const p = toUnits(e); setDrag({ ...drag, x: Math.max(0.3, Math.min(W - 0.3, snap(p.x - drag.dx))), y: Math.max(0.3, Math.min(H - 0.3, snap(p.y - drag.dy))) }); }}
        onPointerUp={() => { if (drag) { onMove?.(drag.id, drag.x, drag.y); setDrag(null); } }} onPointerLeave={() => { if (drag) { onMove?.(drag.id, drag.x, drag.y); setDrag(null); } }}>
        <defs><pattern id="planks" width="120" height="40" patternUnits="userSpaceOnUse"><rect width="120" height="40" fill="#EFE5D2" /><rect y="38" width="120" height="2" fill="#E3D6BE" /><rect x="60" width="2" height="40" fill="#E6DAC4" /></pattern><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1.2" fill="#C9BBA0" /></pattern></defs>
        <rect width={W * U} height={H * U} fill="url(#planks)" />
        {editable && <rect width={W * U} height={H * U} fill="url(#grid)" />}
        <rect x="6" y="6" width={W * U - 12} height={H * U - 12} rx="18" fill="none" stroke="#C8B79A" strokeWidth="4" />
        {tables.map((t) => {
          const isDrag = drag?.id === t.id; const x = (isDrag ? drag!.x : t.pos_x) * U; const y = (isDrag ? drag!.y : t.pos_y) * U;
          const { w, h } = dims(t); const c = TONE2D[selectedId === t.id ? 'pick' : t.tone || 'free']; const clickable = editable || (onSelect && t.tone !== 'off');
          return (
            <g key={t.id} transform={`translate(${x} ${y})`} style={{ cursor: editable ? (isDrag ? 'grabbing' : 'grab') : clickable ? 'pointer' : 'not-allowed' }}
              onPointerDown={(e) => { if (editable) { const p = toUnits(e); setDrag({ id: t.id, dx: p.x - t.pos_x, dy: p.y - t.pos_y, x: t.pos_x, y: t.pos_y }); (e.target as Element).setPointerCapture?.(e.pointerId); } }}
              onClick={() => clickable && onSelect?.(t)} role="button" aria-label={`Table ${t.name}, ${t.seats} seats`}>
              {chairs(t).map((ch, i) => <rect key={i} x={ch.x * U - 15} y={ch.y * U - 12} width="30" height="24" rx="8" fill={t.tone === 'off' ? '#D9D6CF' : '#8B6A4A'} transform={`rotate(${ch.r} ${ch.x * U} ${ch.y * U})`} />)}
              {t.shape === 'round' ? <circle r={(w * U) / 2} fill={c.fill} stroke={c.stroke} strokeWidth={selectedId === t.id ? 8 : 5} /> : <rect x={(-w * U) / 2} y={(-h * U) / 2} width={w * U} height={h * U} rx="16" fill={c.fill} stroke={c.stroke} strokeWidth={selectedId === t.id ? 8 : 5} />}
              <text textAnchor="middle" y="-2" fontSize="30" fontWeight="800" fill={c.text} style={{ fontFamily: 'Figtree, system-ui' }}>{t.name}</text>
              <text textAnchor="middle" y="26" fontSize="19" fontWeight="600" fill={c.text} style={{ fontFamily: 'Figtree, system-ui' }}>{t.sub || `${t.seats} seats`}</text>
              {isDrag && <circle r={Math.max(w, h) * U * 0.7} fill="none" stroke="#D9B36A" strokeDasharray="10 8" strokeWidth="3" />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const Legend2D = ({ tones }: { tones: string[] }) => <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{tones.map((k) => <span key={k} className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded" style={{ background: TONE2D[k].fill, border: `2px solid ${TONE2D[k].stroke}` }} />{TONE2D[k].label}</span>)}</div>;

/** Side panel to change the selected table in edit mode. */
export function TableEditor({ t, onChange, onDelete, saving }: { t: Table2D; onChange: (patch: Partial<Table2D>) => void; onDelete: () => void; saving?: boolean }) {
  const shapes: [string, any, string][] = [['round', Circle, 'Round'], ['square', Square, 'Square'], ['long', RectangleHorizontal, 'Long']];
  return (
    <div className="space-y-4">
      <div><label className="label" htmlFor="tname">Table name</label><input id="tname" className="input" value={t.name} onChange={(e) => onChange({ name: e.target.value })} /></div>
      <div><div className="label">Chairs</div><div className="flex items-center gap-3"><button type="button" className="btn-secondary h-11 w-11 p-0" onClick={() => onChange({ seats: Math.max(1, t.seats - 1) })} aria-label="One chair less"><Minus className="h-5 w-5" /></button><span className="w-10 text-center text-2xl font-bold">{t.seats}</span><button type="button" className="btn-secondary h-11 w-11 p-0" onClick={() => onChange({ seats: Math.min(12, t.seats + 1) })} aria-label="One chair more"><Plus className="h-5 w-5" /></button></div></div>
      <div><div className="label">Shape</div><div className="grid grid-cols-3 gap-2">{shapes.map(([k, I, l]) => <button type="button" key={k} onClick={() => onChange({ shape: k })} className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-semibold ${t.shape === k ? 'border-brand bg-brand-soft' : 'border-line'}`}><I className="h-6 w-6" />{l}</button>)}</div></div>
      {t.shape !== 'round' && <button type="button" className="btn-secondary w-full" onClick={() => onChange({ rotation: String(t.rotation) === '90' ? '0' : '90' })}><RotateCw className="h-4 w-4" />Turn the table</button>}
      <p className="flex items-center gap-2 rounded-lg bg-paper p-2 text-xs text-muted"><Move className="h-4 w-4 shrink-0" />Drag the table on the plan to move it.</p>
      <div className="flex gap-2"><button type="button" className="btn-ghost flex-1 text-bad" onClick={onDelete}><Trash2 className="h-4 w-4" />Remove table</button>{saving && <span className="flex items-center gap-1 text-xs text-muted"><Save className="h-3.5 w-3.5" />Saving…</span>}</div>
    </div>
  );
}
