'use client'

import { useI18n } from '@/lib/i18n'

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
        <button className="ip-badge" onClick={onOpenQr} aria-label="QR">
          ···
        </button>
        <button className="lang-btn" onClick={toggleLang}>
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <button className="ctrl-btn" onClick={onOpenQr} title="QR" aria-label="Mostrar código QR">
          ⊞
        </button>
        <button className="ctrl-btn" onClick={onOpenText} title={t('app.text_link')} aria-label="Compartir texto">
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
