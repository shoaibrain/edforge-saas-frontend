import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.08],
    ['rgba(10,26,36,0)', 'rgba(10,26,36,0.92)'],
  )
  const headerPy = useTransform(scrollYProgress, [0, 0.08], [56, 12])
  const collapsibleOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0])
  const collapsibleMaxHeight = useTransform(scrollYProgress, [0, 0.08], [150, 0])
  const titleScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.55])
  const titleMarginBottom = useTransform(scrollYProgress, [0, 0.08], [24, 0])

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
    <div className="px-6 py-10 text-center lg:py-14">
      <div
        className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
        style={{
          border: '1px solid rgba(42,157,143,0.2)',
          backgroundColor: 'rgba(42,157,143,0.06)',
          color: 'rgba(94,196,182,0.8)',
        }}
      >
        {sectionTag}
      </div>
      <h2 className="mb-6 text-balance font-sans text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem]" style={{ color: '#e8edf0' }}>
        {sectionTitle}
      </h2>
      <p className="mx-auto max-w-3xl text-pretty text-sm sm:text-base md:text-lg lg:text-xl" style={{ color: '#8aafbf' }}>
        {sectionSubtitle}
      </p>
    </div>
  )

  // ─── Desktop section header: sticky with scroll-linked morph ───
  const desktopSectionHeader = prefersReducedMotion ? (
    <div
      className="sticky top-0 z-20 px-6 py-10 text-center"
      style={{ backgroundColor: 'rgba(10,26,36,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <h2 className="text-balance font-sans text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem]" style={{ color: '#e8edf0' }}>
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
            border: '1px solid rgba(42,157,143,0.2)',
            backgroundColor: 'rgba(42,157,143,0.06)',
            color: 'rgba(94,196,182,0.8)',
          }}
        >
          {sectionTag}
        </div>
      </motion.div>

      {/* Title — shrinks on scroll */}
      <motion.h2
        className="text-balance font-sans text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem]"
        style={{
          color: '#e8edf0',
          scale: titleScale,
          transformOrigin: 'top center',
          marginBottom: titleMarginBottom,
        }}
      >
        {sectionTitle}
      </motion.h2>

      {/* Subtitle + scroll hint — collapses on scroll */}
      <motion.div style={{ maxHeight: collapsibleMaxHeight, opacity: collapsibleOpacity, overflow: 'hidden' }}>
        <p className="mx-auto max-w-3xl text-pretty text-sm sm:text-base md:text-lg lg:text-xl" style={{ color: '#8aafbf' }}>
          {sectionSubtitle}
        </p>
        <div
          className="mt-4 flex flex-col items-center gap-1"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-xs font-medium tracking-wider uppercase" style={{ color: '#8aafbf' }}>
            Scroll to explore
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: '#2a9d8f' }} />
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
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
              style={{
                backgroundColor: isActive(index) ? '#2a9d8f' : 'rgba(42,157,143,0.08)',
                color: isActive(index) ? '#050b0f' : '#8aafbf',
                border: isActive(index) ? 'none' : '1px solid rgba(42,157,143,0.15)',
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
              <h3 className="mb-3 text-xl font-bold leading-tight sm:text-2xl" style={{ color: '#e8edf0' }}>
                {sections[activeSection].headline}
              </h3>
              <p className="text-sm leading-relaxed sm:text-base" style={{ color: '#8aafbf' }}>
                {sections[activeSection].body}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Dashboard Preview */}
        <div className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-[500px] overflow-hidden rounded-xl" style={{ border: '1px solid rgba(42,157,143,0.1)' }}>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
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
            backgroundColor: isActive(index) ? '#2a9d8f' : 'rgba(42,157,143,0.25)',
            transition: prefersReducedMotion ? 'none' : 'all 0.4s ease-out',
            boxShadow: isActive(index) ? '0 0 8px rgba(42,157,143,0.4)' : 'none',
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
            className="flex min-h-[50vh] items-center px-12 py-12 transition-all duration-700 ease-out"
            style={{
              opacity: isActive(index) ? 1 : 0.45,
              transform: variant === 'skeleton'
                ? (isActive(index) ? 'scale(1)' : 'scale(0.98)')
                : (isActive(index) ? 'translateY(0)' : 'translateY(10px)'),
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
                  className="mb-4 inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md"
                  style={{
                    border: '1px solid rgba(42,157,143,0.2)',
                    backgroundColor: 'rgba(10,26,36,0.5)',
                    color: '#e8edf0',
                  }}
                >
                  {section.badge}
                </div>
                <h3 className="mb-4 text-3xl font-bold leading-tight" style={{ color: '#e8edf0' }}>
                  {section.headline}
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: '#8aafbf' }}>
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
      <div className="sticky top-24 flex h-[calc(100vh-6rem)] items-center justify-center px-6" style={{ contain: 'layout style' }}>
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
