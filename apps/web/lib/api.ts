import { getServerBaseUrl } from './config'

export interface RegisterResponse {
  deviceId: string
  emoji: string
  name: string
  token: string
  roomId: string | null
  deploymentId?: string
}

export interface Device {
  id: string
  emoji: string
  name: string
  sessionId?: string
}

export interface Clip {
  id: string
  text: string
  mtime: string
}

function url(path: string, params?: Record<string, string | undefined>) {
  const u = new URL(path, getServerBaseUrl())
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) u.searchParams.set(key, value)
    }
  }
  return u.toString()
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export function register(payload: {
  deviceId?: string | null
  token?: string | null
  roomId?: string
  name?: string
}) {
  return postJson<RegisterResponse>('/api/register', payload)
}

export function heartbeat(payload: {
  deviceId: string
  token: string
  sessionId: string
  roomId?: string
}) {
  return postJson<{ ok: boolean }>('/api/heartbeat', payload)
}

export async function fetchDevices(
  me: string,
  roomId?: string
): Promise<Device[]> {
  const res = await fetch(url('/api/devices', { me, roomId }), { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudieron cargar los dispositivos')
  const payload: unknown = await res.json()
  if (!Array.isArray(payload)) return []
  const unique = new Map<string, Device>()
  for (const value of payload) {
    if (value && typeof value.id === 'string' && typeof value.emoji === 'string') {
      unique.set(value.id, { id: value.id, emoji: value.emoji,
        name: typeof value.name === 'string' ? value.name : '',
        sessionId: typeof value.sessionId === 'string' ? value.sessionId : undefined })
    }
  }
  return [...unique.values()]
}

export async function fetchQr(
  pageUrl: string
): Promise<{ url: string; qr: string }> {
  const res = await fetch(url('/api/qr', { url: pageUrl }))
  return res.json()
}

export function sendSignal(payload: {
  to: string
  from: string
  token: string
  type: string
  data: unknown
  roomId?: string
  sessionId: string
  toSessionId?: string
}) {
  return postJson<{ ok: boolean }>('/api/signal', payload)
}

export function eventsUrl(deviceId: string, token: string, roomId: string | undefined, sessionId: string) {
  return url('/api/events', { deviceId, token, roomId, sessionId })
}

export async function fetchClips(roomId?: string): Promise<Clip[]> {
  const res = await fetch(url('/api/clips', { roomId }))
  return res.json()
}

export function createClip(text: string, roomId?: string) {
  return postJson<{ ok: boolean; id?: string; error?: string }>('/api/clips', {
    text,
    roomId,
  })
}

export async function deleteClip(id: string, roomId?: string) {
  await fetch(url(`/api/clips/${encodeURIComponent(id)}`, { roomId }), {
    method: 'DELETE',
  })
}
