'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

export function ContentPage({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLang } = useI18n()
  const pathname = usePathname()

  const navLinks = [
    { href: '/about', label: t('footer.about') },
    { href: '/help', label: t('footer.help') },
    { href: '/privacy', label: t('footer.privacy') },
  ]

  return (
    <div className="content-page">
      <header>
        <Link href="/" className="logo">
          InstantDrop
        </Link>
        <div className="header-right">
          <button className="lang-btn" onClick={toggleLang}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <Link href="/" className="ctrl-btn accent" style={{ width: 'auto', borderRadius: 999, padding: '0 12px', fontSize: '0.72rem' }}>
            {t('nav.app')}
          </Link>
        </div>
      </header>
      <main className="content-main">{children}</main>
      <footer>
        <div className="footer-left" />
        <nav className="footer-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
          <a href="mailto:instantdropweb@gmail.com">{t('footer.contact')}</a>
        </nav>
      </footer>
    </div>
  )
}
