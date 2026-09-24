const { Router } = require('express')
const { getRoomKey } = require('../config')
const { findDevice, sseClients, activeConnections, broadcastPresence, removeConnection } = require('../state')
const { rateLimit } = require('../middleware/rateLimit')

const router = Router()

router.get('/events', (req, res) => {
  const { deviceId, token, roomId, sessionId } = req.query
  const found = findDevice(deviceId)
  if (!found || found.device.token !== token || found.roomKey !== getRoomKey(req, roomId) ||
      typeof sessionId !== 'string' || !/^[a-f0-9]{32}$/.test(sessionId)) {
    return res.status(403).end()
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  if (!sseClients.has(deviceId)) sseClients.set(deviceId, new Map())
  const connections = sseClients.get(deviceId)
  const previous = connections.get(sessionId)
  connections.set(sessionId, { res, lastSeen: Date.now() })
  previous?.res.end()
  found.device.lastSeen = Date.now()
  broadcastPresence(found.roomKey)

  const ping = setInterval(() => res.write('event: ping\ndata: {}\n\n'), 4000)
  res.on('close', () => {
    clearInterval(ping)
    removeConnection(deviceId, sessionId, res)
  })
})

router.post('/signal', rateLimit(60, 10_000), (req, res) => {
  const { to, from, token, type, data, roomId, sessionId, toSessionId } = req.body || {}
  const sender = findDevice(from)
  if (!sender || sender.device.token !== token || sender.roomKey !== getRoomKey(req, roomId) ||
      !activeConnections(from).some(([id]) => id === sessionId)) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  const receiver = findDevice(to)
  if (!receiver || receiver.roomKey !== sender.roomKey) {
    return res.status(403).json({ error: 'Dispositivo fuera de tu sala' })
  }
  const connections = activeConnections(to)
  const target = toSessionId ? connections.find(([id]) => id === toSessionId) : connections.at(-1)
  if (!target) return res.status(409).json({ error: 'El dispositivo se ha desconectado' })
  target[1].res.write(`data: ${JSON.stringify({ from, type, data, sessionId })}\n\n`)
  res.json({ ok: true })
})

module.exports = router
