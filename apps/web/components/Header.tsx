'use client'

import { useCallback, useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { getServerBaseUrl } from '@/lib/config'

export function Header({
  roomId,
  onRoomChange,
  onOpenQr,
  onOpenText,
  onAddClick,
  addDisabled,
}: {
  roomId: string
  onRoomChange: (value: string) => void
  onOpenQr: () => void
  onOpenText: () => void
  onAddClick: () => void
  addDisabled: boolean
}) {
  const { t, lang, toggleLang } = useI18n()
  const [serverUrl, setServerUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [roomOpen, setRoomOpen] = useState(false)
  const [roomDraft, setRoomDraft] = useState(roomId)
  const isDefaultRoom = /^NET-[A-F0-9]{12}$/.test(roomId)

  useEffect(() => {
    setServerUrl(getServerBaseUrl())
  }, [])

  useEffect(() => setRoomDraft(roomId), [roomId])

  const copyServerUrl = useCallback(async () => {
    const urlToCopy = serverUrl || getServerBaseUrl()
    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: seleccionar el texto
      const input = document.createElement('input')
      input.value = urlToCopy
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [serverUrl])

  const getServerIP = () => {
    try {
      const url = new URL(serverUrl || getServerBaseUrl())
      const hostname = url.hostname

      // Solo mostrar si es IP privada o localhost
      const isPrivate = /^(localhost|127\.|192\.168\.|10\.|172\.)/.test(
        hostname
      )

      if (isPrivate) return hostname
      return 'web'
    } catch {
      return '...'
    }
  }

  return (
    <header>
      <span className="logo"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M14 3.5v14m0 0 5-5m-5 5-5-5"/><path d="M6.5 18.5v2A2.5 2.5 0 0 0 9 23h10a2.5 2.5 0 0 0 2.5-2.5v-2"/></svg></span><span>instantdrop</span></span>
      <div className="header-right">
        <button
          className="ip-badge"
          onClick={copyServerUrl}
          title={serverUrl ? `Copiar dirección del servidor · ${serverUrl}` : 'Copiar dirección del servidor'}
          aria-label="Copiar dirección del servidor"
        >
          {copied ? <Glyph name="check" /> : getServerIP() === 'web' ? <Glyph name="globe" /> : getServerIP()}
        </button>
        <button className="lang-btn" onClick={toggleLang}>
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <button className={`ctrl-btn room-btn ${isDefaultRoom ? '' : 'has-custom-room'}`} onClick={() => setRoomOpen((open) => !open)} aria-expanded={roomOpen} aria-label={`${t('app.room_code')}: ${roomId}`} title={`${t('app.room_code')}: ${roomId}`}>
          <Glyph name="room" />
          {!isDefaultRoom && <span className="room-code-label">{roomId}</span>}
        </button>
        <button
          className="ctrl-btn qr-btn"
          onClick={onOpenQr}
          title="QR"
          aria-label="Mostrar código QR"
        >
          <Glyph name="qr" />
        </button>
        <button
          className="ctrl-btn text-btn"
          onClick={onOpenText}
          title={t('app.text_link')}
          aria-label="Compartir texto"
        >
          <Glyph name="text" />
        </button>
        <button
          className="ctrl-btn accent add-btn"
          onClick={onAddClick}
          disabled={addDisabled}
          title="Enviar"
          aria-label="Enviar archivo"
        >
          <Glyph name="plus" />
        </button>
        {roomOpen && <form className="room-popover" onSubmit={(event) => { event.preventDefault(); onRoomChange(roomDraft.trim().toUpperCase()); setRoomOpen(false) }}>
          <label htmlFor="room-code-input">{t('app.room_code')}</label>
          <div className="room-edit-row"><input id="room-code-input" autoFocus className="room-input" maxLength={24} value={roomDraft} onChange={(event) => setRoomDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setRoomOpen(false) }} /><button className="room-apply" type="submit" title={t('app.room_apply')} aria-label={t('app.room_apply')}><Glyph name="check" /></button></div>
        </form>}
      </div>
    </header>
  )
}

function Glyph({ name }: { name: 'check' | 'globe' | 'qr' | 'text' | 'plus' | 'room' }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" {...shared}>
    {name === 'check' && <path d="m5 12 4 4L19 6" />}
    {name === 'globe' && <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18"/></>}
    {name === 'qr' && <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14v2m-4 4h2m2-4v4h2"/></>}
    {name === 'text' && <><path d="M4 7V4h16v3M12 4v16m-4 0h8"/></>}
    {name === 'room' && <><circle cx="8.5" cy="15.5" r="4.5"/><path d="m12 12 8-8 2 2-2 2 2 2-3 3-2-2-3 3"/></>}
    {name === 'plus' && <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>}
  </svg>
}
