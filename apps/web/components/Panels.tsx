'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { getFileEmoji, getFileVibeKey, formatSize } from '@/lib/fileMeta'
import type { OverlayState, IncomingRequest } from '@/hooks/useInstantDrop'

export function UploadOverlay({ overlay, onCancel }: { overlay: OverlayState; onCancel: () => void }) {
  const { t } = useI18n()
  return (
    <div id="upload-overlay" className={overlay.open ? 'open' : ''}>
      <div className="upload-box">
        <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="upload-ring" />
          <span className="upload-pct">{overlay.pct}</span>
        </div>
        <span className="upload-label">{overlay.label}</span>
        <button className="upload-cancel" onClick={onCancel}>
          {t('app.cancel')}
        </button>
      </div>
    </div>
  )
}

export function QrPanel({
  open,
  onClose,
  qr,
}: {
  open: boolean
  onClose: () => void
  qr: { url: string; qr: string } | null
}) {
  const { t } = useI18n()
  return (
    <div id="qr-panel" className={open ? 'open' : ''} onClick={onClose}>
      <div className="qr-box" onClick={(e) => e.stopPropagation()}>
        {/* QR is a locally generated data: URL, not a remote asset — <img> is intentional here */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr?.qr || ''} alt="QR" />
        <div className="qr-url">
          <a href={qr?.url || '#'} target="_blank" rel="noreferrer">
            {qr?.url || 'Cargando…'}
          </a>
        </div>
        <p className="qr-hint" dangerouslySetInnerHTML={{ __html: t('app.qr_hint') }} />
        <button className="btn-close" onClick={onClose}>
          {t('app.close')}
        </button>
      </div>
    </div>
  )
}

export function TextPanel({
  open,
  onClose,
  onSend,
  targetEmoji,
}: {
  open: boolean
  onClose: () => void
  onSend: (text: string) => void
  targetEmoji: string | null
}) {
  const { t } = useI18n()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  return (
    <div id="text-panel" className={open ? 'open' : ''} onClick={onClose}>
      <div className="text-box" onClick={(e) => e.stopPropagation()}>
        <div className="text-box-header">
          <span className="text-box-title">
            {targetEmoji ? `${t('app.text_panel_to')} ${targetEmoji}` : t('app.text_panel_title')}
          </span>
          <button className="btn-close" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }} onClick={onClose}>
            ✕
          </button>
        </div>
        <textarea
          className="text-area"
          placeholder={t('app.text_placeholder')}
          maxLength={10000}
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              const trimmed = value.trim()
              if (trimmed) onSend(trimmed)
            }
            if (e.key === 'Escape') onClose()
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
            {value.length} / 10000
          </span>
        </div>
        <div className="text-actions">
          <button className="btn-close" style={{ flex: 'none', width: 'auto', padding: '10px 18px' }} onClick={onClose}>
            {t('app.cancel')}
          </button>
          <button
            className="btn-send"
            disabled={value.length === 0}
            onClick={() => {
              const trimmed = value.trim()
              if (trimmed) onSend(trimmed)
            }}
          >
            {t('app.send_to_net')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RecvPanel({
  content,
  onClose,
  onCopy,
}: {
  content: string | null
  onClose: () => void
  onCopy: (text: string) => Promise<boolean>
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (content) setCopied(false)
  }, [content])

  return (
    <div id="recv-panel" className={content ? 'open' : ''} onClick={onClose}>
      <div className="recv-box" onClick={(e) => e.stopPropagation()}>
        <div className="recv-header">
          <span className="recv-title">{t('app.recv_title')}</span>
          <button className="btn-close" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="recv-content">{content}</div>
        <button
          className={`btn-copy-big ${copied ? 'copied' : ''}`}
          onClick={async () => {
            if (!content) return
            const ok = await onCopy(content)
            if (ok) {
              setCopied(true)
              setTimeout(onClose, 900)
            }
          }}
        >
          <span>{copied ? '✓' : '⎘'}</span>
          <span>{copied ? t('app.copied') : t('app.copy_text')}</span>
        </button>
        <button className="btn-close" onClick={onClose}>
          {t('app.close_lower')}
        </button>
      </div>
    </div>
  )
}

export function IncomingPanel({
  incoming,
  onAccept,
  onReject,
}: {
  incoming: IncomingRequest | null
  onAccept: () => void
  onReject: () => void
}) {
  const { t } = useI18n()
  const first = incoming?.files[0]
  const totalSize = incoming ? incoming.files.reduce((s, f) => s + f.size, 0) : 0

  return (
    <div id="incoming-panel" className={incoming ? 'open' : ''}>
      <div className="incoming-box">
        <div className="incoming-sender-row">
          <span className="incoming-from">{incoming?.peerEmoji || '👤'}</span>
          <span className="incoming-arrow-icon">→</span>
          <span className="incoming-file-icon">{first ? getFileEmoji(first.name) : '📁'}</span>
        </div>
        <div className="incoming-title">{t('app.incoming_title')}</div>
        <div className="incoming-vibe">{first ? t(getFileVibeKey(first.name)) : t('app.incoming_vibe_default')}</div>
        <div className="incoming-name">
          {first && incoming && incoming.files.length > 1
            ? `${first.name} (+${incoming.files.length - 1} ${t('files.more')})`
            : first?.name}
        </div>
        <div className="incoming-size">
          {formatSize(totalSize)}
          {incoming && incoming.files.length > 1 ? ` · ${incoming.files.length} ${t('files.files')}` : ''}
        </div>
        <div className="incoming-actions">
          <button className="btn-reject" onClick={onReject}>
            {t('app.reject')}
          </button>
          <button className="btn-accept" onClick={onAccept}>
            {t('app.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div id="toast" className={message ? 'show' : ''}>
      {message}
    </div>
  )
}
