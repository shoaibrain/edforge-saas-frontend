import { useRef, useState, useCallback } from 'react'
import { useThrottledScroll } from '../hooks/useThrottledScroll'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { SkeletonCard } from './SkeletonCard'
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
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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

  const sectionHeader = (
    <div className="px-6 py-16 text-center lg:py-24">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
        {sectionTag}
      </div>
      <h2 className="mb-6 text-balance font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
        {sectionTitle}
      </h2>
      <p className="mx-auto max-w-3xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">
        {sectionSubtitle}
      </p>
    </div>
  )

  // ─── Mobile Layout: pill tabs + content below ───
  if (!isDesktop) {
    return (
      <div className="relative border-t border-border">
        {sectionHeader}

        {/* Pill Tab Bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-6 scrollbar-hide">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleTabClick(index)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive(index)
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {section.badge}
            </button>
          ))}
        </div>

        {/* Active Content */}
        <div className="px-4 pb-8 sm:px-6">
          {variant === 'skeleton' ? (
            <SkeletonCard
              badge={sections[activeSection].badge}
              title={sections[activeSection].headline}
              description={sections[activeSection].body}
              className="mx-auto w-full max-w-lg"
            />
          ) : (
            <div className="mx-auto max-w-lg">
              <h3 className="mb-3 text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {sections[activeSection].headline}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {sections[activeSection].body}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Dashboard Preview */}
        <div className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-[500px]">
            <Dashboard activeState={dashboardState} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Desktop Layout: sticky scrollytelling ───
  const textColumn = (
    <div className={`w-full lg:w-5/12 ${reversed ? 'lg:pr-8' : 'lg:pl-8'}`}>
      <div className="space-y-0 pb-24">
        {sections.map((section, index) => (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[index] = el
            }}
            className="flex min-h-[80vh] items-center px-12 py-12 transition-all duration-700 ease-out"
            style={{
              opacity: isActive(index) ? 1 : 0.3,
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
                <div className="mb-4 inline-flex items-center rounded-md border border-border bg-background/50 px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur-md">
                  {section.badge}
                </div>
                <h3 className="mb-4 text-3xl font-bold leading-tight text-foreground">
                  {section.headline}
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
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
      <div className="sticky top-24 flex h-[calc(100vh-6rem)] items-center justify-center px-6">
        <div className="w-full max-w-[900px]">
          <Dashboard activeState={dashboardState} />
        </div>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} className="relative border-t border-border">
      {sectionHeader}

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
    </div>
  )
}
