require('dotenv').config({ quiet: true }) // suppress dotenv's own promotional startup log
const express = require('express')

const { PORT, getLocalIP } = require('./config')
const { corsMiddleware, securityHeaders } = require('./middleware/security')

const devicesRouter = require('./routes/devices')
const eventsRouter = require('./routes/events')
const clipsRouter = require('./routes/clips')
const qrRouter = require('./routes/qr')

const app = express()

app.set('trust proxy', 1) // Render sits behind a proxy; needed for req.ip / X-Forwarded-*

app.use(corsMiddleware)
app.use(securityHeaders)
app.use(express.json({ limit: '64kb' })) // clips/signals are small JSON payloads only

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api', devicesRouter)
app.use('/api', eventsRouter)
app.use('/api', clipsRouter)
app.use('/api', qrRouter)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === 'Origin no permitido por CORS') {
    return res.status(403).json({ error: 'Origin no permitido' })
  }
  console.error(err)
  res.status(500).json({ error: 'Error interno' })
})

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP()
  console.log('\nInstantDrop API corriendo')
  console.log(` Local:  http://localhost:${PORT}`)
  console.log(` Red:    http://${ip}:${PORT}`)
  console.log(' Señalización WebRTC + clips en memoria — sin archivos en el servidor\n')
})
