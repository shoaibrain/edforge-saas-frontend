/**
 * Archetype profile registry — GENERIC base + per-archetype delta overlays.
 *
 * Resolution mirrors the shipped `resolveAddressVariant(archetype, country)`
 * precedent exactly (packages/forms/src/sections/AddressFields.tsx):
 *   1. a known archetype wins outright (archetype beats country);
 *   2. otherwise `country === 'NPL'` falls back to the PABSON profile
 *      (a Nepal tenant with no/unknown archetype still gets Nepal-shaped UI);
 *   3. otherwise GENERIC.
 *
 * Adding a new governance body = add its overlay + a REGISTRY entry. No
 * call-site edits. The conformance test in __tests__/registry.test.ts fails
 * if a registered archetype is missing any EntityKind.
 */

import {
  ENTITY_KINDS,
  FEATURE_FIELDS,
  ALLOWED_VALUE_CONTROLS,
  type ArchetypeUiProfile,
  type ArchetypeFeatureMatrix,
  type AllowedValueControl,
  type EntityKind,
  type FeatureField,
  type FieldRequirement,
  type IdentifierSpec,
} from './types'

/**
 * GENERIC base — every entity resolves to its human-readable number with the
 * internal `id` as the (never-raw) fallback. UUID-shaped fields render as a
 * truncated, copyable badge, never a raw `id.slice(0, 8)` fragment.
 */
const GENERIC_IDENTIFIERS: Record<EntityKind, IdentifierSpec> = {
  student: {
    primaryField: 'studentNumber',
    fallbackField: 'id',
    labelKey: 'identifiers.studentNumber',
    format: 'plain',
  },
  payment: {
    primaryField: 'receiptNumber',
    fallbackField: 'id',
    labelKey: 'identifiers.receiptNumber',
    format: 'plain',
  },
  invoice: {
    primaryField: 'invoiceNumber',
    fallbackField: 'id',
    labelKey: 'identifiers.invoiceNumber',
    format: 'plain',
  },
  account: {
    primaryField: 'accountNumber',
    fallbackField: 'id',
    labelKey: 'identifiers.accountNumber',
    format: 'plain',
  },
  user: {
    primaryField: 'displayName',
    fallbackField: 'id',
    labelKey: 'identifiers.userId',
    format: 'plain',
  },
  receipt: {
    primaryField: 'receiptNumber',
    fallbackField: 'id',
    labelKey: 'identifiers.receiptNumber',
    format: 'plain',
  },
  transaction: {
    primaryField: 'transactionId',
    fallbackField: 'id',
    labelKey: 'identifiers.transactionId',
    format: 'uuid-short',
    copyable: true,
  },
  enrollment: {
    primaryField: 'enrollmentId',
    fallbackField: 'id',
    labelKey: 'identifiers.enrollmentId',
    format: 'uuid-short',
    copyable: true,
  },
}

/**
 * PABSON delta — the one governance-specific override that matters today:
 * a PABSON student's government-registered CEHRD/IEMIS `emisStudentId` is the
 * primary identifier (it's PII → `sensitive`), with the school-local
 * `studentNumber` as secondary + fallback. Everything else inherits GENERIC.
 */
const PABSON_OVERLAY: Partial<Record<EntityKind, IdentifierSpec>> = {
  student: {
    primaryField: 'emisStudentId',
    secondaryField: 'studentNumber',
    fallbackField: 'studentNumber',
    labelKey: 'identifiers.emisStudentId',
    format: 'iemis',
    copyable: true,
    sensitive: true,
  },
}

/**
 * GENERIC feature base — open everywhere: no field is required, and every
 * settings control is unconstrained (`null` = show all options). A new
 * governance body overlays only the fields/controls it locks down.
 */
const GENERIC_FEATURE_FIELDS: Record<FeatureField, FieldRequirement> = {
  emisSchoolCode: 'optional',
}

const GENERIC_ALLOWED_VALUES: ArchetypeFeatureMatrix['allowedValues'] = {
  currency: null,
  timezone: null,
  calendarSystem: null,
}

/**
 * PABSON delta — the IEMIS school code is mandatory (it drives CEHRD Flash I/II
 * reporting; mirrors the backend PABSON guard in identity `schools.service`),
 * and the regional controls are locked to Nepal: NPR currency, Asia/Kathmandu
 * timezone, Bikram Sambat calendar. Everything else inherits the GENERIC base.
 */
const PABSON_FEATURE_OVERLAY: DeepPartial<ArchetypeFeatureMatrix> = {
  fields: { emisSchoolCode: 'required' },
  allowedValues: {
    currency: ['NPR'],
    timezone: ['Asia/Kathmandu'],
    calendarSystem: ['bikram_sambat'],
  },
}

