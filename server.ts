import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDb } from './database.ts';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Simple encryption for vault passwords (not for production, but meets "encrypted storage" requirement for this demo)
const ENCRYPTION_KEY = crypto.scryptSync(JWT_SECRET, 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function startServer() {
  initDb();
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Middleware: Role Check
  const authorizeRoles = (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    };
  };

  // Helper: Log Audit
  const logAudit = (userId: number, userName: string, action: string, module: string, details?: string) => {
    db.prepare('INSERT INTO audit_logs (user_id, user_name, action, module, details) VALUES (?, ?, ?, ?, ?)').run(
      userId, userName, action, module, details || null
    );
  };

  // --- Auth Routes ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      // Log failed attempt
      logAudit(0, 'Unknown', 'Failed Login Attempt', 'Auth', `Email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    logAudit(user.id, user.name, 'User Login', 'Auth');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // --- Dashboard Stats ---
  app.get('/api/stats', authenticateToken, (req, res) => {
    const devicesCount = db.prepare('SELECT COUNT(*) as count FROM devices').get() as any;
    const wifiCount = db.prepare('SELECT COUNT(*) as count FROM wifi_credentials').get() as any;
    const vaultCount = db.prepare('SELECT COUNT(*) as count FROM password_vault').get() as any;
    
    const deviceTypes = db.prepare('SELECT device_type as name, COUNT(*) as value FROM devices GROUP BY device_type').all();
    const vaultCategories = db.prepare('SELECT category as name, COUNT(*) as value FROM password_vault GROUP BY category').all();
    const topUsers = db.prepare('SELECT user_name as name, COUNT(*) as value FROM audit_logs GROUP BY user_name ORDER BY value DESC LIMIT 5').all();
    const moduleActivity = db.prepare('SELECT module as name, COUNT(*) as value FROM audit_logs GROUP BY module').all();
    
    // Activity by day (last 7 days)
    const dailyActivity = db.prepare(`
      SELECT date(timestamp) as name, COUNT(*) as value 
      FROM audit_logs 
      WHERE timestamp >= date('now', '-7 days')
      GROUP BY date(timestamp)
      ORDER BY name ASC
    `).all();

    const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10').all();
    const alerts = db.prepare('SELECT * FROM messages WHERE is_read = 0 ORDER BY created_at DESC').all();

    res.json({
      totalDevices: devicesCount.count,
      totalWifi: wifiCount.count,
      totalCredentials: vaultCount.count,
      deviceTypes,
      vaultCategories,
      topUsers,
      moduleActivity,
      dailyActivity,
      recentLogs,
      alerts
    });
  });

  // --- Device Routes ---
  app.get('/api/devices', authenticateToken, (req, res) => {
    const devices = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all();
    res.json(devices);
  });

  app.post('/api/devices', authenticateToken, authorizeRoles('Administrator', 'Operator'), (req, res) => {
    const { device_name, device_type, location, ip_address, installation, notes } = req.body;
    const result = db.prepare('INSERT INTO devices (device_name, device_type, location, ip_address, installation, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
      device_name, device_type, location, ip_address, installation, notes
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Added Device', 'Devices', device_name);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/devices/:id', authenticateToken, authorizeRoles('Administrator', 'Operator'), (req, res) => {
    const { device_name, device_type, location, ip_address, installation, notes } = req.body;
    db.prepare('UPDATE devices SET device_name = ?, device_type = ?, location = ?, ip_address = ?, installation = ?, notes = ? WHERE id = ?').run(
      device_name, device_type, location, ip_address, installation, notes, req.params.id
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Updated Device', 'Devices', device_name);
    res.json({ success: true });
  });

  app.delete('/api/devices/:id', authenticateToken, authorizeRoles('Administrator'), (req, res) => {
    const device: any = db.prepare('SELECT device_name FROM devices WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
    logAudit((req as any).user.id, (req as any).user.name, 'Deleted Device', 'Devices', device?.device_name);
    res.json({ success: true });
  });

  // --- WiFi Routes ---
  app.get('/api/wifi', authenticateToken, (req, res) => {
    const wifi = db.prepare('SELECT * FROM wifi_credentials ORDER BY created_at DESC').all();
    res.json(wifi);
  });

  app.post('/api/wifi', authenticateToken, authorizeRoles('Administrator', 'Operator'), (req, res) => {
    const { ssid, password, location, assigned_devices, security_type, notes } = req.body;
    const result = db.prepare('INSERT INTO wifi_credentials (ssid, password, location, assigned_devices, security_type, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
      ssid, password, location, assigned_devices, security_type, notes
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Added WiFi Network', 'WiFi', ssid);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/wifi/:id', authenticateToken, authorizeRoles('Administrator', 'Operator'), (req, res) => {
    const { ssid, password, location, assigned_devices, security_type, notes } = req.body;
    db.prepare('UPDATE wifi_credentials SET ssid = ?, password = ?, location = ?, assigned_devices = ?, security_type = ?, notes = ? WHERE id = ?').run(
      ssid, password, location, assigned_devices, security_type, notes, req.params.id
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Updated WiFi Credentials', 'WiFi', ssid);
    res.json({ success: true });
  });

  // --- Vault Routes ---
  app.get('/api/vault', authenticateToken, (req, res) => {
    const items = db.prepare('SELECT * FROM password_vault ORDER BY created_at DESC').all() as any[];
    const decryptedItems = items.map(item => ({
      ...item,
      password: decrypt(item.password)
    }));
    res.json(decryptedItems);
  });

  app.post('/api/vault', authenticateToken, authorizeRoles('Administrator', 'Operator'), (req, res) => {
    const { service_name, username, password, category, notes } = req.body;
    const encryptedPassword = encrypt(password);
    const result = db.prepare('INSERT INTO password_vault (service_name, username, password, category, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(
      service_name, username, encryptedPassword, category, notes, (req as any).user.id
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Added Vault Credential', 'Vault', service_name);
    res.json({ id: result.lastInsertRowid });
  });

  // --- Notes Routes ---
  app.get('/api/notes', authenticateToken, (req, res) => {
    const notes = db.prepare('SELECT * FROM secure_notes WHERE is_archived = 0 ORDER BY is_pinned DESC, created_at DESC').all();
    res.json(notes);
  });

  app.post('/api/notes', authenticateToken, (req, res) => {
    const { title, content, category, is_pinned } = req.body;
    const result = db.prepare('INSERT INTO secure_notes (title, content, category, is_pinned, created_by) VALUES (?, ?, ?, ?, ?)').run(
      title, content, category, is_pinned ? 1 : 0, (req as any).user.id
    );
    logAudit((req as any).user.id, (req as any).user.name, 'Created Note', 'Notes', title);
    res.json({ id: result.lastInsertRowid });
  });

  // --- Audit Logs ---
  app.get('/api/audit', authenticateToken, authorizeRoles('Administrator'), (req, res) => {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
    res.json(logs);
  });

  // --- User Management ---
  app.get('/api/users', authenticateToken, authorizeRoles('Administrator'), (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticateToken, authorizeRoles('Administrator'), (req, res) => {
    const { name, email, role, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)').run(
        name, email, role, hashedPassword
      );
      logAudit((req as any).user.id, (req as any).user.name, 'Created User', 'Users', email);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ message: 'Email already exists' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, authorizeRoles('Administrator'), (req, res) => {
    const user: any = db.prepare('SELECT email FROM users WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logAudit((req as any).user.id, (req as any).user.name, 'Deleted User', 'Users', user?.email);
    res.json({ success: true });
  });

  // --- Vite / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Air Force Key Manager running at http://localhost:${PORT}`);
  });
}

startServer();
