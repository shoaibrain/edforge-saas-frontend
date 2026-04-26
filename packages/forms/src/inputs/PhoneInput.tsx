/**
 * PhoneInput — archetype-aware phone field (Sprint A.11)
 *
 * Thin wrapper around the existing `<PhoneField>` low-level component. Reads
 * the tenant's archetype + country (passed as props) and resolves the format
 * via `phoneFormatForArchetype` from `@aibrains/shared-types` (Sprint A.5),
 * then forwards the computed dial-code prefix + placeholder + helper text +
 * validation regex to `<PhoneField>`.
 *
 * Resolution order (mirrors AddressFields A.10):
 *   1. archetype === 'PABSON' → +977 Nepal mobile (10 digits, leading 9)
 *   2. country === 'NPL'      → +977 Nepal mobile
 *   3. otherwise              → +1 US/Canada
 *
 * Why a wrapper, not extend PhoneField: keep PhoneField low-level + reusable
 * by callers who want to override defaults manually. PhoneInput is the
 * "use the right format for this tenant" convenience.
 *
 * Props-driven (per Sprint A.7 design): caller passes archetype + country
 * from their app's tenant context.
 */

import { type RegisterOptions } from 'react-hook-form'
import {
  phoneFormatForArchetype,
  isValidPhoneForArchetype,
} from '@aibrains/shared-types'
import { PhoneField } from '../fields/PhoneField'

export interface PhoneInputProps {
  /** Field name (supports dot notation for nested fields). */
  name: string
  /**
   * Tenant archetype. PABSON triggers the Nepal-mobile format. If `undefined`
   * or any other value, falls through to country resolution.
   */
  archetype?: string | null
  /**
   * Tenant country (ISO-3166 alpha-3). `NPL` triggers Nepal-mobile format
   * even when archetype isn't PABSON. Otherwise US default.
   */
  country?: string | null
  /** Field label. Default `"Phone"`. */
  label?: string
  /** Helper text shown below input (shown alongside the auto-derived format hint). */
  helperText?: string
  /** Whether field is disabled. */
  disabled?: boolean
  /** Whether field is read-only. */
  readOnly?: boolean
  /** Whether field is required. */
  required?: boolean
  /** Container class name. */
  className?: string
  /** Input container class name. */
  inputClassName?: string
  /**
   * Additional react-hook-form validation rules. Merged with the auto-derived
   * archetype-aware regex (the regex always wins on conflicting keys).
   */
  rules?: RegisterOptions
  /** Show checkmark on valid input. */
  showSuccessState?: boolean
}

/**
 * Build the merged RHF rules object: archetype-aware validate + caller's
 * extra rules. Exported for testing.
 */
export function buildPhoneInputRules(
  archetype: string | undefined | null,
  country: string | undefined | null,
  callerRules?: RegisterOptions,
): RegisterOptions {
  return {
    ...callerRules,
    validate: {
      ...((callerRules?.validate as Record<string, (value: string) => boolean | string>) ?? {}),
      archetypeFormat: (value: string) => {
        // Empty string is allowed (let `required` rule handle non-empty)
        if (!value) return true
        return (
          isValidPhoneForArchetype(value, archetype, country) ||
          'Phone number does not match the expected format for this tenant'
        )
      },
    },
  }
}

export function PhoneInput({
  name,
  archetype,
  country,
  label = 'Phone',
  helperText,
  disabled,
  readOnly,
  required,
  className,
  inputClassName,
  rules,
  showSuccessState,
}: PhoneInputProps) {
  const fmt = phoneFormatForArchetype(archetype, country)
  const mergedRules = buildPhoneInputRules(archetype, country, rules)

  // Helper text: caller's helper takes priority; otherwise derived hint.
  const derivedHelper = `Format: ${fmt.label} — e.g., ${fmt.placeholder}`
  const finalHelperText = helperText ?? derivedHelper

  return (
    <PhoneField
      name={name}
      label={label}
      placeholder={fmt.placeholder}
      helperText={finalHelperText}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      className={className}
      inputClassName={inputClassName}
      rules={mergedRules}
      showSuccessState={showSuccessState}
      defaultCountryCode={fmt.dialCode}
    />
  )
}
