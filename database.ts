import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production use /app/data so a Docker volume can persist the DB
const dbDir = process.env.NODE_ENV === 'production'
  ? '/app/data'
  : __dirname;

const db = new Database(path.join(dbDir, 'database.db'));

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

  // Seed default users if not exist
  const seedUsers = [
    { name: 'GAF Administrator', email: 'admin@airforce.mil',    role: 'Administrator', password: 'adminpassword' },
    { name: 'Ops Officer',       email: 'operator@airforce.mil', role: 'Operator',      password: 'operatorpass' },
    { name: 'Viewer Account',    email: 'viewer@airforce.mil',   role: 'Viewer',        password: 'viewerpass' },
  ];

  // Seed default messages if none exist
  const msgCount = (db.prepare('SELECT COUNT(*) as count FROM messages').get() as any).count;
  if (msgCount === 0) {
    const seedMessages = [
      {
        type: 'security',
        title: 'Security Policy Update',
        content: 'The network rotation policy has been updated for Q2. All administrators are required to review and acknowledge the new procedures before end of week.\n\nKey changes include:\n• WiFi credential rotation every 60 days (down from 90)\n• Mandatory 2FA for all admin accounts\n• New device registration requires dual approval\n\nPlease confirm receipt by logging into the portal.',
      },
      {
        type: 'system',
        title: 'New Device Detected',
        content: 'A new workstation (WS-442) has been registered in Sector 7. Verification pending from the duty officer.\n\nDevice Details:\n• Hostname: WS-442\n• MAC: 00:1A:2B:3C:4D:5E\n• Location: Sector 7, Room 204\n\nPlease verify and approve or reject this registration in the Devices module.',
      },
      {
        type: 'expiry',
        title: 'Credential Expiry Warning',
        content: '3 credentials in the Secure Vault are set to expire within 48 hours. Immediate rotation is recommended.\n\nAffected credentials:\n1. AWS Root Account — expires in 24h\n2. Internal DB Admin — expires in 36h\n3. VPN Gateway Key — expires in 48h\n\nNavigate to the Password Vault to rotate these credentials.',
      },
      {
        type: 'system',
        title: 'Scheduled Maintenance Notice',
        content: 'Scheduled maintenance for the primary gateway is set for Sunday 02:00–04:00 hrs. Expect brief service interruptions.\n\nMaintenance window: Sunday 02:00 – 04:00 hrs\nAffected systems: Primary Gateway, DNS Resolver, DHCP Server\n\nAll non-essential services will be suspended during this window. Emergency protocols remain active.',
      },
    ];
    for (const m of seedMessages) {
      db.prepare('INSERT INTO messages (type, title, content) VALUES (?, ?, ?)').run(m.type, m.title, m.content);
    }
    console.log('Seeded default messages');
  }

  for (const u of seedUsers) {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (!exists) {
      const hash = bcrypt.hashSync(u.password, 10);
      db.prepare('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)').run(u.name, u.email, u.role, hash);
      console.log(`Seeded user: ${u.email} / ${u.password} [${u.role}]`);
    }
  }
}

export default db;
