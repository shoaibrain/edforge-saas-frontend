import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function MidPageCTA() {
  return (
    <section
      className="relative"
      aria-label="Call to action"
      style={{ paddingTop: 'var(--lp-section-gap)', paddingBottom: 'var(--lp-section-gap)', backgroundImage: 'radial-gradient(ellipse at center, rgba(var(--brand-primary), 0.06), transparent 70%)' }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2
          className="font-bold tracking-tight text-balance"
          style={{ fontSize: 'var(--lp-font-section-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
        >
          One platform for everything your district runs on.
        </h2>
        <p
          className="mx-auto mt-5 max-w-2xl text-pretty"
          style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', lineHeight: '1.7', color: 'rgb(var(--text-secondary))' }}
        >
          Student information, staff management, real-time reporting, and family engagement — unified in a single system built for K-12 from the ground up.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-8 py-3.5 font-semibold transition-all duration-200 hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--lp-chart-primary)', color: 'rgb(var(--text-inverted))', borderRadius: 'var(--lp-radius-sm)', fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-subheading)' }}
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-medium transition-all duration-200 hover:bg-white/5"
            style={{ border: '1px solid rgba(var(--brand-primary),0.3)', color: 'var(--lp-chart-secondary)', borderRadius: 'var(--lp-radius-sm)', fontSize: 'var(--lp-font-body)' }}
          >
            Schedule a Demo
          </a>
        </div>
      </div>
    </section>
  )
}
