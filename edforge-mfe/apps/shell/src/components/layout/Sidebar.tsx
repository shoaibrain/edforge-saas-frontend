/**
 * Dynamic Sidebar Component
 * 
 * A context-aware sidebar that changes navigation items based on the current route/module.
 * Features ABAC permission filtering and smooth animations.
 */

import { useState, useEffect, Fragment, useSyncExternalStore } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import {
  Home,
  ChevronsUpDown,
  ArrowLeft,
  Search,
  Check,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useSidebarStore } from '../../stores/sidebar.store'
import { useAuthStore, MOCK_SCHOOLS } from '../../stores/auth.store'
import { SIDEBAR_NAV_ICON_SIZE } from '../../config/ui-constants'
import { useSidebarModule, useActiveNavItem } from '../../hooks/useSidebarModule'
import { useSecureNavGroups } from '../../hooks/useSecureNavItems'
import type { NavItem, NavItemGroup } from '../../config/sidebar-modules'
import { Tooltip } from '@edforge/ui'
import { SidebarEdgeTrigger } from './SidebarEdgeTrigger'
import { getSchoolAvatar } from '../../lib/avatar'
import { cn } from '../../lib/utils'

// ============================================================================
// ANIMATED NAV ICON WITH FRAMER MOTION
// ============================================================================

