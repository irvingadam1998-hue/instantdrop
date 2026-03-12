const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Archivos en memoria — se pierden al reiniciar
const files = new Map(); // name -> { name, buffer, size, mtime }
const clips = new Map(); // id -> { id, text, mtime }

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ── Detectar IP WiFi real (ignora adaptadores virtuales) ──
function getWiFiIP() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return '0.0.0.0';

  const ifaces = os.networkInterfaces();
  const skip = /virtual|vmware|vbox|hyper|vethernet|loopback|bluetooth|tunnel|tap|tun/i;
  const prefer = /wi.?fi|wlan|wireless/i;
  let fallback = null;

  for (const [name, addrs] of Object.entries(ifaces)) {
    if (skip.test(name)) continue;
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (prefer.test(name)) return addr.address; // WiFi encontrado
      if (!fallback) fallback = addr.address;
    }
  }
  return fallback || '127.0.0.1';
}

// ── Restricción: el cliente debe estar en la misma subred /24
//    que la interfaz de red que recibió la conexión ──
app.use((req, res, next) => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return next();

  const clean = ip => (ip || '').replace(/^::ffff:/, '');
  const remote = clean(req.socket.remoteAddress); // IP del cliente
  const local  = clean(req.socket.localAddress);  // IP del adaptador que recibió la conexión

  // Permitir loopback
  if (remote === '127.0.0.1' || remote === '::1') return next();

  const remoteSubnet = remote.split('.').slice(0, 3).join('.');
  const localSubnet  = local.split('.').slice(0, 3).join('.');

  if (remoteSubnet !== localSubnet) {
    return res.status(403).send('Acceso solo desde la red WiFi local.');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// List
app.get('/api/files', (req, res) => {
  const list = [...files.values()].map(({ name, size, mtime }) => ({ name, size, mtime }));
  res.json(list);
});

// Upload
app.post('/api/upload', (req, res) => {
  upload.array('files')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ error: 'Archivo muy grande. Máximo 50 MB.' });
    if (err) return res.status(500).json({ error: err.message });

    for (const f of req.files) {
      let name = f.originalname;
      const ext = path.extname(name);
      const base = path.basename(name, ext);
      let i = 1;
      while (files.has(name)) name = `${base}(${i++})${ext}`;
      files.set(name, { name, buffer: f.buffer, size: f.size, mtime: new Date() });
    }

    res.json({ ok: true, files: req.files.map(f => f.originalname) });
  });
});

// Download
app.get('/api/download/:filename', (req, res) => {
  const file = files.get(req.params.filename);
  if (!file) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(file.buffer);
});

// Delete
app.delete('/api/files/:filename', (req, res) => {
  if (!files.has(req.params.filename)) return res.status(404).json({ error: 'Not found' });
  files.delete(req.params.filename);
  res.json({ ok: true });
});

// Text clips
app.use(express.json());

app.get('/api/clips', (req, res) => {
  res.json([...clips.values()].map(({ id, text, mtime }) => ({ id, text, mtime })));
});

app.post('/api/clips', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Texto vacío' });
  if (text.length > 10000) return res.status(400).json({ error: 'Texto muy largo (máx 10 000 caracteres)' });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  clips.set(id, { id, text, mtime: new Date() });
  res.json({ ok: true, id });
});

app.delete('/api/clips/:id', (req, res) => {
  if (!clips.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  clips.delete(req.params.id);
  res.json({ ok: true });
});

// QR
app.get('/api/qr', async (req, res) => {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || `${BIND_IP}:${PORT}`;
  const proto = process.env.RAILWAY_PUBLIC_DOMAIN ? 'https' : 'http';
  const url = `${proto}://${host}`;
  const qr = await qrcode.toDataURL(url);
  res.json({ url, qr });
});

// ── Arrancar el servidor SOLO en la IP WiFi ──
const BIND_IP = getWiFiIP();

app.listen(PORT, BIND_IP, () => {
  console.log(`\n WiFi Share corriendo`);
  console.log(` Red:    http://${BIND_IP}:${PORT}`);
  console.log(` Solo accesible desde la misma red WiFi (${BIND_IP.split('.').slice(0,3).join('.')}.x)\n`);
});
