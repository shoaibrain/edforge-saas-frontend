/**
 * Contact step — the address "has the operator started this?" gate (#367).
 *
 * This is the refine that actually blocks Continue, and it shipped with no
 * coverage: `payload.test.ts` exercises the submit mapper, not the schema the
 * wizard validates each step against.
 *
 * The rule under test is narrow and worth stating exactly, because the
 * surrounding design is deliberate and must not be "simplified" away:
 *
 *   - Routing PABSON tenants to the Nepal address form is by design.
 *   - Locking country to 'NPL' for those tenants is by design (Sprint A.8).
 *   - Requiring a street once an address IS being given is by design, and is
 *     pinned by address-schemas-region-aware.spec.ts in shared-types.
 *
 * None of those is the defect. The defect was that this schema counted the
 * locked country as evidence the operator had started filling in an address,
 * so a block nobody touched demanded a street. The repo had already answered
 * this question the same way once, in the school wizard
 * (apps/shell/src/components/settings/school-wizard/school-wizard.schemas.ts),
 * which excludes `country` from both the required set and the started-gate.
 */

import { describe, it, expect } from 'vitest'
import { contactInfoStepSchema, defaultStudentFormData } from './student.form'

type AddressBag = Record<string, string | undefined>

interface ContactBag {
  contactInfo: {
    email?: string
    phone?: string
    phoneType?: string
    address: AddressBag
    mailingAddress: AddressBag
    useMailingAddress?: boolean
  }
}

/** The Contact-step slice of the wizard's initial data, unmodified. */
function untouched(): ContactBag {
  return {
    contactInfo: structuredClone(defaultStudentFormData.contactInfo) as ContactBag['contactInfo'],
  }
}

function errorPaths(data: unknown): string[] {
  const r = contactInfoStepSchema.safeParse(data)
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
}

describe('contact step — an untouched address block is not "started" (#367)', () => {
  it('passes for a GENERIC tenant, where country stays empty', () => {
    expect(errorPaths(untouched())).toEqual([])
  })

  it('passes for a PABSON tenant, where the form has locked country to NPL', () => {
    // AddressFieldsNepal writes this on mount, before the operator has seen
    // the step. Pre-fix this produced "Street address is required when
    // providing address details" on contactInfo.address.street1.
    const data = untouched()
    data.contactInfo.address.country = 'NPL'

    expect(errorPaths(data)).toEqual([])
  })

  it('passes when the mailing address is also NPL-locked', () => {
    // Same effect, second mount. It blocked identically.
    const data = untouched()
    data.contactInfo.address.country = 'NPL'
    data.contactInfo.mailingAddress.country = 'NPL'

    expect(errorPaths(data)).toEqual([])
  })
})

describe('contact step — a real address still requires its street', () => {
  it('demands street1 once a city is given', () => {
    const data = untouched()
    data.contactInfo.address.city = 'Austin'

    expect(errorPaths(data)).toContain('contactInfo.address.street1')
  })

  it('demands street1 once a Nepal field is given', () => {
    // The Nepal fields are anchors too. Whether street1 is the right anchor
    // for Nepal at all is a live product question — a Nepali address is
    // municipality + ward and often has no street — but that is a deliberate,
    // separately-tested rule in shared-types, not this fix's business.
    const data = untouched()
    data.contactInfo.address.municipality = 'Lalitpur Metropolitan City'

    expect(errorPaths(data)).toContain('contactInfo.address.street1')
  })

  it('accepts a Nepali address once the tole is given', () => {
    const data = untouched()
    Object.assign(data.contactInfo.address, {
      country: 'NPL',
      province: 'Bagmati',
      district: 'Lalitpur',
      municipality: 'Lalitpur Metropolitan City',
      wardNumber: '3',
      street1: 'Jhamsikhel Marg',
    })

    expect(errorPaths(data)).toEqual([])
  })
})

describe('the schema can represent a Nepali address at all', () => {
  it('does not strip the four Nepal fields on parse', () => {
    // The root cause was staleness, not just the anchor: this schema was a
    // pre-Sprint-A.1 copy listing only the six US keys, so zod removed
    // province/district/municipality/ward before the refine ever saw them —
    // they could not have satisfied the anchor even when filled.
    const data = untouched()
    Object.assign(data.contactInfo.address, {
      street1: 'Tole-12',
      country: 'NPL',
      province: 'Madhesh',
      district: 'Dhanusha',
      municipality: 'Kshireshwarnath',
      wardNumber: '9',
    })

    const parsed = contactInfoStepSchema.parse(data) as {
      contactInfo: { address: Record<string, unknown> }
    }

    expect(parsed.contactInfo.address).toMatchObject({
      province: 'Madhesh',
      district: 'Dhanusha',
      municipality: 'Kshireshwarnath',
      wardNumber: '9',
    })
  })
})
