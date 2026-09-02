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

  useEffect(() => {
    setServerUrl(getServerBaseUrl())
  }, [])

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
      return '🌐' // Ícono de internet para URLs públicas (Render)
    } catch {
      return '...'
    }
  }

  return (
    <header>
      <span className="logo">InstantDrop</span>
      <div className="header-right">
        <input
          key={roomId}
          className="room-input"
          maxLength={24}
          placeholder="ROOM"
          aria-label="Room code"
          defaultValue={roomId}
          onBlur={(e) => onRoomChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        <button
          className="ip-badge"
          onClick={copyServerUrl}
          title={`Copiar: ${serverUrl}`}
          aria-label={`IP local: ${getServerIP()}`}
        >
          {copied ? '✓' : getServerIP()}
        </button>
        <button className="lang-btn" onClick={toggleLang}>
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <button
          className="ctrl-btn"
          onClick={onOpenQr}
          title="QR"
          aria-label="Mostrar código QR"
        >
          ⊞
        </button>
        <button
          className="ctrl-btn"
          onClick={onOpenText}
          title={t('app.text_link')}
          aria-label="Compartir texto"
        >
          ¶
        </button>
        <button
          className="ctrl-btn accent"
          onClick={onAddClick}
          disabled={addDisabled}
          title="Enviar"
          aria-label="Enviar archivo"
        >
          +
        </button>
      </div>
    </header>
  )
}
