// localStorage is the only persistence this app has — no backend database,
// no cookies. Keys are namespaced to avoid clashing with anything else on
// whatever domain this ends up deployed to.
const KEYS = {
  deviceId: 'InstantDrop-deviceId',
  token: 'InstantDrop-token',
  emoji: 'InstantDrop-emoji',
  roomId: 'InstantDrop-roomId',
  lang: 'lang',
  deploymentId: 'InstantDrop-deploymentId',
} as const

export function normalizeRoomId(raw: string | null | undefined): string {
  return (raw || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 24)
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
  getRoomId: () => normalizeRoomId(safeGet(KEYS.roomId)),
  getDeploymentId: () => safeGet(KEYS.deploymentId),
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
    safeSet(KEYS.deviceId, deviceId)
    safeSet(KEYS.token, token)
    safeSet(KEYS.emoji, emoji)
    safeSet(KEYS.roomId, roomId)
    if (deploymentId) safeSet(KEYS.deploymentId, deploymentId)
  },
  setRoomId: (roomId: string) => safeSet(KEYS.roomId, roomId),
  clear: () => {
    safeSet(KEYS.deviceId, '')
    safeSet(KEYS.token, '')
    safeSet(KEYS.emoji, '')
    safeSet(KEYS.roomId, '')
    safeSet(KEYS.deploymentId, '')
  },
}

export const langStorage = {
  get: () => safeGet(KEYS.lang),
  set: (lang: string) => safeSet(KEYS.lang, lang),
}
