// In-memory store (used by the browser demo and tests). Same interface as the server store.
export class MemoryStore {
  constructor(db) { this.db = db; this.idx = {}; this.onChange = null; }
  col(c) { if (!this.db[c]) this.db[c] = []; return this.db[c]; }
  all(c) { return this.col(c); }
  get(c, id) { return this.col(c).find((r) => r.id === id) || null; }
  insert(c, rec) { this.col(c).push(rec); this.changed(); return rec; }
  update(c, id, next) { const arr = this.col(c); const i = arr.findIndex((r) => r.id === id); if (i >= 0) arr[i] = { ...next, id }; this.changed(); return arr[i]; }
  remove(c, id) { const arr = this.col(c); const i = arr.findIndex((r) => r.id === id); if (i >= 0) arr.splice(i, 1); this.changed(); }
  changed() { if (this.onChange) this.onChange(); }
}
