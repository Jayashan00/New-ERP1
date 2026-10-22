import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, onDataChange } from './api';
import { can as canFn } from '@shared/roles.js';
import { setCurrency } from './format';

type Me = { user: any; role: any; business: any; businesses: any[]; settings: any; platform: any } | null;
type AuthCtx = {
  me: Me; ready: boolean; can: (key: string, a?: string) => boolean; isSuper: boolean; hasModule: (m: string) => boolean;
  login: (e: string, p: string) => Promise<any>; logout: () => void; refresh: () => Promise<void>; switchBusiness: (id: string | null) => void;
};
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    if (!api.isSignedIn()) { setMe(null); setReady(true); return; }
    try { const m = await api.me(); setMe(m); setCurrency(m.settings?.currency_symbol || 'Rs'); applyTheme(m.settings); }
    catch { api.logout(); setMe(null); }
    setReady(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onDataChange(() => { if (api.isSignedIn()) api.me().then((m) => { setMe(m); setCurrency(m.settings?.currency_symbol || 'Rs'); }).catch(() => {}); }) as any, []);
  const value: AuthCtx = {
    me, ready,
    isSuper: me?.user?.role === 'super_admin',
    can: (key, a = 'v') => canFn(me?.role, key, a),
    hasModule: (m) => !!me?.business?.modules?.includes(m),
    login: async (e, p) => { const r = await api.login(e, p); await refresh(); return r; },
    logout: () => { api.logout(); setMe(null); },
    refresh,
    switchBusiness: (id) => { api.setBusiness(id); refresh(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function applyTheme(settings: any) {
  const hex = settings?.primary_color;
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex) || document.documentElement.classList.contains('dark')) { document.documentElement.style.removeProperty('--brand'); return; }
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  document.documentElement.style.setProperty('--brand', `${r} ${g} ${b}`);
  document.documentElement.style.setProperty('--brand-dark', `${Math.round(r * 0.78)} ${Math.round(g * 0.78)} ${Math.round(b * 0.78)}`);
}
