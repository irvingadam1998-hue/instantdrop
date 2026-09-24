const { Router } = require('express')
const { randomBytes } = require('crypto')
const {
  EMOJIS,
  getRoomKey,
  getRoomDisplayLabel,
  normalizeRoomId,
  clientSubnet,
} = require('../config')
const { getRoom, findDevice, sseClients, availableDevices, broadcastPresence, removeConnection } = require('../state')
const { rateLimit } = require('../middleware/rateLimit')

const router = Router()

function generateDeviceId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function pickEmoji(room) {
  const used = new Set([...room.values()].map((d) => d.emoji))
  const pool = EMOJIS.filter((e) => !used.has(e))
  const source = pool.length ? pool : EMOJIS
  return source[Math.floor(Math.random() * source.length)]
}

router.post('/register', rateLimit(60, 60_000), (req, res) => {
  const { deviceId: existingId, token: existingToken, roomId, name } = req.body || {}
  const roomKey = getRoomKey(req, roomId)
  const room = getRoom(roomKey)
  const existing = findDevice(existingId)
  if (existing && existing.device.token !== existingToken) {
    return res.status(403).json({ error: 'Token inválido' })
  }
  if (existing && existing.roomKey !== roomKey) {
    const previousRoomKey = existing.roomKey
    getRoom(previousRoomKey).delete(existingId)
    existing.device.roomKey = roomKey
    room.set(existingId, existing.device)
    for (const [sessionId] of sseClients.get(existingId) || []) removeConnection(existingId, sessionId)
    broadcastPresence(previousRoomKey)
    broadcastPresence(roomKey)
  }

  // Re-registration: the token must match before we refresh lastSeen.
  if (existingId && room.has(existingId)) {
    const device = room.get(existingId)
    if (device.token !== existingToken) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    device.lastSeen = Date.now()
    device.name = typeof name === 'string' ? name.trim().slice(0, 60) : device.name
    broadcastPresence(roomKey)
    return res.json({
      deviceId: existingId,
      emoji: device.emoji,
      name: device.name,
      token: device.token,
      roomId: normalizeRoomId(roomId) || getRoomDisplayLabel(roomKey),
      deploymentId: req.deploymentId,
    })
  }

  // Client-generated credentials make concurrent first registrations idempotent.
  const canResume = /^[a-f0-9]{32}$/.test(existingId || '') && /^[a-f0-9]{48}$/.test(existingToken || '')
  const deviceId = canResume ? existingId : generateDeviceId()
  const token = canResume ? existingToken : randomBytes(24).toString('hex')
  const emoji = pickEmoji(room)

  room.set(deviceId, {
    id: deviceId,
    emoji,
    name: typeof name === 'string' ? name.trim().slice(0, 60) : '',
    token,
    subnet: clientSubnet(req),
    roomKey,
    lastSeen: Date.now(),
  })

  res.json({
    deviceId,
    emoji,
    name: typeof name === 'string' ? name.trim().slice(0, 60) : '',
    token,
    roomId: normalizeRoomId(roomId) || getRoomDisplayLabel(roomKey),
    deploymentId: req.deploymentId,
  })
})

router.post('/heartbeat', (req, res) => {
  const { deviceId, token, roomId, sessionId } = req.body || {}
  const roomKey = getRoomKey(req, roomId)
  const device = getRoom(roomKey).get(deviceId)

  if (device && device.token === token) {
    device.lastSeen = Date.now()
    const connection = sseClients.get(deviceId)?.get(sessionId)
    if (connection) connection.lastSeen = Date.now()
    return res.json({ ok: !!connection })
  }
  // Expired or token mismatch — client must call /register again.
  res.json({ ok: false })
})

router.get('/devices', (req, res) => {
  const roomKey = getRoomKey(req, req.query.roomId)
  const { me } = req.query
  res.setHeader('Cache-Control', 'no-store')
  res.json(availableDevices(roomKey, me))
})

router.post('/disconnect', (req, res) => {
  const { deviceId, token, sessionId } = req.body || {}
  const found = findDevice(deviceId)
  if (found?.device.token === token) removeConnection(deviceId, sessionId)
  res.json({ ok: true })
})

module.exports = router
