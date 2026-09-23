/**
 * Enrolment-wizard payload mappers.
 *
 * The wizard's form state and the create-student request are not the same
 * shape, and the gap is where three production defects lived (#366, #367,
 * #368). These live outside the component so the mapping is testable on its
 * own — every one of those defects was invisible to a render test and only
 * shows up in the bytes that go on the wire.
 */

/**
 * Drops keys whose value is `''` or `undefined`.
 *
 * Every wizard step seeds its inputs with empty strings so React keeps them
 * controlled, so `''` arrives here meaning "operator left this blank". The
 * backend's optional validators reject it for any field carrying a format —
 * `phoneType` is a `z.enum`, `email` is `.email()` — producing a 400 on
 * fields the UI labels optional (#366). Booleans and numbers pass through,
 * so `isPrimary: false` survives.
 */
export function omitEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined)
  )
}

/**
 * Maps a form address onto the shared `addressSchema` shape.
 *
 * Returns `undefined` for an address the operator never filled in, which is
 * not the same as "every key empty": `AddressFieldsNepal` locks `country` to
 * `'NPL'` on mount for PABSON tenants, so an untouched block arrives here
 * already carrying one value. Sending `{ country: 'NPL' }` trips the
 * backend's "street1 is required when any address field is present" refine,
 * which is why country is not treated as an anchor (#367).
 */
export function cleanAddress(
  addr: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!addr) return undefined

  const cleaned = omitEmpty({
    street1: (addr.street1 as string) || (addr.street as string),
    street2: addr.street2 as string,
    city: addr.city as string,
    state: addr.state as string,
    zipCode: (addr.zipCode as string) || (addr.postalCode as string),
    country: addr.country as string,
    // Nepal extension fields (Sprint A.1). The allow-list this replaced
    // predated them and silently dropped every Nepali address (#368).
    wardNumber: addr.wardNumber as string,
    municipality: addr.municipality as string,
    district: addr.district as string,
    province: addr.province as string,
  })

  const anchored = Object.keys(cleaned).some((k) => k !== 'country')
  return anchored ? cleaned : undefined
}

/**
 * Keeps the guardians an operator actually filled in, and strips their blank
 * optionals. Guardian rows are seeded from a template of empty strings, so
 * without this every unfilled optional reaches the backend verbatim.
 */
export function cleanGuardians(
  guardians: Array<Record<string, unknown>> | undefined
): Array<Record<string, unknown>> | undefined {
  const filled = guardians?.filter((g) => g.firstName && g.lastName).map(omitEmpty)
  return filled && filled.length > 0 ? filled : undefined
}
