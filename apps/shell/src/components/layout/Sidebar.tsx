/**
 * Dynamic Sidebar Component — Shell V2
 *
 * Gmail-inspired seamless sidebar with pill nav items and module-specific accent colors.
 * Features ABAC permission filtering and smooth CSS transitions.
 */

import { useState, useEffect, useSyncExternalStore } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useSidebarStore } from '../../stores/sidebar.store'
import { SIDEBAR_NAV_ICON_SIZE, SIDEBAR_NAV_ICON_SIZE_COLLAPSED } from '../../config/ui-constants'
import { useSidebarModule, useActiveNavItem } from '../../hooks/useSidebarModule'
import { useSecureNavGroups } from '../../hooks/useSecureNavItems'
import type { NavItem, NavItemGroup, SidebarModule } from '../../config/sidebar-modules'
import { Tooltip } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { cn } from '../../lib/utils'

// ============================================================================
// MODULE ACCENT COLOR MAPPING
// ============================================================================

type AccentKey = 'teal' | 'amber' | 'coral' | 'blue'

const MODULE_ACCENT_MAP: Record<string, AccentKey> = {
  home: 'teal',
  'home-student': 'teal',
  'home-parent': 'teal',
  academics: 'teal',
  'student-portal': 'teal',
  'parent-portal': 'teal',
  finance: 'amber',
  people: 'coral',
  settings: 'blue',
}

function getAccentKey(moduleId: SidebarModule): AccentKey {
  return MODULE_ACCENT_MAP[moduleId] || 'teal'
}

// ============================================================================
// ANIMATED NAV ICON
// ============================================================================

function AnimatedNavIcon({
  icon: IconEl,
  isActive,
  isHovered,
  isDanger,
  accentKey,
  collapsed,
}: {
  icon: LucideIcon
  isActive: boolean
  isHovered: boolean
  isDanger?: boolean
  accentKey: AccentKey
  collapsed: boolean
}) {
  const iconSize = collapsed ? SIDEBAR_NAV_ICON_SIZE_COLLAPSED : SIDEBAR_NAV_ICON_SIZE

  const iconColor = isActive && !isDanger
    ? `var(--shell-pill-${accentKey}-icon)`
    : isActive && isDanger
      ? undefined
      : 'var(--shell-icon-color)'

  // In collapsed state, the icon container handles active/hover backgrounds
  const containerBg = collapsed && isActive && !isDanger
    ? `var(--shell-pill-${accentKey}-bg)`
    : collapsed && isActive && isDanger
      ? 'rgba(226,75,74,0.10)'
      : collapsed && isHovered && !isActive
        ? 'var(--shell-ni-hover)'
        : 'transparent'

  return (
    <motion.div
      animate={{
        scale: isHovered && !isActive ? 1.08 : 1,
        rotate: isHovered && !isActive ? 3 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'relative flex items-center justify-center flex-shrink-0 transition-colors duration-150',
        collapsed ? 'w-12 h-12 rounded-xl' : 'w-9 h-9 rounded-[10px]',
      )}
      style={{ background: containerBg }}
    >
      <IconEl
        size={iconSize}
        className={cn(
          'transition-colors duration-200 relative z-10',
          isActive && isDanger && 'text-rust-500',
        )}
        style={iconColor ? { color: iconColor } : undefined}
        strokeWidth={1.75}
      />
    </motion.div>
  )
}

// ============================================================================
// NAV ITEM LINK — Pill Pattern
// ============================================================================

