import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { RotateCcw, Eye, MousePointerClick } from 'lucide-react';

export type Table3D = { id: string; name: string; seats: number; shape: string; pos_x: number; pos_y: number; tone: 'free' | 'busy' | 'reserved' | 'alert' | 'cleaning' | 'off'; sub?: string };
export const TONES: Record<string, { color: string; label: string }> = {
  free: { color: '#22A061', label: 'Free' }, busy: { color: '#2F6FB0', label: 'Guests seated' }, reserved: { color: '#E0A13A', label: 'Reserved' },
  alert: { color: '#D9443C', label: 'Wants the bill' }, cleaning: { color: '#8A97A0', label: 'Needs clearing' }, off: { color: '#B9BFBC', label: 'Not available' },
};
const SEL = '#F2B53A';
const S = 1.15; // floor units → world units

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    const hue = 28 + (i % 3) * 3, l = 46 + ((i * 7) % 9);
    g.fillStyle = `hsl(${hue} 42% ${l}%)`; g.fillRect(0, i * 64, 512, 64);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `hsla(${hue} 40% ${l - 12}% / 0.18)`; g.beginPath(); const y = i * 64 + Math.random() * 64; g.moveTo(0, y); g.bezierCurveTo(170, y + 4, 340, y - 4, 512, y + 2); g.stroke(); }
    g.fillStyle = 'rgba(60,35,15,0.35)'; g.fillRect(0, i * 64, 512, 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function labelSprite(title: string, sub: string, color: string) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(255,255,255,0.96)'; const r = 26; g.beginPath(); g.roundRect(8, 8, 240, 96, r); g.fill();
  g.fillStyle = color; g.beginPath(); g.roundRect(8, 8, 18, 96, [r, 0, 0, r]); g.fill();
  g.fillStyle = '#17252E'; g.font = 'bold 44px Figtree, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(title, 136, 56);
  g.fillStyle = '#5B6B75'; g.font = '600 26px Figtree, system-ui, sans-serif'; g.fillText(sub, 136, 90);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(1.9, 0.95, 1); s.renderOrder = 10; return s;
}

function buildTable(t: Table3D, mats: any) {
  const g = new THREE.Group(); g.userData = { id: t.id };
  const round = t.shape === 'round'; const long = t.shape === 'long' || t.seats >= 6;
  const w = long ? 1.9 : 1.0, d = long ? 0.95 : 1.0, topY = 0.74;
  const cloth = new THREE.MeshStandardMaterial({ color: t.tone === 'off' ? '#E4E2DC' : '#FBF8F1', roughness: 0.9 });
  const top = round ? new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.06, 40), cloth) : new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), cloth);
  top.position.y = topY; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const edge = round ? new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 40), mats.wood) : new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.03, d + 0.04), mats.wood);
  edge.position.y = topY - 0.045; g.add(edge);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, topY - 0.05, 12), mats.darkWood); leg.position.y = (topY - 0.05) / 2; leg.castShadow = true; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.04, 24), mats.darkWood); foot.position.y = 0.02; g.add(foot);
  // chairs + plates
  const n = Math.min(8, Math.max(2, t.seats));
  for (let i = 0; i < n; i++) {
    let x: number, z: number, rot: number;
    if (round) { const a = (i / n) * Math.PI * 2; x = Math.cos(a) * 0.95; z = Math.sin(a) * 0.95; rot = -a - Math.PI / 2; }
    else { const per = Math.ceil(n / 2); const side = i < per ? -1 : 1; const k = i % per; x = ((k + 0.5) / per - 0.5) * w; z = side * (d / 2 + 0.42); rot = side < 0 ? 0 : Math.PI; }
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), mats.chair); seat.position.y = 0.45; seat.castShadow = true; chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.05), mats.chair); back.position.set(0, 0.7, -0.19); back.castShadow = true; chair.add(back);
    for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), mats.darkWood); l.position.set(lx, 0.225, lz); chair.add(l); }
    chair.position.set(x, 0, z); chair.rotation.y = rot; g.add(chair);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.015, 24), mats.plate);
    const px = round ? Math.cos((i / n) * Math.PI * 2) * 0.38 : x * 0.92; const pz = round ? Math.sin((i / n) * Math.PI * 2) * 0.38 : (z > 0 ? 1 : -1) * (d / 2 - 0.2);
    plate.position.set(px, topY + 0.04, pz); g.add(plate);
  }
  // centre piece
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.16, 12), mats.vase); vase.position.y = topY + 0.11; g.add(vase);
  const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mats.flower); flower.position.y = topY + 0.24; g.add(flower);
  // status ring on the floor
  const col = TONES[t.tone].color;
  const ringR = round ? 1.32 : Math.max(w, d) * 0.5 + 0.85;
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringR - 0.07, ringR, 64), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: t.tone === 'off' ? 0.35 : 0.95, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; ring.name = 'ring'; g.add(ring);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(ringR, 64), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: t.tone === 'off' ? 0.05 : 0.14 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01; glow.name = 'glow'; g.add(glow);
  const label = labelSprite(t.name, t.sub || `${t.seats} seats`, col); label.position.y = 2.05; label.name = 'label'; g.add(label);
  // invisible hit box for easy clicking
  const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 1.2) + 0.9, 1.2, Math.max(d, 1.2) + 0.9), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.6; hit.userData = { hit: true, id: t.id }; g.add(hit);
  g.position.set((t.pos_x + w / 2) * S, 0, (t.pos_y + 0.5) * S);
  return g;
}

