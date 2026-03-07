import { Link } from '@tanstack/react-router'
import { Twitter, Mail, Shield, CheckCircle } from 'lucide-react'
import type React from 'react'
import { useInView } from './hooks/useInView'
import { useReducedMotion } from './hooks/useReducedMotion'
import { DotGrid } from './decorations/SVGDecorations'

function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (isInternalRoute(href)) {
    return (
      <Link
        to={href}
        activeProps={{ 'aria-current': 'page' } as Record<string, string>}
        className="text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className="text-sm font-medium transition-colors hover:opacity-70"
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

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function Footer() {
  const [footerRef, isInView] = useInView('100px')
  const prefersReducedMotion = useReducedMotion()
  const show = prefersReducedMotion || isInView

  return (
    <footer
      className="relative w-full overflow-hidden pb-12"
      style={{ backgroundColor: 'var(--lp-bento-lavender)' }}
    >
      {/* Subtle dot grid texture */}
      <DotGrid opacity={0.03} style={{ zIndex: 0 }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">

        {/* ── Typographic Statement ── */}
        <div
          ref={footerRef}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'clamp(4rem, 8vw, 8rem) 0 clamp(3rem, 6vw, 5rem)',
            overflow: 'hidden',
          }}
        >
          {/* Massive wordmark — serif font with warm gradient */}
          <span
            className="hero-gradient-text"
            style={{
              fontFamily: 'var(--lp-font-heading)',
              fontSize: 'clamp(4rem, 15vw, 12rem)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              whiteSpace: 'nowrap',
              position: 'relative',
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
              transition: prefersReducedMotion ? 'none'
                : `opacity 0.9s ${EASE_OUT_EXPO} 0.15s, transform 0.9s ${EASE_OUT_EXPO} 0.15s`,
            }}
          >
            EdForge
          </span>

          {/* Tagline */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              color: 'rgb(var(--text-secondary))',
              fontWeight: 400,
              letterSpacing: '0.02em',
              marginTop: 'clamp(1rem, 2vw, 1.5rem)',
              position: 'relative',
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(15px)',
              transition: prefersReducedMotion ? 'none'
                : `opacity 0.9s ${EASE_OUT_EXPO} 0.3s, transform 0.9s ${EASE_OUT_EXPO} 0.3s`,
            }}
          >
            Next-generation education management.
          </p>
        </div>

        {/* Decorative separator */}
        <div
          aria-hidden="true"
          style={{
            width: '100%',
            maxWidth: '12rem',
            height: '2px',
            margin: '0 auto clamp(3rem, 5vw, 5rem)',
            background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.3), transparent)',
            borderRadius: '1px',
          }}
        />

        {/* ── Links Grid ── */}
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

        {/* ── Compliance Badges ── */}
        <div
          className="mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-10"
          style={{ borderTop: '1px solid rgba(167, 139, 250, 0.15)' }}
        >
          {[
            { icon: CheckCircle, label: 'FERPA Compliant', bg: '#ECFDF5', color: '#059669' },
            { icon: CheckCircle, label: 'COPPA Ready', bg: '#FFF7ED', color: '#EA580C' },
            { icon: Shield, label: 'SOC 2 Roadmap', bg: '#EFF6FF', color: '#2563EB' },
            { icon: CheckCircle, label: 'Ed-Fi Aligned', bg: '#FFFBEB', color: '#D97706' },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-4 py-2"
              style={{
                borderRadius: 'var(--lp-radius-pill)',
                backgroundColor: badge.bg,
              }}
            >
              <badge.icon className="h-3.5 w-3.5" style={{ color: badge.color }} />
              <span className="text-xs font-semibold" style={{ color: badge.color }}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div
          className="flex flex-col items-center justify-between gap-6 pt-8 md:flex-row"
          style={{ borderTop: '1px solid rgba(167, 139, 250, 0.15)' }}
        >
          <p className="text-sm" style={{ color: 'rgb(var(--text-tertiary))' }}>
            &copy; {new Date().getFullYear()} EdForge Technologies LLC
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-10 w-10 items-center justify-center transition-all hover:scale-105"
                  style={{
                    borderRadius: 'var(--lp-radius-pill)',
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    color: 'rgb(var(--text-secondary))',
                  }}
                >
                  <social.icon className="h-4 w-4 transition-colors group-hover:text-[#F97316]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
