/**
 * Dynamic Sidebar Component — Shell V2
 *
 * Gmail-inspired seamless sidebar with pill nav items and SIGNATURE animated icons.
 * Icon motion + the per-item accent come from @edforge/ui/motion and @edforge/theme
 * (icon-motion.css). This file only wires the trigger contract (`.ef-motion` +
 * `.is-active` on the focusable <a>) and sets the per-item `--accent`; CSS owns the
 * motion. Features ABAC permission filtering.
 *
 * Icon mapping is EXPLICIT (NAV_SIGNATURE): an item animates only when it has a
 * hand-picked signature glyph. Every other item renders its original Lucide glyph
 * unchanged (static, but still accent-tinted) — so the manifest's icon choice is
 * never silently swapped. Accent falls back to the module hue for unmapped items.
 */

import { useState, useEffect, useSyncExternalStore, type CSSProperties } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { AnimatedIcon, resolveAccent, type IconName, type AccentHue } from '@edforge/ui/motion'
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
// SIGNATURE MAPPING — nav-item id → animated-glyph name
// EXPLICIT and conservative: only items whose signature glyph is a clean match
// for the manifest's icon are listed. Unlisted items keep their original Lucide
// glyph (static). Adding a new animated item is a one-line entry here.
// The accent hue per glyph lives in the motion registry (ICON_ACCENT).
// ============================================================================

const NAV_SIGNATURE: Record<string, IconName> = {
  // primary modules
  academics: 'academics',
  people: 'people',
  finance: 'finance',
  settings: 'settings',
  // module overviews (GalleryVerticalEnd)
  'academics-home': 'overview',
  'finance-home': 'overview',
  'people-home': 'overview',
  'analytics-overview': 'overview',
  'analytics-dashboard': 'overview',
  'settings-home': 'overview',
  // people-shaped sub-items (UsersRound)
  students: 'people',
  'staff-directory': 'people',
  'student-accounts': 'people',
  // book-shaped (BookOpen ≈ academic-setup open book)
  curriculum: 'academicsetup',
  // grades (GraduationCap ≈ academics mortarboard)
  'my-grades': 'academics',
  'children-grades': 'academics',
  // settings sub-nav
  'my-account': 'account',
  preferences: 'preferences',
  security: 'security',
  'workspace-settings': 'workspace',
  organization: 'organization',
  'rbac-security': 'rbac',
  'auth-debug': 'authdebug',
}

// Accent hue per module — the fallback for items without their own signature, so
// every item in a module shares a coherent tint. Mirrors the prototype's primary
// nav hues (home emerald, academics violet, people amber, finance teal, settings blue).
const MODULE_HUE: Record<SidebarModule, AccentHue> = {
  home: 'emerald',
  'home-student': 'emerald',
  'home-parent': 'emerald',
  'student-portal': 'emerald',
  'parent-portal': 'emerald',
  academics: 'violet',
  finance: 'teal',
  people: 'amber',
  settings: 'blue',
  analytics: 'sky',
}

/** Resolve the inline `--accent` value for a nav item (danger items go red). */
function navAccent(item: NavItem, moduleId: SidebarModule): string {
  if (item.variant === 'danger') return 'var(--color-danger)'
  const sig = NAV_SIGNATURE[item.id]
  if (sig) return resolveAccent(sig, {})
  return resolveAccent(undefined, { accent: MODULE_HUE[moduleId] ?? 'emerald' })
}

// ============================================================================
// NAV ICON — signature glyph (animated) or original Lucide glyph (static),
// both inside the `.nav-ico` holder so the accent tint + glow apply uniformly.
// ============================================================================

