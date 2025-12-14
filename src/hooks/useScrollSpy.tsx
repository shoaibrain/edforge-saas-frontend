/**
 * useScrollSpy Hook
 * 
 * A custom hook that tracks which section is currently visible
 * in the viewport, enabling scroll-spy navigation.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ScrollSpySection {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface UseScrollSpyOptions {
  /** Offset from top of viewport (for fixed headers) */
  offset?: number
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Threshold for intersection */
  threshold?: number | number[]
}

export interface UseScrollSpyReturn {
  /** Currently active section ID */
  activeSection: string
  /** Scroll to a specific section */
  scrollToSection: (sectionId: string) => void
  /** Register a section ref */
  registerSection: (id: string) => (el: HTMLElement | null) => void
  /** Progress through all sections (0-1) */
  scrollProgress: number
}

export function useScrollSpy(
  sections: ScrollSpySection[],
  options: UseScrollSpyOptions = {}
): UseScrollSpyReturn {
  const {
    offset = 100,
    rootMargin = '-20% 0px -70% 0px',
    threshold = 0,
  } = options

  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Calculate scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set up intersection observer
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        
        if (visibleEntries.length > 0) {
          // Get the entry closest to the top of the viewport
          const topEntry = visibleEntries.reduce((closest, entry) => {
            const entryTop = entry.boundingClientRect.top
            const closestTop = closest.boundingClientRect.top
            return Math.abs(entryTop) < Math.abs(closestTop) ? entry : closest
          })

          setActiveSection(topEntry.target.id)
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    // Observe all registered sections
    sectionRefs.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [rootMargin, threshold, sections])

  // Register a section element
  const registerSection = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionRefs.current.set(id, el)
        if (observerRef.current) {
          observerRef.current.observe(el)
        }
      } else {
        const existing = sectionRefs.current.get(id)
        if (existing && observerRef.current) {
          observerRef.current.unobserve(existing)
        }
        sectionRefs.current.delete(id)
      }
    },
    []
  )

  // Scroll to a specific section
  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = sectionRefs.current.get(sectionId) || document.getElementById(sectionId)
      
      if (element) {
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        const targetPosition = elementTop - offset

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        })

        // Update active section immediately for responsive feel
        setActiveSection(sectionId)
      }
    },
    [offset]
  )

  return {
    activeSection,
    scrollToSection,
    registerSection,
    scrollProgress,
  }
}

/**
 * ScrollSpyNav Component
 * 
 * A navigation component that uses scroll-spy to highlight
 * the currently visible section.
 */

import { useSpring, animated, config } from '@react-spring/web'
import { cn } from '@/lib/utils'

export interface ScrollSpyNavProps {
  sections: ScrollSpySection[]
  activeSection: string
  onSectionClick: (sectionId: string) => void
  className?: string
  variant?: 'sidebar' | 'pills' | 'minimal'
}

export function ScrollSpyNav({
  sections,
  activeSection,
  onSectionClick,
  className,
  variant = 'sidebar',
}: ScrollSpyNavProps) {
  const activeIndex = sections.findIndex((s) => s.id === activeSection)

  // Spring for the active indicator
  const indicatorSpring = useSpring({
    y: activeIndex * 44, // Approximate height of each item
    config: config.gentle,
  })

  if (variant === 'pills') {
    return (
      <nav className={cn('flex items-center gap-2 p-1 bg-[rgb(var(--surface-tertiary))] rounded-full', className)}>
        {sections.map((section) => {
          const isActive = section.id === activeSection
          const Icon = section.icon

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium rounded-full transition-colors',
                isActive
                  ? 'text-[rgb(var(--text-primary))]'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              )}
            >
              {isActive && (
                <animated.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[rgb(var(--surface-secondary))] rounded-full shadow-sm"
                />
              )}
              <span className="relative flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                {section.label}
              </span>
            </button>
          )
        })}
      </nav>
    )
  }

  if (variant === 'minimal') {
    return (
      <nav className={cn('space-y-1', className)}>
        {sections.map((section) => {
          const isActive = section.id === activeSection

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={cn(
                'block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                isActive
                  ? 'text-teal-600 dark:text-cyan-400 font-medium'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              )}
            >
              {section.label}
            </button>
          )
        })}
      </nav>
    )
  }

  // Default: sidebar variant
  return (
    <nav className={cn('relative space-y-1', className)}>
      {/* Active Indicator */}
      <animated.div
        style={{
          transform: indicatorSpring.y.to((y) => `translateY(${y}px)`),
        }}
        className="absolute left-0 w-0.5 h-10 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"
      />

      {sections.map((section) => {
        const isActive = section.id === activeSection
        const Icon = section.icon

        return (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all',
              isActive
                ? 'bg-teal-500/10 text-teal-700 dark:text-cyan-300 font-medium'
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))]'
            )}
          >
            {Icon && (
              <Icon className={cn(
                'w-4 h-4',
                isActive ? 'text-teal-500 dark:text-cyan-400' : ''
              )} />
            )}
            <span>{section.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

