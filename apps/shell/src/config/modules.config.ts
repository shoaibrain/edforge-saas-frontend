/**
 * Module availability configuration for the current release.
 */
export const MODULE_AVAILABILITY = {
  academics: true,
  people: true,
  finance: true,
  analytics: true,
} as const

export type ModuleId = keyof typeof MODULE_AVAILABILITY
export type EnabledModuleId = {
  [K in ModuleId]: (typeof MODULE_AVAILABILITY)[K] extends true ? K : never
}[ModuleId]

export function isModuleEnabled(moduleId: string): boolean {
  return MODULE_AVAILABILITY[moduleId as ModuleId] === true
}
