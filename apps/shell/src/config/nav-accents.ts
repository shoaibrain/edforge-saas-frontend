/**
 * Nav accent registry — shared by every chrome surface that renders nav items
 * (desktop Sidebar, phone tab bar, L2 pill row, mobile nav drawer).
 *
 * Icon mapping is EXPLICIT (NAV_SIGNATURE): an item animates only when it has a
 * hand-picked signature glyph. Every other item renders its original Lucide
 * glyph unchanged (static, but still accent-tinted) — so the manifest's icon
 * choice is never silently swapped. Accent falls back to the module hue for
 * unmapped items. The accent hue per glyph lives in the motion registry
 * (ICON_ACCENT).
 */

import { resolveAccent, type IconName, type AccentHue } from '@edforge/ui/motion'
import type { NavItem, SidebarModule } from './sidebar-modules'

export const NAV_SIGNATURE: Record<string, IconName> = {
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
  // attendance (calendar + check)
  'my-attendance': 'attendance',
  'children-attendance': 'attendance',
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
export const MODULE_HUE: Record<SidebarModule, AccentHue> = {
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
export function navAccent(item: NavItem, moduleId: SidebarModule): string {
  if (item.variant === 'danger') return 'var(--color-danger)'
  const sig = NAV_SIGNATURE[item.id]
  if (sig) return resolveAccent(sig, {})
  return resolveAccent(undefined, { accent: MODULE_HUE[moduleId] ?? 'emerald' })
}

/** Resolve the module-level accent (used by the phone tab bar's module tabs). */
export function moduleAccent(moduleId: SidebarModule): string {
  const sig = NAV_SIGNATURE[moduleId]
  if (sig) return resolveAccent(sig, {})
  return resolveAccent(undefined, { accent: MODULE_HUE[moduleId] ?? 'emerald' })
}
