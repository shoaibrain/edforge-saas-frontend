/**
 * CarouselWidget
 * 
 * Notion-inspired horizontal scroll carousel with:
 * - Native wheel/trackpad scrolling
 * - Subtle hover-to-reveal navigation buttons on edges
 * - Glassy transparent edge shadows
 * - Notion-style page cards with icon, title, and timestamp
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import {
  useRecentlyVisited,
  getIconComponent,
  type VisitedPage
} from '../../../hooks/useRecentlyVisited'
import { formatRelativeDate } from '../../../lib/greeting'
import { WidgetSection } from '../WidgetSection'

// ============================================================================
// TYPES
// ============================================================================

export interface CarouselCard {
  id: string
  title: string
  subtitle?: string
  icon: LucideIcon | string
  href?: string
  module?: string
  /** For stat cards */
  value?: string | number
  /** For stat cards: positive, negative, neutral */
  changeType?: 'positive' | 'negative' | 'neutral'
  /** For stat cards: change indicator text */
  change?: string
}

interface CarouselWidgetProps {
  /** Cards to display */
  cards: CarouselCard[]
  /** Card type determines styling */
  cardType?: 'page' | 'stat'
  /** Animation delay for staggered entry */
  animationDelay?: number
}

// ============================================================================
// CARD STYLING - Light and Dark Mode Optimized
// Using explicit light mode colors to ensure proper rendering
// ============================================================================