function AnimatedNavIcon({
  icon: Icon,
  isActive,
  isHovered,
  isDanger,
}: {
  icon: LucideIcon
  isActive: boolean
  isHovered: boolean
  isDanger?: boolean
}) {
  return (
    <motion.div
      animate={{
        scale: isHovered && !isActive ? 1.15 : 1,
        rotate: isHovered && !isActive ? 6 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="relative flex items-center justify-center flex-shrink-0"
    >
      <Icon
        size={SIDEBAR_NAV_ICON_SIZE}
        className={cn(
          'transition-colors duration-200 relative z-10',
          isActive && !isDanger && 'text-teal-700 dark:text-white',
          isActive && isDanger && 'text-rust-500',
          !isActive && 'text-[rgb(var(--icon-inactive))] hover:text-[rgb(var(--icon-inactive-hover))]'
        )}
      />
      {/* Glow effect */}
      <motion.div
        animate={{
          opacity: isHovered && !isActive ? 0.8 : 0,
          scale: isHovered && !isActive ? 1.4 : 0.8,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={cn(
          'absolute inset-0 rounded-full blur-md',
          isDanger ? 'bg-rust-500/25' : 'bg-teal-500/25 dark:bg-cyan-500/25'
        )}
      />
    </motion.div>
  )
}

// ============================================================================
// NAV ITEM LINK
// ============================================================================

function NavItemLink({
  item,
  collapsed,
  isActive,
  index,
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isDanger = item.variant === 'danger'

  const linkContent = (
    <Link
      to={item.href || '#'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block relative"
    >
      <motion.div
        animate={{
          backgroundColor: isHovered && !isActive
            ? 'rgba(100, 116, 139, 0.06)'
            : 'rgba(0, 0, 0, 0)',
        }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative flex items-center rounded-xl transition-colors duration-200',
          collapsed ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5'
        )}
      >
        {/* Active background pill */}
        {isActive && (
          <motion.div
            layoutId="activeNavBg"
            className={cn(
              'absolute inset-0 rounded-xl',
              isDanger
                ? 'bg-rust-500/10'
                : 'bg-[rgb(var(--interactive-active))]'
            )}
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}

        {/* Active indicator line */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full',
              isDanger ? 'bg-rust-500' : 'bg-gradient-to-b from-teal-500 to-cyan-500'
            )}
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}

        {/* Icon */}
        <AnimatedNavIcon
          icon={item.icon}
          isActive={isActive}
          isHovered={isHovered}
          isDanger={isDanger}
        />

        {/* Label - animated visibility */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm font-medium whitespace-nowrap overflow-hidden relative z-10',
                isActive && !isDanger && 'text-teal-700 dark:text-white',
                isActive && isDanger && 'text-rust-600 dark:text-rust-400',
                !isActive && !isDanger && 'text-[rgb(var(--text-secondary))]',
                !isActive && isDanger && 'text-rust-500/80'
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        <AnimatePresence>
          {item.badge && !collapsed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-golden-400/20 text-golden-600 dark:text-golden-400 relative z-10"
            >
              {item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right" sideOffset={12}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
        >
          {linkContent}
        </motion.div>
      </Tooltip>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
    >
      {linkContent}
    </motion.div>
  )
}

// ============================================================================
// NAV GROUP
// ============================================================================

function NavGroup({
  group,
  collapsed,
  activeItemId,
  startIndex,
}: {
  group: NavItemGroup
  collapsed: boolean
  activeItemId: string | null
  startIndex: number
}) {
  return (
    <div className="space-y-0.5">
      {/* Group header */}
      {group.label && !collapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]"
        >
          {group.label}
        </motion.p>
      )}

      {/* Group items */}
      {group.items.map((item, idx) => (
        <NavItemLink
          key={item.id}
          item={item}
          collapsed={collapsed}
          isActive={activeItemId === item.id}
          index={startIndex + idx}
        />
      ))}
    </div>
  )
}

// ============================================================================
// UNIFIED HOME NAV BUTTON
// Uses the same animation pattern as NavItemLink for consistency
// ============================================================================

/**
 * Custom hook for pathname with guaranteed reactivity in Sidebar context.
 */
function useSidebarPathname(): string {
  const router = useRouter()
  return useSyncExternalStore(
    (callback) => router.subscribe('onResolved', callback),
    () => router.state.location.pathname,
    () => router.state.location.pathname
  )
}

function HomeNavButton({
  collapsed,
  isSubModule
}: {
  collapsed: boolean
  isSubModule: boolean
}) {
  const pathname = useSidebarPathname()
  const [isHovered, setIsHovered] = useState(false)

  // Determine state based on context
  const isAtHome = pathname === '/home' || pathname === '/'
  const isActive = !isSubModule && isAtHome
  const showBackMode = isSubModule

  // Dynamic icon and label
  const CurrentIcon = showBackMode ? ArrowLeft : Home
  const label = showBackMode ? 'Back to Home' : 'Home'

  const linkContent = (
    <Link
      to="/home"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block relative"
    >
      <motion.div
        animate={{
          backgroundColor: isHovered && !isActive
            ? 'rgba(100, 116, 139, 0.06)'
            : 'rgba(0, 0, 0, 0)',
        }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative flex items-center rounded-xl transition-colors duration-200',
          collapsed ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5'
        )}
      >
        {/* Active background pill - same as NavItemLink */}
        {isActive && (
          <motion.div
            layoutId="activeNavBg"
            className="absolute inset-0 rounded-xl bg-[rgb(var(--interactive-active))]"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}

        {/* Active indicator line - same as NavItemLink */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-teal-500 to-cyan-500"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}

        {/* Icon - using AnimatedNavIcon for consistency */}
        <AnimatedNavIcon
          icon={CurrentIcon}
          isActive={isActive}
          isHovered={isHovered}
        />

        {/* Label - same animation as NavItemLink */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm font-medium whitespace-nowrap overflow-hidden relative z-10',
                isActive && 'text-teal-700 dark:text-white',
                !isActive && 'text-[rgb(var(--text-secondary))]'
              )}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" sideOffset={12}>
        {linkContent}
      </Tooltip>
    )
  }

  return linkContent
}

// ============================================================================
// SIDEBAR SCHOOL SELECTOR
// A context-aware school selector with unified structure for smooth animations
// The avatar stays in a fixed position while text content animates away
// ============================================================================

function SidebarSchoolSelector({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setActiveSchoolId = useAppStore((s) => s.setActiveSchoolId)
  const [query, setQuery] = useState('')

  if (!user) return null

  const userSchools = Object.keys(user.assignments)
  const activeSchool = activeSchoolId ? MOCK_SCHOOLS[activeSchoolId] : null

  const filteredSchools = query === ''
    ? userSchools
    : userSchools.filter((schoolId) =>
      MOCK_SCHOOLS[schoolId]?.name.toLowerCase().includes(query.toLowerCase())
    )

  // Dropdown content (shared between collapsed and expanded)
  const dropdownContent = (
    <>
      {/* Search */}
      <div className="p-3 border-b border-[rgb(var(--border-secondary))]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Find School..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Schools Label */}
      <div className="px-4 py-2.5">
        <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Your Schools</span>
      </div>

      {/* Schools List */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin px-2 pb-2">
        {filteredSchools.map((schoolId) => {
          const school = MOCK_SCHOOLS[schoolId]
          const isSelected = schoolId === activeSchoolId
          return (
            <MenuItem key={schoolId}>
              {({ active }) => (
                <button
                  onClick={() => {
                    setActiveSchoolId(schoolId)
                    setQuery('')
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150',
                    active && 'bg-[rgb(var(--interactive-hover))]',
                    isSelected && 'bg-teal-500/10 dark:bg-cyan-500/15'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg overflow-hidden flex-shrink-0',
                    isSelected ? 'ring-2 ring-teal-500' : 'ring-1 ring-[rgb(var(--border-primary))]'
                  )}>
                    <img
                      src={getSchoolAvatar(school?.name || schoolId, { size: 40 })}
                      alt={school?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-teal-700 dark:text-cyan-300' : 'text-[rgb(var(--text-primary))]'
                    )}>
                      {school?.name}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{user.assignments[schoolId]}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 dark:bg-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )}
            </MenuItem>
          )
        })}
      </div>

      {/* Create School */}
      {user.globalRole === 'TenantAdmin' && (
        <div className="border-t border-[rgb(var(--border-secondary))] p-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-teal-600 dark:text-cyan-400 hover:bg-teal-500/10 rounded-xl transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Create New School
          </button>
        </div>
      )}
    </>
  )

  // Unified structure for both collapsed and expanded states
  // Avatar stays fixed, text animates with CSS transitions
  return (
    <Menu as="div" className="relative w-full">
      {collapsed ? (
        // Collapsed: Tooltip wraps the button, dropdown floats to the right
        <Tooltip content={activeSchool?.name || 'Select School'} side="right" sideOffset={12}>
          <MenuButton className="flex items-center justify-center w-full h-12 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200 group">
            {/* Avatar - fixed size, always visible */}
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[rgb(var(--border-primary))] group-hover:border-teal-500/50 dark:group-hover:border-cyan-500/50 transition-colors flex-shrink-0">
              <img
                src={getSchoolAvatar(activeSchool?.name || 'school', { size: 40 })}
                alt={activeSchool?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </MenuButton>
        </Tooltip>
      ) : (
        // Expanded: Full button with text
        <MenuButton className="flex items-center gap-3 w-full h-12 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200 group px-2">
          {/* Avatar - fixed size, always visible */}
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[rgb(var(--border-primary))] group-hover:border-teal-500/50 dark:group-hover:border-cyan-500/50 transition-colors flex-shrink-0">
            <img
              src={getSchoolAvatar(activeSchool?.name || 'school', { size: 40 })}
              alt={activeSchool?.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate leading-tight">
              {activeSchool?.name || 'Select School'}
            </p>
            <p className="text-[11px] text-[rgb(var(--text-tertiary))] truncate leading-tight">
              {activeSchoolId ? user.assignments[activeSchoolId] : 'Choose school'}
            </p>
          </div>

          {/* Chevron */}
          <ChevronsUpDown className="w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-secondary))] transition-colors flex-shrink-0 mr-1" />
        </MenuButton>
      )}

      {/* Dropdown - Apple-like glassmorphism with backdrop blur */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems
          className={cn(
            'w-80 rounded-2xl z-50 overflow-hidden',
            // Glassmorphism - frosted glass effect
            'bg-[rgb(var(--surface-secondary))]/85 backdrop-blur-xl',
            'border border-white/10 dark:border-white/5',
            'shadow-xl shadow-black/10 dark:shadow-black/40',
            // Ring for subtle depth
            'ring-1 ring-inset ring-white/5',
            collapsed
              ? 'absolute left-full top-0 ml-3 origin-left'
              : 'absolute left-0 top-full mt-2 origin-top'
          )}
        >
          {dropdownContent}
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setModule = useSidebarStore((s) => s.setModule)

  // Get current module based on route
  const { moduleId, config, isSubModule } = useSidebarModule()
  const activeItemId = useActiveNavItem()

  // Filter groups based on permissions
  const filteredGroups = useSecureNavGroups(config.groups)

  // Update sidebar store when module changes
  useEffect(() => {
    setModule(moduleId)
  }, [moduleId, setModule])

  // Calculate cumulative index for stagger animation
  let itemIndex = 0

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[rgb(var(--surface-secondary))] border-r border-[rgb(var(--border-primary))]"
      aria-label="Main navigation"
    >
      {/* Header - School Selector */}
      <div className="flex items-center h-16 px-2 border-b border-[rgb(var(--border-primary))]">
        <SidebarSchoolSelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2" aria-label="Sidebar navigation">
        <AnimatePresence mode="wait">
          <motion.div
            key={moduleId}
            initial={{ opacity: 0, x: isSubModule ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSubModule ? -20 : 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-1"
          >
            {/* Unified Home/Back button - Always visible, adapts to context */}
            <div className="mb-3 pb-2 border-b border-[rgb(var(--border-secondary))]">
              <HomeNavButton collapsed={collapsed} isSubModule={isSubModule} />
            </div>

            {/* Module navigation groups */}
            {filteredGroups.map((group) => {
              const groupStartIndex = itemIndex
              itemIndex += group.items.length

              return (
                <NavGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  activeItemId={activeItemId}
                  startIndex={groupStartIndex}
                />
              )
            })}
          </motion.div>
        </AnimatePresence>
      </nav>

      {/* Edge-based sidebar toggle - appears on hover at the right border */}
      <SidebarEdgeTrigger collapsed={collapsed} onToggle={toggleSidebar} />
    </motion.aside>
  )
}
