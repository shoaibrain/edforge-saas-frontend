import { useState, Fragment, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useSpring, animated } from '@react-spring/web'
import {
  Search,
  Bell,
  Plus,
  User,
  Settings,
  FileText,
  Moon,
  Sun,
  Monitor,
  LogOut,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { useThemeStore, type Theme } from '../../stores/theme.store'
import { useQuickAddPersonModal, useInviteTeamModal, useAddClassroomModal, useAddGradeLevelModal } from '../../stores/modal.store'
import { Avatar } from '@edforge/ui'
import { CommandPalette, useCommandPalette } from '../ui/CommandPalette'
import { ModuleSwitcher, useModuleSwitcher } from '../ui/ModuleSwitcher'
import { Breadcrumbs } from './Breadcrumbs'
import {
  ADD_NEW_OPTIONS,
  getOptionsGroupedByCategory,
  getContextAwareOptions,
  type AddNewOption,
} from '../../config/add-new-options'
import { can, type Action, type Resource } from '@edforge/abac'
import { cn } from '../../lib/utils'

// ============================================================================
// GLOBAL SEARCH BUTTON
// ============================================================================

function GlobalSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] border border-[rgb(var(--border-primary))] rounded-xl transition-all duration-200 hover:border-teal-500/50"
    >
      <Search className="w-4 h-4" />
      <span className="hidden md:inline">Search...</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-md text-[rgb(var(--text-tertiary))]">
        ⌘K
      </kbd>
    </button>
  )
}

// ============================================================================
// ADD NEW DROPDOWN - ENHANCED WITH CONTEXT AWARENESS
// ============================================================================

