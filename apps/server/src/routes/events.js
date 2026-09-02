const { Router } = require('express')
const { getRoomKey } = require('../config')
const { getRoom, findDevice, sseClients, pendingSignals } = require('../state')
const { rateLimit } = require('../middleware/rateLimit')

const router = Router()

// WebRTC signaling only — the server relays offer/answer/ICE messages between
// two already-registered devices and never touches file bytes or clip content.
router.get('/events', (req, res) => {
  const { deviceId, token, roomId } = req.query
  const requestedRoomKey = roomId ? getRoomKey(req, roomId) : null

  // Validate the device exists, its token is correct, and it belongs to the requested room.
  const found = findDevice(deviceId)
  if (
    !found ||
    found.device.token !== token ||
    (requestedRoomKey && found.roomKey !== requestedRoomKey)
  ) {
    return res.status(403).end()
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  sseClients.set(deviceId, res)

  // Flush any signals that arrived before this SSE connection was ready.
  const queued = pendingSignals.get(deviceId)
  if (queued) {
    const now = Date.now()
    for (const s of queued) {
      if (now - s.ts < 30_000) {
        res.write(`data: ${JSON.stringify({ from: s.from, type: s.type, data: s.data })}\n\n`)
      }
    }
    pendingSignals.delete(deviceId)
  }

  const ping = setInterval(() => res.write(': ping\n\n'), 25_000)
  req.on('close', () => {
    clearInterval(ping)
    sseClients.delete(deviceId)
  })
})

router.post('/signal', rateLimit(60, 10_000), (req, res) => {
  const { to, from, token, type, data, roomId } = req.body || {}

  // 1. Sender must exist and present a valid token.
  const sender = findDevice(from)
  if (!sender || sender.device.token !== token) {
    return res.status(403).json({ error: 'No autorizado' })
  }

  const senderRoomKey = roomId ? getRoomKey(req, roomId) : sender.roomKey

  // 2. Target must be in the same room (or the LAN-fallback room, as resolved above).
  const targetRoom = getRoom(senderRoomKey)
  if (!targetRoom.has(to)) {
    return res.status(403).json({ error: 'Dispositivo fuera de tu sala' })
  }

  const target = sseClients.get(to)
  if (target) {
    target.write(`data: ${JSON.stringify({ from, type, data })}\n\n`)
  } else {
    // Receiver has no active SSE connection yet — queue for delivery on connect.
    if (!pendingSignals.has(to)) pendingSignals.set(to, [])
    pendingSignals.get(to).push({ from, type, data, ts: Date.now() })
  }

  res.json({ ok: !!target })
})

module.exports = router
