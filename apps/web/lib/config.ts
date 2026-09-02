// Resolves the base URL of the Express backend.
//
// In production (Render, or any split deployment) set NEXT_PUBLIC_SERVER_URL at
// build time to the backend's public URL — it always wins.
//
// Without it (typical local/LAN development, one machine running both apps),
// we derive the backend address from the browser's own hostname plus the
// backend's port. That way, whatever LAN IP a phone used to reach this page
// is exactly the IP it will use to reach the API too — no hardcoded IPs.
const DEFAULT_SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || '4000'

export function getServerBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SERVER_PORT}`
  }

  return `http://localhost:${DEFAULT_SERVER_PORT}`
}
