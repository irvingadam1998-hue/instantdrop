const { getClientIP } = require('../config')

// Minimal in-memory rate limiter — no external dependency needed for this scale.
// Each call site gets its own bucket map so limits never bleed across endpoints.
function rateLimit(max, windowMs) {
  const buckets = new Map()
  return (req, res, next) => {
    const key = getClientIP(req)
    const now = Date.now()
    const entry = buckets.get(key)
    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    if (entry.count >= max) {
      return res.status(429).json({ error: 'Demasiadas solicitudes' })
    }
    entry.count++
    next()
  }
}

module.exports = { rateLimit }
