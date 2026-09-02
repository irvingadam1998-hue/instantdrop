import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a monorepo (apps/web) with a single root lockfile —
  // pin the trace root so Next doesn't have to guess it from the tree.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // No server-side data fetching or API routes here — this frontend is a static,
  // fully client-driven app that talks to the separate Express backend over
  // NEXT_PUBLIC_SERVER_URL, so it can be deployed as static/standalone output
  // just as well as on Vercel-style infra. Render runs it with `next start`.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
