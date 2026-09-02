const { Router } = require('express')
const { getRoomKey } = require('../config')
const { getRoomClips } = require('../state')
const { rateLimit } = require('../middleware/rateLimit')

const router = Router()
const MAX_CLIPS_PER_ROOM = 100
const MAX_CLIP_LENGTH = 10_000

router.get('/clips', (req, res) => {
  const roomKey = getRoomKey(req, req.query.roomId)
  const clips = getRoomClips(roomKey)
  res.json([...clips.values()].map(({ id, text, mtime }) => ({ id, text, mtime })))
})

router.post('/clips', rateLimit(30, 60_000), (req, res) => {
  const roomKey = getRoomKey(req, req.body && req.body.roomId)
  const text = ((req.body && req.body.text) || '').trim()

  if (!text) return res.status(400).json({ error: 'Texto vacío' })
  if (text.length > MAX_CLIP_LENGTH) return res.status(400).json({ error: 'Texto muy largo' })

  const clips = getRoomClips(roomKey)
  if (clips.size >= MAX_CLIPS_PER_ROOM) {
    return res.status(429).json({ error: 'Límite de clips alcanzado' })
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  clips.set(id, { id, text, mtime: new Date() })
  res.json({ ok: true, id })
})

router.delete('/clips/:id', rateLimit(30, 60_000), (req, res) => {
  const roomKey = getRoomKey(req, req.query.roomId)
  const clips = getRoomClips(roomKey)

  if (!clips.has(req.params.id)) return res.status(404).json({ error: 'Not found' })
  clips.delete(req.params.id)
  res.json({ ok: true })
})

module.exports = router
