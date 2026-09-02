'use client'

import type { Clip } from '@/lib/api'

export function PillsRow({
  clips,
  onCopy,
  onDelete,
}: {
  clips: Clip[]
  onCopy: (text: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="pills-row">
      {clips.map((c) => (
        <div key={c.id} className="clip-pill" title="Click para copiar" onClick={() => onCopy(c.text)}>
          <span className="clip-icon">¶</span>
          <span className="clip-text">{c.text}</span>
          <button
            className="clip-del"
            aria-label="Eliminar clip"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(c.id)
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