const moduleColors: Record<string, { bg: string; icon: string }> = {
  academics: {
    bg: 'bg-teal-500/15 dark:bg-teal-500/25',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  finance: {
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  people: {
    bg: 'bg-blue-500/15 dark:bg-blue-500/25',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  messages: {
    bg: 'bg-violet-500/15 dark:bg-violet-500/25',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  analytics: {
    bg: 'bg-orange-500/15 dark:bg-orange-500/25',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  settings: {
    bg: 'bg-slate-500/15 dark:bg-slate-500/25',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  home: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  // Stat card specific colors
  positive: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  negative: {
    bg: 'bg-rose-500/15 dark:bg-rose-500/25',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  neutral: {
    bg: 'bg-slate-500/15 dark:bg-slate-500/25',
    icon: 'text-slate-600 dark:text-slate-400',
  },
}

// ============================================================================
// PAGE CARD COMPONENT - Notion Style
// ============================================================================

interface PageCardProps {
  card: CarouselCard
  index: number
}

function PageCard({ card, index }: PageCardProps) {
  const Icon = typeof card.icon === 'string' ? getIconComponent(card.icon) : card.icon
  const colors = moduleColors[card.module || 'home'] || moduleColors.home

  const content = (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <div
        className={`
          group relative flex flex-col w-[180px] h-[160px] p-4 rounded-2xl
          bg-[rgb(var(--surface-secondary))]
          border border-[rgb(var(--border-primary))]
          shadow-sm hover:shadow-md
          transition-all duration-200 cursor-pointer overflow-hidden
          hover:scale-[1.02] hover:border-[rgb(var(--border-primary))]/80
          active:scale-[0.98]
        `}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${colors.bg}
          transition-transform duration-200 group-hover:scale-105
        `}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        {/* Title - positioned at bottom */}
        <div className="mt-auto relative z-10">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] text-[15px] leading-tight mb-1">
            {card.title}
          </h3>

          {/* Timestamp with clock icon - like Notion */}
          {card.subtitle && (
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
              <Clock className="w-3 h-3" />
              <span>{card.subtitle}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (card.href) {
    return (
      <Link to={card.href} draggable={false} className="select-none">
        {content}
      </Link>
    )
  }

  return content
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  card: CarouselCard
  index: number
}

function StatCard({ card, index }: StatCardProps) {
  const Icon = typeof card.icon === 'string' ? getIconComponent(card.icon) : card.icon
  const colorKey = card.changeType || 'neutral'
  const colors = moduleColors[card.module || colorKey] || moduleColors[colorKey]

  const TrendIcon = card.changeType === 'positive' ? TrendingUp
    : card.changeType === 'negative' ? TrendingDown
      : Minus

  const content = (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <div
        className={`
          group relative flex flex-col w-[180px] h-[140px] p-4 rounded-2xl
          bg-[rgb(var(--surface-secondary))]
          border border-[rgb(var(--border-primary))]
          shadow-sm
          transition-all duration-200 overflow-hidden
          ${card.href ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}
        `}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Icon */}
        <div className={`
          w-9 h-9 rounded-xl flex items-center justify-center
          ${colors.bg}
          transition-transform duration-200 group-hover:scale-105
        `}>
          <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="mt-auto relative z-10">
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5 truncate">
            {card.title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {card.value}
            </span>
            {card.change && (
              <div className={`flex items-center gap-0.5 text-xs ${card.changeType === 'positive' ? 'text-emerald-600' :
                  card.changeType === 'negative' ? 'text-rose-600' :
                    'text-[rgb(var(--text-tertiary))]'
                }`}>
                <TrendIcon className="w-3 h-3" />
                <span>{card.change}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (card.href) {
    return (
      <Link to={card.href} draggable={false} className="select-none">
        {content}
      </Link>
    )
  }

  return content
}

// ============================================================================
// CAROUSEL NAVIGATION BUTTON - Notion Style
// ============================================================================

interface NavButtonProps {
  direction: 'left' | 'right'
  onClick: () => void
  visible: boolean
}

function NavButton({ direction, onClick, visible }: NavButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          onClick={onClick}
          className={`
            absolute top-1/2 -translate-y-1/2 z-20
            w-9 h-9 rounded-full
            flex items-center justify-center
            bg-[rgb(var(--surface-secondary))]
            border border-[rgb(var(--border-primary))]
            shadow-lg
            text-[rgb(var(--text-tertiary))]
            hover:bg-[rgb(var(--interactive-hover))]
            hover:text-[rgb(var(--text-primary))]
            transition-all duration-150
            ${direction === 'left' ? 'left-2' : 'right-2'}
          `}
          aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
        >
          {direction === 'left' ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// CAROUSEL CORE
// ============================================================================

const SCROLL_AMOUNT = 360

interface CarouselCoreProps {
  cards: CarouselCard[]
  cardType: 'page' | 'stat'
}

function CarouselCore({ cards, cardType }: CarouselCoreProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Check scroll position and update button visibility
  const checkScrollPosition = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  // Check on mount and when card count changes
  useEffect(() => {
    checkScrollPosition()
  }, [checkScrollPosition, cards.length])

  // Smooth scroll with easing
  const smoothScroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT
    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    })
  }, [])

  // Handle wheel events for horizontal scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!scrollRef.current) return

    // Check if the scroll is primarily horizontal or if it's a trackpad gesture
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
    const hasTrackpadMomentum = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0

    if (isHorizontal || hasTrackpadMomentum) {
      const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY

      // Only prevent default if we can scroll in that direction
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const atStart = scrollLeft <= 0
      const atEnd = scrollLeft >= scrollWidth - clientWidth

      if ((scrollDelta < 0 && !atStart) || (scrollDelta > 0 && !atEnd)) {
        e.preventDefault()
        scrollRef.current.scrollLeft += scrollDelta
      }
    }
  }, [])

  const CardComponent = cardType === 'stat' ? StatCard : PageCard

  return (
    <div
      className="relative group/carousel px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Buttons - positioned outside cards on edges */}
      <NavButton
        direction="left"
        onClick={() => smoothScroll('left')}
        visible={isHovered && canScrollLeft}
      />
      <NavButton
        direction="right"
        onClick={() => smoothScroll('right')}
        visible={isHovered && canScrollRight}
      />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onScroll={checkScrollPosition}
        className={`
          flex gap-3 overflow-x-auto scrollbar-none
          scroll-smooth
          py-2 -my-2
        `}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {cards.map((card, index) => (
          <CardComponent key={card.id} card={card} index={index} />
        ))}
      </div>

      {/* Glassy edge fade gradients - Notion style */}
      <div
        className={`
          pointer-events-none absolute left-0 top-0 bottom-0 w-16
          bg-gradient-to-r from-[rgb(var(--surface-primary))] via-[rgb(var(--surface-primary))]/80 to-transparent
          transition-opacity duration-300
          ${canScrollLeft ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          backdropFilter: canScrollLeft ? 'blur(2px)' : 'none',
        }}
      />
      <div
        className={`
          pointer-events-none absolute right-0 top-0 bottom-0 w-16
          bg-gradient-to-l from-[rgb(var(--surface-primary))] via-[rgb(var(--surface-primary))]/80 to-transparent
          transition-opacity duration-300
          ${canScrollRight ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          backdropFilter: canScrollRight ? 'blur(2px)' : 'none',
        }}
      />
    </div>
  )
}

// ============================================================================
// MAIN WIDGET EXPORT
// ============================================================================

export function CarouselWidget({
  cards,
  cardType = 'page',
  animationDelay = 0.1,
}: CarouselWidgetProps) {
  if (cards.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
    >
      <CarouselCore cards={cards} cardType={cardType} />
    </motion.div>
  )
}

// ============================================================================
// RECENTLY VISITED WIDGET (Convenience Wrapper)
// ============================================================================

export function RecentlyVisitedWidget() {
  const { recentPages } = useRecentlyVisited()
  const { t } = useTranslation('dashboard')

  const pages: VisitedPage[] = recentPages

  // Convert to CarouselCard format - memoized to prevent infinite re-renders
  const cards: CarouselCard[] = useMemo(() =>
    pages.map((page: VisitedPage) => ({
      id: page.path,
      title: page.title,
      subtitle: formatRelativeDate(new Date(page.visitedAt), t),
      icon: page.icon,
      href: page.path,
      module: page.module,
    })),
    [pages, t]
  )

  return (
    <WidgetSection
      widgetId="recently-visited"
      label={t('recentlyVisited')}
      icon={Clock}
      animationDelay={0.1}
      showHeader={true}
    >
      <CarouselWidget cards={cards} cardType="page" />
    </WidgetSection>
  )
}
