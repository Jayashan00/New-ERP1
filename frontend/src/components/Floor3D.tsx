import { useState } from 'react';
import { RotateCw, Box, LayoutGrid } from 'lucide-react';

export type FloorTable = { id: string; name: string; seats: number; shape: string; pos_x: number; pos_y: number; tone: 'free' | 'busy' | 'reserved' | 'alert' | 'off' | 'pick' | 'cleaning'; sub?: string };
const TONE: Record<string, { top: string; side: string; text: string }> = {
  free: { top: '#E7F4EC', side: '#2F8F5B', text: '#1D5C3A' },
  busy: { top: '#E3EDF8', side: '#2F6FB0', text: '#1E4A78' },
  reserved: { top: '#FCF1DE', side: '#C98A1A', text: '#7A520C' },
  alert: { top: '#FBE4E2', side: '#C2413B', text: '#7F2420' },
  cleaning: { top: '#EEF0F2', side: '#8A97A0', text: '#4B5560' },
  off: { top: '#F1F2F1', side: '#C9CFCC', text: '#9AA4A0' },
  pick: { top: '#0F6E66', side: '#0B544E', text: '#FFFFFF' },
};
const U = 70; // px per floor unit

/** A tilted, rotatable 3D floor with tables and chairs. Click a table to select it. */
export function Floor3D({ tables, onSelect, selectedId, height = 420 }: { tables: FloorTable[]; onSelect?: (t: FloorTable) => void; selectedId?: string; height?: number }) {
  const [angle, setAngle] = useState(-32);
  const [flat, setFlat] = useState(false);
  const w = Math.max(9, ...tables.map((t) => t.pos_x + 3)) * U;
  const h = Math.max(5.5, ...tables.map((t) => t.pos_y + 2.4)) * U;
  const tilt = flat ? 0 : 56;
  const rot = flat ? 0 : angle;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line" style={{ height, background: 'radial-gradient(ellipse at 50% 20%, #F8F5EE 0%, #E9E4D8 70%)' }}>
      <div className="absolute right-3 top-3 z-20 flex gap-1.5">
        <button className="btn-secondary btn-sm bg-surface/90" onClick={() => setFlat(!flat)} title={flat ? 'Show in 3D' : 'Show from above'}>{flat ? <Box className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}{flat ? '3D view' : 'Top view'}</button>
        {!flat && <button className="btn-secondary btn-sm bg-surface/90" onClick={() => setAngle(angle === -32 ? 32 : angle === 32 ? 0 : -32)} title="Turn the room"><RotateCw className="h-4 w-4" />Turn</button>}
      </div>
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1300 }}>
        <div className="relative transition-transform duration-700 ease-out" style={{ width: w, height: h, transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg) rotateZ(${rot}deg) scale(${flat ? 0.85 : 1})` }}>
          {/* floor */}
          <div className="absolute inset-0 rounded-xl" style={{ background: 'repeating-linear-gradient(90deg, #C9A27A 0 46px, #BF966D 46px 48px)', boxShadow: 'inset 0 0 0 6px #8B6A4A, 0 30px 60px -20px rgba(0,0,0,0.35)' }} />
          <div className="absolute -left-2 top-3 text-3xl" style={{ transform: `rotateZ(${-rot}deg) rotateX(${-tilt}deg) translateZ(20px)` }} aria-hidden>🪴</div>
          <div className="absolute -right-2 bottom-3 text-3xl" style={{ transform: `rotateZ(${-rot}deg) rotateX(${-tilt}deg) translateZ(20px)` }} aria-hidden>🌿</div>
          {tables.map((t) => {
            const c = TONE[selectedId === t.id ? 'pick' : t.tone];
            const long = t.shape === 'long' || t.seats >= 6; const round = t.shape === 'round';
            const tw = (long ? 2.3 : 1.25) * U, th = 1.15 * U;
            const n = Math.min(8, t.seats);
            const chairs = Array.from({ length: n }, (_, i) => {
              if (round) { const a = (i / n) * Math.PI * 2; return { x: tw / 2 + Math.cos(a) * (tw / 2 + 12) - 9, y: th / 2 + Math.sin(a) * (th / 2 + 12) - 9 }; }
              const perSide = Math.ceil(n / 2); const side = i < perSide ? -1 : 1; const k = i % perSide;
              return { x: ((k + 0.5) / perSide) * tw - 9, y: side < 0 ? -22 : th + 4 };
            });
            const clickable = !!onSelect && t.tone !== 'off';
            return (
              <button key={t.id} disabled={!clickable} onClick={() => clickable && onSelect!(t)} aria-label={`Table ${t.name}, ${t.seats} seats`} className={`group absolute ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`} style={{ left: t.pos_x * U, top: t.pos_y * U, width: tw, height: th, transformStyle: 'preserve-3d' }}>
                {chairs.map((p, i) => <span key={i} className="absolute h-[18px] w-[18px] rounded-md" style={{ left: p.x, top: p.y, background: '#6B4A2E', transform: 'translateZ(8px)', boxShadow: '0 3px 0 #4A321E' }} />)}
                <span className="absolute inset-0 transition-transform duration-200 group-hover:[transform:translateZ(30px)]" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
                  <span className={`absolute inset-0 ${round ? 'rounded-full' : 'rounded-lg'}`} style={{ background: c.top, border: `3px solid ${c.side}`, boxShadow: `0 8px 0 ${c.side}, 0 14px 18px rgba(0,0,0,0.25)` }} />
                  <span className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: `rotateZ(${-rot}deg)` }}>
                    <span className="text-sm font-extrabold leading-none" style={{ color: c.text }}>{t.name}</span>
                    <span className="text-[10px] font-semibold" style={{ color: c.text }}>{t.sub || `${t.seats} seats`}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const FloorLegend = ({ items }: { items: [string, string][] }) => (
  <div className="flex flex-wrap gap-3 text-xs">{items.map(([tone, label]) => <span key={label} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: TONE[tone].top, border: `2px solid ${TONE[tone].side}` }} />{label}</span>)}</div>
);
