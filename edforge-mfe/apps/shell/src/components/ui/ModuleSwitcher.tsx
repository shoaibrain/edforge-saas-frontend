/**
 * Module Switcher Component
 * 
 * Quick navigation between top-level modules using ⌘J (Cmd+J).
 * Allows users to jump directly from any module to another without
 * navigating back to home first.
 * 
 * Features:
 * - Keyboard shortcut: ⌘J / Ctrl+J
 * - Current module indicator
 * - Fast keyboard navigation
 * - Spring animations
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Dialog, Combobox } from '@headlessui/react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useSpring, animated, config } from '@react-spring/web'
import {
  School,
  HandCoins,
  UsersRound,
  MessageCircleMore,
  BarChart3,
  Settings,
  GraduationCap,
  Baby,
  ArrowRight,
  Layers,
  Check,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { can } from '@edforge/abac'

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

interface ModuleOption {
  id: string
  name: string
  description: string
  icon: typeof School
  path: string
  iconBg: string
  iconColor: string
  /** Permission check - if specified, only show if user has this permission */
  permission?: {
    action: 'view'
    resource: string
  }
}

const MODULES: ModuleOption[] = [
  {
    id: 'home',
    name: 'Home',
    description: 'Dashboard and overview',
    icon: Layers,
    path: '/home',
    iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
  },
  {
    id: 'academics',
    name: 'Academics',
    description: 'Students, classes, curriculum',
    icon: School,
    path: '/academics',
    iconBg: 'bg-golden-400/20',
    iconColor: 'text-golden-600 dark:text-golden-400',
    permission: { action: 'view', resource: 'students' },
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Billing, payroll, expenses',
    icon: HandCoins,
    path: '/finance',
    iconBg: 'bg-aqua-400/20',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
    permission: { action: 'view', resource: 'billing' },
  },
  {
    id: 'people',
    name: 'People',
    description: 'Staff directory, departments',
    icon: UsersRound,
    path: '/people',
    iconBg: 'bg-vanilla-400/25 dark:bg-vanilla-400/20',
    iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    permission: { action: 'view', resource: 'staff' },
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Inbox, announcements, meetings',
    icon: MessageCircleMore,
    path: '/messages',
    iconBg: 'bg-caramel-400/20',
    iconColor: 'text-caramel-600 dark:text-caramel-400',
    permission: { action: 'view', resource: 'communications' },
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Reports and insights',
    icon: BarChart3,
    path: '/analytics',
    iconBg: 'bg-rust-400/15 dark:bg-rust-400/20',
    iconColor: 'text-rust-500 dark:text-rust-400',
    permission: { action: 'view', resource: 'analytics' },
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Account and preferences',
    icon: Settings,
    path: '/settings',
    iconBg: 'bg-[rgb(var(--surface-tertiary))]',
    iconColor: 'text-[rgb(var(--text-secondary))]',
  },
  {
    id: 'student-portal',
    name: 'Student Portal',
    description: 'Grades, schedule, assignments',
    icon: GraduationCap,
    path: '/student-portal',
    iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    permission: { action: 'view', resource: 'student-portal' },
  },
  {
    id: 'parent-portal',
    name: 'Family Portal',
    description: "Children's grades, fees",
    icon: Baby,
    path: '/parent-portal',
    iconBg: 'bg-golden-400/20',
    iconColor: 'text-golden-600 dark:text-golden-400',
    permission: { action: 'view', resource: 'parent-portal' },
  },
]

// ============================================================================
// MODULE SWITCHER COMPONENT
// ============================================================================

interface ModuleSwitcherProps {
  open: boolean
  onClose: () => void
}

