'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { deviceStorage, normalizeRoomId } from '@/lib/storage'
import * as api from '@/lib/api'
import type { Clip, Device } from '@/lib/api'

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
const CHUNK_SIZE = 256 * 1024
const HIGH_WATER = 4 * 1024 * 1024
const LOW_WATER = 512 * 1024
const POLL_INTERVAL_MS = 3000
const HEARTBEAT_INTERVAL_MS = 10_000

export interface OverlayState {
  open: boolean
  label: string
  pct: string
}

export interface IncomingRequest {
  files: { name: string; size: number }[]
  peerId: string
  peerEmoji: string
}

export function useInstantDrop() {
  const { t } = useI18n()

  // ── Identity & room (persisted) ──
  const [myDeviceId, setMyDeviceId] = useState('')
  const [myToken, setMyToken] = useState('')
  const [myEmoji, setMyEmoji] = useState('··')
  const [myRoomId, setMyRoomIdState] = useState('')
  const [ready, setReady] = useState(false)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [esConnected, setEsConnected] = useState(false)

  // ── Network state ──
  const [devices, setDevices] = useState<Device[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [qr, setQr] = useState<{ url: string; qr: string } | null>(null)

  // ── Transient UI state ──
  const [overlay, setOverlay] = useState<OverlayState>({
    open: false,
    label: '',
    pct: '',
  })
  const [incoming, setIncoming] = useState<IncomingRequest | null>(null)
  const [recvText, setRecvText] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // ── Mutable refs mirroring state used inside long-lived closures (SSE, WebRTC) ──
  const myDeviceIdRef = useRef(myDeviceId)
  const myTokenRef = useRef(myToken)
  const myRoomIdRef = useRef(myRoomId)
  const selectedIdRef = useRef(selectedId)
  const isBusyRef = useRef(isBusy)
  useEffect(() => void (myDeviceIdRef.current = myDeviceId), [myDeviceId])
  useEffect(() => void (myTokenRef.current = myToken), [myToken])
  useEffect(() => void (myRoomIdRef.current = myRoomId), [myRoomId])
  useEffect(() => void (selectedIdRef.current = selectedId), [selectedId])
  useEffect(() => void (isBusyRef.current = isBusy), [isBusy])

  const peerConnections = useRef(new Map<string, RTCPeerConnection>())
  const pendingFiles = useRef(new Map<string, File[]>())
  const pendingTexts = useRef(new Map<string, string>())
  const deviceEmojis = useRef(new Map<string, string>())
  const incomingDCRef = useRef<RTCDataChannel | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const esDelayRef = useRef(3000)
  const esRecoveringRef = useRef(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2500)
  }, [])

  // ── Registration ──
  const register = useCallback(async () => {
    const res = await api.register({
      deviceId: myDeviceIdRef.current || undefined,
      token: myTokenRef.current || undefined,
      roomId: myRoomIdRef.current || undefined,
    })

    // Detect deployment change and clear stale credentials
    const storedDeploymentId = deviceStorage.getDeploymentId()
    if (
      res.deploymentId &&
      storedDeploymentId &&
      res.deploymentId !== storedDeploymentId
    ) {
      deviceStorage.clear()
    }

    setMyDeviceId(res.deviceId)
    setMyToken(res.token)
    setMyEmoji(res.emoji)
    setDeploymentId(res.deploymentId || null)
    const resolvedRoomId = normalizeRoomId(res.roomId || myRoomIdRef.current)
    setMyRoomIdState(resolvedRoomId)
    deviceStorage.save({
      deviceId: res.deviceId,
      token: res.token,
      emoji: res.emoji,
      roomId: resolvedRoomId,
      deploymentId: res.deploymentId,
    })
    return res
  }, [])

  const setMyRoomId = useCallback((value: string) => {
    const normalized = normalizeRoomId(value)
    // Update the ref synchronously too — register() below reads it
    // immediately, before this render's effects (which sync the ref
    // from state) would otherwise get a chance to run.
    myRoomIdRef.current = normalized
    setMyRoomIdState(normalized)
    deviceStorage.setRoomId(normalized)
  }, [])

  // ── Devices & clips polling ──
  const loadDevices = useCallback(async () => {
    if (!myDeviceIdRef.current) return
    const list = await api.fetchDevices(
      myDeviceIdRef.current,
      myRoomIdRef.current || undefined
    )
    list.forEach((d) => deviceEmojis.current.set(d.id, d.emoji))
    setDevices(list)
    if (
      selectedIdRef.current &&
      !list.find((d) => d.id === selectedIdRef.current)
    ) {
      setSelectedId(null)
    }
  }, [])

  const loadClips = useCallback(async () => {
    const list = await api.fetchClips(myRoomIdRef.current || undefined)
    setClips(list)
  }, [])

  const poll = useCallback(async () => {
    await Promise.all([loadDevices(), loadClips()])
  }, [loadDevices, loadClips])

  // ── WebRTC signaling ──
  const signal = useCallback(
    async (to: string, type: string, data: unknown) => {
      await api.sendSignal({
        to,
        from: myDeviceIdRef.current,
        token: myTokenRef.current,
        type,
        data,
        roomId: myRoomIdRef.current || undefined,
      })
    },
    []
  )

  const hideOverlay = useCallback(() => {
    setOverlay({ open: false, label: '', pct: '' })
    setIsBusy(false)
  }, [])

  const showOverlay = useCallback((label: string, pct: string) => {
    setOverlay({ open: true, label, pct })
  }, [])

  const startActualTransfer = useCallback(
    async (dc: RTCDataChannel, peerId: string) => {
      const files = pendingFiles.current.get(peerId) || []
      pendingFiles.current.delete(peerId)
      dc.bufferedAmountLowThreshold = LOW_WATER

      for (const file of files) {
        showOverlay(`${t('overlay.sending')} ${file.name}`, '0%')
        dc.send(
          JSON.stringify({ type: 'meta', name: file.name, size: file.size })
        )

        let offset = 0
        let lastPct = -1
        while (offset < file.size) {
          if (dc.bufferedAmount > HIGH_WATER) {
            await new Promise<void>((resolve) => {
              if (dc.bufferedAmount <= LOW_WATER) return resolve()
              dc.onbufferedamountlow = () => {
                dc.onbufferedamountlow = null
                resolve()
              }
            })
          }
          const end = Math.min(offset + CHUNK_SIZE, file.size)
          const chunk = await file.slice(offset, end).arrayBuffer()
          dc.send(chunk)
          offset = end
          const pct = Math.round((offset / file.size) * 100)
          if (pct !== lastPct) {
            setOverlay((prev) => ({ ...prev, pct: pct + '%' }))
            lastPct = pct
          }
        }
        dc.send(JSON.stringify({ type: 'done' }))
      }

      hideOverlay()
      toast(t('toast.sent'))
      setTimeout(() => {
        peerConnections.current.get(peerId)?.close()
        peerConnections.current.delete(peerId)
      }, 4000)
    },
    [hideOverlay, showOverlay, t, toast]
  )

  const sendQueued = useCallback(
    (dc: RTCDataChannel, peerId: string) => {
      if (pendingTexts.current.has(peerId)) {
        const text = pendingTexts.current.get(peerId)!
        pendingTexts.current.delete(peerId)
        dc.send(JSON.stringify({ type: 'text', content: text }))
        hideOverlay()
        toast(t('toast.text_sent'))
        dc.close()
        setTimeout(() => {
          peerConnections.current.get(peerId)?.close()
          peerConnections.current.delete(peerId)
        }, 800)
        return
      }

      const files = pendingFiles.current.get(peerId) || []
      if (!files.length) return
      showOverlay(t('overlay.waiting'), '⏳')
      dc.send(
        JSON.stringify({
          type: 'request',
          files: files.map((f) => ({ name: f.name, size: f.size })),
        })
      )
    },
    [hideOverlay, showOverlay, t, toast]
  )

  const receiveOn = useCallback(
    (dc: RTCDataChannel, peerId: string) => {
      dc.binaryType = 'arraybuffer'
      let state: {
        name: string
        size: number
        chunks: BlobPart[]
        got: number
      } | null = null
      let doneCount = 0
      let expectedFiles = 1

      dc.onclose = () => {
        if (incomingDCRef.current === dc) {
          incomingDCRef.current = null
          setIncoming(null)
          toast(t('toast.sender_cancel'))
        } else if (state) {
          state = null
          hideOverlay()
          toast(t('toast.interrupted'))
        }
      }

      dc.onmessage = (e) => {
        if (typeof e.data === 'string') {
          let msg: any
          try {
            msg = JSON.parse(e.data)
          } catch {
            return
          }
          if (msg.type === 'text') {
            if (typeof msg.content === 'string') setRecvText(msg.content)
            return
          }
          if (msg.type === 'request') {
            if (!Array.isArray(msg.files) || !msg.files.length) return
            expectedFiles = msg.files.length
            incomingDCRef.current = dc
            setIncoming({
              files: msg.files,
              peerId,
              peerEmoji: deviceEmojis.current.get(peerId) || '👤',
            })
            return
          }
          if (msg.type === 'meta') {
            if (
              typeof msg.name !== 'string' ||
              typeof msg.size !== 'number' ||
              msg.size < 0
            )
              return
            state = { name: msg.name, size: msg.size, chunks: [], got: 0 }
            showOverlay(`${t('overlay.receiving')} ${msg.name}`, '0%')
          } else if (msg.type === 'done' && state) {
            const blob = new Blob(state.chunks)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = state.name
            a.click()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
            hideOverlay()
            toast(`📥 ${state.name}`)
            state = null
            doneCount++
            if (doneCount >= expectedFiles) dc.close()
          }
        } else if (state) {
          state.chunks.push(e.data)
          state.got += (e.data as ArrayBuffer).byteLength
          setOverlay((prev) => ({
            ...prev,
            pct: Math.round((state!.got / state!.size) * 100) + '%',
          }))
        }
      }
    },
    [hideOverlay, showOverlay, t, toast]
  )

  const createPC = useCallback(
    (peerId: string, initiator: boolean) => {
      const existing = peerConnections.current.get(peerId)
      if (existing) {
        existing.close()
        peerConnections.current.delete(peerId)
      }
      const pc = new RTCPeerConnection(STUN_SERVERS)
      peerConnections.current.set(peerId, pc)

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) signal(peerId, 'ice', candidate)
      }
      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          peerConnections.current.delete(peerId)
        }
      }

      if (initiator) {
        const dc = pc.createDataChannel('files', { ordered: true })
        const connTimeout = setTimeout(() => {
          if (dc.readyState !== 'open') {
            pendingFiles.current.delete(peerId)
            pendingTexts.current.delete(peerId)
            hideOverlay()
            toast(t('toast.no_connect'))
            pc.close()
            peerConnections.current.delete(peerId)
          }
        }, 15000)
        dc.onopen = () => {
          clearTimeout(connTimeout)
          sendQueued(dc, peerId)
        }
        dc.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            if (msg.type === 'accept') {
              startActualTransfer(dc, peerId)
            } else if (msg.type === 'reject') {
              pendingFiles.current.delete(peerId)
              hideOverlay()
              toast(t('toast.rejected'))
              dc.close()
              setTimeout(() => {
                peerConnections.current.get(peerId)?.close()
                peerConnections.current.delete(peerId)
              }, 800)
            }
          } catch {
            hideOverlay()
            toast(t('toast.proto_err'))
          }
        }
        dc.onerror = () => {
          clearTimeout(connTimeout)
          pendingFiles.current.delete(peerId)
          hideOverlay()
          toast(t('toast.transfer_err'))
        }
      } else {
        pc.ondatachannel = (e) => receiveOn(e.channel, peerId)
      }
      return pc
    },
    [hideOverlay, receiveOn, sendQueued, signal, startActualTransfer, t, toast]
  )

  const connectEvents = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setEsConnected(false)
    if (!myDeviceIdRef.current || !myTokenRef.current) return

    const es = new EventSource(
      api.eventsUrl(
        myDeviceIdRef.current,
        myTokenRef.current,
        myRoomIdRef.current || undefined
      )
    )
    esRef.current = es

    es.onopen = () => {
      setEsConnected(true)
      esDelayRef.current = 3000
      esRecoveringRef.current = false
    }

    es.onmessage = async (e) => {
      esDelayRef.current = 3000
      const { from, type, data } = JSON.parse(e.data)

      if (type === 'offer') {
        const pc = createPC(from, false)
        await pc.setRemoteDescription(data)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        signal(from, 'answer', pc.localDescription)
      }
      if (type === 'answer') {
        const pc = peerConnections.current.get(from)
        if (pc) await pc.setRemoteDescription(data)
      }
      if (type === 'ice') {
        const pc = peerConnections.current.get(from)
        if (pc && data) await pc.addIceCandidate(data).catch(() => {})
      }
    }

    es.onerror = () => {
      setEsConnected(false)
      es.close()
      esRef.current = null
      setTimeout(connectEvents, esDelayRef.current)
      esDelayRef.current = Math.min(esDelayRef.current * 2, 20000)
    }
  }, [createPC, signal])

  // ── Public actions ──
  const validateFiles = useCallback(
    (files: File[]) => {
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversized.length) {
        const names = oversized
          .map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
          .join(', ')
        toast(`${t('toast.oversized')}: ${names}`)
        return false
      }
      return true
    },
    [t, toast]
  )

  const sendFiles = useCallback(
    async (files: File[], targetId: string) => {
      if (isBusyRef.current) {
        toast(t('toast.busy'))
        return
      }
      if (!validateFiles(files)) return

      // Wait for EventSource to connect (up to 5 seconds)
      for (let i = 0; i < 50; i++) {
        if (esRef.current?.readyState === EventSource.OPEN) break
        await new Promise((r) => setTimeout(r, 100))
      }
      if (esRef.current?.readyState !== EventSource.OPEN) {
        toast(t('toast.no_connect'))
        return
      }

      setIsBusy(true)
      pendingFiles.current.set(targetId, files)
      showOverlay(t('overlay.connecting'), '')
      const pc = createPC(targetId, true)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      signal(targetId, 'offer', pc.localDescription)
    },
    [createPC, showOverlay, signal, t, toast, validateFiles]
  )

  const sendText = useCallback(
    async (text: string, targetId: string) => {
      if (isBusyRef.current) {
        toast(t('toast.busy'))
        return
      }

      // Wait for EventSource to connect (up to 5 seconds)
      for (let i = 0; i < 50; i++) {
        if (esRef.current?.readyState === EventSource.OPEN) break
        await new Promise((r) => setTimeout(r, 100))
      }
      if (esRef.current?.readyState !== EventSource.OPEN) {
        toast(t('toast.no_connect'))
        return
      }

      setIsBusy(true)
      pendingTexts.current.set(targetId, text)
      showOverlay(t('overlay.connecting'), '')
      const pc = createPC(targetId, true)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      signal(targetId, 'offer', pc.localDescription)
    },
    [createPC, showOverlay, signal, t, toast]
  )

  const selectDevice = useCallback(
    (id: string) => {
      if (isBusyRef.current) {
        toast(t('toast.busy'))
        return
      }
      setSelectedId((prev) => (prev === id ? null : id))
    },
    [t, toast]
  )

  const cancelTransfer = useCallback(() => {
    peerConnections.current.forEach((pc) => pc.close())
    peerConnections.current.clear()
    pendingFiles.current.clear()
    pendingTexts.current.clear()
    hideOverlay()
    toast(t('toast.cancelled'))
  }, [hideOverlay, t, toast])

  const acceptIncoming = useCallback(() => {
    if (!incomingDCRef.current) return
    incomingDCRef.current.send(JSON.stringify({ type: 'accept' }))
    setIncoming(null)
    toast(t('toast.downloading'))
    incomingDCRef.current = null
  }, [t, toast])

  const rejectIncoming = useCallback(() => {
    if (incomingDCRef.current) {
      incomingDCRef.current.send(JSON.stringify({ type: 'reject' }))
      const dc = incomingDCRef.current
      setTimeout(() => dc.close(), 200)
      incomingDCRef.current = null
    }
    setIncoming(null)
    toast(t('toast.file_rejected'))
  }, [t, toast])

  const shareClip = useCallback(
    async (text: string) => {
      const res = await api.createClip(text, myRoomIdRef.current || undefined)
      if (res.error) {
        toast(res.error)
        return
      }
      await loadClips()
      toast(t('toast.text_shared'))
    },
    [loadClips, t, toast]
  )

  const removeClip = useCallback(
    async (id: string) => {
      await api.deleteClip(id, myRoomIdRef.current || undefined)
      await loadClips()
    },
    [loadClips]
  )

  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        toast(t('toast.copy_fail'))
        return false
      }
    },
    [t, toast]
  )

  const loadQr = useCallback(async () => {
    const res = await api.fetchQr(window.location.origin)
    setQr(res)
  }, [])

  const changeRoom = useCallback(
    async (value: string) => {
      setMyRoomId(value)
      await register()
      await loadDevices()
      connectEvents()
    },
    [connectEvents, loadDevices, register, setMyRoomId]
  )

  // ── Init ──
  useEffect(() => {
    setMyDeviceId(deviceStorage.getDeviceId() || '')
    setMyToken(deviceStorage.getToken() || '')
    setMyEmoji(deviceStorage.getEmoji())
    setMyRoomIdState(deviceStorage.getRoomId())
    setDeploymentId(deviceStorage.getDeploymentId())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    let heartbeatId: ReturnType<typeof setInterval>
    let pollId: ReturnType<typeof setInterval>
    ;(async () => {
      await register()
      await loadQr()
      connectEvents()
      await poll()
      // Guards against a Strict Mode dev double-invoke: if this effect was
      // already torn down before this async chain finished, don't leak an
      // interval that the (already-run) cleanup above will never see.
      if (!cancelled) pollId = setInterval(poll, POLL_INTERVAL_MS)
    })()

    heartbeatId = setInterval(async () => {
      try {
        const res = await api.heartbeat({
          deviceId: myDeviceIdRef.current,
          token: myTokenRef.current,
          roomId: myRoomIdRef.current || undefined,
        })
        if (!res.ok) {
          await register()
          connectEvents()
        }
      } catch {
        /* network error — retried next tick */
      }
    }, HEARTBEAT_INTERVAL_MS)

    const onVisibility = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(heartbeatId)
      clearInterval(pollId)
      document.removeEventListener('visibilitychange', onVisibility)
      esRef.current?.close()
      peerConnections.current.forEach((pc) => pc.close())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return {
    ready,
    showToast: toast,
    myEmoji,
    myRoomId,
    devices,
    clips,
    selectedId,
    isBusy,
    overlay,
    incoming,
    recvText,
    toastMsg,
    qr,
    setRecvText,
    changeRoom,
    selectDevice,
    sendFiles,
    sendText,
    cancelTransfer,
    acceptIncoming,
    rejectIncoming,
    shareClip,
    removeClip,
    copyText,
    validateFiles,
  }
}