type DeepPartial<T> = { [K in keyof T]?: Partial<T[K]> }

function buildFeatures(overlay: DeepPartial<ArchetypeFeatureMatrix> = {}): ArchetypeFeatureMatrix {
  return {
    fields: { ...GENERIC_FEATURE_FIELDS, ...overlay.fields },
    allowedValues: { ...GENERIC_ALLOWED_VALUES, ...overlay.allowedValues },
  }
}

function buildProfile(
  archetype: string,
  addressVariant: ArchetypeUiProfile['addressVariant'],
  calendarSystem: ArchetypeUiProfile['calendarSystem'],
  overlay: Partial<Record<EntityKind, IdentifierSpec>> = {},
  features: ArchetypeFeatureMatrix = buildFeatures(),
): ArchetypeUiProfile {
  return {
    archetype,
    addressVariant,
    calendarSystem,
    identifiers: { ...GENERIC_IDENTIFIERS, ...overlay },
    features,
  }
}

const GENERIC_PROFILE = buildProfile('GENERIC', 'legacy', 'gregorian')
const PABSON_PROFILE = buildProfile(
  'PABSON',
  'nepal',
  'bikram_sambat',
  PABSON_OVERLAY,
  buildFeatures(PABSON_FEATURE_OVERLAY),
)

/**
 * The runtime-active registry. V1 governance bodies only. Reserved archetypes
 * (`CBSE_IN`, `NAIS_US`, `GEMS_UAE`) and future ones (`CBS`, `NGO_RUN`) are
 * deliberately NOT here yet — they're added when their pilot is funded
 * (see the framework execution doc, Wave 4). `getArchetypeProfile` degrades
 * any unregistered archetype to GENERIC, so this is safe.
 */
export const ARCHETYPE_REGISTRY: Readonly<Record<string, ArchetypeUiProfile>> = {
  GENERIC: GENERIC_PROFILE,
  PABSON: PABSON_PROFILE,
}

/**
 * Resolve the UI profile for a tenant. Archetype beats country; an unknown
 * archetype in Nepal falls back to PABSON; everything else is GENERIC. Never
 * throws — an unrecognized archetype degrades to GENERIC.
 */
export function getArchetypeProfile(
  archetype?: string | null,
  country?: string | null,
): ArchetypeUiProfile {
  // Own-property check: `archetype` can originate from tenant data, so a bare
  // bracket lookup would resolve inherited Object.prototype members
  // ('toString', '__proto__', etc.) and break the "always degrade to GENERIC"
  // contract.
  if (archetype && Object.hasOwn(ARCHETYPE_REGISTRY, archetype)) {
    return ARCHETYPE_REGISTRY[archetype]
  }
  if (country === 'NPL') {
    return ARCHETYPE_REGISTRY.PABSON
  }
  return ARCHETYPE_REGISTRY.GENERIC
}

/** The identifier spec for one entity under one governance body. */
export function getIdentifierSpec(
  entity: EntityKind,
  archetype?: string | null,
  country?: string | null,
): IdentifierSpec {
  return getArchetypeProfile(archetype, country).identifiers[entity]
}

/** The GF3 feature matrix (required/hidden fields + locked option sets) for a tenant. */
export function getArchetypeFeatureMatrix(
  archetype?: string | null,
  country?: string | null,
): ArchetypeFeatureMatrix {
  return getArchetypeProfile(archetype, country).features
}

/** Requirement of one operator form field under one governance body. */
export function fieldRequirement(
  field: FeatureField,
  archetype?: string | null,
  country?: string | null,
): FieldRequirement {
  return getArchetypeFeatureMatrix(archetype, country).fields[field]
}

/**
 * The allowed value-set for one settings control under one governance body.
 * `null` = unconstrained (the consumer shows every option); a non-empty array =
 * restrict to exactly those values. Returned as `readonly string[] | null` so a
 * dropdown can `.filter(o => allowed === null || allowed.includes(o.value))`.
 */
export function allowedValuesFor(
  control: AllowedValueControl,
  archetype?: string | null,
  country?: string | null,
): readonly string[] | null {
  return getArchetypeFeatureMatrix(archetype, country).allowedValues[control]
}

/** Active archetype labels the registry knows about (for conformance tests). */
export const REGISTERED_ARCHETYPES: readonly string[] = Object.keys(ARCHETYPE_REGISTRY)

export { ENTITY_KINDS, FEATURE_FIELDS, ALLOWED_VALUE_CONTROLS }
