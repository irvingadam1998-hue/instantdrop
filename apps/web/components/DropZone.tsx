'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

export function DropZone({
  selectedEmoji,
  isDiscovering,
  onZoneClick,
  onDropFiles,
}: {
  selectedEmoji: string | null
  isDiscovering: boolean
  onZoneClick: () => void
  onDropFiles: (files: File[]) => void
}) {
  const { t } = useI18n()
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onDropFiles(files)
  }

  return (
    <div className="drop-wrap">
      <div
        id="drop-zone"
        className={`${dragOver ? 'drag-over' : ''} ${isDiscovering && !selectedEmoji ? 'discovering' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={onZoneClick}
      />
      <div className="diamond" />
      <div className="center-icon">
        {!selectedEmoji && isDiscovering && <div className="discovery-files" aria-hidden="true"><FileGlyph kind="image" /><FileGlyph kind="document" /><FileGlyph kind="audio" /></div>}
        <div className={`icon-box ${isDiscovering && !selectedEmoji ? 'is-discovering' : ''}`} aria-hidden="true">{selectedEmoji || (isDiscovering ? <SearchIcon /> : <ArrowUp />)}</div>
        <span className="icon-label">{selectedEmoji ? t('app.ready') : isDiscovering ? t('app.searching') : t('app.choose_device')}</span>
      </div>
    </div>
  )
}

function ArrowUp() {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 10 5-5 5 5M12 5v14" /></svg>
}

function SearchIcon() {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></svg>
}

function FileGlyph({ kind }: { kind: 'image' | 'document' | 'audio' }) {
  return <span className={`discovery-file discovery-file-${kind}`}>
    {kind === 'image' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.5" /><path d="m5 17 5-4 3 2 3-4 3 4" /></svg>
      : kind === 'document' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3.5h7l4 4v13H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 3.5v5h5M9 13h6M9 16.5h6" /></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 18V5l10-2v13" /><circle cx="7" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>}
  </span>
}
