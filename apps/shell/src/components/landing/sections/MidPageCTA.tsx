import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { DotGrid, GeometricAccent } from '../decorations/SVGDecorations'

export function MidPageCTA() {
  return (
    <section
      className="relative"
      aria-label="Call to action"
      style={{
        paddingTop: 'var(--lp-section-gap)',
        paddingBottom: 'var(--lp-section-gap)',
        background: 'linear-gradient(180deg, rgb(var(--surface-primary)), var(--lp-bento-peach) 50%, rgb(var(--surface-primary)))',
      }}
    >
      {/* Background dot grid */}
      <DotGrid opacity={0.04} style={{ zIndex: 0 }} />

      {/* Edge accents */}
      <GeometricAccent shape="crosshair" size={28} style={{ top: '20%', left: '5%', zIndex: 1 }} />
      <GeometricAccent shape="bracket" size={22} style={{ bottom: '25%', right: '6%', zIndex: 1 }} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2
          className="font-bold tracking-tight text-balance"
          style={{
            fontFamily: 'var(--lp-font-heading)',
            fontSize: 'var(--lp-font-section-title)',
            fontWeight: 'var(--lp-weight-heading)',
            color: 'rgb(var(--text-primary))',
          }}
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
            className="lp-btn-primary group inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 min-h-[48px] py-3.5 font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
            style={{
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              borderRadius: 'var(--lp-radius-pill)',
              fontSize: 'var(--lp-font-body)',
              fontWeight: 'var(--lp-weight-subheading)',
              boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
            }}
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
            className="lp-btn-secondary inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 min-h-[48px] py-3.5 font-semibold transition-all duration-200"
            style={{
              border: '2px solid rgb(var(--text-primary))',
              color: 'rgb(var(--text-primary))',
              borderRadius: 'var(--lp-radius-pill)',
              fontSize: 'var(--lp-font-body)',
            }}
          >
            Schedule a Demo
          </a>
        </div>
      </div>
    </section>
  )
}
