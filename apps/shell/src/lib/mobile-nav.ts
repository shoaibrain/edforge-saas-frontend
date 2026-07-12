/**
 * Mobile navigation derivation — pure functions behind the phone chrome
 * (bottom tab bar, app bar composition, L2 pill-row visibility).
 *
 * Everything here derives from the SIDEBAR_MODULES registry AFTER RBAC
 * filtering (filterNavGroups / useSecureNavGroups) — the mobile chrome never
 * hand-rolls a nav list, so the rbac-sidebar matrix holds on phone by
 * construction.
 */

import {
  detectModuleFromPath,
  isHomeModule,
  type NavItem,
  type NavItemGroup,
  type SidebarModule,
} from '../config/sidebar-modules'
import type { Breakpoint } from '@edforge/ui'

// ============================================================================
// BOTTOM TAB DERIVATION
// ============================================================================

export interface TabDerivation {
  /** Items rendered as their own tab (after the Home tab). */
  tabs: NavItem[]
  /** Items folded into the "More" tab's sheet. Empty → no More tab. */
  overflow: NavItem[]
}

/**
 * Derive the bottom tab bar from the user's RBAC-filtered role-home groups.
 *
 * Cap: 5 tabs total including Home. ≤4 visible items → Home + all of them
 * (no More). ≥5 items → Home + first 3 + a More tab holding the rest
 * (Home + 4 + More would be 6). Registry order is preserved; admin roles
 * top out at exactly 5 (Academics/People/Finance/Settings), parents overflow
 * into More.
 */
export function deriveTabItems(filteredHomeGroups: NavItemGroup[]): TabDerivation {
  const items = filteredHomeGroups.flatMap((group) =>
    group.items.filter((item) => Boolean(item.href))
  )

  if (items.length <= 4) {
    return { tabs: items, overflow: [] }
  }
  return { tabs: items.slice(0, 3), overflow: items.slice(3) }
}

/**
 * Longest-prefix active matching across tab hrefs — exactly one tab is active
 * at any route ('/parent-portal' overview vs '/parent-portal/grades' both
 * prefix-match '/parent-portal'; the longer href wins). '/' is home.
 */
export function matchActiveTab(pathname: string, tabHrefs: string[]): string | null {
  const path = pathname === '/' ? '/home' : pathname

  let best: string | null = null
  for (const href of tabHrefs) {
    if (path === href || path.startsWith(href + '/')) {
      if (!best || href.length > best.length) best = href
    }
  }
  return best
}

// ============================================================================
// APP BAR COMPOSITION
// ============================================================================

export type AppBarState =
  | { kind: 'home' }
  | { kind: 'module-root'; moduleId: SidebarModule }
  | { kind: 'subpage'; moduleId: SidebarModule; backTo: string }

/**
 * Derive the phone app bar composition from the pathname.
 *
 * home         '/' or '/home' → greeting + BS·AD date
 * module-root  one path segment → module title + school subtitle
 * subpage      deeper → back chevron (module root) + page title + subtitle
 */
export function deriveAppBarState(pathname: string): AppBarState {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/home') {
    return { kind: 'home' }
  }

  const moduleId = detectModuleFromPath(pathname)

  if (segments.length === 1 && !isHomeModule(moduleId)) {
    return { kind: 'module-root', moduleId }
  }

  // '/student-portal' has no index route (its nav items all point deeper) and
  // orphan deep routes (e.g. /payments/callback) resolve to the home module —
  // both back out to /home rather than a 404.
  const backTo =
    isHomeModule(moduleId) || moduleId === 'student-portal'
      ? '/home'
      : '/' + segments[0]

  return { kind: 'subpage', moduleId, backTo }
}

// ============================================================================
// L2 PILL ROW VISIBILITY
// ============================================================================

/**
 * Whether the L2 page-pill row renders for the current module.
 *
 * Phone: hidden on the home module and on the role's own portal family —
 * those items ARE the tab bar. Tablet: always eligible (no tab bar exists;
 * the home pills double as the module switcher). Desktop: never (sidebar
 * owns L2).
 */
export function shouldShowL2Row(
  moduleId: SidebarModule,
  homeModuleId: SidebarModule,
  breakpoint: Breakpoint
): boolean {
  if (breakpoint === 'desktop') return false
  if (breakpoint === 'tablet') return true

  if (isHomeModule(moduleId)) return false
  if (moduleId === 'student-portal' && homeModuleId === 'home-student') return false
  if (moduleId === 'parent-portal' && homeModuleId === 'home-parent') return false
  return true
}
