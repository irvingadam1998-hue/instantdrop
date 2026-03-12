const express = require('express');
const multer  = require('multer');
const qrcode  = require('qrcode');
const path    = require('path');
const os      = require('os');

const app  = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ── Datos globales (todos los que llegan al servidor comparten la misma red) ──
const EMOJIS = [
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
  '🦁','🐮','🐸','🐵','🐧','🐦','🦆','🦅','🦉','🦋',
  '🐺','🐗','🐴','🦄','🐝','🐞','🐬','🐙','🦈','🦒'
];
const TIMEOUT = 30000; // 30s sin heartbeat → offline

const devices     = new Map(); // deviceId → device
const deviceInbox = new Map(); // deviceId → Map(fileId → file)
const clips       = new Map(); // id → clip

function getInbox(deviceId) {
  if (!deviceInbox.has(deviceId)) deviceInbox.set(deviceId, new Map());
  return deviceInbox.get(deviceId);
}

// Limpiar dispositivos inactivos cada 10s
setInterval(() => {
  const now = Date.now();
  for (const [id, d] of devices.entries())
    if (now - d.lastSeen > TIMEOUT) devices.delete(id);
}, 10000);

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  const skip   = /virtual|vmware|vbox|hyper|vethernet|loopback|bluetooth|tunnel|tap|tun/i;
  const prefer = /wi.?fi|wlan|wireless/i;
  let fallback = null;
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (skip.test(name)) continue;
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (prefer.test(name)) return addr.address;
      if (!fallback) fallback = addr.address;
    }
  }
  return fallback || '127.0.0.1';
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Registro de dispositivo ──
app.post('/api/register', (req, res) => {
  const { deviceId: existing } = req.body || {};

  if (existing && devices.has(existing)) {
    const d = devices.get(existing);
    d.lastSeen = Date.now();
    return res.json({ deviceId: existing, emoji: d.emoji });
  }

  const deviceId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const used     = new Set([...devices.values()].map(d => d.emoji));
  const pool     = EMOJIS.filter(e => !used.has(e));
  const emoji    = (pool.length ? pool : EMOJIS)[Math.floor(Math.random() * (pool.length || EMOJIS.length))];

  devices.set(deviceId, { id: deviceId, emoji, lastSeen: Date.now() });
  res.json({ deviceId, emoji });
});

// ── Heartbeat ──
app.post('/api/heartbeat', (req, res) => {
  const { deviceId } = req.body || {};
  const d = devices.get(deviceId);
  if (d) d.lastSeen = Date.now();
  res.json({ ok: true });
});

// ── Listar dispositivos activos (excluyendo el propio) ──
app.get('/api/devices', (req, res) => {
  const { me } = req.query;
  const now    = Date.now();
  const list   = [...devices.values()]
    .filter(d => d.id !== me && now - d.lastSeen < TIMEOUT)
    .map(({ id, emoji }) => ({ id, emoji }));
  res.json(list);
});

// ── Enviar archivos a un dispositivo específico ──
app.post('/api/send/:targetId', (req, res) => {
  upload.array('files')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ error: 'Archivo muy grande. Máximo 50 MB.' });
    if (err) return res.status(500).json({ error: err.message });

    const fromId    = req.body.fromId;
    const sender    = devices.get(fromId);
    const fromEmoji = sender ? sender.emoji : '❓';
    const inbox     = getInbox(req.params.targetId);

    for (const f of req.files) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      inbox.set(id, {
        id, name: f.originalname, buffer: f.buffer,
        size: f.size, mtime: new Date(), fromEmoji
      });
    }
    res.json({ ok: true });
  });
});

// ── Bandeja de entrada ──
app.get('/api/inbox', (req, res) => {
  const { deviceId } = req.query;
  const items = [...getInbox(deviceId).values()]
    .map(({ id, name, size, mtime, fromEmoji }) => ({ id, name, size, mtime, fromEmoji }));
  res.json(items);
});

app.get('/api/inbox/:fileId/download', (req, res) => {
  const { deviceId } = req.query;
  const file = getInbox(deviceId).get(req.params.fileId);
  if (!file) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(file.buffer);
});

app.delete('/api/inbox/:fileId', (req, res) => {
  const { deviceId } = req.query;
  const inbox = getInbox(deviceId);
  if (!inbox.has(req.params.fileId)) return res.status(404).json({ error: 'Not found' });
  inbox.delete(req.params.fileId);
  res.json({ ok: true });
});

// ── Text clips (compartidos entre todos en la red) ──
app.get('/api/clips', (req, res) => {
  res.json([...clips.values()].map(({ id, text, mtime }) => ({ id, text, mtime })));
});

app.post('/api/clips', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Texto vacío' });
  if (text.length > 10000) return res.status(400).json({ error: 'Texto muy largo' });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  clips.set(id, { id, text, mtime: new Date() });
  res.json({ ok: true, id });
});

app.delete('/api/clips/:id', (req, res) => {
  if (!clips.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  clips.delete(req.params.id);
  res.json({ ok: true });
});

// ── QR ──
app.get('/api/qr', async (req, res) => {
  const host  = process.env.RAILWAY_PUBLIC_DOMAIN || `${getLocalIP()}:${PORT}`;
  const proto = process.env.RAILWAY_PUBLIC_DOMAIN ? 'https' : 'http';
  const url   = `${proto}://${host}`;
  const qr    = await qrcode.toDataURL(url);
  res.json({ url, qr });
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n WiFi Share corriendo`);
  console.log(` Red:    http://${ip}:${PORT}\n`);
});
