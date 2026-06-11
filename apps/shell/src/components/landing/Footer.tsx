import { Link } from '@tanstack/react-router'
import { Twitter, Mail } from 'lucide-react'
import type React from 'react'

function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "text-sm transition-colors hover:text-[rgb(var(--text-primary))]"
  const style = { color: 'rgb(var(--text-secondary))' }

  if (isInternalRoute(href)) {
    return (
      <Link
        to={href}
        activeProps={{ 'aria-current': 'page' } as Record<string, string>}
        className={className}
        style={style}
      >
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  )
}

const footerLinks = [
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'Security', href: '/security' },
]

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/edforgedotnet', label: 'Twitter' },
  { icon: Mail, href: 'mailto:shoaibrain@edforge.net', label: 'Email' },
]

export function Footer() {
  return (
    <footer
      className="w-full bg-[rgb(var(--background-primary))]"
      style={{
        borderTop: '1px solid rgb(var(--border-primary))',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 py-12">
        {/* Top: Brand + Nav links */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="EdForge Logo" className="w-7 h-7 object-contain" />
              <span
                className="text-lg font-bold tracking-tight text-[rgb(var(--text-primary))]"
                style={{
                  fontFamily: 'var(--lp-font-heading)',
                }}
              >
                EdForge Technologies
              </span>
            </div>
            <p
              className="mt-1.5 text-sm text-[rgb(var(--text-tertiary))]"
            >
              Everything your schools run on — in one place.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <FooterLink key={link.name} href={link.href}>
                {link.name}
              </FooterLink>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div
          className="my-8"
          style={{ borderTop: '1px solid rgb(var(--border-secondary))' }}
        />

        {/* Bottom: Copyright + Compliance + Social */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              &copy; {new Date().getFullYear()} EdForge Technologies LLC
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              FERPA Compliant&ensp;&middot;&ensp;COPPA Ready&ensp;&middot;&ensp;Ed-Fi Aligned
            </p>
          </div>

          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors text-[rgb(var(--text-tertiary))] bg-transparent"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgb(var(--text-primary))'
                  e.currentTarget.style.backgroundColor = 'rgb(var(--border-secondary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgb(var(--text-tertiary))'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
