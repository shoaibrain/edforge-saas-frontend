/**
 * @edforge/archetype — type surface for the governance-body UI profile.
 *
 * One governance body (archetype) = one cohesive `ArchetypeUiProfile`. This is
 * the frontend half of the Governance-Body Archetype Framework
 * (see edforge/docs/archetype-framework/). It generalizes the existing
 * per-surface `resolve<X>(archetype, country)` helpers (`resolveAddressVariant`,
 * `phoneFormatForArchetype`) into a single registry so adding a new governance
 * body is a data-only change with zero call-site edits.
 *
 * GF0 (thin) ships the registry + the identifier specs (data). The resolver
 * logic, hook, and components that *consume* the specs land in GF1
 * (the identifier-resolver, sequenced from the merged PR #95 plan).
 */

/**
 * Entity kinds that carry a human-facing identifier somewhere in the UI.
 * Mirrors the `EntityKind` union in the merged identifier-display plan
 * (docs/archetype-identifier-display-sprint-plan.md S1-T2).
 */
export type EntityKind =
  | 'student'
  | 'payment'
  | 'invoice'
  | 'account'
  | 'user'
  | 'receipt'
  | 'transaction'
  | 'enrollment'

export const ENTITY_KINDS: readonly EntityKind[] = [
  'student',
  'payment',
  'invoice',
  'account',
  'user',
  'receipt',
  'transaction',
  'enrollment',
] as const

/**
 * How a resolved identifier value should be rendered.
 * - `iemis`   — government-registered code (IEMIS/CEHRD badge styling)
 * - `uuid-short` — internal UUID, truncated + copyable (never shown raw/full)
 * - `plain`   — human-readable string as-is
 * - `mono`    — monospace (codes that aren't UUIDs but benefit from alignment)
 */
export type IdentifierFormat = 'iemis' | 'uuid-short' | 'plain' | 'mono'

/**
 * Per-entity identifier rule for one governance body. Field names are strings
 * (not `keyof` a shared-types DTO) at this layer so `@edforge/archetype` stays
 * dependency-light and publish-free; GF1 adds the typed `EntityDataMap` +
 * `@aibrains/shared-types` contract test on top.
 */
export interface IdentifierSpec {
  /** Primary field to read from the entity payload. */
  primaryField: string
  /** Optional secondary field shown alongside (e.g. studentNumber under EMIS). */
  secondaryField?: string
  /** Field used when `primaryField` is empty. Defaults to `id` if unset. */
  fallbackField?: string
  /** i18n key in the `identifiers` namespace (added in GF1). */
  labelKey: string
  /** Render style. */
  format: IdentifierFormat
  /** Show a copy-to-clipboard affordance. */
  copyable?: boolean
  /** Value is government PII — display layer must honor the sensitive-data mask. */
  sensitive?: boolean
}

export type AddressVariant = 'nepal' | 'legacy'
export type CalendarSystem = 'bikram_sambat' | 'gregorian'

/**
 * The complete UI profile for one governance body. New surfaces (feature
 * matrix, allowed-value sets) are added as slots here in later sprints (GF3);
 * GF0 ships the slots the Wave-1 identifier work needs.
 */
export interface ArchetypeUiProfile {
  /** Canonical archetype label this profile resolves to. */
  archetype: string
  /** Which address form shape to render. Mirrors `resolveAddressVariant`. */
  addressVariant: AddressVariant
  /** Calendar system for date display. */
  calendarSystem: CalendarSystem
  /** Per-entity identifier display rules. */
  identifiers: Record<EntityKind, IdentifierSpec>
}
