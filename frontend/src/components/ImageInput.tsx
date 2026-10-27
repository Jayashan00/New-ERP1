import { useState } from 'react';
import { Upload, Link2, Trash2, ImageIcon } from 'lucide-react';
import { resizeImage } from '@/lib/image';

/** Pick a photo from the phone/computer, or paste a web link. Shows a preview. */
export function ImageInput({ value, onChange, aspect = 'aspect-video', label = 'photo' }: { value?: string; onChange: (v: string) => void; aspect?: string; label?: string }) {
  const [link, setLink] = useState(false); const [err, setErr] = useState('');
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className={`relative grid ${aspect} place-items-center bg-paper`}>{value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-sm text-muted"><ImageIcon className="h-8 w-8" />No {label} yet</span>}</div>
      <div className="flex flex-wrap items-center gap-2 p-2">
        <label className="btn-primary btn-sm cursor-pointer"><Upload className="h-4 w-4" />{value ? 'Change' : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setErr(''); onChange(await resizeImage(f)); } catch { setErr('That file is not a photo.'); } }} /></label>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setLink(!link)}><Link2 className="h-4 w-4" />Use a link</button>
        {value && <button type="button" className="btn-ghost btn-sm text-bad" onClick={() => onChange('')} aria-label={`Remove ${label}`}><Trash2 className="h-4 w-4" /></button>}
      </div>
      {link && <div className="px-2 pb-2"><input className="input" placeholder="https://…" defaultValue={value?.startsWith('http') ? value : ''} onBlur={(e) => e.target.value && onChange(e.target.value.trim())} /></div>}
      {err && <p className="px-2 pb-2 text-xs text-bad">{err}</p>}
    </div>
  );
}
