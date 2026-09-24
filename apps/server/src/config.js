const os = require('os')
const { createHash } = require('crypto')

const IS_PRODUCTION = ['production', 'prod'].includes(
  (process.env.APP_ENV || process.env.NODE_ENV || '').toLowerCase()
)

const PORT = process.env.PORT || 4000
const DEVICE_TIMEOUT_MS = 15_000

const EMOJIS = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐸',
  '🐵',
  '🐧',
  '🐦',
  '🦆',
  '🦅',
  '🦉',
  '🦋',
  '🐺',
  '🐗',
  '🐴',
  '🦄',
  '🐝',
  '🐞',
  '🐬',
  '🐙',
  '🦈',
  '🦒',
]

// Explicit list of frontend origins allowed to call this API (comma-separated).
// Falls back to permissive-but-scoped rules for local/LAN development below.
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean)

function getLocalIP() {
  let ifaces
  try {
    ifaces = os.networkInterfaces()
  } catch {
    return '127.0.0.1'
  }
  const skip =
    /virtual|vmware|vbox|hyper|vethernet|loopback|bluetooth|tunnel|tap|tun/i
  const prefer = /wi.?fi|wlan|wireless/i
  let fallback = null
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (skip.test(name)) continue
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue
      if (prefer.test(name)) return addr.address
      if (!fallback) fallback = addr.address
    }
  }
  return fallback || '127.0.0.1'
}

function isPrivateIP(ip) {
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('127.')) return true
  if (ip.startsWith('172.')) {
    const n = parseInt(ip.split('.')[1], 10)
    return n >= 16 && n <= 31
  }
  return false
}

// Origin is trusted if it's explicitly configured via FRONTEND_URL, or — outside
// production — if it's localhost / a private-LAN host (so two devices on the same
// WiFi can run web+server on one machine during development and still talk cross-port).
function isAllowedOrigin(origin) {
  if (!origin) return true // same-origin requests, curl, native EventSource without Origin
  const normalized = origin.replace(/\/$/, '')
  if (FRONTEND_ORIGINS.includes(normalized)) return true
  if (IS_PRODUCTION) return false
  try {
    const host = new URL(normalized).hostname
    return host === 'localhost' || host === '127.0.0.1' || isPrivateIP(host)
  } catch {
    return false
  }
}

// getClientIP is only used for the LAN-fallback room key (last resort, see getRoomKey)
// and for rate-limiting buckets — never as the primary source of room identity, so it
// stays safe to trust X-Forwarded-For behind Render's proxy without affecting room stability.
function getClientIP(req) {
  const forwarded = (req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
  if (forwarded.length) return forwarded[0].replace(/^::ffff:/, '')
  return (req.socket.remoteAddress || '').replace(/^::ffff:/, '')
}

function clientSubnet(req) {
  const ip = getClientIP(req)
  if (ip === '127.0.0.1' || ip === '::1')
    return getLocalIP().split('.').slice(0, 3).join('.')
  if (isPrivateIP(ip)) return ip.split('.').slice(0, 3).join('.')
  return ip // public IP: everyone behind the same router/NAT shares this
}

function normalizeRoomId(raw) {
  const value = (raw || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 24)
  return value || null
}

// Automatic discovery is scoped to a network, never to the public website.
// Only an explicit code can cross networks.
function getRoomKey(req, roomId) {
  const explicit = normalizeRoomId(roomId)
  if (explicit) return `room:${explicit}`

  const network = createHash('sha256').update(clientSubnet(req)).digest('hex').slice(0, 12).toUpperCase()
  return `room:NET-${network}`
}

// Automatic network rooms receive a shareable, opaque label as well.
function getRoomDisplayLabel(roomKey) {
  return roomKey.startsWith('room:') ? roomKey.slice('room:'.length) : null
}

module.exports = {
  IS_PRODUCTION,
  PORT,
  DEVICE_TIMEOUT_MS,
  EMOJIS,
  FRONTEND_ORIGINS,
  getLocalIP,
  isPrivateIP,
  isAllowedOrigin,
  getClientIP,
  clientSubnet,
  normalizeRoomId,
  getRoomKey,
  getRoomDisplayLabel,
}
