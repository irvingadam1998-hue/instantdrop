const { DEVICE_TIMEOUT_MS } = require('./config')

// All state is in-memory and ephemeral by design — this server never persists
// files or clips to disk, and everything here disappears on restart.
const rooms = new Map() // roomKey → Map(deviceId → device)
const roomClips = new Map() // roomKey → Map(id → clip)
// Multiple tabs share an identity but have separate live connections.
const sseClients = new Map() // deviceId -> Map(sessionId -> { res, lastSeen })

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

function activeConnections(deviceId, now = Date.now()) {
  return [...(sseClients.get(deviceId)?.entries() || [])].filter(([, connection]) =>
    !connection.res.destroyed && !connection.res.writableEnded && now - connection.lastSeen < DEVICE_TIMEOUT_MS
  )
}

function availableDevices(roomKey, me, now = Date.now()) {
  const devices = [...getRoom(roomKey).values()]
    .filter((device) => device.id !== me && activeConnections(device.id, now).length)
  const nameCounts = new Map()
  for (const device of devices) nameCounts.set(device.name, (nameCounts.get(device.name) || 0) + 1)
  const nameIndexes = new Map()
  return devices.map(({ id, emoji, name }) => {
    const connections = activeConnections(id, now)
    const index = (nameIndexes.get(name) || 0) + 1
    nameIndexes.set(name, index)
    const label = nameCounts.get(name) > 1 ? `${name} ${index}` : name
    return { id, emoji, name: label, sessionId: connections.at(-1)?.[0] }
  })
}

function broadcastPresence(roomKey) {
  for (const id of getRoom(roomKey).keys()) {
    const event = `event: devices\ndata: ${JSON.stringify(availableDevices(roomKey, id))}\n\n`
    for (const [, { res }] of activeConnections(id)) res.write(event)
  }
}

function removeConnection(deviceId, sessionId, expectedResponse) {
  const connections = sseClients.get(deviceId)
  const connection = connections?.get(sessionId)
  // Closing an old stream must never delete its replacement.
  if (!connection || (expectedResponse && connection.res !== expectedResponse)) return
  connections.delete(sessionId)
  if (!connections.size) sseClients.delete(deviceId)
  connection.res.end()
  const found = findDevice(deviceId)
  if (found) broadcastPresence(found.roomKey)
}

function pruneDevices(now = Date.now()) {
  for (const [id, connections] of sseClients) {
    for (const [sessionId, connection] of connections) {
      if (now - connection.lastSeen >= DEVICE_TIMEOUT_MS || connection.res.destroyed) {
        removeConnection(id, sessionId, connection.res)
      }
    }
  }
  for (const [roomKey, room] of rooms) {
    for (const [id, device] of room) {
      if (!sseClients.has(id) && now - device.lastSeen >= DEVICE_TIMEOUT_MS) room.delete(id)
    }
    if (!room.size) rooms.delete(roomKey)
  }
}

setInterval(pruneDevices, 1000).unref()

module.exports = {
  rooms,
  roomClips,
  sseClients,
  activeConnections,
  availableDevices,
  broadcastPresence,
  removeConnection,
  pruneDevices,
  getRoom,
  getRoomClips,
  findDevice,
}
