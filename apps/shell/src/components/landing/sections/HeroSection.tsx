import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

const pillars = [
  { title: 'Compliance-First', detail: 'FERPA · COPPA · SOC 2' },
  { title: 'Ed-Fi Aligned', detail: 'Open data interoperability' },
  { title: 'Event-Driven Core', detail: 'Real-time across every school' },
]

export function HeroSection() {
  return (
    <section
      aria-label="Introduction"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Layer 1 — base gradient */}
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, #050b0f 0%, #0a1a24 35%, #102630 65%, #162e3b 100%)',
        }}
      />

      {/* Layer 2 — dot grid with radial mask */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3e%3ccircle cx='1' cy='1' r='0.6' fill='rgba(255,255,255,0.045)'/%3e%3c/svg%3e\")",
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
        }}
      />

      {/* Layer 3 — soft ambient mesh */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(42,157,143,0.07), transparent),' +
            'radial-gradient(ellipse 40% 30% at 25% 35%, rgba(42,157,143,0.04), transparent),' +
            'radial-gradient(ellipse 35% 25% at 75% 55%, rgba(233,196,106,0.03), transparent)',
        }}
      />

      {/* Layer 4 — slow-rotating glow (GPU-composited via transform) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25 hero-glow-rotate"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle 450px at 30% 40%, oklch(0.42 0.09 175 / 0.2), transparent),' +
            'radial-gradient(circle 350px at 70% 55%, oklch(0.50 0.06 80 / 0.12), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[56rem] mx-auto px-6 sm:px-8 pt-28 pb-20 text-center">
        {/* Badge pill */}
        <div className="hero-fade-in hero-stagger-1 mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a9d8f]/20 bg-[#2a9d8f]/[0.06] px-4 py-2 text-[0.8125rem] font-medium text-[#5ec4b6]/80 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2a9d8f]/60" />
          Purpose-built for K-12 education
        </div>

        {/* Headline */}
        <h1 className="hero-fade-in hero-stagger-2 text-[2.5rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] font-bold text-white tracking-[-0.025em] mb-6">
          One platform to power
          <br />
          <span className="hero-gradient-text">
            every school in your district.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-fade-in hero-stagger-3 text-base leading-relaxed sm:text-lg md:text-xl lg:text-[1.35rem] lg:leading-[1.6] text-[#8aafbf] max-w-[38rem] mx-auto mb-10">
          Unify student data, school operations, and district analytics on one
          modern, FERPA-compliant platform — designed to replace legacy systems,
          not add to them.
        </p>

        {/* CTA */}
        <div className="hero-fade-in hero-stagger-4 mb-14 sm:mb-16">
          <Link
            to="/login"
            className="group relative z-10 inline-flex items-center justify-center gap-2 cursor-pointer rounded-full bg-white text-[#0a1a24] px-7 py-2.5 text-[0.875rem] font-semibold transition-colors duration-200 hover:bg-[#e8ebed]"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Platform pillars — above the fold */}
        <div className="hero-fade-in hero-stagger-5 flex flex-col sm:flex-row items-center justify-center sm:divide-x sm:divide-white/[0.08]">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col items-center px-7 sm:px-9 py-2 sm:py-0"
            >
              <span className="text-[0.8125rem] font-semibold text-white/60 tracking-wide">
                {pillar.title}
              </span>
              <span className="text-[0.6875rem] text-[#4d7f8f] mt-0.5">
                {pillar.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade for seamless transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[5] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to bottom, transparent, #0d1e27)' }}
      />
    </section>
  )
}
