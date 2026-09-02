'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { ContentPage } from '@/components/ContentPage'

export default function AboutPage() {
  const { t } = useI18n()
  const features = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const

  return (
    <ContentPage>
      <div className="content-hero">
        <h1>{t('about.title')}</h1>
        <p>{t('about.lead')}</p>
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div className="feature-card" key={f}>
            <h3>{t(`about.${f}.title` as const)}</h3>
            <p>{t(`about.${f}.body` as const)}</p>
          </div>
        ))}
      </div>

      <div className="section">
        <h2>{t('about.how.title')}</h2>
        <p>{t('about.how.p1')}</p>
        <p>{t('about.how.p2')}</p>
      </div>

      <div className="section">
        <h2>{t('about.who.title')}</h2>
        <p>{t('about.who.p1')}</p>
        <p>{t('about.who.p2')}</p>
      </div>

      <div className="cta-block">
        <Link className="btn-cta" href="/">
          {t('about.cta')} →
        </Link>
      </div>
    </ContentPage>
  )
}
