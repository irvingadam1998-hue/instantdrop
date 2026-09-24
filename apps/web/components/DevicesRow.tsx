'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Device } from '@/lib/api'

export function DevicesRow({
  devices,
  isSearching,
  isConnected,
  myEmoji,
  selectedId,
  onSelect,
  onDropOnDevice,
}: {
  devices: Device[]
  isSearching: boolean
  isConnected: boolean
  myEmoji: string
  selectedId: string | null
  onSelect: (id: string) => void
  onDropOnDevice: (id: string, files: File[]) => void
}) {
  const { t } = useI18n()
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const label = !isConnected
    ? t('app.offline')
    : isSearching || devices.length === 0
    ? t('app.searching')
    : devices.length
    ? `${devices.length} ${t(devices.length > 1 ? 'app.devices_many' : 'app.devices_one')}`
    : t('app.no_devices')

  return (
    <div className="devices-wrap" id="devices-wrap">
      <div className="devices-label"><span className={`presence-dot ${!isConnected ? 'offline' : isSearching || devices.length === 0 ? 'searching' : 'online'}`} />{label}</div>
      <div className="devices-row">
        {devices.map((d) => (
          <div
            key={d.id}
            className={`device-bubble ${selectedId === d.id ? 'selected' : ''} ${dragOverId === d.id ? 'drag-over' : ''}`}
            aria-label={`${d.name || d.emoji}, ${t('app.send')}`}
            title={d.name || d.emoji}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d.id) } }}
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
            <span className="device-tag">{d.name || t('app.send')}</span>
          </div>
        ))}
        <div className="device-bubble me">
          <div className="device-ring">{myEmoji}</div>
          <span className="device-tag">{t('app.me')}</span>
        </div>
      </div>
      {isConnected && devices.length === 0 && <div className="devices-tip">{t('app.tip_reload')}</div>}
    </div>
  )
}
