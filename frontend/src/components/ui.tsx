import { ReactNode, useEffect, useState, createContext, useContext, useRef, useId, isValidElement, cloneElement } from 'react';
import { X, Loader2, HelpCircle, AlertTriangle, Inbox, ChevronDown } from 'lucide-react';
import { ICONS } from '@/lib/icons';
import { TONE_CLASS, toneOf, pretty, money, num, pct, initials } from '@/lib/format';

export function Icon({ name, className = 'h-4 w-4' }: { name?: string; className?: string }) {
  const C = (name && ICONS[name]) || ICONS.Layers;
  return <C className={className} aria-hidden />;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}

export function Status({ value, label }: { value: any; label?: string }) {
  if (value === undefined || value === null || value === '') return <span className="text-muted">—</span>;
  return <span className={`chip ${TONE_CLASS[toneOf(value)]}`}>{label || pretty(value)}</span>;
}

export function Empty({ title = 'Nothing here yet', text, action, icon = 'Inbox' }: { title?: string; text?: string; action?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Icon name={icon} className="h-5 w-5" /></div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: any; onRetry?: () => void }) {
  const denied = error?.status === 403;
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-bad/10 text-bad"><AlertTriangle className="h-5 w-5" /></div>
      <p className="font-semibold">{denied ? 'This page is not part of your role' : 'This page could not load'}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{denied ? 'Ask your administrator to add it to your role in Roles & permissions.' : error?.message || 'Please try again.'}</p>
      {onRetry && !denied && <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function PageHeader({ title, desc, icon, actions, help }: { title: string; desc?: string; icon?: string; actions?: ReactNode; help?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <div className="mt-0.5 hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand sm:grid"><Icon name={icon} className="h-5 w-5" /></div>}
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              {title}
              {help && <button onClick={() => setOpen(!open)} className="text-muted hover:text-brand" aria-label="How this page works" title="How this page works"><HelpCircle className="h-4 w-4" /></button>}
            </h1>
            {desc && <p className="mt-0.5 max-w-3xl text-sm text-muted">{desc}</p>}
          </div>
        </div>
        {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {help && open && <div className="anim-pop mt-3 rounded-xl border border-brand/20 bg-brand-soft/60 p-4 text-sm leading-relaxed">{help}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2>{actions}</div>}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, fmt, hint, tone, icon }: { label: string; value: any; fmt?: string; hint?: string; tone?: string; icon?: string }) {
  const shown = fmt === 'money' ? money(value, { short: Math.abs(Number(value)) >= 1e5 }) : fmt === 'percent' ? pct(value) : fmt === 'text' ? value : num(Math.round(Number(value) * 100) / 100);
  const bar = tone === 'bad' ? 'bg-bad' : tone === 'warn' ? 'bg-saffron' : tone === 'ok' ? 'bg-ok' : 'bg-brand';
  return (
    <div className="card relative overflow-hidden p-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted">{label}{icon && <Icon name={icon} className="h-4 w-4" />}</div>
      <div className={`mt-1 truncate font-bold tracking-tight ${fmt === 'text' ? 'text-lg' : 'text-2xl'}`}>{shown}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose} role="dialog" aria-modal>
      <div className={`anim-pop flex max-h-[92vh] w-full ${w} flex-col rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><h2 className="text-base font-bold">{title}</h2><button onClick={onClose} className="btn-ghost -mr-2 p-1.5" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onMouseDown={onClose} role="dialog" aria-modal>
      <div className={`anim-slide flex h-full w-full flex-col bg-surface shadow-pop ${wide ? 'max-w-3xl' : 'max-w-xl'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><h2 className="min-w-0 truncate text-base font-bold">{title}</h2><button onClick={onClose} className="btn-ghost -mr-2 p-1.5" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- confirm dialog as a hook-friendly context
type ConfirmOpts = { title: string; text?: string; confirm?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(null as any);
export const useConfirm = () => useContext(ConfirmCtx);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const ask = (o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve }));
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title} size="sm" footer={<><button className="btn-secondary" onClick={() => close(false)}>Keep it</button><button className={state?.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)} autoFocus>{state?.confirm || 'Confirm'}</button></>}>
        <p className="text-sm text-muted">{state?.text}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { key: string; label: ReactNode; count?: number }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)} className={`btn-sm btn shrink-0 rounded-full ${value === t.key ? 'bg-ink text-surface' : 'bg-surface text-muted shadow-card hover:text-ink'}`}>
          {t.label}{t.count !== undefined && <span className={`rounded-full px-1.5 text-[11px] ${value === t.key ? 'bg-surface/20' : 'bg-paper'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      {label && <span className="text-sm"><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>}
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export function Field({ label, hint, children, required, error }: { label: string; hint?: string; children: ReactNode; required?: boolean; error?: string }) {
  const auto = useId();
  // link the label to its input so screen readers and clicks on the label work
  const el: any = isValidElement(children) ? children : null;
  const linkable = el && typeof el.type === 'string' && ['input', 'select', 'textarea'].includes(el.type);
  const id = linkable ? el.props.id || auto : undefined;
  return (
    <div>
      <label className="label" htmlFor={id}>{label}{required && <span className="text-bad"> *</span>}</label>
      {linkable ? cloneElement(el, { id, 'aria-invalid': error ? true : undefined }) : children}
      {error ? <p className="mt-1 text-xs text-bad">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Avatar({ name, color, size = 'md' }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-lg' }[size];
  return <span className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${s}`} style={{ background: color || 'rgb(var(--brand))' }}>{initials(name)}</span>;
}

export function Dropdown({ button, children, align = 'right' }: { button: ReactNode; children: ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as any)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{button}</div>
      {open && <div onClick={() => setOpen(false)} className={`anim-pop absolute z-40 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop ${align === 'right' ? 'right-0' : 'left-0'}`}>{children}</div>}
    </div>
  );
}
export const MenuItem = ({ onClick, children, danger, icon }: { onClick?: () => void; children: ReactNode; danger?: boolean; icon?: string }) => (
  <button onClick={onClick} className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-paper ${danger ? 'text-bad' : ''}`}>{icon && <Icon name={icon} className="h-4 w-4 text-muted" />}{children}</button>
);

export function Collapsible({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-line">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold" onClick={() => setOpen(!open)}>{title}<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      {open && <div className="border-t border-line px-4 py-3">{children}</div>}
    </div>
  );
}

export const Help = ({ children }: { children: ReactNode }) => <div className="flex gap-2 rounded-lg bg-paper px-3 py-2 text-xs text-muted"><HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div>{children}</div></div>;
export { Inbox };
