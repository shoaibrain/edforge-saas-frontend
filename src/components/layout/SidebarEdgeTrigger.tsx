/**
 * SidebarEdgeTrigger Component
 * 
 * A modern edge-based sidebar toggle that appears on hover at the sidebar border.
 * Following the VS Code / Linear / Notion pattern for elegant sidebar control.
 * 
 * Features:
 * - Invisible by default, appears on hover near sidebar edge
 * - Chevron follows mouse Y position dynamically
 * - Smooth scale/opacity animations with framer-motion
 * - Shows ChevronLeft when expanded, ChevronRight when collapsed
 */

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarEdgeTriggerProps {
  collapsed: boolean
  onToggle: () => void
}

export function SidebarEdgeTrigger({ collapsed, onToggle }: SidebarEdgeTriggerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mouseY, setMouseY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track mouse position within the hover zone
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      // Clamp Y position to keep button within visible area (with padding)
      const y = Math.max(24, Math.min(e.clientY - rect.top, rect.height - 24))
      setMouseY(y)
    }
  }, [])

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true)
    handleMouseMove(e)
  }, [handleMouseMove])

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-0 bottom-0 w-3 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual edge line - subtle indicator that appears on hover */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-0.5 bg-teal-500/50 dark:bg-cyan-500/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Trigger button - follows mouse Y position */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 30,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            style={{ top: mouseY }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              'absolute right-0 translate-x-1/2 -translate-y-1/2',
              'w-5 h-5 rounded-full',
              'flex items-center justify-center',
              'bg-[rgb(var(--surface-secondary))]',
              'border border-[rgb(var(--border-secondary))]',
              'shadow-sm',
              'text-[rgb(var(--text-tertiary))]',
              'hover:bg-teal-500 dark:hover:bg-cyan-500',
              'hover:text-white',
              'hover:border-transparent',
              'transition-colors duration-150',
              'focus:outline-none'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
