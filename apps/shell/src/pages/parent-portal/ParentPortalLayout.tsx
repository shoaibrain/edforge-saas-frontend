/**
 * Parent Portal Layout
 *
 * Wraps all parent portal pages with children resolution and child selector.
 * Provides ParentPortalContext with the resolved children list and active child.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useParentChildren, type ChildProfile } from '../../hooks/useParentChildren'
import { Skeleton, Button } from '@edforge/ui'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { RouteErrorBoundary } from '../../components/layout/ErrorBoundary'
import '../../styles/family-portal.css'

// ============================================================================
// CONTEXT
// ============================================================================

interface ParentPortalContextValue {
  children: ChildProfile[]
  activeChild: ChildProfile | null
  setActiveChildId: (studentId: string) => void
}

const ParentPortalContext = createContext<ParentPortalContextValue | null>(null)

export function useParentPortal() {
  const ctx = useContext(ParentPortalContext)
  if (!ctx) throw new Error('useParentPortal must be used inside ParentPortalLayout')
  return ctx
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function ParentPortalLayout() {
  const { children, isLoading, error } = useParentChildren()
  const [activeChildId, setActiveChildId] = useState<string | null>(null)

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !activeChildId) {
      setActiveChildId(children[0].studentId)
    }
  }, [children, activeChildId])

  const activeChild = children.find((c) => c.studentId === activeChildId) ?? null

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || children.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
            No Children Found
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
            We couldn't find any student records linked to your account. Please contact your school administrator if this issue persists.
          </p>
          <Button onClick={() => window.location.href = '/home'}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ParentPortalContext.Provider value={{ children, activeChild, setActiveChildId }}>
      <div data-family-portal="true">
        {/* Child selector (shown when parent has multiple children) */}
        {children.length > 1 && (
          <ChildSelector
            children={children}
            activeChildId={activeChildId}
            onSelect={setActiveChildId}
          />
        )}
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </div>
    </ParentPortalContext.Provider>
  )
}

// ============================================================================
// CHILD SELECTOR
// ============================================================================

function ChildSelector({
  children,
  activeChildId,
  onSelect,
}: {
  children: ChildProfile[]
  activeChildId: string | null
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const active = children.find((c) => c.studentId === activeChildId)

  return (
    <div className="px-6 pt-4 pb-0">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors text-sm"
        >
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {active ? `${active.firstName} ${active.lastName}` : 'Select child'}
          </span>
          {active?.gradeLevel && (
            <span className="text-[rgb(var(--text-secondary))]">
              Grade {active.gradeLevel}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg min-w-60">
              {children.map((child) => (
                <button
                  key={child.studentId}
                  onClick={() => {
                    onSelect(child.studentId)
                    setIsOpen(false)
                  }}
                  className={`w-full text-start px-4 py-3 hover:bg-[rgb(var(--background-secondary))] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    child.studentId === activeChildId
                      ? 'bg-[rgb(var(--background-secondary))]'
                      : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {child.firstName} {child.lastName}
                  </p>
                  {child.gradeLevel && (
                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                      Grade {child.gradeLevel}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
