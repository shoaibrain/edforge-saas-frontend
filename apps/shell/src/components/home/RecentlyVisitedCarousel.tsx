/**
 * Recently Visited Carousel
 * 
 * An elegant Framer Motion drag-based carousel showing
 * recently visited pages with smooth animations.
 */

import { useRef, useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useMotionValue, useSpring, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { 
  useRecentlyVisited, 
  getIconComponent, 
  type VisitedPage 
} from '../../hooks/useRecentlyVisited'
import { formatRelativeDate } from '../../lib/greeting'

// ============================================================================
// EXTENDED MOCK DATA FOR MORE CARDS
// ============================================================================

const EXTENDED_MOCK_PAGES: VisitedPage[] = [
  // [MVP-PARKED] Communications mock entry
  // {
  //   path: '/communications',
  //   title: 'Meetings',
  //   icon: 'Video',
  //   module: 'communications',
  //   visitedAt: new Date().toISOString(),
  // },
  // [/MVP-PARKED]
  {
    path: '/settings',
    title: 'Settings',
    icon: 'Settings',
    module: 'settings',
    visitedAt: new Date().toISOString(),
  },
  {
    path: '/academics',
    title: 'Academics',
    icon: 'GraduationCap',
    module: 'academics',
    visitedAt: new Date().toISOString(),
  },
  {
    path: '/academics/students',
    title: 'Students',
    icon: 'Users',
    module: 'academics',
    visitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    path: '/finance',
    title: 'Finance',
    icon: 'DollarSign',
    module: 'finance',
    visitedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    path: '/people',
    title: 'People',
    icon: 'Users',
    module: 'people',
    visitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  // [MVP-PARKED] Analytics mock entry
  // {
  //   path: '/analytics',
  //   title: 'Analytics',
  //   icon: 'BarChart3',
  //   module: 'analytics',
  //   visitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  // },
  // [/MVP-PARKED]
  {
    path: '/academics/classrooms',
    title: 'Classrooms',
    icon: 'BookOpen',
    module: 'academics',
    visitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface VisitedCardProps {
  page: VisitedPage
  index: number
}

function VisitedCard({ page, index }: VisitedCardProps) {
  const Icon = getIconComponent(page.icon)
  const visitedDate = new Date(page.visitedAt)
  
  // Module-based color schemes
  const moduleColors: Record<string, { bg: string; icon: string; gradient: string }> = {
    academics: {
      bg: 'bg-teal-500/8 dark:bg-cyan-500/12',
      icon: 'text-teal-600 dark:text-cyan-400',
      gradient: 'from-teal-500/20 to-teal-500/5 dark:from-cyan-500/20 dark:to-cyan-500/5',
    },
    finance: {
      bg: 'bg-golden-400/10',
      icon: 'text-golden-600 dark:text-golden-400',
      gradient: 'from-golden-400/20 to-golden-400/5',
    },
    people: {
      bg: 'bg-aqua-400/10',
      icon: 'text-aqua-700 dark:text-aqua-400',
      gradient: 'from-aqua-400/20 to-aqua-400/5',
    },
    // [MVP-PARKED] Parked module color schemes
    // communications: {
    //   bg: 'bg-violet-500/8 dark:bg-violet-400/12',
    //   icon: 'text-violet-600 dark:text-violet-400',
    //   gradient: 'from-violet-500/20 to-violet-500/5 dark:from-violet-400/20 dark:to-violet-400/5',
    // },
    // analytics: {
    //   bg: 'bg-caramel-400/10',
    //   icon: 'text-caramel-600 dark:text-caramel-400',
    //   gradient: 'from-caramel-400/20 to-caramel-400/5',
    // },
    // [/MVP-PARKED]
    settings: {
      bg: 'bg-slate-500/8 dark:bg-slate-400/12',
      icon: 'text-slate-600 dark:text-slate-400',
      gradient: 'from-slate-500/20 to-slate-500/5',
    },
    home: {
      bg: 'bg-vanilla-400/15',
      icon: 'text-vanilla-700 dark:text-vanilla-500',
      gradient: 'from-vanilla-400/20 to-vanilla-400/5',
    },
  }
  
  const colors = moduleColors[page.module] || moduleColors.home
  
  return (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={page.path}
        className={`
          group relative flex flex-col w-[160px] h-[140px] p-4 rounded-2xl
          bg-gradient-to-br ${colors.gradient}
          border border-[rgb(var(--border-primary))]
          transition-all duration-300 cursor-pointer overflow-hidden
          hover:shadow-xl hover:scale-[1.02] hover:border-[rgb(var(--border-tertiary))]
          active:scale-[0.98]
        `}
        draggable={false}
      >
        {/* Background glow effect */}
        <div className={`
          absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0
          ${colors.bg} group-hover:opacity-100 transition-opacity duration-500
        `} />
        
        {/* Icon */}
        <div className={`
          relative w-11 h-11 rounded-xl flex items-center justify-center mb-auto
          ${colors.bg} backdrop-blur-sm
          transition-transform duration-300 group-hover:scale-110
        `}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        
        {/* Content */}
        <div className="relative mt-3">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] text-sm truncate mb-1">
            {page.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-[rgb(var(--text-tertiary))]">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeDate(visitedDate)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ============================================================================
// CAROUSEL COMPONENT
// ============================================================================

const CARD_WIDTH = 160
const CARD_GAP = 12
const DRAG_BUFFER = 50

export function RecentlyVisitedCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const { recentPages } = useRecentlyVisited()
  
  // Use extended mock data if less than 3 real pages (for a better demo experience)
  // Merge user's pages with mock data, avoiding duplicates
  const pages = recentPages.length >= 3 
    ? recentPages 
    : (() => {
        const existingPaths = new Set(recentPages.map(p => p.path))
        const mockToAdd = EXTENDED_MOCK_PAGES.filter(p => !existingPaths.has(p.path))
        return [...recentPages, ...mockToAdd].slice(0, 10)
      })()
  
  // Calculate total scroll width
  const totalWidth = pages.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP
  const maxDrag = Math.max(0, totalWidth - containerWidth)
  
  // Motion values for drag
  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])
  
  // Handle drag end with bounds
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get()
    const velocity = info.velocity.x
    
    // Calculate target position based on velocity
    let targetX = currentX + velocity * 0.2
    
    // Clamp to bounds
    targetX = Math.max(-maxDrag, Math.min(0, targetX))
    
    // Animate to target
    x.set(targetX)
  }
  
  // Navigation buttons
  const scrollPrev = () => {
    const currentX = x.get()
    const newX = Math.min(0, currentX + CARD_WIDTH * 2 + CARD_GAP * 2)
    x.set(newX)
  }
  
  const scrollNext = () => {
    const currentX = x.get()
    const newX = Math.max(-maxDrag, currentX - CARD_WIDTH * 2 - CARD_GAP * 2)
    x.set(newX)
  }
  
  if (pages.length === 0) {
    return null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            Recently visited
          </h2>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={scrollPrev}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]
              text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] 
              hover:border-[rgb(var(--border-tertiary))] hover:shadow-md
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={scrollNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]
              text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]
              hover:border-[rgb(var(--border-tertiary))] hover:shadow-md
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {/* Carousel Container */}
      <div 
        ref={containerRef} 
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -maxDrag - DRAG_BUFFER, right: DRAG_BUFFER }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x: springX }}
          className="flex gap-3"
        >
          {pages.map((page, index) => (
            <VisitedCard key={page.path} page={page} index={index} />
          ))}
        </motion.div>
      </div>
      
      {/* Edge Gradients */}
      <div className="pointer-events-none absolute left-0 top-12 bottom-0 w-8 bg-gradient-to-r from-[rgb(var(--surface-primary))] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-12 bottom-0 w-8 bg-gradient-to-l from-[rgb(var(--surface-primary))] to-transparent" />
    </motion.div>
  )
}
