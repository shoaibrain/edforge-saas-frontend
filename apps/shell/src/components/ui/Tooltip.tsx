import { useState, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  disabled?: boolean
  delayDuration?: number
}

export function Tooltip({
  content,
  children,
  side = 'right',
  sideOffset = 8,
  disabled = false,
  delayDuration = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calculatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    let x = 0
    let y = 0

    switch (side) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2
        y = rect.top + scrollY - sideOffset
        break
      case 'right':
        x = rect.right + scrollX + sideOffset
        y = rect.top + scrollY + rect.height / 2
        break
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2
        y = rect.bottom + scrollY + sideOffset
        break
      case 'left':
        x = rect.left + scrollX - sideOffset
        y = rect.top + scrollY + rect.height / 2
        break
    }

    setPosition({ x, y })
  }

  const handleMouseEnter = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      calculatePosition()
      setIsVisible(true)
    }, delayDuration)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const getTransformOrigin = () => {
    switch (side) {
      case 'top': return 'bottom center'
      case 'right': return 'left center'
      case 'bottom': return 'top center'
      case 'left': return 'right center'
    }
  }

  const getTranslate = () => {
    switch (side) {
      case 'top': return { x: '-50%', y: '-100%' }
      case 'right': return { x: '0%', y: '-50%' }
      case 'bottom': return { x: '-50%', y: '0%' }
      case 'left': return { x: '-100%', y: '-50%' }
    }
  }

  const translate = getTranslate()

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                transform: `translate(${translate.x}, ${translate.y})`,
                transformOrigin: getTransformOrigin(),
                zIndex: 9999,
              }}
              className="pointer-events-none"
            >
              <div className="px-3 py-1.5 rounded-lg bg-[rgb(var(--background-inverse))] text-[rgb(var(--action-primary-fg))] text-sm font-medium shadow-lg whitespace-nowrap">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

