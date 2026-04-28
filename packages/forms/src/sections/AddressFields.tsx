/**
 * AddressFields — region-aware address form (Sprint A.10)
 *
 * Single import surface for callers. Branches at render time on the tenant's
 * archetype + country to render either:
 *   - `<AddressFieldsNepal>` (Sprint A.8) — for PABSON archetype OR `country='NPL'`
 *   - `<AddressFieldsLegacy>` (Sprint A.9) — US-shaped, for everything else
 *
 * Props-driven (per Sprint A.7 design): caller passes archetype + country
 * from their app's tenant context (e.g., `useTenant()` in shell-context).
 * The component itself does NOT import any tenant-context hook — keeps the
 * forms package decoupled from app-specific state plumbing.
 *
 * Resolution mirrors `phoneFormatForArchetype` in @aibrains/shared-types
 * (Sprint A.5):
 *   1. archetype === 'PABSON' → Nepal
 *   2. country === 'NPL'      → Nepal (GENERIC tenant operating in Nepal)
 *   3. otherwise              → Legacy (US/generic)
 *
 * See `docs/decisions/region-aware-forms-divergence.md` for the divergence
 * policy on existing tenant data.
 */

import { type LucideIcon } from 'lucide-react'
import { AddressFieldsNepal } from './AddressFieldsNepal'
import { AddressFieldsLegacy } from './AddressFieldsLegacy'

export interface AddressFieldsProps {
  /**
   * Tenant archetype. PABSON triggers the Nepal-shaped form. If `undefined`
   * or any other value, falls through to country resolution.
   */
  archetype?: string | null
  /**
   * Tenant country (ISO-3166 alpha-3). `NPL` triggers Nepal-shaped form
   * even when archetype isn't PABSON. Otherwise legacy.
   */
  country?: string | null

  /** Prefix for field names. Defaults to `address`. */
  namePrefix?: string
  /** Show section header. */
  showHeader?: boolean
  /** Section title override. */
  title?: string
  /** Section icon override. */
  icon?: LucideIcon
  /** Disable all inputs. */
  disabled?: boolean
  /** Show optional "address line 2" / suite field. */
  showAddressLine2?: boolean
  /**
   * Show country selector (legacy only — Nepal variant always locks
   * country to NPL and renders it read-only).
   */
  showCountry?: boolean
  /** Additional class name. */
  className?: string
}

/**
 * Resolve which address-shape variant to render. Exported for testing.
 */
export function resolveAddressVariant(
  archetype: string | undefined | null,
  country: string | undefined | null,
): 'nepal' | 'legacy' {
  if (archetype === 'PABSON') return 'nepal'
  if (country === 'NPL') return 'nepal'
  return 'legacy'
}

export function AddressFields({
  archetype,
  country,
  namePrefix,
  showHeader,
  title,
  icon,
  disabled,
  showAddressLine2,
  showCountry,
  className,
}: AddressFieldsProps) {
  const variant = resolveAddressVariant(archetype, country)

  if (variant === 'nepal') {
    return (
      <AddressFieldsNepal
        namePrefix={namePrefix}
        showHeader={showHeader}
        title={title}
        icon={icon}
        disabled={disabled}
        showAddressLine2={showAddressLine2}
        className={className}
      />
    )
  }

  return (
    <AddressFieldsLegacy
      namePrefix={namePrefix}
      showHeader={showHeader}
      title={title}
      icon={icon}
      disabled={disabled}
      showAddressLine2={showAddressLine2}
      showCountry={showCountry}
      className={className}
    />
  )
}
