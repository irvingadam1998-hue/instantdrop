'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { FloatingIcons } from './FloatingIcons'

export function DropZone({
  selectedEmoji,
  onZoneClick,
  onDropFiles,
}: {
  selectedEmoji: string | null
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
        className={dragOver ? 'drag-over' : ''}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={onZoneClick}
      />
      <div className="scan-sweep" />
      <div className="orbit-dot" />
      <div className="orbit-dot2" />
      <div className="diamond diamond-outer" />
      <div className="diamond" />
      <FloatingIcons />
      <div className="center-icon">
        <div className="icon-box">{selectedEmoji || '↑'}</div>
        <span className="icon-label">{selectedEmoji ? t('app.ready') : t('app.choose_device')}</span>
      </div>
    </div>
  )
}
