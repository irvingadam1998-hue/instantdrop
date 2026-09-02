const { Router } = require('express')
const qrcode = require('qrcode')
const { IS_PRODUCTION, PORT, getLocalIP } = require('../config')

const router = Router()

function isSafeUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// The frontend knows its own real address (window.location) far more reliably
// than this API ever could — especially once frontend and backend are deployed
// as two independent Render services — so it's the preferred source of truth.
// The Host-header fallback only matters for direct/local-network access to this
// API (e.g. hitting the server's own port straight from a LAN device).
router.get('/qr', async (req, res) => {
  const requested = typeof req.query.url === 'string' ? req.query.url : null
  let url

  if (requested && isSafeUrl(requested) && requested.length <= 2048) {
    url = requested
  } else {
    const host = ((req.headers['x-forwarded-host'] || req.headers.host || '') + '').split(',')[0]
    const proto = req.headers['x-forwarded-proto'] || (IS_PRODUCTION ? 'https' : 'http')
    url = host ? `${proto}://${host}` : `http://${getLocalIP()}:${PORT}`
  }

  const qr = await qrcode.toDataURL(url)
  res.json({ url, qr })
})

module.exports = router
