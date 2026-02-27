import { Link } from '@tanstack/react-router'
import { Twitter, Mail, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import type React from 'react'

function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (isInternalRoute(href)) {
    return (
      <Link
        to={href}
        className="text-sm sm:text-base font-medium transition-colors"
        style={{ color: '#8aafbf' }}
      >
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className="text-sm sm:text-base font-medium transition-colors"
      style={{ color: '#8aafbf' }}
    >
      {children}
    </a>
  )
}

const footerLinks = {
  product: [
    { name: 'About EdForge', href: '/about' },
    { name: 'Security', href: '/security' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
  solutions: [
    { name: 'For Districts', href: '/about' },
    { name: 'For Schools', href: '/about' },
    { name: 'For Teachers', href: '/about' },
    { name: 'For Parents', href: '/about' },
  ],
  resources: [
    { name: 'Documentation', href: '/about' },
    { name: 'Support', href: '/contact' },
    { name: 'Security', href: '/security' },
    { name: 'Contact Us', href: '/contact' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/edforgedotnet', label: 'Twitter' },
  { icon: Mail, href: 'mailto:shoaibrain@edforge.net', label: 'Email' },
]

export function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden pt-24 pb-12"
      style={{ backgroundColor: '#0a1a24', borderTop: '1px solid rgba(42,157,143,0.1)' }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* CTA Section */}
        <div className="mb-24 flex flex-col items-center justify-between gap-12 text-center md:flex-row md:items-end md:text-left">
          <div className="max-w-2xl">
            <h2
              className="mb-6 text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl"
              style={{ color: '#e8edf0' }}
            >
              Your district deserves better tools.
            </h2>
            <p className="text-base sm:text-lg" style={{ color: '#8aafbf' }}>
              Join forward-thinking districts modernizing education management with EdForge.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="group inline-flex h-14 items-center justify-center rounded-full px-8 text-lg font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: '#2a9d8f',
                color: '#050b0f',
                boxShadow: '0 10px 25px -5px rgba(42,157,143,0.3)',
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Links Grid */}
        <nav aria-label="Footer navigation" className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-16">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-6">
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: 'rgba(138,175,191,0.6)' }}
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
          className="mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-12"
          style={{ borderTop: '1px solid rgba(42,157,143,0.1)' }}
        >
          {[
            { icon: CheckCircle, label: 'FERPA Compliant' },
            { icon: CheckCircle, label: 'COPPA Ready' },
            { icon: Shield, label: 'SOC 2 Roadmap' },
            { icon: CheckCircle, label: 'Ed-Fi Aligned' },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'rgba(42,157,143,0.08)',
                border: '1px solid rgba(42,157,143,0.2)',
              }}
            >
              <badge.icon className="h-4 w-4" style={{ color: '#2a9d8f' }} />
              <span className="text-sm font-medium" style={{ color: '#5ec4b6' }}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Massive Typography */}
        <div className="relative mb-12 flex w-full justify-center overflow-hidden">
          <h1
            className="select-none font-black leading-none tracking-tighter transition-colors"
            style={{
              fontSize: 'clamp(2.5rem, 12vw, 8rem)',
              color: 'rgba(42,157,143,0.06)',
            }}
          >
            EdForge
          </h1>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col items-center justify-between gap-6 pt-8 md:flex-row"
          style={{ borderTop: '1px solid rgba(42,157,143,0.1)' }}
        >
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm font-medium" style={{ color: '#8aafbf' }}>
              &copy; {new Date().getFullYear()} EdForge Technologies LLC. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: 'rgba(138,175,191,0.6)' }}>
              6600 McKinney Ranch Parkway, McKinney, TX 75070
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 mr-6">
              <Link to="/privacy" className="text-sm transition-colors" style={{ color: '#8aafbf' }}>Privacy</Link>
              <Link to="/terms" className="text-sm transition-colors" style={{ color: '#8aafbf' }}>Terms</Link>
              <Link to="/security" className="text-sm transition-colors" style={{ color: '#8aafbf' }}>Security</Link>
            </div>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full transition-all"
                  style={{
                    border: '1px solid rgba(42,157,143,0.2)',
                    backgroundColor: 'rgba(42,157,143,0.06)',
                    color: '#8aafbf',
                  }}
                >
                  <social.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility Statement */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'rgba(138,175,191,0.5)' }}>
            EdForge is committed to accessibility. We strive to meet WCAG 2.1 Level AA standards.{' '}
            <a href="mailto:shoaibrain@edforge.net" style={{ color: '#2a9d8f' }} className="hover:underline">
              Report accessibility issues
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
