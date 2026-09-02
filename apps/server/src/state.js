const { DEVICE_TIMEOUT_MS } = require('./config')

// All state is in-memory and ephemeral by design — this server never persists
// files or clips to disk, and everything here disappears on restart.
const rooms = new Map() // roomKey → Map(deviceId → device)
const roomClips = new Map() // roomKey → Map(id → clip)
const sseClients = new Map() // deviceId → res  ← WebRTC signaling only
const pendingSignals = new Map() // deviceId → [{ from, type, data, ts }]

function getRoom(roomKey) {
  if (!rooms.has(roomKey)) rooms.set(roomKey, new Map())
  return rooms.get(roomKey)
}

function getRoomClips(roomKey) {
  if (!roomClips.has(roomKey)) roomClips.set(roomKey, new Map())
  return roomClips.get(roomKey)
}

// Find a device across all rooms → { device, roomKey } or null
function findDevice(deviceId) {
  for (const [roomKey, room] of rooms.entries()) {
    if (room.has(deviceId)) return { device: room.get(deviceId), roomKey }
  }
  return null
}

// Drop devices that stopped sending heartbeats
setInterval(() => {
  const now = Date.now()
  for (const devices of rooms.values()) {
    for (const [id, device] of devices.entries()) {
      if (now - device.lastSeen > DEVICE_TIMEOUT_MS) devices.delete(id)
    }
  }
}, 10_000)

// Drop queued signals that were never delivered
setInterval(() => {
  const cutoff = Date.now() - 30_000
  for (const [id, signals] of pendingSignals.entries()) {
    const fresh = signals.filter((s) => s.ts > cutoff)
    if (fresh.length) pendingSignals.set(id, fresh)
    else pendingSignals.delete(id)
  }
}, 60_000)

module.exports = {
  rooms,
  roomClips,
  sseClients,
  pendingSignals,
  getRoom,
  getRoomClips,
  findDevice,
}