export function Restaurant3D({ tables, selectedId, onSelect, height = 480, hint = true }: { tables: Table3D[]; selectedId?: string; onSelect?: (t: Table3D) => void; height?: number; hint?: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<any>({});
  const [ready, setReady] = useState(false); const [fail, setFail] = useState(false);
  const cbRef = useRef(onSelect); cbRef.current = onSelect;
  const tablesRef = useRef(tables); tablesRef.current = tables;

  // one-time scene
  useEffect(() => {
    const el = mount.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); } catch { setFail(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#F1EBDF'); scene.fog = new THREE.Fog('#F1EBDF', 18, 40);
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.25; controls.minDistance = 4; controls.maxDistance = 22; controls.enablePan = true; controls.screenSpacePanning = false;
    scene.add(new THREE.HemisphereLight('#FFF6E5', '#8A6A4A', 0.9));
    const sun = new THREE.DirectionalLight('#FFE7C2', 2.2); sun.position.set(6, 12, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14; sun.shadow.bias = -0.0004; sun.shadow.radius = 4; scene.add(sun);
    const mats = {
      wood: new THREE.MeshStandardMaterial({ color: '#8B5A2B', roughness: 0.55 }), darkWood: new THREE.MeshStandardMaterial({ color: '#4E3220', roughness: 0.6 }),
      chair: new THREE.MeshStandardMaterial({ color: '#6E4527', roughness: 0.6 }), plate: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.25 }),
      vase: new THREE.MeshStandardMaterial({ color: '#1F3B2D', roughness: 0.3 }), flower: new THREE.MeshStandardMaterial({ color: '#E9A23B', roughness: 0.6 }),
    };
    const floorG = new THREE.Group(); scene.add(floorG);
    const tableG = new THREE.Group(); scene.add(tableG);
    const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let hovered: THREE.Object3D | null = null; let raf = 0; let downAt = 0;
    const pick = (e: PointerEvent) => { const r = renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); const hits = ray.intersectObjects(tableG.children, true).filter((h) => h.object.userData.hit); return hits[0]?.object.parent || null; };
    const onMove = (e: PointerEvent) => { const g = pick(e); const t = g && tablesRef.current.find((x) => x.id === g.userData.id); const ok = !!(g && t && t.tone !== 'off' && cbRef.current); renderer.domElement.style.cursor = ok ? 'pointer' : 'grab'; const target = ok ? g : null; if (target !== hovered) { if (hovered) gsap.to(hovered.position, { y: 0, duration: 0.3 }); if (target) gsap.to(target.position, { y: 0.12, duration: 0.3 }); hovered = target; } };
    const onDown = () => { downAt = Date.now(); };
    const onUp = (e: PointerEvent) => { if (Date.now() - downAt > 300) return; const g = pick(e); if (!g) return; const t = tablesRef.current.find((x) => x.id === g.userData.id); if (t && t.tone !== 'off' && cbRef.current) cbRef.current(t); };
    renderer.domElement.addEventListener('pointermove', onMove); renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp);
    const ro = new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }); ro.observe(el);
    const clock = new THREE.Clock();
    const loop = () => { raf = requestAnimationFrame(loop); const t = clock.getElapsedTime(); tableG.children.forEach((g: any) => { const ring = g.getObjectByName('ring'); if (g.userData.selected && ring) { const s = 1 + Math.sin(t * 4) * 0.04; ring.scale.set(s, s, s); } }); controls.update(); renderer.render(scene, camera); };
    loop();
    api.current = { scene, camera, controls, renderer, floorG, tableG, mats, dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.removeEventListener('pointermove', onMove); renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp); controls.dispose(); renderer.dispose(); scene.traverse((o: any) => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach((m: any) => { m.map?.dispose?.(); m.dispose?.(); }); }); el.removeChild(renderer.domElement); } };
    setReady(true);
    return () => api.current.dispose?.();
  }, []);

  // (re)build floor + tables when the list changes
  const sig = tables.map((t) => `${t.id}:${t.tone}:${t.sub}:${t.pos_x}:${t.pos_y}`).join('|');
  useEffect(() => {
    if (!ready) return; const { floorG, tableG, mats, camera, controls } = api.current;
    const clear = (g: THREE.Group) => { while (g.children.length) { const o: any = g.children.pop(); o.traverse?.((x: any) => { x.geometry?.dispose?.(); if (x.material) [].concat(x.material).forEach((m: any) => { m.map?.dispose?.(); if (!Object.values(mats).includes(m)) m.dispose?.(); }); }); } };
    const first = tableG.children.length === 0 && floorG.children.length === 0;
    clear(floorG); clear(tableG);
    const maxX = Math.max(8, ...tables.map((t) => t.pos_x + 2.6)) * S, maxZ = Math.max(5, ...tables.map((t) => t.pos_y + 1.8)) * S;
    const W = maxX + 1.6, D = maxZ + 1.6, cx = maxX / 2, cz = maxZ / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 })); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true; floorG.add(floor);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, D + 6), new THREE.MeshStandardMaterial({ color: '#E2D7C3', roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(cx, -0.01, cz); rug.receiveShadow = true; floorG.add(rug);
    const wallM = new THREE.MeshStandardMaterial({ color: '#EADFC9', roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, 0.12), wallM); back.position.set(cx, 0.6, -0.8 + 0.0); back.receiveShadow = true; back.castShadow = true; floorG.add(back);
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, D), wallM); side.position.set(cx - W / 2, 0.6, cz); side.receiveShadow = true; floorG.add(side);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.16), mats.wood); trim.position.set(cx, 1.2, -0.8); floorG.add(trim);
    for (const [px, pz] of [[cx - W / 2 + 0.6, -0.3], [cx + W / 2 - 0.6, -0.3], [cx - W / 2 + 0.6, D - 1.4]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 16), new THREE.MeshStandardMaterial({ color: '#B4643B', roughness: 0.8 })); pot.position.set(px, 0.2, pz); pot.castShadow = true; floorG.add(pot);
      for (let i = 0; i < 6; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? '#2F6B3A' : '#3F8A4B', roughness: 0.7 })); leaf.position.set(px + Math.cos(i) * 0.08, 0.7, pz + Math.sin(i) * 0.08); leaf.rotation.set(Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5); leaf.castShadow = true; floorG.add(leaf); }
    }
    for (const t of tables) tableG.add(buildTable(t, mats));
    controls.target.set(cx, 0.4, cz);
    api.current.home = { pos: new THREE.Vector3(cx + 0.5, 7.5, cz + D * 0.95 + 2.5), target: new THREE.Vector3(cx, 0.4, cz) };
    api.current.top = { pos: new THREE.Vector3(cx, 15, cz + 0.01), target: new THREE.Vector3(cx, 0, cz) };
    if (first) { camera.position.set(cx + 10, 14, cz + 18); gsap.to(camera.position, { ...api.current.home.pos, duration: 1.8, ease: 'power3.out' }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig]);

  // selection highlight + gentle focus
  useEffect(() => {
    if (!ready) return; const { tableG, controls } = api.current;
    tableG.children.forEach((g: any) => {
      const t = tables.find((x) => x.id === g.userData.id); const isSel = g.userData.id === selectedId; g.userData.selected = isSel;
      const col = new THREE.Color(isSel ? SEL : TONES[t?.tone || 'free'].color);
      (g.getObjectByName('ring') as any).material.color = col; (g.getObjectByName('glow') as any).material.color = col; (g.getObjectByName('glow') as any).material.opacity = isSel ? 0.32 : t?.tone === 'off' ? 0.05 : 0.14;
      if (!isSel) g.getObjectByName('ring').scale.set(1, 1, 1);
      if (isSel) gsap.to(controls.target, { x: g.position.x, z: g.position.z, duration: 0.9, ease: 'power2.out' });
    });
  }, [ready, selectedId, sig]);

  const fly = (k: 'home' | 'top') => { const v = api.current[k]; if (!v) return; gsap.to(api.current.camera.position, { ...v.pos, duration: 1.1, ease: 'power2.inOut' }); gsap.to(api.current.controls.target, { x: v.target.x, y: v.target.y, z: v.target.z, duration: 1.1, ease: 'power2.inOut' }); };

  if (fail) return <div className="grid place-items-center rounded-2xl border border-line bg-paper p-10 text-center text-sm text-muted" style={{ height }}>This device cannot show 3D. Use the list view instead.</div>;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line shadow-card" style={{ height }}>
      <div ref={mount} className="absolute inset-0" />
      <div className="absolute right-3 top-3 flex gap-2">
        <button type="button" onClick={() => fly('home')} className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-ink shadow-md hover:bg-white"><RotateCcw className="h-4 w-4" />Reset view</button>
        <button type="button" onClick={() => fly('top')} className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-ink shadow-md hover:bg-white"><Eye className="h-4 w-4" />From above</button>
      </div>
      {hint && <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/75 px-4 py-2 text-xs font-medium text-white"><MousePointerClick className="h-4 w-4" />Tap a table to choose it · drag to look around · pinch or scroll to zoom</div>}
    </div>
  );
}

export const Legend3D = ({ tones }: { tones: string[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{tones.map((k) => <span key={k} className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full" style={{ background: TONES[k].color }} />{TONES[k].label}</span>)}<span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full" style={{ background: SEL }} />Your choice</span></div>
);
