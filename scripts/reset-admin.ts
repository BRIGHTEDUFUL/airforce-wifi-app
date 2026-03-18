/**
 * Reset admin password on the server if login is broken.
 * Usage: NODE_ENV=production npx tsx scripts/reset-admin.ts
 */
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD   = process.env.NODE_ENV === 'production';
const dbDir     = IS_PROD ? path.join(__dirname, '..', 'data') : path.join(__dirname, '..');

if (!fs.existsSync(dbDir)) {
  console.error(`[reset] data/ directory not found at ${dbDir}`);
  process.exit(1);
}

const dbPath = path.join(dbDir, 'database.db');
if (!fs.existsSync(dbPath)) {
  console.error(`[reset] database.db not found at ${dbPath} — start the server first`);
  process.exit(1);
}

const db   = new Database(dbPath);
const hash = bcrypt.hashSync('Admin@GAF2026!', 10);

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@airforce.mil');
if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, 'admin@airforce.mil');
  console.log('[reset] Admin password reset to: Admin@GAF2026!');
} else {
  db.prepare('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)').run(
    'GAF Administrator', 'admin@airforce.mil', 'Administrator', hash
  );
  console.log('[reset] Admin user created: admin@airforce.mil / Admin@GAF2026!');
}

db.close();
