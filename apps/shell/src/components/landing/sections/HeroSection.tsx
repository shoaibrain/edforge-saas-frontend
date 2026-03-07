import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section
      aria-label="Introduction"
      className="relative flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'rgb(var(--surface-primary))', minHeight: '85vh' }}
    >
      {/* Content */}
      <div className="relative z-10 max-w-[60rem] mx-auto px-6 sm:px-8 pt-32 pb-24 text-center">
        {/* Badge pill */}
        <div
          className="hero-fade-in hero-stagger-1 mb-8 inline-flex items-center gap-2 px-5 py-2.5 text-[0.8125rem] font-semibold"
          style={{
            borderRadius: 'var(--lp-radius-pill)',
            backgroundColor: 'var(--lp-bento-peach)',
            color: '#EA580C',
            border: '1px solid #FDBA74',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: '#F97316', boxShadow: '0 0 6px #F97316' }}
          />
          Purpose-built for K-12 education
        </div>

        {/* Headline — serif display font */}
        <h1
          className="hero-fade-in hero-stagger-2 mb-8"
          style={{
            fontFamily: 'var(--lp-font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'rgb(var(--text-primary))',
          }}
        >
          One platform to power
          <br />
          <span className="hero-gradient-text">
            every school in your district.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-fade-in hero-stagger-3 text-base leading-relaxed sm:text-lg md:text-xl lg:text-[1.35rem] lg:leading-[1.7] max-w-[40rem] mx-auto mb-12"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          Unify student data, school operations, and district analytics on one
          modern, FERPA-compliant platform — designed to replace legacy systems,
          not add to them.
        </p>

        {/* CTA row */}
        <div className="hero-fade-in hero-stagger-4 mb-10 sm:mb-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="lp-btn-primary group relative z-10 inline-flex items-center justify-center gap-2 cursor-pointer px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316]"
            style={{
              borderRadius: 'var(--lp-radius-pill)',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
            }}
          >
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
            className="lp-btn-secondary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E293B]"
            style={{
              borderRadius: 'var(--lp-radius-pill)',
              border: '2px solid rgb(var(--text-primary))',
              color: 'rgb(var(--text-primary))',
            }}
          >
            Schedule a Demo
          </a>
        </div>


      </div>
    </section>
  )
}
