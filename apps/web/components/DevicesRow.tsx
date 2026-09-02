'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Device } from '@/lib/api'

export function DevicesRow({
  devices,
  myEmoji,
  selectedId,
  onSelect,
  onDropOnDevice,
}: {
  devices: Device[]
  myEmoji: string
  selectedId: string | null
  onSelect: (id: string) => void
  onDropOnDevice: (id: string, files: File[]) => void
}) {
  const { t } = useI18n()
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const label = devices.length
    ? `${devices.length} ${t(devices.length > 1 ? 'app.devices_many' : 'app.devices_one')}`
    : t('app.no_devices')

  return (
    <div className="devices-wrap" id="devices-wrap">
      <div className="devices-label">{label}</div>
      <div className="devices-row">
        <div className="device-bubble me">
          <div className="device-ring">{myEmoji}</div>
          <span className="device-tag">{t('app.me')}</span>
        </div>
        {devices.map((d) => (
          <div
            key={d.id}
            className={`device-bubble ${selectedId === d.id ? 'selected' : ''} ${dragOverId === d.id ? 'drag-over' : ''}`}
            aria-label={d.emoji}
            onClick={() => onSelect(d.id)}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverId(d.id)
            }}
            onDragLeave={() => setDragOverId((prev) => (prev === d.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOverId(null)
              const files = Array.from(e.dataTransfer.files)
              if (files.length) onDropOnDevice(d.id, files)
            }}
          >
            <div className="device-ring">{d.emoji}</div>
            <span className="device-tag">{selectedId === d.id ? t('app.selected') : t('app.send')}</span>
          </div>
        ))}
      </div>
      <div className="devices-tip">{t('app.tip_reload')}</div>
    </div>
  )
}
