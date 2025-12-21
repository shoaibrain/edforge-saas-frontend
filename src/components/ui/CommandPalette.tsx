import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, Combobox } from '@headlessui/react'
import { useNavigate } from '@tanstack/react-router'
import { useSpring, animated, config } from '@react-spring/web'
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  DollarSign,
  Users,
  Settings,
  User,
  FileText,
  Calendar,
  Plus,
  ArrowRight,
  Command,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  name: string
  description?: string
  icon: typeof Search
  category: 'navigation' | 'actions' | 'people' | 'recent'
  action: () => void
  shortcut?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

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

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      name: 'Go to Dashboard',
      description: 'View your dashboard overview',
      icon: LayoutDashboard,
      category: 'navigation',
      action: () => { navigate({ to: '/' }); onClose() },
      shortcut: 'G D',
    },
    {
      id: 'nav-academics',
      name: 'Go to Academics',
      description: 'Manage students and classes',
      icon: GraduationCap,
      category: 'navigation',
      action: () => { navigate({ to: '/academics' }); onClose() },
      shortcut: 'G A',
    },
    {
      id: 'nav-finance',
      name: 'Go to Finance',
      description: 'View financial reports and billing',
      icon: DollarSign,
      category: 'navigation',
      action: () => { navigate({ to: '/finance' }); onClose() },
      shortcut: 'G F',
    },
    {
      id: 'nav-people',
      name: 'Go to People',
      description: 'Manage all people in the organization',
      icon: Users,
      category: 'navigation',
      action: () => { navigate({ to: '/people' }); onClose() },
      shortcut: 'G P',
    },
    {
      id: 'nav-settings',
      name: 'Go to Settings',
      description: 'Configure your preferences',
      icon: Settings,
      category: 'navigation',
      action: () => { navigate({ to: '/settings', search: { tab: 'account' } }); onClose() },
      shortcut: 'G ,',
    },
    // Actions
    {
      id: 'action-add-student',
      name: 'Add New Student',
      description: 'Enroll a new student',
      icon: Plus,
      category: 'actions',
      action: () => { onClose() },
    },
    {
      id: 'action-add-staff',
      name: 'Add New Staff',
      description: 'Add a staff member',
      icon: Plus,
      category: 'actions',
      action: () => { onClose() },
    },
    {
      id: 'action-attendance',
      name: 'Record Attendance',
      description: 'Mark attendance for today',
      icon: Calendar,
      category: 'actions',
      action: () => { onClose() },
    },
    {
      id: 'action-report',
      name: 'Generate Report',
      description: 'Create a new report',
      icon: FileText,
      category: 'actions',
      action: () => { onClose() },
    },
    // People
    {
      id: 'person-1',
      name: 'Emma Thompson',
      description: 'Student • Grade 10',
      icon: User,
      category: 'people',
      action: () => { onClose() },
    },
    {
      id: 'person-2',
      name: 'Dr. Amanda Foster',
      description: 'Staff • Principal',
      icon: User,
      category: 'people',
      action: () => { onClose() },
    },
    {
      id: 'person-3',
      name: 'Robert Martinez',
      description: 'Staff • Teacher',
      icon: User,
      category: 'people',
      action: () => { onClose() },
    },
  ]

  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description?.toLowerCase().includes(query.toLowerCase())
      )

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    people: 'People',
    recent: 'Recent',
  }

  const categoryIcons: Record<string, typeof Search> = {
    navigation: Hash,
    actions: Plus,
    people: Users,
    recent: Calendar,
  }

  if (!open) return null

  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={onClose}>
      {/* Backdrop - Apple-like smoky blur */}
      <animated.div
        style={backdropSpring}
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Container - click outside the Panel closes the dialog */}
      <div 
        className="fixed inset-0 overflow-y-auto"
        onClick={onClose}
      >
        <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
          <Dialog.Panel
            as={animated.div}
            style={modalSpring}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className={cn(
              'w-full max-w-2xl transform overflow-hidden rounded-2xl',
              // Glassmorphism - Apple-like frosted glass
              'bg-[rgb(var(--surface-secondary))]/90 backdrop-blur-2xl',
              'border border-white/10 dark:border-white/5',
              'shadow-2xl shadow-black/20 dark:shadow-black/50',
              // Subtle inner ring for depth
              'ring-1 ring-inset ring-white/5'
            )}
          >
            <Combobox
              onChange={(command: CommandItem | null) => {
                if (command) {
                  command.action()
                }
              }}
            >
              {/* Search Input */}
              <div className="relative border-b border-[rgb(var(--border-primary))]">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/15 dark:bg-cyan-500/20">
                    <Command className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  </div>
                </div>
                <Combobox.Input
                  ref={inputRef}
                  className="w-full h-16 pl-16 pr-24 text-base bg-transparent text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none"
                  placeholder="Type a command or search..."
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="px-2.5 py-1.5 text-xs font-semibold text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <Combobox.Options static className="max-h-[55vh] overflow-y-auto scrollbar-thin">
                {filteredCommands.length === 0 && query !== '' ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                      <Search className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
                    </div>
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                      No results for "<span className="text-teal-600 dark:text-cyan-400">{query}</span>"
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="p-3">
                    {Object.entries(groupedCommands).map(([category, items]) => {
                      const CategoryIcon = categoryIcons[category]
                      return (
                        <div key={category} className="mb-5 last:mb-0">
                          <div className="px-3 py-2 flex items-center gap-2">
                            <CategoryIcon className="w-3.5 h-3.5 text-teal-500 dark:text-cyan-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                              {categoryLabels[category]}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {items.map((command) => (
                              <CommandOption key={command.id} command={command} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Combobox.Options>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center gap-5 text-xs text-[rgb(var(--text-tertiary))]">
                  <span className="flex items-center gap-2">
                    <kbd className="px-1.5 py-1 bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded text-[10px] font-bold">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <kbd className="px-1.5 py-1 bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded text-[10px] font-bold">↵</kbd>
                    <span>Select</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">Powered by</span>
                  <span className="text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Edforge</span>
                </div>
              </div>
            </Combobox>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}

// ============================================================================
// COMMAND OPTION WITH SPRING ANIMATION
// ============================================================================

function CommandOption({ command }: { command: CommandItem }) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    x: hovered ? 4 : 0,
    scale: hovered ? 1.01 : 1,
    config: config.gentle,
  })

  return (
    <Combobox.Option value={command}>
      {({ active }) => (
        <animated.div
          style={{
            transform: spring.x.to(x => `translateX(${x}px) scale(${spring.scale.get()})`),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
            active ? 'bg-teal-500/10 dark:bg-cyan-500/15' : ''
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            active 
              ? 'bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30' 
              : 'bg-[rgb(var(--surface-tertiary))]'
          }`}>
            <command.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[rgb(var(--text-secondary))]'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${
              active ? 'text-teal-700 dark:text-cyan-300' : 'text-[rgb(var(--text-primary))]'
            }`}>
              {command.name}
            </p>
            {command.description && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] truncate mt-0.5">
                {command.description}
              </p>
            )}
          </div>
          {command.shortcut && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {command.shortcut.split(' ').map((key, i) => (
                <kbd
                  key={i}
                  className={`px-2 py-1 text-[10px] font-bold border rounded-md transition-colors ${
                    active 
                      ? 'bg-teal-500/20 border-teal-500/30 text-teal-600 dark:text-cyan-300'
                      : 'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))]'
                  }`}
                >
                  {key}
                </kbd>
              ))}
            </div>
          )}
          {active && (
            <ArrowRight className="w-4 h-4 text-teal-500 dark:text-cyan-400 flex-shrink-0" />
          )}
        </animated.div>
      )}
    </Combobox.Option>
  )
}

// ============================================================================
// HOOK TO MANAGE COMMAND PALETTE STATE
// ============================================================================

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
