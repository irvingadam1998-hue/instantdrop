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

  if (!app.ready) {
    return (
      <main className="seo-fallback">
        <p className="workspace-kicker">INSTANTDROP</p>
        <h1>Compartir archivos entre dispositivos, sin subirlos a la nube</h1>
        <p>InstantDrop conecta teléfonos y computadoras para transferir archivos desde el navegador mediante WebRTC. No necesitas crear una cuenta ni instalar una aplicación.</p>
        <p>La detección automática funciona en dispositivos de la misma red. Para redes diferentes, puedes reunirlos con un código de sala si ambos pueden conectarse al servicio.</p>
        <Link href="/help">Guía de uso y solución de problemas</Link>
      </main>
    )
  }

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

      <main className="home-main">
        <div className="workspace-heading">
          <div className="workspace-kicker"><span className="kicker-mark" />{t('app.workspace_kicker')}</div>
          <h1>{t('app.workspace_title')}</h1>
          <p>{t('app.workspace_subtitle')}</p>
        </div>

        <section className="sharing-workspace" aria-label={t('app.workspace_title')}>
          <aside className="device-panel">
            <div className="device-panel-heading"><div><span className="panel-eyebrow">{t('app.devices_eyebrow')}</span><h2>{t('app.devices_title')}</h2></div><span className="device-count">{app.devices.length.toString().padStart(2, '0')}</span></div>
            <div className="device-panel-rule" />
            <DevicesRow
              devices={app.devices}
              isSearching={app.devicesLoading}
              isConnected={app.isConnected}
              myEmoji={app.myEmoji}
              selectedId={app.selectedId}
              onSelect={app.selectDevice}
              onDropOnDevice={onDeviceDropFiles}
            />
          </aside>

          <div className={`transfer-stage ${app.overlay.open && /\d+%/.test(app.overlay.pct) ? 'is-transferring' : ''}`}>
            <div className="stage-topline"><span>{t('app.stage_label')}</span><span className="stage-lock"><LockIcon />{t('app.private_label')}</span></div>
            <div className="stage-art" aria-hidden="true"><StageArtwork active={app.isConnected && app.devices.length === 0} transferring={app.overlay.open && /\d+%/.test(app.overlay.pct)} /></div>
            <DropZone
              selectedEmoji={selectedEmoji}
              isDiscovering={app.isConnected && app.devices.length === 0}
              onZoneClick={tryOpenFilePicker}
              onDropFiles={onZoneDropFiles}
            />
            <div className={`stage-footer ${app.overlay.open ? 'transfer-status' : ''}`} title={app.overlay.open ? app.overlay.label : undefined}>
              <span className="stage-orbit-dot" />
              {app.overlay.open && /\d+%/.test(app.overlay.pct) ? <><span className="stage-status-label">{app.overlay.label}</span><span className="stage-status-pct">{app.overlay.pct}</span></> : selectedEmoji ? t('app.ready') : app.isConnected && app.devices.length === 0 ? t('app.searching') : t('app.stage_prompt')}
            </div>
            {app.overlay.open && /\d+%/.test(app.overlay.pct) && <div className="stage-progress-track"><span style={{ width: app.overlay.pct }} /></div>}
          </div>

        </section>

        <div className="workspace-bottom">
          <div className="hint-block">
            <span className="hint-text">
              {app.selectedId ? t('app.drag_or_tap') : t('app.choose_device')} <span className="hint-separator">·</span>{' '}
              <button className="hint-text-link" onClick={tryOpenTextPanel}>{t('app.text_link')}</button>
            </span>
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
        </div>
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

function LockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>
}

function StageArtwork({ active, transferring }: { active: boolean; transferring: boolean }) {
  return <svg className={`stage-illustration ${active ? 'is-active' : ''} ${transferring ? 'is-transferring' : ''}`} viewBox="0 0 520 280" fill="none" preserveAspectRatio="xMidYMid meet">
    <path className="route-line route-line-a" d="M62 184C142 184 153 91 245 91s105 93 211 93" />
    <path className="route-line route-line-b" d="M74 206c77 0 101-62 171-62s93 62 183 62" />
    <circle className="route-node" cx="63" cy="184" r="4"/><circle className="route-node route-node-end" cx="456" cy="184" r="4"/>
    <g className="art-device art-device-left"><rect x="34" y="87" width="88" height="132" rx="13"/><rect x="41" y="99" width="74" height="104" rx="6"/><path d="M68 211h20"/><circle cx="78" cy="211" r="2"/></g>
    <g className="art-device art-device-right"><rect x="398" y="99" width="90" height="122" rx="13"/><rect x="405" y="107" width="76" height="104" rx="6"/><path d="M432 215h22"/></g>
    <g className="art-file art-file-one"><rect x="188" y="44" width="42" height="48" rx="9"/><path d="M198 76l8-8 6 5 8-11 5 14"/><circle cx="201" cy="58" r="2"/></g>
    <g className="art-file art-file-two"><rect x="275" y="174" width="42" height="48" rx="9"/><path d="M287 188h18M287 194h18M287 200h12"/></g>
    <g className="art-file art-file-three"><rect x="326" y="52" width="42" height="48" rx="9"/><path d="M344 66v19m0-19 12-3v15m-16 7a4 4 0 1 1-1-7m13 3a4 4 0 1 1-1-7"/></g>
    <g className="travel-file"><rect x="0" y="0" width="32" height="36" rx="8"/><path d="M9 11h14M9 17h14M9 23h9"/></g>
    <circle className="travel-trail-dot travel-trail-one" r="2.5"/><circle className="travel-trail-dot travel-trail-two" r="2"/><circle className="travel-trail-dot travel-trail-three" r="1.5"/>
    <circle className="art-spark" cx="160" cy="129" r="2"/><circle className="art-spark art-spark-two" cx="355" cy="144" r="2"/><path className="art-cross" d="M260 31v10m-5-5h10M247 232v8m-4-4h8"/>
  </svg>
}
