/**
 * MobileTabBar — phone bottom tab bar (tabs nav variant, < 640px).
 *
 * Tabs derive from the user's ROLE-HOME module config (not the current
 * route's module, so tabs never change while navigating) through the same
 * RBAC filter as the desktop sidebar, then the cap-5 rule
 * (lib/mobile-nav.ts): Home + up to 4 items, or Home + 3 + "More" when the
 * role has 5+ visible items (parents). Active pill mirrors the desktop
 * sidebar's accent wayfinding.
 */

import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Home, MoreHorizontal } from 'lucide-react'
import { resolveAccent } from '@edforge/ui/motion'
import { Sheet, useBreakpoint } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'
import { useNavStore } from '../../stores/nav.store'
import { useSecureNavGroups } from '../../hooks/useSecureNavItems'
import { usePathname, useRoleHomeModuleId } from '../../hooks/useSidebarModule'
import { deriveTabItems, matchActiveTab } from '../../lib/mobile-nav'
import { navAccent } from '../../config/nav-accents'
import { getModuleConfig, type NavItem } from '../../config/sidebar-modules'
import { cn } from '../../lib/utils'

function scrollContentToTop() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById('main-content')
    ?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

function TabLink({
  href,
  label,
  icon: Icon,
  accent,
  isActive,
}: {
  href: string
  label: string
  icon: NavItem['icon']
  accent: string
  isActive: boolean
}) {
  return (
    <Link
      to={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn('shell-tab', isActive && 'is-active')}
      // allow-presentation-style: active tab tint is accent-driven (color-mix)
      style={{ '--accent': accent } as CSSProperties}
      onClick={(e) => {
        if (isActive) {
          e.preventDefault()
          scrollContentToTop()
        }
      }}
    >
      <span className="shell-tab-pill">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <span className="shell-tab-label">{label}</span>
    </Link>
  )
}

export function MobileTabBar() {
  const bp = useBreakpoint()
  const variant = useNavStore((s) => s.variant)
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()
  const navigate = useNavigate()
  const { t: tNav } = useTranslation('nav')
  const [moreOpen, setMoreOpen] = useState(false)

  const homeModuleId = useRoleHomeModuleId()
  const config = getModuleConfig(homeModuleId)
  const filteredGroups = useSecureNavGroups(config.groups)
  const { tabs, overflow } = useMemo(
    () => deriveTabItems(filteredGroups),
    [filteredGroups]
  )

  const activeHref = useMemo(() => {
    const allHrefs = [
      '/home',
      ...tabs.map((t) => t.href!),
      ...overflow.map((t) => t.href!),
    ]
    return matchActiveTab(pathname, allHrefs)
  }, [pathname, tabs, overflow])

  if (bp !== 'phone' || variant !== 'tabs' || !user) return null

  const moreActive = overflow.some((item) => item.href === activeHref)

  return (
    <>
      <nav className="shell-tabbar" aria-label={tNav('mainNavigation')}>
        <TabLink
          href="/home"
          label={tNav('home')}
          icon={Home}
          accent={resolveAccent('home', {})}
          isActive={activeHref === '/home'}
        />

        {tabs.map((item) => (
          <TabLink
            key={item.id}
            href={item.href!}
            label={tNav(`sidebar.${item.id}`, { defaultValue: item.label })}
            icon={item.icon}
            accent={navAccent(item, homeModuleId)}
            isActive={activeHref === item.href}
          />
        ))}

        {overflow.length > 0 && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn('shell-tab', moreActive && 'is-active')}
            // allow-presentation-style: active tab tint is accent-driven (color-mix)
            style={{ '--accent': resolveAccent('home', {}) } as CSSProperties}
          >
            <span className="shell-tab-pill">
              <MoreHorizontal size={22} strokeWidth={1.75} />
            </span>
            <span className="shell-tab-label">{tNav('moreTab')}</span>
          </button>
        )}
      </nav>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        ariaLabel={tNav('moreTab')}
      >
        <div className="px-2 py-2">
          {overflow.map((item) => {
            const Icon = item.icon
            const isActive = activeHref === item.href
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setMoreOpen(false)
                  navigate({ to: item.href! })
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 min-h-12 rounded-xl text-left transition-colors active:bg-[rgb(var(--background-tertiary))]',
                  isActive && 'bg-[rgb(var(--background-tertiary))]'
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className="flex-shrink-0 text-[rgb(var(--text-secondary))]"
                />
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {tNav(`sidebar.${item.id}`, { defaultValue: item.label })}
                </span>
              </button>
            )
          })}
        </div>
      </Sheet>
    </>
  )
}
