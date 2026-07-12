/**
 * MobileNavDrawer — the full-nav left drawer: tablet's primary navigation
 * (the header hamburger opens it) and the phone's variant-B nav (dev flag in
 * nav.store).
 *
 * Content derives from the same registry + RBAC path as the desktop sidebar:
 * Home row, then one section per RBAC-visible module (admin family) or the
 * role-home's groups (portal family). Headless Dialog provides focus trap,
 * Esc, scrim close, and focus restoration.
 */

import { Fragment, useEffect, useMemo, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { X, Home, LogOut } from 'lucide-react'
import { useBreakpoint } from '@edforge/ui'
import { resolveAccent } from '@edforge/ui/motion'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { useNavStore } from '../../stores/nav.store'
import { useHomeStore } from '../../stores/home.store'
import { usePathname, useRoleHomeModuleId } from '../../hooks/useSidebarModule'
import { useActiveSchool } from '../../hooks/useActiveSchool'
import { filterNavGroups } from '../../hooks/useSecureNavItems'
import { matchActiveTab } from '../../lib/mobile-nav'
import { navAccent } from '../../config/nav-accents'
import {
  detectModuleFromPath,
  getModuleConfig,
  type NavItem,
  type SidebarModule,
} from '../../config/sidebar-modules'
import { getSchoolAvatar } from '../../lib/avatar'
import { cn } from '../../lib/utils'

interface DrawerSection {
  key: string
  label?: string
  moduleId: SidebarModule
  items: NavItem[]
}

function DrawerRow({
  item,
  moduleId,
  isActive,
  label,
  onNavigate,
}: {
  item: NavItem
  moduleId: SidebarModule
  isActive: boolean
  label: string
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.href!}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
      className="block relative"
      // allow-presentation-style: active row tint is accent-driven (color-mix)
      style={{ '--accent': navAccent(item, moduleId) } as CSSProperties}
    >
      <div
        className={cn(
          'flex items-center gap-3 h-11 px-4 mx-2 rounded-3xl transition-colors',
          isActive
            ? 'bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]'
            : 'active:bg-[var(--shell-ni-hover)]'
        )}
      >
        <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
        <span
          className="text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis"
          // allow-presentation-style: active nav label color is accent-driven
          style={{
            color: isActive
              ? 'color-mix(in oklch, var(--accent) 92%, var(--shell-text-1))'
              : 'var(--shell-text-2)',
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  )
}

export function MobileNavDrawer() {
  const bp = useBreakpoint()
  const variant = useNavStore((s) => s.variant)
  const drawerOpen = useNavStore((s) => s.drawerOpen)
  const closeDrawer = useNavStore((s) => s.closeDrawer)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const activeAcademicYear = useHomeStore((s) => s.activeAcademicYear)
  const pathname = usePathname()
  const homeModuleId = useRoleHomeModuleId()
  const { activeSchool } = useActiveSchool()
  const { t: tNav } = useTranslation('nav')

  // Drawer exists on tablet (primary nav) and on phone only under the
  // drawer nav variant. Force-close when the breakpoint/variant makes it
  // ineligible (e.g. resize into desktop).
  const eligible = bp === 'tablet' || (bp === 'phone' && variant === 'drawer')
  useEffect(() => {
    if (drawerOpen && !eligible) closeDrawer()
  }, [drawerOpen, eligible, closeDrawer])

  const sections = useMemo<DrawerSection[]>(() => {
    if (!user) return []

    if (homeModuleId === 'home') {
      // Admin family: one section per RBAC-visible home entry's module
      const homeItems = filterNavGroups(
        getModuleConfig('home').groups,
        user,
        activeSchoolId
      ).flatMap((g) => g.items)

      return homeItems
        .map((homeItem) => {
          const moduleId = detectModuleFromPath(homeItem.href || '/')
          const items = filterNavGroups(
            getModuleConfig(moduleId).groups,
            user,
            activeSchoolId
          )
            .flatMap((g) => g.items)
            .filter((i) => i.href)
          return {
            key: moduleId,
            label: tNav(`module.${moduleId}`),
            moduleId,
            items,
          }
        })
        .filter((s) => s.items.length > 0)
    }

    // Portal family: the role-home's groups as sections
    return filterNavGroups(getModuleConfig(homeModuleId).groups, user, activeSchoolId)
      .map((g) => ({
        key: g.id,
        label: g.label ? tNav(`group.${g.id}`, { defaultValue: g.label }) : undefined,
        moduleId: homeModuleId,
        items: g.items.filter((i) => i.href),
      }))
      .filter((s) => s.items.length > 0)
  }, [user, activeSchoolId, homeModuleId, tNav])

  const activeHref = useMemo(() => {
    const allHrefs = ['/home', ...sections.flatMap((s) => s.items.map((i) => i.href!))]
    return matchActiveTab(pathname, allHrefs)
  }, [pathname, sections])

  if (!user) return null

  return (
    <Transition show={drawerOpen && eligible} as={Fragment}>
      <Dialog onClose={closeDrawer} aria-label={tNav('mainNavigation')} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="shell-fade"
          enterFrom="shell-fade-hidden"
          enterTo="shell-fade-shown"
          leave="shell-fade"
          leaveFrom="shell-fade-shown"
          leaveTo="shell-fade-hidden"
        >
          <div className="shell-scrim" aria-hidden="true" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="shell-slide"
          enterFrom="shell-slide-left-hidden"
          enterTo="shell-slide-shown"
          leave="shell-slide"
          leaveFrom="shell-slide-shown"
          leaveTo="shell-slide-left-hidden"
        >
          <DialogPanel className="shell-drawer">
            {/* School header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[var(--shell-divider)]">
              {activeSchool ? (
                <>
                  <img
                    src={getSchoolAvatar(activeSchool.name, { size: 40 })}
                    alt={activeSchool.name}
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[color:var(--shell-school-name)]">
                      {activeSchool.name}
                    </p>
                    <p className="text-xs truncate text-[color:var(--shell-school-code)]">
                      {activeSchool.code}
                      {activeAcademicYear ? ` · ${activeAcademicYear.name}` : ''}
                    </p>
                  </div>
                </>
              ) : (
                <p className="flex-1 text-sm font-semibold text-[color:var(--shell-text-1)]">
                  EdForge
                </p>
              )}
              <button
                type="button"
                onClick={closeDrawer}
                aria-label={tNav('closeNavigation')}
                className="shell-touch w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[var(--shell-ni-hover)] text-[color:var(--shell-text-2)]"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Nav body */}
            <nav
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2"
              aria-label={tNav('mainNavigation')}
            >
              <Link
                to="/home"
                aria-current={activeHref === '/home' ? 'page' : undefined}
                onClick={closeDrawer}
                className="block relative"
                // allow-presentation-style: active row tint is accent-driven (color-mix)
                style={{ '--accent': resolveAccent('home', {}) } as CSSProperties}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 h-11 px-4 mx-2 rounded-3xl transition-colors',
                    activeHref === '/home'
                      ? 'bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]'
                      : 'active:bg-[var(--shell-ni-hover)]'
                  )}
                >
                  <Home size={18} strokeWidth={1.75} className="flex-shrink-0" />
                  <span
                    className="text-[13.5px]"
                    // allow-presentation-style: active nav label color is accent-driven
                    style={{
                      color:
                        activeHref === '/home'
                          ? 'color-mix(in oklch, var(--accent) 92%, var(--shell-text-1))'
                          : 'var(--shell-text-2)',
                      fontWeight: activeHref === '/home' ? 600 : 400,
                    }}
                  >
                    {tNav('home')}
                  </span>
                </div>
              </Link>

              {sections.map((section) => (
                <div key={section.key} className="mt-1">
                  {section.label && (
                    <p className="px-5 pt-4 pb-1.5 text-3xs font-medium text-[var(--shell-sec-lbl)]">
                      {section.label}
                    </p>
                  )}
                  {section.items.map((item) => (
                    <DrawerRow
                      key={item.id}
                      item={item}
                      moduleId={section.moduleId}
                      isActive={activeHref === item.href}
                      label={tNav(`sidebar.${item.id}`, { defaultValue: item.label })}
                      onNavigate={closeDrawer}
                    />
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer — sign out */}
            <div className="border-t border-[var(--shell-divider)] p-2">
              <button
                type="button"
                onClick={() => {
                  closeDrawer()
                  logout()
                }}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-3xl transition-colors active:bg-rust-50 dark:active:bg-rust-900/20"
              >
                <LogOut size={18} strokeWidth={1.75} className="flex-shrink-0 text-rust-500" />
                <span className="text-[13.5px] font-medium text-rust-600 dark:text-rust-400">
                  {tNav('signOut')}
                </span>
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