function AddNewOptionItem({
  option,
  isHighlighted,
  onSelect
}: {
  option: AddNewOption
  isHighlighted?: boolean
  onSelect: (option: AddNewOption) => void
}) {
  const [hovered, setHovered] = useState(false)

  const springProps = useSpring({
    x: hovered ? 4 : 0,
    scale: hovered ? 1.02 : 1,
    config: { tension: 400, friction: 25 },
  })

  const Icon = option.icon

  return (
    <MenuItem>
      {({ active }) => (
        <animated.button
          style={{
            transform: springProps.x.to(x => `translateX(${x}px) scale(${springProps.scale.get()})`),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onSelect(option)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
            active && 'bg-[rgb(var(--interactive-hover))]',
            isHighlighted && 'bg-teal-500/5 dark:bg-cyan-500/5'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', option.iconBg)}>
            <Icon className={cn('w-4.5 h-4.5', option.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{option.label}</p>
              {isHighlighted && (
                <Sparkles className="w-3 h-3 text-golden-500" />
              )}
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{option.description}</p>
          </div>
          {option.shortcut && (
            <kbd className="hidden lg:flex items-center px-2 py-1 text-[10px] font-semibold bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-md text-[rgb(var(--text-tertiary))]">
              {option.shortcut}
            </kbd>
          )}
        </animated.button>
      )}
    </MenuItem>
  )
}

function AddNewDropdown() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  // Modal hooks
  const quickAddModal = useQuickAddPersonModal()
  const inviteModal = useInviteTeamModal()
  const classroomModal = useAddClassroomModal()
  const gradeLevelModal = useAddGradeLevelModal()

  // Check permission helper
  const hasPermission = useCallback((action: Action, resource: Resource) => {
    return can(user, { action, resource, schoolId: activeSchoolId || undefined })
  }, [user, activeSchoolId])

  // Filter options based on permissions and active school
  const filteredOptions = useMemo(() => {
    return ADD_NEW_OPTIONS.filter((option) => {
      // Check permission
      if (option.permission) {
        if (!hasPermission(option.permission.action, option.permission.resource)) {
          return false
        }
      }
      // Check if requires active school
      if (option.requiresActiveSchool && !activeSchoolId) {
        return false
      }
      return true
    })
  }, [hasPermission, activeSchoolId])

  // Get context-aware options
  const { highlighted, other } = useMemo(() => {
    return getContextAwareOptions(filteredOptions, location.pathname)
  }, [filteredOptions, location.pathname])

  // Group remaining options by category
  const groupedOptions = useMemo(() => {
    return getOptionsGroupedByCategory(other)
  }, [other])

  // Handle option selection
  const handleSelect = (option: AddNewOption) => {
    switch (option.actionType) {
      case 'quick-add-person':
        quickAddModal.open({
          personType: option.actionData?.personType as any,
        })
        break
      case 'invite':
        inviteModal.open()
        break
      case 'modal':
        if (option.id === 'new-classroom') {
          classroomModal.open()
        } else if (option.id === 'new-grade-level') {
          gradeLevelModal.open()
        }
        // TODO: Handle other modal types
        break
      case 'wizard':
        navigate({
          to: '/people/new',
          search: {
            type: option.actionData?.personType as 'student' | 'teacher' | 'staff' | 'guardian'
          }
        })
        break
    }
  }

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-xl',
            'bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-secondary))]',
            'border border-[rgb(var(--border-primary))]',
            'hover:bg-[rgb(var(--surface-tertiary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-secondary))]',
            'shadow-sm hover:shadow-md',
            open && 'ring-2 ring-[rgb(var(--interactive-focus))] ring-offset-1 bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-primary))]'
          )}>
            <Plus className={cn('w-4 h-4 transition-transform duration-200 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-secondary))]', open && 'rotate-45')} />
            <span className="hidden sm:inline">Add New</span>
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <MenuItems className="absolute right-0 mt-2 w-[550px] origin-top-right rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl shadow-ink-500/15 dark:shadow-black/30 z-50 overflow-hidden outline-none">

              {/* Highlighted/Suggested (Full Width) */}
              {highlighted.length > 0 && (
                <div className="bg-[rgb(var(--surface-tertiary))] border-b border-[rgb(var(--border-secondary))] p-2">
                  <div className="px-3 py-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-golden-500" />
                    <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                      Suggested for this page
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {highlighted.map((option) => (
                      <AddNewOptionItem
                        key={option.id}
                        option={option}
                        isHighlighted
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Main Grid Content */}
              {filteredOptions.length > 0 ? (
                <div className="grid grid-cols-2 divide-x divide-[rgb(var(--border-secondary))]">

                  {/* Left Column: People */}
                  <div className="p-2">
                    <div className="px-4 py-2 mb-1">
                      <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                        People
                      </span>
                    </div>
                    <div className="space-y-1">
                      {(groupedOptions.get('people') || []).map((option) => (
                        <AddNewOptionItem
                          key={option.id}
                          option={option}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Academic & Administrative */}
                  <div className="p-2 bg-[rgb(var(--surface-primary))]/50">
                    <div className="space-y-4">
                      {/* Academic */}
                      <div>
                        <div className="px-4 py-2 mb-1">
                          <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                            Academic
                          </span>
                        </div>
                        <div className="space-y-1">
                          {(groupedOptions.get('academic') || []).map((option) => (
                            <AddNewOptionItem
                              key={option.id}
                              option={option}
                              onSelect={handleSelect}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Administrative */}
                      {(groupedOptions.get('administrative') || []).length > 0 && (
                        <div>
                          <div className="px-4 py-2 mb-1 border-t border-[rgb(var(--border-secondary))] pt-4">
                            <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                              Administrative
                            </span>
                          </div>
                          <div className="space-y-1">
                            {(groupedOptions.get('administrative') || []).map((option) => (
                              <AddNewOptionItem
                                key={option.id}
                                option={option}
                                onSelect={handleSelect}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                /* Empty State */
                <div className="px-4 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--surface-tertiary))] flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
                  </div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {activeSchoolId
                      ? 'No actions available for your role'
                      : 'Select a school to add items'
                    }
                  </p>
                </div>
              )}
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  )
}

// ============================================================================
// USER MENU WITH THEME PICKER
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()

  if (!user) return null

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center rounded-full ring-2 ring-[rgb(var(--border-primary))] ring-offset-2 ring-offset-[rgb(var(--surface-secondary))] hover:ring-teal-500/50 transition-all duration-200">
        <Avatar
          name={user.name}
          size="sm"
          shape="circle"
        />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-95 translate-y-1"
      >
        <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" shape="rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[rgb(var(--text-primary))] truncate">{user.name}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/15 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                  {user.globalRole}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Picker */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">Theme</span>
              <div className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]">
                {themes.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setTheme(value)
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${theme === value
                      ? 'bg-teal-500 dark:bg-cyan-500 text-white shadow-sm'
                      : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))]'
                      }`}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <User className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">My Profile</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">View and edit profile</p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Settings</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">Manage preferences</p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Help & Support</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">Get help with Edforge</p>
                  </div>
                </button>
              )}
            </MenuItem>
          </div>

          <div className="border-t border-[rgb(var(--border-secondary))] py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rust-100 dark:bg-rust-900/30 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-rust-500" />
                  </div>
                  <span className="text-sm font-medium text-rust-600 dark:text-rust-400">Sign out</span>
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================

export function Header() {
  const commandPalette = useCommandPalette()
  const moduleSwitcher = useModuleSwitcher()

  return (
    <>
      <header 
        className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
        aria-label="Global header"
      >
        {/* Left Section - Breadcrumbs only (sidebar toggle is now edge-based) */}
        <div className="flex items-center min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        {/* Right Section - All header actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <GlobalSearchButton onClick={commandPalette.toggle} />

          {/* Documentation */}
          <button 
            className="p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200"
            aria-label="Documentation"
          >
            <FileText className="w-5 h-5" />
          </button>

          <AddNewDropdown />

          {/* Notifications */}
          <button 
            className="relative p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rust-500 rounded-full ring-2 ring-[rgb(var(--surface-secondary))]" />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette open={commandPalette.open} onClose={commandPalette.close} />
      
      {/* Module Switcher Modal (⌘J) */}
      <ModuleSwitcher open={moduleSwitcher.open} onClose={moduleSwitcher.close} />
    </>
  )
}
