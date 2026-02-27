import { Link } from '@tanstack/react-router'
import { Twitter, Mail, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import type React from 'react'

function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'text-sm sm:text-base font-medium text-foreground transition-colors hover:text-primary'
  if (isInternalRoute(href)) {
    return <Link to={href} className={className}>{children}</Link>
  }
  return <a href={href} className={className}>{children}</a>
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
    <footer className="relative w-full overflow-hidden border-t border-border bg-background pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* CTA Section */}
        <div className="mb-24 flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="mb-6 text-2xl font-bold tracking-tighter text-foreground sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              Ready to transform your school?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Join forward-thinking schools that are modernizing education management with EdForge.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="group inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
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
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
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
        <div className="mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 border-t border-border pt-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">FERPA Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">COPPA Ready</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">SOC 2 Roadmap</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">GDPR Compatible</span>
          </div>
        </div>

        {/* Massive Typography */}
        <div className="relative mb-12 flex w-full justify-center overflow-hidden">
          <h1 className="select-none font-black leading-none tracking-tighter text-foreground/5 transition-colors hover:text-foreground/10" style={{ fontSize: 'clamp(3rem, 15vw, 12rem)' }}>
            EdForge
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm font-medium text-muted-foreground">
              &copy; {new Date().getFullYear()} EdForge Technologies LLC. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              6600 McKinney Ranch Parkway, McKinney, TX 75070
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 mr-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link>
            </div>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility Statement */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            EdForge is committed to accessibility. We strive to meet WCAG 2.1 Level AA standards.{' '}
            <a href="mailto:shoaibrain@edforge.net" className="text-primary hover:underline">
              Report accessibility issues
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
