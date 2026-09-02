'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useInstantDrop } from '@/hooks/useInstantDrop'
import { Header } from './Header'
import { DropZone } from './DropZone'
import { DevicesRow } from './DevicesRow'
import { PillsRow } from './PillsRow'
import { UploadOverlay, QrPanel, TextPanel, RecvPanel, IncomingPanel, Toast } from './Panels'

export function InstantDropApp() {
  const { t } = useI18n()
  const app = useInstantDrop()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [textPanelOpen, setTextPanelOpen] = useState(false)

  const selectedEmoji =
    app.selectedId != null ? app.devices.find((d) => d.id === app.selectedId)?.emoji || null : null

  function tryOpenFilePicker() {
    if (app.isBusy) return app.showToast(t('toast.busy'))
    if (!app.selectedId) return app.showToast(t('toast.choose_first'))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  function tryOpenTextPanel() {
    if (!app.selectedId) return app.showToast(t('toast.choose_first'))
    setTextPanelOpen(true)
  }

  function onZoneDropFiles(files: File[]) {
    if (app.isBusy) return app.showToast(t('toast.busy'))
    if (!app.selectedId) return app.showToast(t('toast.choose_first'))
    if (!app.validateFiles(files)) return
    app.sendFiles(files, app.selectedId)
  }

  function onDeviceDropFiles(id: string, files: File[]) {
    if (app.isBusy) return app.showToast(t('toast.busy'))
    if (!app.validateFiles(files)) return
    app.sendFiles(files, id)
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (app.isBusy) return app.showToast(t('toast.busy'))
    if (!app.selectedId) return app.showToast(t('toast.no_device'))
    if (!app.validateFiles(files)) return
    app.sendFiles(files, app.selectedId)
  }

  // Global drag/drop: allow dropping a file anywhere on the page onto the
  // currently selected device, not just on the diamond itself.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const target = e.target as HTMLElement
      if (target.closest('#drop-zone') || target.closest('.device-bubble')) return
      const files = Array.from(e.dataTransfer?.files || [])
      if (!files.length) return
      if (app.isBusy) return app.showToast(t('toast.busy'))
      if (!app.selectedId) return app.showToast(t('toast.choose_first'))
      if (!app.validateFiles(files)) return
      app.sendFiles(files, app.selectedId)
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [app, t])

  // Pasted text anywhere outside a text field is shared as a clip.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const text = (e.clipboardData?.getData('text') || '').trim()
      if (!text) return
      app.shareClip(text)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [app])

  if (!app.ready) return null

  return (
    <div className="app-shell">
      <Header
        roomId={app.myRoomId}
        onRoomChange={app.changeRoom}
        onOpenQr={() => setQrOpen(true)}
        onOpenText={tryOpenTextPanel}
        onAddClick={tryOpenFilePicker}
        addDisabled={app.isBusy}
      />

      <main>
        <DropZone selectedEmoji={selectedEmoji} onZoneClick={tryOpenFilePicker} onDropFiles={onZoneDropFiles} />

        <DevicesRow
          devices={app.devices}
          myEmoji={app.myEmoji}
          selectedId={app.selectedId}
          onSelect={app.selectDevice}
          onDropOnDevice={onDeviceDropFiles}
        />

        <div className="hint-block">
          <span className="hint-text">
            {app.selectedId ? t('app.drag_or_tap') : t('app.choose_device')} ·{' '}
            <span className="hint-text-link" onClick={tryOpenTextPanel}>
              {t('app.text_link')}
            </span>
          </span>
          <button className="add-btn" disabled={app.isBusy} onClick={tryOpenFilePicker} aria-label="Enviar archivo">
            +
          </button>
        </div>

        <PillsRow
          clips={app.clips}
          onCopy={(text) =>
            app.copyText(text).then((ok) => {
              if (ok) app.showToast(t('toast.copied_clip'))
            })
          }
          onDelete={app.removeClip}
        />
      </main>

      <footer>
        <div className="footer-left">
          <div className="stat-chip">
            <b>{app.clips.length}</b> {t('app.received')}
          </div>
          <div className="stat-chip">
            {t('app.max')} <b>500mb</b>
          </div>
        </div>
        <nav className="footer-nav">
          <Link href="/about">{t('footer.about')}</Link>
          <Link href="/help">{t('footer.help')}</Link>
          <Link href="/privacy">{t('footer.privacy')}</Link>
          <a href="mailto:instantdropweb@gmail.com">{t('footer.contact')}</a>
        </nav>
      </footer>

      <input ref={fileInputRef} type="file" id="file-input" multiple onChange={onFileInputChange} />

      <UploadOverlay overlay={app.overlay} onCancel={app.cancelTransfer} />
      <QrPanel open={qrOpen} onClose={() => setQrOpen(false)} qr={app.qr} />
      <TextPanel
        open={textPanelOpen}
        onClose={() => setTextPanelOpen(false)}
        targetEmoji={selectedEmoji}
        onSend={(text) => {
          setTextPanelOpen(false)
          if (app.selectedId) app.sendText(text, app.selectedId)
        }}
      />
      <RecvPanel content={app.recvText} onClose={() => app.setRecvText(null)} onCopy={app.copyText} />
      <IncomingPanel incoming={app.incoming} onAccept={app.acceptIncoming} onReject={app.rejectIncoming} />
      <Toast message={app.toastMsg} />
    </div>
  )
}
