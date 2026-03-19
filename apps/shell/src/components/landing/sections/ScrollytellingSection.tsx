import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SkeletonCard } from './SkeletonCard'
import type React from 'react'

export interface ScrollSection<T extends string> {
  id: number
  state: T
  headline: string
  body: string
  badge: string
  highlightWords?: string[]
  icon?: React.ElementType
  summary?: string
  span?: 'single' | 'wide'
}

function renderHighlightedHeadline(headline: string, highlightWords?: string[]): React.ReactNode {
  if (!highlightWords?.length) return headline
  const parts: React.ReactNode[] = []
  let remaining = headline
  let key = 0
  for (const word of highlightWords) {
    const idx = remaining.indexOf(word)
    if (idx === -1) continue
    if (idx > 0) parts.push(remaining.slice(0, idx))
    parts.push(<span key={key++} className="font-bold text-[var(--lp-accent-green)]">{word}</span>)
    remaining = remaining.slice(idx + word.length)
  }
  if (remaining) parts.push(remaining)
  return parts.length > 0 ? parts : headline
}

interface ScrollytellingSectionProps<T extends string> {
  sections: ScrollSection<T>[]
  sectionTag: string
  sectionTitle: React.ReactNode
  sectionSubtitle: string
  dashboard: React.ComponentType<{ activeState: T }>
  reversed?: boolean
  variant?: 'plain' | 'skeleton'
  accentColor?: string
  accentBg?: string
}

export function ScrollytellingSection<T extends string>({
  sections,
  sectionTag,
  sectionTitle,
  sectionSubtitle,
  dashboard: Dashboard,
  reversed = false,
  variant = 'plain',
  accentColor = 'var(--lp-accent-green)',
  accentBg = 'var(--lp-accent-green-light)',
}: ScrollytellingSectionProps<T>) {
  const [activeSection, setActiveSection] = useState<number>(0)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const prefersReducedMotion = useReducedMotion()

  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const duration = 6000 // 6 seconds per section

  // Auto-advance logic
  useEffect(() => {
    if (!isDesktop || prefersReducedMotion) {
      setProgress(0)
      return
    }

    if (isHovered) return

    const interval = 30
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActiveSection((prev) => (prev + 1) % sections.length)
          return 0
        }
        return p + step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isDesktop, prefersReducedMotion, isHovered, duration, sections.length])

  const handleTabClick = (index: number) => {
    setActiveSection(index)
    setProgress(0)
  }

  const sectionHeader = (
    <div className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
      <div
        className="mb-8 inline-flex items-center gap-2 px-5 py-2 text-[0.8125rem] font-bold uppercase tracking-wide"
        style={{
          borderRadius: 'var(--lp-radius-pill)',
          backgroundColor: accentBg,
          color: accentColor,
        }}
      >
        {sectionTag}
      </div>
      <h2
        className="mb-6 text-balance tracking-tight"
        style={{
          fontFamily: 'var(--lp-font-heading)',
          fontSize: 'var(--lp-font-section-title)',
          fontWeight: '700',
          lineHeight: '1.1',
          color: 'rgb(var(--text-primary))',
        }}
      >
        {sectionTitle}
      </h2>
      <p
        className="mx-auto max-w-2xl text-pretty"
        style={{
          fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
          lineHeight: '1.6',
          color: '#475569' // Softer slate color for readability
        }}
      >
        {sectionSubtitle}
      </p>
    </div>
  )

  if (!isDesktop) {
    // Mobile View (Horizontal Tabs)
    return (
      <section className="relative pb-24" aria-label={typeof sectionTag === 'string' ? sectionTag : undefined}>
        {sectionHeader}
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto px-6 pb-8 scrollbar-hide snap-x snap-mandatory scroll-pl-6" role="tablist">
            {sections.map((section, index) => {
              const active = activeSection === index
              return (
                <button
                  key={section.id}
                  onClick={() => handleTabClick(index)}
                  className="shrink-0 snap-start font-medium transition-all duration-200"
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '9999px',
                    backgroundColor: active ? accentBg : '#F1F5F9',
                    color: active ? accentColor : '#475569',
                    border: `1px solid ${active ? accentColor : 'transparent'}`,
                  }}
                >
                  {section.badge}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-6 pb-12">
          {variant === 'skeleton' ? (
            <SkeletonCard
              badge={sections[activeSection].badge}
              title={sections[activeSection].headline}
              description={sections[activeSection].body}
              icon={sections[activeSection].icon}
              accentColor={accentColor}
              accentBg={accentBg}
              className="mx-auto w-full max-w-lg"
            />
          ) : (
            <div className="mx-auto max-w-lg">
              <h3 className="mb-4 font-semibold leading-tight text-2xl text-slate-900">
                {renderHighlightedHeadline(sections[activeSection].headline, sections[activeSection].highlightWords)}
              </h3>
              <p className="leading-relaxed text-slate-600 text-lg">
                {sections[activeSection].body}
              </p>
            </div>
          )}
        </div>

        <div className="px-6">
          <div className="mx-auto max-w-[600px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-[#FAF9F6] p-4">
            <Dashboard activeState={sections[activeSection].state} />
          </div>
        </div>
      </section>
    )
  }

  // Desktop View (Sticky Scroll)
  return (
    <section className="relative pb-32" aria-label={typeof sectionTag === 'string' ? sectionTag : undefined}>
      {sectionHeader}

      <div className="mx-auto max-w-[1360px] px-8">
        <div className={`flex items-start gap-12 lg:gap-20 ${reversed ? 'flex-row-reverse' : 'flex-row'}`}>

          {/* Left Column: Accordion Text Blocks */}
          <div
            className="w-full lg:w-[40%] py-4 flex flex-col justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex flex-col relative space-y-2">
              {sections.map((section, index) => {
                const active = activeSection === index

                return (
                  <button
                    key={section.id}
                    onClick={() => handleTabClick(index)}
                    className="relative flex flex-col items-start px-8 py-5 text-left transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316] rounded-xl"
                    style={{ opacity: active ? 1 : 0.5 }}
                    aria-expanded={active}
                  >
                    {/* Background Track */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full bg-slate-200/60" />

                    {/* Active Progress Bar */}
                    {active && (
                      <div
                        className="absolute left-0 top-0 w-1.5 rounded-full transition-all duration-75 ease-linear"
                        style={{ height: `${progress}%`, backgroundColor: accentColor }}
                      />
                    )}

                    <h3
                      className="tracking-tight transition-all duration-300"
                      style={{
                        fontFamily: 'var(--lp-font-heading)',
                        fontSize: active ? '1.75rem' : '1.35rem',
                        fontWeight: '600',
                        color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))'
                      }}
                    >
                      {renderHighlightedHeadline(section.headline, section.highlightWords)}
                    </h3>

                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden w-full"
                        >
                          <div className="pt-3 pb-1">
                            <p className="leading-relaxed text-slate-600 text-lg mb-5 max-w-[28rem]">
                              {section.body}
                            </p>

                            <div
                              className="inline-flex font-medium items-center hover:underline cursor-pointer"
                              style={{ color: accentColor }}
                            >
                              Learn more
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Sticky Dashboard Graphic */}
          <div className="w-full lg:w-[60%] sticky top-32 lg:top-40 pl-0 lg:pl-12 flex flex-col items-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full rounded-[2rem] border border-slate-200 bg-white p-2 md:p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
              >
                {/* Inner wrapper for exact screenshot proportions */}
                <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-[#FAFAFA] border border-slate-100 shadow-inner p-2 md:p-6 lg:p-8">
                  <Dashboard activeState={sections[activeSection].state} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
