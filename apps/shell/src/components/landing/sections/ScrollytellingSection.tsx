import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useThrottledScroll } from '../hooks/useThrottledScroll'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SkeletonCard } from './SkeletonCard'
import { ChevronDown } from 'lucide-react'
import type React from 'react'

export interface ScrollSection<T extends string> {
  id: number
  state: T
  headline: string
  body: string
  badge: string
}

interface ScrollytellingSectionProps<T extends string> {
  sections: ScrollSection<T>[]
  sectionTag: string
  sectionTitle: React.ReactNode
  sectionSubtitle: string
  dashboard: React.ComponentType<{ activeState: T }>
  /** Swap columns: text LEFT, dashboard RIGHT */
  reversed?: boolean
  /** Use SkeletonCard for text panels instead of plain text */
  variant?: 'plain' | 'skeleton'
}

export function ScrollytellingSection<T extends string>({
  sections,
  sectionTag,
  sectionTitle,
  sectionSubtitle,
  dashboard: Dashboard,
  reversed = false,
  variant = 'plain',
}: ScrollytellingSectionProps<T>) {
  const [activeSection, setActiveSection] = useState<number>(0)
  const [dashboardState, setDashboardState] = useState<T>(sections[0].state)
  const [hasScrolled, setHasScrolled] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const prefersReducedMotion = useReducedMotion()

  // Scroll-linked morph transforms for sticky desktop header
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Header chrome
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.08],
    ['rgba(10,26,36,0)', 'rgba(10,26,36,0.92)'],
  )
  const headerPy = useTransform(scrollYProgress, [0, 0.08], [56, 14])

  // Collapsibles: badge + subtitle — fast fade to clear stage for arc
  const collapsibleOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0])
  const collapsibleMaxHeight = useTransform(scrollYProgress, [0, 0.05], [150, 0])

  // Title raw transforms (before spring wrapping)
  const rawTitleScale = useTransform(scrollYProgress, [0, 0.10], [1, 0.65])
  const titleMarginBottom = useTransform(scrollYProgress, [0, 0.08], [24, 0])

  // ── Arc motion: curved path from center toward dashboard column ──
  // Vertical arc: peaks at 10px then settles at 2px (the title "lands")
  const rawArcY = useTransform(scrollYProgress, [0, 0.04, 0.10], [0, 10, 2])
  // Horizontal drift: 100px toward dashboard side (delayed start for the curve)
  const rawDriftX = useTransform(
    scrollYProgress,
    [0, 0.02, 0.12],
    reversed ? [0, 0, 100] : [0, 0, -100],
  )

  // Accent underline — fades in and grows from dashboard side
  const accentLineOpacity = useTransform(scrollYProgress, [0.06, 0.12], [0, 1])
  const accentLineScaleX = useTransform(scrollYProgress, [0.06, 0.14], [0, 1])

  // Spring physics — wraps raw values for organic overshoot + settle
  const springConfig = { stiffness: 120, damping: 25, mass: 0.8 }
  const titleScale = useSpring(rawTitleScale, springConfig)
  const titleDriftX = useSpring(rawDriftX, springConfig)
  const titleArcY = useSpring(rawArcY, springConfig)

  // Track if user has scrolled past first panel (hides scroll hint on mobile)
  useEffect(() => {
    if (activeSection > 0 && !hasScrolled) {
      setHasScrolled(true)
    }
  }, [activeSection, hasScrolled])

  // Desktop: scroll-driven state updates (throttled to rAF)
  useThrottledScroll(useCallback(() => {
    if (!isDesktop) return
    const container = containerRef.current
    if (!container) return

    const viewportCenter = window.innerHeight / 2
    let closestSection = 0
    let closestDistance = Number.POSITIVE_INFINITY

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return
      const rect = ref.getBoundingClientRect()
      const sectionCenter = rect.top + rect.height / 2
      const distance = Math.abs(sectionCenter - viewportCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestSection = index
      }
    })

    setActiveSection(closestSection)
    setDashboardState(sections[closestSection].state)
  }, [sections, isDesktop]))

  const isActive = (index: number) => activeSection === index

  // Mobile: tab-based navigation
  const handleTabClick = (index: number) => {
    setActiveSection(index)
    setDashboardState(sections[index].state)
  }

  // Desktop: keyboard navigation (arrow keys)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDesktop) return
    let nextIndex: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = Math.min(activeSection + 1, sections.length - 1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextIndex = Math.max(activeSection - 1, 0)
    }
    if (nextIndex !== null && nextIndex !== activeSection) {
      e.preventDefault()
      setActiveSection(nextIndex)
      setDashboardState(sections[nextIndex].state)
      sectionRefs.current[nextIndex]?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [isDesktop, activeSection, sections, prefersReducedMotion])

  // ─── Mobile section header (static, non-sticky) ───
  const sectionHeader = (
    <div className="px-6 pt-12 pb-10 text-center lg:pb-14">
      <div
        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
        style={{
          border: '1px solid rgba(var(--brand-primary),0.2)',
          backgroundColor: 'rgba(var(--brand-primary),0.06)',
          color: 'rgba(94,196,182,0.8)',
        }}
      >
        {sectionTag}
      </div>
      <h2
        className="mb-6 text-balance font-sans font-bold tracking-tight"
        style={{ fontSize: 'var(--lp-font-section-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
      >
        {sectionTitle}
      </h2>
      <p
        className="mx-auto max-w-3xl text-pretty"
        style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', color: 'rgb(var(--text-secondary))' }}
      >
        {sectionSubtitle}
      </p>
    </div>
  )

  // ─── Desktop section header: sticky with scroll-linked morph ───
  const desktopSectionHeader = prefersReducedMotion ? (
    <div
      className="sticky top-0 z-20 px-6 pt-12 pb-10 text-center"
      style={{ backgroundColor: 'rgba(10,26,36,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <h2
        className="text-balance font-sans font-bold tracking-tight"
        style={{ fontSize: 'var(--lp-font-section-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
      >
        {sectionTitle}
      </h2>
    </div>
  ) : (
    <motion.div
      className="sticky top-0 z-20 px-6 text-center"
      style={{
        backgroundColor: headerBg,
        paddingTop: headerPy,
        paddingBottom: headerPy,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Badge — collapses on scroll */}
      <motion.div style={{ maxHeight: collapsibleMaxHeight, opacity: collapsibleOpacity, overflow: 'hidden' }}>
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
          style={{
            border: '1px solid rgba(var(--brand-primary),0.2)',
            backgroundColor: 'rgba(var(--brand-primary),0.06)',
            color: 'rgba(94,196,182,0.8)',
          }}
        >
          {sectionTag}
        </div>
      </motion.div>

      {/* Title — arcs toward dashboard column with spring physics */}
      <motion.h2
        className="text-balance font-sans font-bold tracking-tight"
        style={{
          fontSize: 'var(--lp-font-section-title)',
          fontWeight: 'var(--lp-weight-heading)',
          color: 'rgb(var(--text-primary))',
          scale: titleScale,
          x: titleDriftX,
          y: titleArcY,
          transformOrigin: reversed ? 'top 75%' : 'top 25%',
          marginBottom: titleMarginBottom,
        }}
      >
        {sectionTitle}
      </motion.h2>

      {/* Accent underline — visual anchor for collapsed state */}
      <motion.div
        style={{
          height: 2,
          marginTop: 8,
          background: reversed
            ? 'linear-gradient(270deg, var(--lp-chart-primary), transparent 80%)'
            : 'linear-gradient(90deg, var(--lp-chart-primary), transparent 80%)',
          opacity: accentLineOpacity,
          scaleX: accentLineScaleX,
          transformOrigin: reversed ? 'right' : 'left',
        }}
      />

      {/* Subtitle + scroll hint — collapses on scroll */}
      <motion.div style={{ maxHeight: collapsibleMaxHeight, opacity: collapsibleOpacity, overflow: 'hidden' }}>
        <p
          className="mx-auto max-w-3xl text-pretty"
          style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', color: 'rgb(var(--text-secondary))' }}
        >
          {sectionSubtitle}
        </p>
        <div
          className="mt-4 flex flex-col items-center gap-1"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgb(var(--text-secondary))' }}>
            Scroll to explore
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: 'var(--lp-chart-primary)' }} />
        </div>
      </motion.div>
    </motion.div>
  )

  // ─── Mobile Layout: pill tabs + content below ───
  if (!isDesktop) {
    return (
      <section className="relative" aria-label={typeof sectionTag === 'string' ? sectionTag : undefined}>
        {sectionHeader}

        {/* Pill Tab Bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-6 scrollbar-hide" role="tablist" aria-label={`${sectionTag} features`}>
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleTabClick(index)}
              role="tab"
              aria-selected={isActive(index)}
              aria-controls={`tabpanel-${section.state}`}
              id={`tab-${section.state}`}
              className="shrink-0 rounded-full px-4 py-2 font-medium transition-all duration-300"
              style={{
                fontSize: 'var(--lp-font-label)',
                backgroundColor: isActive(index) ? 'var(--lp-chart-primary)' : 'rgba(var(--brand-primary),0.08)',
                color: isActive(index) ? '#050b0f' : 'rgb(var(--text-secondary))',
                border: isActive(index) ? 'none' : '1px solid rgba(var(--brand-primary),0.15)',
                boxShadow: isActive(index) ? '0 4px 6px -1px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {section.badge}
            </button>
          ))}
        </div>

        {/* Active Content */}
        <div
          className="px-4 pb-8 sm:px-6"
          role="tabpanel"
          id={`tabpanel-${sections[activeSection].state}`}
          aria-labelledby={`tab-${sections[activeSection].state}`}
        >
          {variant === 'skeleton' ? (
            <SkeletonCard
              badge={sections[activeSection].badge}
              title={sections[activeSection].headline}
              description={sections[activeSection].body}
              className="mx-auto w-full max-w-lg"
            />
          ) : (
            <div className="mx-auto max-w-lg">
              <h3
                className="mb-3 font-bold leading-tight"
                style={{ fontSize: 'var(--lp-font-feature-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
              >
                {sections[activeSection].headline}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', color: 'rgb(var(--text-secondary))' }}
              >
                {sections[activeSection].body}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Dashboard Preview */}
        <div className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-[500px] overflow-hidden" style={{ border: '1px solid rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-lg)' }}>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-15%' }}>
              <Dashboard activeState={dashboardState} />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // ─── Desktop Layout: sticky scrollytelling ───

  // Progress indicator — now inside the sticky dashboard container
  const progressIndicator = (
    <div
      className="absolute z-10 flex flex-col items-center justify-center gap-3"
      style={{
        [reversed ? 'left' : 'right']: '0',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      {sections.map((_, index) => (
        <div
          key={index}
          className="rounded-full"
          style={{
            width: '4px',
            height: isActive(index) ? '32px' : '8px',
            backgroundColor: isActive(index) ? 'var(--lp-chart-primary)' : 'rgba(var(--brand-primary),0.25)',
            transition: prefersReducedMotion ? 'none' : 'all 0.4s ease-out',
            boxShadow: isActive(index) ? '0 0 8px rgba(var(--brand-primary),0.4)' : 'none',
          }}
        />
      ))}
    </div>
  )

  const textColumn = (
    <div className={`relative w-full lg:w-5/12 ${reversed ? 'lg:pr-8' : 'lg:pl-8'}`}>
      <div className="space-y-0 pb-24">
        {sections.map((section, index) => (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[index] = el
            }}
            className="flex min-h-[50vh] items-center px-12 py-12"
            data-scroll-animated={isActive(index) ? undefined : 'complete'}
            style={{
              opacity: isActive(index) ? 1 : 0.45,
              transform: variant === 'skeleton'
                ? (isActive(index) ? 'scale(1)' : 'scale(0.98)')
                : (isActive(index) ? 'translateY(0)' : 'translateY(10px)'),
              transition: prefersReducedMotion ? 'none' : 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {variant === 'skeleton' ? (
              <SkeletonCard
                badge={section.badge}
                title={section.headline}
                description={section.body}
                className="w-full max-w-lg"
              />
            ) : (
              <div className="w-full max-w-lg">
                <div
                  className="mb-4 inline-flex items-center rounded-md px-2.5 py-0.5 backdrop-blur-md"
                  style={{
                    fontSize: 'var(--lp-font-label)',
                    fontWeight: 'var(--lp-weight-subheading)',
                    border: '1px solid rgba(var(--brand-primary),0.2)',
                    backgroundColor: 'rgba(var(--surface-primary),0.5)',
                    color: 'rgb(var(--text-primary))',
                  }}
                >
                  {section.badge}
                </div>
                <h3
                  className="mb-4 font-bold leading-tight"
                  style={{ fontSize: 'var(--lp-font-feature-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
                >
                  {section.headline}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', color: 'rgb(var(--text-secondary))' }}
                >
                  {section.body}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const dashboardColumn = (
    <div className="relative w-full lg:w-7/12">
      <div className="sticky flex items-center justify-center px-6" style={{ top: 'clamp(3.5rem, 6vw, 5rem)', height: 'calc(100vh - clamp(3.5rem, 6vw, 5rem))', contain: 'layout style' }}>
        {/* Progress indicator at the edge facing the text column */}
        {progressIndicator}
        <div className="w-full max-w-[900px]">
          <Dashboard activeState={dashboardState} />
        </div>
      </div>
    </div>
  )

  return (
    <section
      ref={containerRef}
      className="relative"
      aria-label={typeof sectionTag === 'string' ? sectionTag : undefined}
      tabIndex={0}
      role="region"
      onKeyDown={handleKeyDown}
    >
      {desktopSectionHeader}

      {/* Scrollytelling Content */}
      <div className="flex flex-row">
        {reversed ? (
          <>
            {textColumn}
            {dashboardColumn}
          </>
        ) : (
          <>
            {dashboardColumn}
            {textColumn}
          </>
        )}
      </div>
    </section>
  )
}
