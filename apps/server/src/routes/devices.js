const { Router } = require('express')
const { randomBytes } = require('crypto')
const {
  EMOJIS,
  DEVICE_TIMEOUT_MS,
  getRoomKey,
  getRoomDisplayLabel,
  normalizeRoomId,
  clientSubnet,
} = require('../config')
const { getRoom } = require('../state')
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

router.post('/register', rateLimit(20, 60_000), (req, res) => {
  const { deviceId: existingId, token: existingToken, roomId } = req.body || {}
  const roomKey = getRoomKey(req, roomId)
  const room = getRoom(roomKey)

  // Re-registration: the token must match before we refresh lastSeen.
  if (existingId && room.has(existingId)) {
    const device = room.get(existingId)
    if (device.token !== existingToken) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    device.lastSeen = Date.now()
    return res.json({
      deviceId: existingId,
      emoji: device.emoji,
      token: device.token,
      roomId: normalizeRoomId(roomId) || getRoomDisplayLabel(roomKey),
      deploymentId: req.deploymentId,
    })
  }

  const deviceId = generateDeviceId()
  const token = randomBytes(24).toString('hex') // unique per-device secret
  const emoji = pickEmoji(room)

  room.set(deviceId, {
    id: deviceId,
    emoji,
    token,
    subnet: clientSubnet(req),
    roomKey,
    lastSeen: Date.now(),
  })

  res.json({
    deviceId,
    emoji,
    token,
    roomId: normalizeRoomId(roomId) || getRoomDisplayLabel(roomKey),
    deploymentId: req.deploymentId,
  })
})

router.post('/heartbeat', (req, res) => {
  const { deviceId, token, roomId } = req.body || {}
  const roomKey = getRoomKey(req, roomId)
  const device = getRoom(roomKey).get(deviceId)

  if (device && device.token === token) {
    device.lastSeen = Date.now()
    return res.json({ ok: true })
  }
  // Expired or token mismatch — client must call /register again.
  res.json({ ok: false })
})

router.get('/devices', (req, res) => {
  const roomKey = getRoomKey(req, req.query.roomId)
  const { me } = req.query
  const now = Date.now()

  const list = [...getRoom(roomKey).values()]
    .filter((d) => d.id !== me && now - d.lastSeen < DEVICE_TIMEOUT_MS)
    .map(({ id, emoji }) => ({ id, emoji }))

  res.json(list)
})

module.exports = router
