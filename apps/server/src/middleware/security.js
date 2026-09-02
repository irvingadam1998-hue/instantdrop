const cors = require('cors')
const { IS_PRODUCTION, isAllowedOrigin } = require('../config')

// This server is API-only (JSON + SSE) — the frontend lives in a separate
// Next.js app, same-domain or on another Render service, so CORS must be
// explicit rather than relying on same-origin cookies/sessions (there are none).
const corsMiddleware = cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true)
    callback(new Error('Origin no permitido por CORS'))
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
})

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  res.setHeader('Content-Security-Policy', ["default-src 'none'", "frame-ancestors 'none'"].join('; '))
  next()
}

module.exports = { corsMiddleware, securityHeaders }