function NavIcon({
  icon: IconEl,
  sigName,
  isActive,
  isHovered,
  collapsed,
}: {
  icon: LucideIcon
  sigName?: IconName
  isActive: boolean
  isHovered: boolean
  collapsed: boolean
}) {
  const iconSize = collapsed ? SIDEBAR_NAV_ICON_SIZE_COLLAPSED : SIDEBAR_NAV_ICON_SIZE

  // In collapsed state the icon container carries the active/hover tint.
  const containerBg = collapsed && isActive
    ? 'color-mix(in oklch, var(--accent) 16%, transparent)'
    : collapsed && isHovered && !isActive
      ? 'var(--shell-ni-hover)'
      : 'transparent'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center flex-shrink-0',
        collapsed ? 'w-12 h-12 rounded-xl' : 'w-9 h-9 rounded-[10px]',
      )}
      // allow-presentation-style: collapsed active/hover icon container tint is accent-driven
      style={{ background: containerBg }}
    >
      {/* Accent is owned by the .ef-motion ancestor (<a>), so applyAccent={false}.
          Mapped items animate; unmapped items render their original glyph static
          (still inside .nav-ico for the accent tint + glow). */}
      {sigName ? (
        <AnimatedIcon name={sigName} size={iconSize} applyAccent={false} />
      ) : (
        <span className="nav-ico">
          <IconEl size={iconSize} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
    </div>
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
  moduleId,
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  index: number
  moduleId: SidebarModule
}) {
  const { t: tNav } = useTranslation('nav')
  const [isHovered, setIsHovered] = useState(false)
  const isDanger = item.variant === 'danger'
  const translatedLabel = tNav(`sidebar.${item.id}`, { defaultValue: item.label })

  const accentValue = navAccent(item, moduleId)
  const sigName = NAV_SIGNATURE[item.id]
  const activeTextColor = 'color-mix(in oklch, var(--accent) 92%, var(--shell-text-1))'

  const linkContent = (
    <Link
      to={item.href || '#'}
      aria-label={translatedLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // ef-motion = the CSS trigger contract; --accent drives icon, glow, pill, label.
      className={cn('block relative ef-motion', isActive && 'is-active')}
      style={{ '--accent': accentValue } as CSSProperties}
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
            // allow-presentation-style: active nav pill bg is accent-driven (color-mix)
            className="absolute inset-0 rounded-3xl"
            style={{ background: 'color-mix(in oklch, var(--accent) 14%, transparent)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        {/* Danger active bg — expanded only (accent is already var(--color-danger)) */}
        {isActive && isDanger && !collapsed && (
          <div
            className="absolute inset-0 rounded-3xl"
            style={{ background: 'color-mix(in oklch, var(--accent) 12%, transparent)' }}
          />
        )}
        {/* Hover bg — expanded only (collapsed hover handled by icon container) */}
        {!isActive && isHovered && !collapsed && (
          <div className="absolute inset-0 rounded-3xl transition-colors duration-150 bg-[var(--shell-ni-hover)]" />
        )}

        {/* Icon with container */}
        <NavIcon
          icon={item.icon}
          sigName={sigName}
          isActive={isActive}
          isHovered={isHovered}
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
              // allow-presentation-style: active nav label color is accent-driven
              style={{
                color: isActive && !isDanger
                  ? activeTextColor
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
      <Tooltip content={translatedLabel} side="right" sideOffset={12} className="block">
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
  moduleId,
}: {
  group: NavItemGroup
  collapsed: boolean
  activeItemId: string | null
  startIndex: number
  moduleId: SidebarModule
}) {
  const { t: tNav } = useTranslation('nav')

  return (
    <div className="space-y-0.5">
      {/* Group header */}
      {group.label && !collapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pt-4 pb-1.5 text-3xs font-medium text-[var(--shell-sec-lbl)]"
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
          moduleId={moduleId}
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
}: {
  collapsed: boolean
  isSubModule: boolean
}) {
  const { t: tNav } = useTranslation('nav')
  const pathname = useSidebarPathname()
  const [isHovered, setIsHovered] = useState(false)

  const isAtHome = pathname === '/home' || pathname === '/'
  const isActive = !isSubModule && isAtHome
  const showBackMode = isSubModule

  const CurrentIcon = showBackMode ? ArrowLeft : Home
  // Home animates (hop); the back arrow has no signature (static) but keeps the hue.
  const sigName: IconName | undefined = showBackMode ? undefined : 'home'
  const label = tNav('home')

  const accentValue = resolveAccent('home', {})
  const activeTextColor = 'color-mix(in oklch, var(--accent) 92%, var(--shell-text-1))'

  const linkContent = (
    <Link
      to="/home"
      aria-label={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('block relative ef-motion', isActive && 'is-active')}
      style={{ '--accent': accentValue } as CSSProperties}
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
            // allow-presentation-style: active nav pill bg is accent-driven (color-mix)
            className="absolute inset-0 rounded-3xl"
            style={{ background: 'color-mix(in oklch, var(--accent) 14%, transparent)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        {/* Hover bg — expanded only */}
        {!isActive && isHovered && !collapsed && (
          <div className="absolute inset-0 rounded-3xl transition-colors duration-150 bg-[var(--shell-ni-hover)]" />
        )}

        {/* Icon with container */}
        <NavIcon
          icon={CurrentIcon}
          sigName={sigName}
          isActive={isActive}
          isHovered={isHovered}
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
              // allow-presentation-style: active nav label color is accent-driven
              className="text-sm whitespace-nowrap overflow-hidden relative z-10"
              style={{
                color: isActive
                  ? activeTextColor
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
      <Tooltip content={label} side="right" sideOffset={12} className="block">
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

  // Update sidebar store when module changes
  useEffect(() => {
    setModule(moduleId)
  }, [moduleId, setModule])

  // Calculate cumulative index for stagger animation
  let itemIndex = 0

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden bg-[var(--shell-page-bg)]"
      style={{
        width: collapsed
          ? 'var(--shell-sidebar-w-collapsed)'
          : 'var(--shell-sidebar-w)',
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
            <HomeNavButton collapsed={collapsed} isSubModule={isSubModule} />
            <div className="mt-1 mx-3 border-b border-[var(--shell-divider)]" />
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
                moduleId={moduleId}
              />
            )
          })}
        </motion.div>
      </nav>
    </aside>
  )
}
