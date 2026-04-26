/**
 * AddressSection — DEPRECATED ALIAS (kept for backwards-compatibility)
 *
 * The body of this component was extracted into `AddressFieldsLegacy` in
 * Sprint A.9 to make room for `AddressFieldsNepal` (A.8) + the archetype
 * switch `AddressFields` (A.10). New callers should use `<AddressFields
 * archetype={...} country={...} />` so PABSON tenants automatically see the
 * Nepal-shaped form.
 *
 * This re-export exists so existing call sites (school create, family
 * forms, etc.) continue to compile and render unchanged. Migration to
 * `<AddressFields>` happens incrementally in Sprint A.12–A.16.
 */

export {
  AddressFieldsLegacy as AddressSection,
  type AddressFieldsLegacyProps as AddressSectionProps,
} from './AddressFieldsLegacy'