export function ModuleSwitcher({ open, onClose }: ModuleSwitcherProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  // Determine current module from path
  const currentModuleId = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/academics')) return 'academics'
    if (path.startsWith('/finance')) return 'finance'
    if (path.startsWith('/people')) return 'people'
    if (path.startsWith('/messages')) return 'messages'
    if (path.startsWith('/analytics')) return 'analytics'
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/student-portal')) return 'student-portal'
    if (path.startsWith('/parent-portal')) return 'parent-portal'
    return 'home'
  }, [location.pathname])

  // Filter modules based on permissions
  const availableModules = useMemo(() => {
    return MODULES.filter((module) => {
      if (!module.permission) return true
      return can(user, {
        action: module.permission.action,
        resource: module.permission.resource as any,
        schoolId: activeSchoolId || undefined,
      })
    })
  }, [user, activeSchoolId])

  // Filter by search query
  const filteredModules = useMemo(() => {
    if (!query) return availableModules
    return availableModules.filter(
      (module) =>
        module.name.toLowerCase().includes(query.toLowerCase()) ||
        module.description.toLowerCase().includes(query.toLowerCase())
    )
  }, [availableModules, query])

  // React-spring animations
  const backdropSpring = useSpring({
    opacity: open ? 1 : 0,
    config: { tension: 280, friction: 60 },
  })

  const modalSpring = useSpring({
    opacity: open ? 1 : 0,
    transform: open
      ? 'scale(1) translateY(0px)'
      : 'scale(0.95) translateY(-20px)',
    config: config.gentle,
  })

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!open) {
      setQuery('')
    }
  }, [open])

  // Handle module selection
  const handleSelect = useCallback(
    (module: ModuleOption | null) => {
      if (module) {
        navigate({ to: module.path })
        onClose()
      }
    },
    [navigate, onClose]
  )

  if (!open) return null

  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={onClose}>
      {/* Backdrop */}
      <animated.div
        style={backdropSpring}
        className="fixed inset-0 bg-ink-500/70 dark:bg-ink-900/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
          <animated.div
            style={modalSpring}
            className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl shadow-ink-500/30 dark:shadow-black/50"
          >
            <Combobox onChange={handleSelect}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Switch Module
                  </h2>
                  <kbd className="px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-md">
                    ⌘J
                  </kbd>
                </div>
                <Combobox.Input
                  ref={inputRef}
                  className="w-full px-4 py-2.5 text-sm bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  placeholder="Search modules..."
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Module List */}
              <Combobox.Options static className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2">
                {filteredModules.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                      No modules found
                    </p>
                  </div>
                ) : (
                  filteredModules.map((module) => (
                    <ModuleOption
                      key={module.id}
                      module={module}
                      isCurrent={module.id === currentModuleId}
                    />
                  ))
                )}
              </Combobox.Options>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-tertiary))]">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded text-[10px] font-bold">
                      ↑↓
                    </kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded text-[10px] font-bold">
                      ↵
                    </kbd>
                    Go
                  </span>
                </div>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  ESC to close
                </span>
              </div>
            </Combobox>
          </animated.div>
        </div>
      </div>
    </Dialog>
  )
}

// ============================================================================
// MODULE OPTION COMPONENT
// ============================================================================

function ModuleOption({
  module,
  isCurrent,
}: {
  module: ModuleOption
  isCurrent: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const spring = useSpring({
    x: hovered ? 4 : 0,
    scale: hovered ? 1.01 : 1,
    config: config.gentle,
  })

  const Icon = module.icon

  return (
    <Combobox.Option value={module}>
      {({ active }) => (
        <animated.div
          style={{
            transform: spring.x.to(
              (x) => `translateX(${x}px) scale(${spring.scale.get()})`
            ),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors',
            active && 'bg-teal-500/10 dark:bg-cyan-500/15',
            isCurrent && !active && 'bg-[rgb(var(--surface-tertiary))]'
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
              active
                ? 'bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30'
                : module.iconBg
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                active ? 'text-white' : module.iconColor
              )}
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'text-sm font-medium truncate',
                  active
                    ? 'text-teal-700 dark:text-cyan-300'
                    : 'text-[rgb(var(--text-primary))]'
                )}
              >
                {module.name}
              </p>
              {isCurrent && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-teal-500/15 text-teal-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))] truncate mt-0.5">
              {module.description}
            </p>
          </div>

          {/* Indicators */}
          {isCurrent ? (
            <Check className="w-4 h-4 text-teal-500 dark:text-cyan-400 flex-shrink-0" />
          ) : (
            active && (
              <ArrowRight className="w-4 h-4 text-teal-500 dark:text-cyan-400 flex-shrink-0" />
            )
          )}
        </animated.div>
      )}
    </Combobox.Option>
  )
}

// ============================================================================
// HOOK TO MANAGE MODULE SWITCHER STATE
// ============================================================================

export function useModuleSwitcher() {
  const [open, setOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ⌘J / Ctrl+J to open module switcher
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    open,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
    close: () => setOpen(false),
  }
}

