import { Link } from '@tanstack/react-router'
import { Twitter, Mail, Shield, CheckCircle } from 'lucide-react'
import type React from 'react'

function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (isInternalRoute(href)) {
    return (
      <Link
        to={href}
        activeProps={{ 'aria-current': 'page' } as Record<string, string>}
        className="text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className="text-sm font-medium transition-colors hover:opacity-80"
      style={{ color: 'rgb(var(--text-secondary))' }}
    >
      {children}
    </a>
  )
}

const footerLinks = {
  platform: [
    { name: 'About', href: '/about' },
    { name: 'For Districts', href: '/about' },
    { name: 'For Schools', href: '/about' },
    { name: 'For Teachers', href: '/about' },
  ],
  resources: [
    { name: 'Documentation', href: '/about' },
    { name: 'Support', href: '/contact' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Security', href: '/security' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/edforgedotnet', label: 'Twitter' },
  { icon: Mail, href: 'mailto:shoaibrain@edforge.net', label: 'Email' },
]

export function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden pt-16 pb-12"
      style={{ backgroundColor: 'rgb(var(--surface-primary))' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Links Grid */}
        <nav aria-label="Footer navigation" className="mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-16">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-5">
              <h3
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgb(var(--text-tertiary))' }}
              >
                {category}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((item) => (
                  <li key={item.name}>
                    <FooterLink href={item.href}>{item.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Compliance Badges */}
        <div
          className="mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-10"
          style={{ borderTop: '1px solid rgba(var(--brand-primary),0.08)' }}
        >
          {[
            { icon: CheckCircle, label: 'FERPA Compliant' },
            { icon: CheckCircle, label: 'COPPA Ready' },
            { icon: Shield, label: 'SOC 2 Roadmap' },
            { icon: CheckCircle, label: 'Ed-Fi Aligned' },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(var(--brand-primary),0.06)',
                border: '1px solid rgba(var(--brand-primary),0.12)',
              }}
            >
              <badge.icon className="h-3.5 w-3.5" style={{ color: 'var(--lp-chart-primary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--lp-chart-secondary)' }}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col items-center justify-between gap-6 pt-8 md:flex-row"
          style={{ borderTop: '1px solid rgba(var(--brand-primary),0.08)' }}
        >
          <p className="text-sm" style={{ color: 'rgb(var(--text-tertiary))' }}>
            &copy; {new Date().getFullYear()} EdForge Technologies LLC
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80"
                  style={{
                    border: '1px solid rgba(var(--brand-primary),0.15)',
                    backgroundColor: 'rgba(var(--brand-primary),0.04)',
                    color: 'rgb(var(--text-secondary))',
                  }}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
