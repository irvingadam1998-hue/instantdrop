const os = require('os')

const IS_PRODUCTION = ['production', 'prod'].includes(
  (process.env.APP_ENV || process.env.NODE_ENV || '').toLowerCase()
)

const PORT = process.env.PORT || 4000
const DEVICE_TIMEOUT_MS = 30_000

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
  const ifaces = os.networkInterfaces()
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

// Stable room resolution — the core of production reliability:
//   1. Explicit roomId from the request always wins (lets users share a code).
//   2. APP_ROOM_ID pins every client hitting this deployment to one fixed room.
//      Set this on Render so the room never shifts under a shared/public domain.
//   3. LAN subnet for private IPs — ensures two devices on the same WiFi/network
//      automatically discover each other, even when accessing via public domain.
//   4. A per-hostname key for public IPs from different networks.
//   5. LAN subnet as fallback for any other case.
function getRoomKey(req, roomId) {
  const explicit = normalizeRoomId(roomId)
  if (explicit) return `room:${explicit}`

  const forced = normalizeRoomId(process.env.APP_ROOM_ID)
  if (forced) return `room:${forced}`

  // Priority: LAN/private subnet first (ensures same-WiFi discovery)
  const clientIP = getClientIP(req)
  if (
    clientIP &&
    clientIP !== '127.0.0.1' &&
    clientIP !== '::1' &&
    isPrivateIP(clientIP)
  ) {
    return `lan:${clientSubnet(req)}`
  }

  // Fall back to hostname-based room for public IPs
  const host = (
    (req.headers['x-forwarded-host'] || req.headers.host || '') + ''
  )
    .split(',')[0]
    .split(':')[0]
    .toLowerCase()
  const isLocalHost =
    !host || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(host)
  if (!isLocalHost) {
    const siteKey = host
      .replace(/^www\./, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 18)
      .toUpperCase()
    if (siteKey) return `room:AUTO-${siteKey}`
  }

  return `lan:${clientSubnet(req)}`
}

// The `room:` prefix means the key came from an explicit code, APP_ROOM_ID, or
// the deployment's own hostname — all shareable/displayable. `lan:` is derived
// from a client IP subnet and isn't a meaningful code to show a user.
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
