'use client'

import { useI18n } from '@/lib/i18n'
import { ContentPage } from '@/components/ContentPage'

export default function PrivacyPage() {
  const { t } = useI18n()
  const sections = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] as const

  return (
    <ContentPage>
      <div className="content-hero">
        <h1>{t('privacy.title')}</h1>
      </div>

      <div className="summary-box">{t('privacy.summary')}</div>

      {sections.map((s) => (
        <div className="section" key={s}>
          <h2>{t(`privacy.${s}.title` as const)}</h2>
          <p>{t(`privacy.${s}.body` as const)}</p>
        </div>
      ))}

      <div className="section">
        <h2>{t('privacy.contact')}</h2>
        <p>
          <a href="mailto:instantdropweb@gmail.com">instantdropweb@gmail.com</a>
        </p>
      </div>
    </ContentPage>
  )
}
