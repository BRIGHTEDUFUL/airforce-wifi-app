import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'database.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('Administrator', 'Operator', 'Viewer')) NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Devices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      location TEXT NOT NULL,
      ip_address TEXT,
      installation TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // WiFi Credentials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wifi_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ssid TEXT NOT NULL,
      password TEXT NOT NULL,
      location TEXT NOT NULL,
      assigned_devices TEXT,
      security_type TEXT CHECK(security_type IN ('WPA2', 'WPA3')) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Password Vault Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      device_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    )
  `);

  try {
    db.exec('ALTER TABLE password_vault ADD COLUMN device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL');
  } catch (e) {
    // Column already exists
  }

  // Secure Notes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS secure_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Messages / Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('security', 'expiry', 'system')) NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Admin User if not exists
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@airforce.mil');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('adminpassword', 10);
    db.prepare('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)').run(
      'System Admin',
      'admin@airforce.mil',
      'Administrator',
      hashedPassword
    );
    console.log('Default admin user created: admin@airforce.mil / adminpassword');
  }
}

export default db;
