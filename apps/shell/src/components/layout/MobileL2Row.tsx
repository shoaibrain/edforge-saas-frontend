/**
 * MobileL2Row — the contextual sidebar's page list as a horizontally
 * scrollable pill rail under the app bar (phone) / header (tablet).
 *
 * Data: the current module's RBAC-filtered groups, flattened (the drawer
 * carries the section labels; a pill rail has no room for them). Hidden on
 * phone for the home module and the role's own portal family — those items
 * ARE the tab bar (lib/mobile-nav.ts shouldShowL2Row).
 */

import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { useBreakpoint } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useSidebarModule, useActiveNavItem, useRoleHomeModuleId } from '../../hooks/useSidebarModule'
import { useSecureNavGroups } from '../../hooks/useSecureNavItems'
import { shouldShowL2Row } from '../../lib/mobile-nav'
import { navAccent } from '../../config/nav-accents'
import type { NavItem, SidebarModule } from '../../config/sidebar-modules'
import { cn } from '../../lib/utils'

function L2Pill({
  item,
  moduleId,
  isActive,
  label,
}: {
  item: NavItem
  moduleId: SidebarModule
  isActive: boolean
  label: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const Icon = item.icon

  useEffect(() => {
    if (isActive && ref.current) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ref.current.scrollIntoView({
        inline: 'nearest',
        block: 'nearest',
        behavior: reduced ? 'auto' : 'smooth',
      })
    }
  }, [isActive])

  return (
    <Link
      ref={ref}
      to={item.href!}
      aria-current={isActive ? 'page' : undefined}
      className={cn('shell-l2-pill', isActive && 'is-active')}
      // allow-presentation-style: active pill tint is accent-driven (color-mix)
      style={{ '--accent': navAccent(item, moduleId) } as CSSProperties}
    >
      <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
      <span>{label}</span>
      {item.badge != null && (
        <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-golden-400/20 text-golden-600 dark:text-golden-400">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function MobileL2Row() {
  const bp = useBreakpoint()
  const { moduleId, config } = useSidebarModule()
  const homeModuleId = useRoleHomeModuleId()
  const filteredGroups = useSecureNavGroups(config.groups)
  const activeItemId = useActiveNavItem()
  const { t: tNav } = useTranslation('nav')

  if (!shouldShowL2Row(moduleId, homeModuleId, bp)) return null

  const items = filteredGroups.flatMap((g) => g.items).filter((i) => i.href)
  if (items.length === 0) return null

  return (
    <nav className="shell-l2" aria-label={tNav(`module.${moduleId}`)}>
      {items.map((item) => (
        <L2Pill
          key={item.id}
          item={item}
          moduleId={moduleId}
          isActive={activeItemId === item.id}
          label={tNav(`sidebar.${item.id}`, { defaultValue: item.label })}
        />
      ))}
    </nav>
  )
}
