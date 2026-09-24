// localStorage is the only persistence this app has — no backend database,
// no cookies. Keys are namespaced to avoid clashing with anything else on
// whatever domain this ends up deployed to.
const KEYS = {
  credentials: 'InstantDrop-credentials',
  deviceId: 'InstantDrop-deviceId',
  token: 'InstantDrop-token',
  emoji: 'InstantDrop-emoji',
  roomId: 'InstantDrop-roomId',
  roomChoice: 'InstantDrop-roomChoice',
  lang: 'lang',
  deploymentId: 'InstantDrop-deploymentId',
} as const

let checkedRoomOnLoad = false

export function normalizeRoomId(raw: string | null | undefined): string {
  return (raw || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 24)
}

function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes)
  window.crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null // private browsing / storage disabled
  }
}

function safeSet(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore — nothing we can do if storage is unavailable */
  }
}

export const deviceStorage = {
  getDeviceId: () => safeGet(KEYS.deviceId),
  getToken: () => safeGet(KEYS.token),
  getEmoji: () => safeGet(KEYS.emoji) || '··',
  getDeviceName: () => {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone'
    if (/Android/.test(ua)) return 'Android'
    if (/Macintosh|Mac OS/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Windows'
    return 'Linux'
  },
  getRoomId: () => {
    if (!checkedRoomOnLoad) {
      checkedRoomOnLoad = true
      const navigation = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (navigation?.type === 'reload') {
        safeSet(KEYS.roomChoice, '')
        safeSet(KEYS.roomId, '')
        return ''
      }
    }
    return normalizeRoomId(safeGet(KEYS.roomChoice))
  },
  getDeploymentId: () => safeGet(KEYS.deploymentId),
  ensureCredentials() {
    try {
      const raw = window.localStorage.getItem(KEYS.credentials)
      if (raw) {
        const saved = JSON.parse(raw)
        if (/^[a-f0-9]{32}$/.test(saved.deviceId) && /^[a-f0-9]{48}$/.test(saved.token)) {
          return saved as { deviceId: string; token: string }
        }
      }
      const legacyId = window.localStorage.getItem(KEYS.deviceId) || ''
      const legacyToken = window.localStorage.getItem(KEYS.token) || ''
      const credentials = {
        deviceId: /^[a-f0-9]{32}$/.test(legacyId) ? legacyId : randomHex(16),
        token: /^[a-f0-9]{48}$/.test(legacyToken) ? legacyToken : randomHex(24),
      }
      window.localStorage.setItem(KEYS.credentials, JSON.stringify(credentials))
      return credentials
    } catch {
      return { deviceId: randomHex(16), token: randomHex(24) }
    }
  },
  getSessionId() {
    try {
      let id = sessionStorage.getItem('InstantDrop-sessionId')
      if (!/^[a-f0-9]{32}$/.test(id || '')) {
        id = randomHex(16)
        sessionStorage.setItem('InstantDrop-sessionId', id)
      }
      return id ?? randomHex(16)
    } catch {
      return randomHex(16)
    }
  },
  save({
    deviceId,
    token,
    emoji,
    roomId,
    deploymentId,
  }: {
    deviceId: string
    token: string
    emoji: string
    roomId: string
    deploymentId?: string
  }) {
    safeSet(KEYS.credentials, JSON.stringify({ deviceId, token }))
    safeSet(KEYS.deviceId, deviceId)
    safeSet(KEYS.token, token)
    safeSet(KEYS.emoji, emoji)
    safeSet(KEYS.roomId, roomId)
    if (deploymentId) safeSet(KEYS.deploymentId, deploymentId)
  },
  setRoomId: (roomId: string) => {
    safeSet(KEYS.roomChoice, normalizeRoomId(roomId))
    safeSet(KEYS.roomId, normalizeRoomId(roomId))
  },
  clear: () => {
    safeSet(KEYS.deviceId, '')
    safeSet(KEYS.token, '')
    safeSet(KEYS.emoji, '')
    safeSet(KEYS.roomId, '')
    safeSet(KEYS.roomChoice, '')
    safeSet(KEYS.deploymentId, '')
  },
}

export const langStorage = {
  get: () => safeGet(KEYS.lang),
  set: (lang: string) => safeSet(KEYS.lang, lang),
}
