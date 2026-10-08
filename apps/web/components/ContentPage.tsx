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
    { href: '/terms', label: 'Términos' },
  ]

  return (
    <div className="content-page">
      <header className="navbar app-navbar">
        <Link href="/" className="logo">
          <span className="brand-mark" aria-hidden="true"><img src="/logo-instantdrop-v5.png" alt="" /></span><span className="brand-word"><b>instant</b><em>drop</em></span>
        </Link>
        <div className="header-right">
          <button className="btn btn-sm btn-ghost lang-btn" onClick={toggleLang}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <Link href="/" className="btn btn-sm btn-primary ctrl-btn accent" style={{ width: 'auto', padding: '0 12px', fontSize: '0.72rem' }}>
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
