/**
 * Focus Management Hook
 * 
 * Manages focus for accessibility on route changes and dynamic content updates.
 * Ensures keyboard and screen reader users have a consistent experience.
 * 
 * Features:
 * - Focus main content on route changes
 * - Announce route changes to screen readers
 * - Focus trap management for modals
 */

import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from '@tanstack/react-router'

// ============================================================================
// ROUTE FOCUS MANAGEMENT
// ============================================================================

/**
 * Hook to manage focus on route changes.
 * Focuses the main content area when navigating to a new page.
 */
export function useRouteFocus() {
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    // Only focus on actual route changes, not initial mount
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname

      // Small delay to ensure DOM is updated
      requestAnimationFrame(() => {
        // Try to focus the main content
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
          // Set tabindex if not already focusable
          if (!mainContent.hasAttribute('tabindex')) {
            mainContent.setAttribute('tabindex', '-1')
          }
          mainContent.focus({ preventScroll: true })
        }
      })
    }
  }, [location.pathname])
}

// ============================================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================================

/**
 * Create a live region for screen reader announcements
 */
function createLiveRegion(): HTMLDivElement {
  const existingRegion = document.getElementById('sr-announcer')
  if (existingRegion) {
    return existingRegion as HTMLDivElement
  }

  const region = document.createElement('div')
  region.id = 'sr-announcer'
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  document.body.appendChild(region)
  return region
}

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReaderAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = createLiveRegion()
    region.setAttribute('aria-live', priority)
    
    // Clear and set message with delay for screen readers to pick up
    region.textContent = ''
    requestAnimationFrame(() => {
      region.textContent = message
    })

    // Clear after announcement
    setTimeout(() => {
      region.textContent = ''
    }, 1000)
  }, [])

  return announce
}

/**
 * Hook to announce route changes to screen readers
 */
export function useRouteAnnouncement() {
  const location = useLocation()
  const announce = useScreenReaderAnnounce()
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname

      // Build a readable page name from the path
      const pathParts = location.pathname.split('/').filter(Boolean)
      const pageName = pathParts.length > 0
        ? pathParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '))
            .join(' - ')
        : 'Home'

      // Announce after a short delay to not interrupt other content
      setTimeout(() => {
        announce(`Navigated to ${pageName}`)
      }, 100)
    }
  }, [location.pathname, announce])
}

// ============================================================================
// FOCUS TRAP
// ============================================================================

/**
 * Hook to trap focus within a container (for modals, dialogs, etc.)
 * 
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element on activation
    firstElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}

// ============================================================================
// RETURN FOCUS
// ============================================================================

/**
 * Hook to return focus to a triggering element when a modal/dialog closes
 */
export function useReturnFocus(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element when opening
      triggerRef.current = document.activeElement as HTMLElement
    } else if (triggerRef.current) {
      // Return focus when closing
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [isOpen])
}

