/**
 * @edforge/archetype — public surface.
 *
 * Frontend home of the Governance-Body Archetype Framework registry.
 * Workspace-private, shell/MFE-only — never imported by AdminWeb (separate
 * repo, CRA/webpack, workspace-only-in-Docker trap). Registered as a Module
 * Federation singleton in packages/config/src/mf-shared.ts so every MFE shares
 * one registry instance.
 */

export type {
  ArchetypeUiProfile,
  IdentifierSpec,
  IdentifierFormat,
  EntityKind,
  AddressVariant,
  CalendarSystem,
} from './types'

export {
  getArchetypeProfile,
  getIdentifierSpec,
  ARCHETYPE_REGISTRY,
  REGISTERED_ARCHETYPES,
  ENTITY_KINDS,
} from './registry'

export {
  resolveIdentifier,
  serializeIdentifier,
  type ResolvedIdentifier,
  type IdentifierContext,
} from './resolveIdentifier'

// React layer (GF1c)
export { useArchetypeIdentifier } from './components/useArchetypeIdentifier'
export { EntityIdDisplay, type EntityIdDisplayProps } from './components/EntityIdDisplay'
export { UuidBadge, type UuidBadgeProps } from './components/UuidBadge'
