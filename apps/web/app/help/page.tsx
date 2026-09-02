'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { ContentPage } from '@/components/ContentPage'

export default function HelpPage() {
  const { t } = useI18n()
  const fileSteps = ['s1', 's2', 's3', 's4'] as const
  const textSteps = ['s1', 's2', 's3'] as const
  const faqs = [
    ['help.faq.q1', 'help.faq.a1'],
    ['help.faq.q2', 'help.faq.a2'],
    ['help.faq.q3', 'help.faq.a3'],
    ['help.faq.q4', 'help.faq.a4'],
    ['help.faq.q5', 'help.faq.a5'],
    ['help.faq.q6', 'help.faq.a6'],
  ] as const

  return (
    <ContentPage>
      <div className="content-hero">
        <h1>{t('help.title')}</h1>
      </div>

      <div className="section">
        <h2>{t('help.files.title')}</h2>
        <ol className="step-list">
          {fileSteps.map((s, i) => (
            <li key={s}>
              <span className="step-num">{i + 1}</span>
              <span>{t(`help.files.${s}` as const)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="section">
        <h2>{t('help.text.title')}</h2>
        <ol className="step-list">
          {textSteps.map((s, i) => (
            <li key={s}>
              <span className="step-num">{i + 1}</span>
              <span>{t(`help.text.${s}` as const)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="section">
        <h2>{t('help.limits.title')}</h2>
        <table className="limits-table">
          <tbody>
            <tr>
              <td>{t('help.limits.size')}</td>
              <td>{t('help.limits.sizeVal')}</td>
            </tr>
            <tr>
              <td>{t('help.limits.text')}</td>
              <td>{t('help.limits.textVal')}</td>
            </tr>
            <tr>
              <td>{t('help.limits.browsers')}</td>
              <td>{t('help.limits.browsersVal')}</td>
            </tr>
            <tr>
              <td>{t('help.limits.network')}</td>
              <td>{t('help.limits.networkVal')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <h2>{t('help.install.title')}</h2>
        <p>{t('help.install.body')}</p>
        <p>{t('help.install.aur')}</p>
        <pre className="code-block">yay -S instantdrop-git</pre>
        <p>{t('help.install.manual')}</p>
        <pre className="code-block">
          git clone https://github.com/irvingadam1998-hue/instantdrop.git{'\n'}
          cd instantdrop/packaging/arch{'\n'}
          makepkg -si
        </pre>
      </div>

      <div className="section">
        <h2>{t('help.faq.title')}</h2>
        {faqs.map(([q, a]) => (
          <div className="faq-item" key={q}>
            <h3>{t(q)}</h3>
            <p>{t(a)}</p>
          </div>
        ))}
      </div>

      <div className="cta-block">
        <Link className="btn-cta" href="/">
          {t('help.cta')} →
        </Link>
      </div>
    </ContentPage>
  )
}
