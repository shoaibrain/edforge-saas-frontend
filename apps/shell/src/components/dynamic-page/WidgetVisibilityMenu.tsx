/**
 * WidgetVisibilityMenu
 * 
 * Notion-style three-dot menu for page customization.
 * Uses checkmarks for visibility toggles like Notion.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Check, RotateCcw, Eye } from 'lucide-react'
import { useDynamicPage } from './DynamicPageContext'

// ============================================================================
// MENU COMPONENT
// ============================================================================

export function WidgetVisibilityMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWidgets, setShowWidgets] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    allWidgets,
    isWidgetVisible,
    toggleWidget,
    resetToDefaults,
  } = useDynamicPage()
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setShowWidgets(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (showWidgets) {
          setShowWidgets(false)
        } else {
          setIsOpen(false)
        }
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showWidgets])
  
  return (
    <div className="relative">
      {/* Three-dot trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-1.5 rounded-md
          text-[rgb(var(--text-tertiary))]
          hover:bg-[rgb(var(--background-tertiary))]
          transition-colors
          ${isOpen ? 'bg-[rgb(var(--background-tertiary))]' : ''}
        `}
        title="Page options"
        aria-label="Page options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      
      {/* Main Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !showWidgets && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute ef-inset-inline-end-0 top-full mt-1 z-50
              w-52 py-1
              bg-[rgb(var(--background-primary))]
              border border-[rgb(var(--border-primary))]
              rounded-lg shadow-xl
            `}
            role="menu"
          >
            {/* Show/hide widgets option */}
            <button
              onClick={() => setShowWidgets(true)}
              className={`
                w-full px-3 py-2 flex items-center gap-3
                hover:bg-[rgb(var(--background-tertiary))]
                transition-colors text-start text-sm
                text-[rgb(var(--text-primary))]
              `}
            >
              <Eye className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <span>Show/hide widgets</span>
              <span className="ms-auto text-[rgb(var(--text-tertiary))]">›</span>
            </button>
            
            {/* Divider */}
            <div className="my-1 border-t border-[rgb(var(--border-secondary))]" />
            
            {/* Reset option */}
            <button
              onClick={() => {
                resetToDefaults()
                setIsOpen(false)
              }}
              className={`
                w-full px-3 py-2 flex items-center gap-3
                text-start text-sm
                text-[rgb(var(--text-secondary))]
                hover:bg-[rgb(var(--background-tertiary))]
                transition-colors
              `}
            >
              <RotateCcw className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <span>Reset to default</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Widgets Submenu */}
      <AnimatePresence>
        {isOpen && showWidgets && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute ef-inset-inline-end-0 top-full mt-1 z-50
              w-52 py-1
              bg-[rgb(var(--background-primary))]
              border border-[rgb(var(--border-primary))]
              rounded-lg shadow-xl
            `}
            role="menu"
          >
            {/* Back button */}
            <button
              onClick={() => setShowWidgets(false)}
              className={`
                w-full px-3 py-2 flex items-center gap-2
                hover:bg-[rgb(var(--background-tertiary))]
                transition-colors text-start text-sm
                text-[rgb(var(--text-tertiary))]
                border-b border-[rgb(var(--border-secondary))]
                mb-1
              `}
            >
              <span>‹</span>
              <span>Back</span>
            </button>
            
            {/* Widget Items - with checkmarks like Notion */}
            {allWidgets.map((widget) => {
              const visible = isWidgetVisible(widget.id)
              
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`
                    w-full px-3 py-2 flex items-center gap-3
                    hover:bg-[rgb(var(--background-tertiary))]
                    transition-colors text-start text-sm
                  `}
                  role="menuitemcheckbox"
                  aria-checked={visible}
                >
                  {/* Checkmark */}
                  <div className="w-4 h-4 flex items-center justify-center">
                    {visible && (
                      <Check className="w-4 h-4 text-[rgb(var(--text-primary))]" />
                    )}
                  </div>
                  
                  <span className="text-[rgb(var(--text-primary))]">
                    {widget.label}
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