function NavItemLink({
  item,
  collapsed,
  isActive,
  index,
  accentKey,
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  index: number
  accentKey: AccentKey
}) {
  const { t: tNav } = useTranslation('nav')
  const [isHovered, setIsHovered] = useState(false)
  const isDanger = item.variant === 'danger'
  const translatedLabel = tNav(`sidebar.${item.id}`, { defaultValue: item.label })

  const pillBgVar = `var(--shell-pill-${accentKey}-bg)`
  const pillTextVar = `var(--shell-pill-${accentKey}-text)`

  const linkContent = (
    <Link
      to={item.href || '#'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block relative"
    >
      <div
        className={cn(
          'relative flex items-center rounded-3xl',
          'mx-2 my-px',
          collapsed ? 'justify-center h-14' : 'gap-3 h-11 pl-[7px] pr-[14px]',
        )}
      >
        {/* Sliding pill — EXPANDED ONLY (collapsed active handled by icon container) */}
        {isActive && !isDanger && !collapsed && (
          <motion.div
            layoutId="sidebar-nav-pill"
            className="absolute inset-0 rounded-3xl"
            style={{ background: pillBgVar }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        {/* Danger active bg — expanded only */}
        {isActive && isDanger && !collapsed && (
          <div className="absolute inset-0 rounded-3xl" style={{ background: 'rgba(226,75,74,0.10)' }} />
        )}
        {/* Hover bg — expanded only (collapsed hover handled by icon container) */}
        {!isActive && isHovered && !collapsed && (
          <div className="absolute inset-0 rounded-3xl transition-colors duration-150" style={{ background: 'var(--shell-ni-hover)' }} />
        )}

        {/* Icon with container */}
        <AnimatedNavIcon
          icon={item.icon}
          isActive={isActive}
          isHovered={isHovered}
          isDanger={isDanger}
          accentKey={accentKey}
          collapsed={collapsed}
        />

        {/* Label — animated visibility on collapse */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm whitespace-nowrap overflow-hidden relative z-10',
                isActive && isDanger && 'text-rust-600 dark:text-rust-400 font-semibold',
                !isActive && !isDanger && 'font-normal',
                !isActive && isDanger && 'text-rust-500/80 font-normal',
              )}
              style={{
                color: isActive && !isDanger
                  ? pillTextVar
                  : !isActive && !isDanger
                    ? 'var(--shell-text-2)'
                    : undefined,
                fontWeight: isActive && !isDanger ? 600 : undefined,
              }}
            >
              {translatedLabel}
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
              className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-golden-400/20 text-golden-600 dark:text-golden-400 relative z-10"
            >
              {item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={translatedLabel} side="right" sideOffset={12}>
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
  accentKey,
}: {
  group: NavItemGroup
  collapsed: boolean
  activeItemId: string | null
  startIndex: number
  accentKey: AccentKey
}) {
  const { t: tNav } = useTranslation('nav')

  return (
    <div className="space-y-0.5">
      {/* Group header */}
      {group.label && !collapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pt-4 pb-1.5"
          style={{
            fontSize: '10.5px',
            fontWeight: 500,
            color: 'var(--shell-sec-lbl)',
          }}
        >
          {tNav(`group.${group.id}`, { defaultValue: group.label })}
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
          accentKey={accentKey}
        />
      ))}
    </div>
  )
}

// ============================================================================
// HOME NAV BUTTON — Pill pattern, same as NavItemLink
// ============================================================================

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
  isSubModule,
  accentKey,
}: {
  collapsed: boolean
  isSubModule: boolean
  accentKey: AccentKey
}) {
  const { t: tNav } = useTranslation('nav')
  const pathname = useSidebarPathname()
  const [isHovered, setIsHovered] = useState(false)

  const isAtHome = pathname === '/home' || pathname === '/'
  const isActive = !isSubModule && isAtHome
  const showBackMode = isSubModule

  const CurrentIcon = showBackMode ? ArrowLeft : Home
  const label = tNav('home')

  const pillBgVar = `var(--shell-pill-${accentKey}-bg)`
  const pillTextVar = `var(--shell-pill-${accentKey}-text)`

  const linkContent = (
    <Link
      to="/home"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block relative"
    >
      <div
        className={cn(
          'relative flex items-center rounded-3xl',
          'mx-2 my-px',
          collapsed ? 'justify-center h-14' : 'gap-3 h-11 pl-[7px] pr-[14px]',
        )}
      >
        {/* Sliding pill — EXPANDED ONLY (collapsed active handled by icon container) */}
        {isActive && !collapsed && (
          <motion.div
            layoutId="sidebar-nav-pill"
            className="absolute inset-0 rounded-3xl"
            style={{ background: pillBgVar }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        {/* Hover bg — expanded only */}
        {!isActive && isHovered && !collapsed && (
          <div className="absolute inset-0 rounded-3xl transition-colors duration-150" style={{ background: 'var(--shell-ni-hover)' }} />
        )}

        {/* Icon with container */}
        <AnimatedNavIcon
          icon={CurrentIcon}
          isActive={isActive}
          isHovered={isHovered}
          accentKey={accentKey}
          collapsed={collapsed}
        />

        {/* Label */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm whitespace-nowrap overflow-hidden relative z-10"
              style={{
                color: isActive
                  ? pillTextVar
                  : showBackMode
                    ? 'var(--shell-text-3)'
                    : 'var(--shell-text-2)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
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
// MAIN SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const setModule = useSidebarStore((s) => s.setModule)

  // Get current module based on route
  const { moduleId, config, isSubModule } = useSidebarModule()
  const activeItemId = useActiveNavItem()

  // Filter groups based on permissions
  const filteredGroups = useSecureNavGroups(config.groups)

  // Resolve module accent color
  const accentKey = getAccentKey(moduleId)

  // Update sidebar store when module changes
  useEffect(() => {
    setModule(moduleId)
  }, [moduleId, setModule])

  // Calculate cumulative index for stagger animation
  let itemIndex = 0

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{
        width: collapsed
          ? 'var(--shell-sidebar-w-collapsed)'
          : 'var(--shell-sidebar-w)',
        background: 'var(--shell-page-bg)',
        transition: 'width var(--shell-transition), background 0.3s',
      }}
      aria-label="Main navigation"
    >
      {/* Spacer — aligns nav below topbar */}
      <div style={{ height: 'var(--shell-topbar-h)', flexShrink: 0 }} aria-hidden />

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--shell-scroll-thumb) transparent' }}
        aria-label="Sidebar navigation"
      >
        <motion.div
          key={moduleId}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
          className="space-y-1"
        >
          {/* Home / Back button */}
          <div className="mb-1">
            <HomeNavButton collapsed={collapsed} isSubModule={isSubModule} accentKey={accentKey} />
            <div className="mt-1" style={{ borderBottom: '1px solid var(--shell-divider)', margin: '0 12px' }} />
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
                accentKey={accentKey}
              />
            )
          })}
        </motion.div>
      </nav>
    </aside>
  )
}
