// SQLite-backed store with an in-memory cache.
// Every collection is a set of JSON documents: table records(col, id, data).
// Reads come from memory (fast); every write goes straight to SQLite (durable).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { buildSeed } from '../../shared/seed.js';

export class SqliteStore {
  constructor(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (col, id));');
    this.q = {
      all: this.db.prepare('SELECT col, data FROM records'),
      upsert: this.db.prepare('INSERT INTO records (col, id, data) VALUES (?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data'),
      del: this.db.prepare('DELETE FROM records WHERE col = ? AND id = ?'),
      count: this.db.prepare('SELECT COUNT(*) AS n FROM records'),
      wipe: this.db.prepare('DELETE FROM records'),
    };
    this.cache = {};
    if (this.q.count.get().n === 0) this.seed(); else this.load();
  }
  load() { this.cache = {}; for (const row of this.q.all.all()) (this.cache[row.col] ||= []).push(JSON.parse(row.data)); }
  seed() {
    const data = buildSeed();
    this.q.wipe.run();
    this.db.exec('BEGIN');
    for (const [col, rows] of Object.entries(data)) for (const r of rows) { if (col === 'users') this.hash(r); this.q.upsert.run(col, r.id, JSON.stringify(r)); }
    this.db.exec('COMMIT');
    this.load();
  }
  hash(u) { if (u.password) { u.password_hash = bcrypt.hashSync(u.password, 10); delete u.password; } delete u._rehash; return u; }
  col(c) { return (this.cache[c] ||= []); }
  all(c) { return this.col(c); }
  get(c, id) { return this.col(c).find((r) => r.id === id) || null; }
  insert(c, rec) { if (c === 'users') this.hash(rec); this.col(c).push(rec); this.q.upsert.run(c, rec.id, JSON.stringify(rec)); return rec; }
  update(c, id, next) {
    const arr = this.col(c); const i = arr.findIndex((r) => r.id === id); if (i < 0) return null;
    const rec = { ...next, id };
    if (c === 'users') { if (rec._rehash && rec.password) this.hash(rec); else { delete rec.password; delete rec._rehash; } }
    arr[i] = rec; this.q.upsert.run(c, id, JSON.stringify(rec)); return rec;
  }
  remove(c, id) { const arr = this.col(c); const i = arr.findIndex((r) => r.id === id); if (i >= 0) arr.splice(i, 1); this.q.del.run(c, id); }
}
