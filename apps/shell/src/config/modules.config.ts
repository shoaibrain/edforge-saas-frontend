/**
 * Module availability configuration for the current release.
 *
 * Modules listed as `false` are parked for post-MVP development.
 * Their source code remains in apps/ but they are excluded from:
 * - Module Federation remotes (rsbuild.config.ts)
 * - Router route tree (router.tsx)
 * - Sidebar navigation (sidebar-modules.ts)
 * - Build/deploy pipeline (build-deploy.sh)
 *
 * To re-enable a module, set it to `true` and follow the
 * re-enablement checklist in docs/MODULE_PARKING.md
 */
export const MODULE_AVAILABILITY = {
  academics: true,
  finance: true,
  people: true,
  // [MVP-PARKED] — These modules will be re-enabled post-MVP
  'special-programs': false,
  messages: false,
  analytics: false,
  edfi: false,
  // [/MVP-PARKED]
} as const

export type ModuleId = keyof typeof MODULE_AVAILABILITY
export type EnabledModuleId = {
  [K in ModuleId]: (typeof MODULE_AVAILABILITY)[K] extends true ? K : never
}[ModuleId]

export function isModuleEnabled(moduleId: string): boolean {
  return MODULE_AVAILABILITY[moduleId as ModuleId] === true
}

/** List of all parked module path prefixes for guard routes */
export const PARKED_MODULE_PATHS = [
  '/messages',
  '/analytics',
  '/special-programs',
  '/edfi',
] as const
