/**
 * Enrolment-wizard payload mappers.
 *
 * These pin the three production defects that shipped because nothing
 * asserted the bytes leaving the wizard: the form rendered correctly and the
 * request was wrong. Each block names the issue it closes.
 */

import { describe, it, expect } from 'vitest'
import { omitEmpty, cleanAddress, cleanGuardians } from './payload'

describe('cleanGuardians — blank optionals must not reach the wire (#366)', () => {
  const filled = {
    firstName: 'Sita',
    lastName: 'Gurung',
    relationship: 'mother',
    email: '',
    phone: '9801234567',
    phoneType: '',
    alternatePhone: '',
    isPrimary: true,
    hasPortalAccess: false,
    canPickup: true,
    employer: '',
    occupation: '',
  }

  it('drops an untouched phoneType rather than sending an empty string', () => {
    // `phoneType` is a z.enum on the backend; '' is not a member, so the
    // whole create 400s on a field the wizard labels optional.
    const [g] = cleanGuardians([filled])!
    expect(g).not.toHaveProperty('phoneType')
  })

  it('drops an untouched email, which fails the same way', () => {
    // Not in the original report only because the tester filled it in.
    // `emailSchema` is `.email()`, so '' is a 400 for any guardian without
    // an email address — ordinary in this market.
    const [g] = cleanGuardians([filled])!
    expect(g).not.toHaveProperty('email')
  })

  it('leaves no empty string anywhere in the guardian payload', () => {
    // The general guarantee. A future field added to EMPTY_GUARDIAN cannot
    // reintroduce the defect, which an enumerated fix would allow.
    const [g] = cleanGuardians([filled])!
    expect(Object.values(g)).not.toContain('')
  })

  it('keeps the values the operator did provide', () => {
    const [g] = cleanGuardians([filled])!
    expect(g).toMatchObject({
      firstName: 'Sita',
      lastName: 'Gurung',
      relationship: 'mother',
      phone: '9801234567',
    })
  })

  it('keeps false booleans — false is an answer, not a blank', () => {
    const [g] = cleanGuardians([filled])!
    expect(g.hasPortalAccess).toBe(false)
    expect(g.isPrimary).toBe(true)
  })

  it('drops a guardian card that was added but never filled in', () => {
    expect(cleanGuardians([{ firstName: '', lastName: '', phoneType: '' }])).toBeUndefined()
  })

  it('returns undefined rather than [] when there are no guardians', () => {
    // The backend is `z.array(guardianSchema).min(1).optional()`: omitted is
    // allowed, empty is a 400. Skipping the step must send nothing.
    expect(cleanGuardians([])).toBeUndefined()
    expect(cleanGuardians(undefined)).toBeUndefined()
  })
})

describe('cleanAddress — a locked country is not an address (#367)', () => {
  it('returns undefined for a block holding only the auto-locked country', () => {
    // AddressFieldsNepal sets country='NPL' on mount for every PABSON
    // tenant. Sending it trips the backend's "street1 required when any
    // field is present" refine on an address nobody touched.
    expect(cleanAddress({ country: 'NPL' })).toBeUndefined()
  })

  it('returns undefined when every other field is still an empty string', () => {
    expect(
      cleanAddress({
        country: 'NPL',
        street1: '',
        city: '',
        municipality: '',
        wardNumber: '',
      })
    ).toBeUndefined()
  })

  it('keeps the country once a real field is present', () => {
    const out = cleanAddress({ country: 'NPL', street1: 'Tole 4' })
    expect(out).toEqual({ country: 'NPL', street1: 'Tole 4' })
  })

  it('also drops a country a GENERIC operator picked and nothing else', () => {
    // Known, deliberate cost of not distinguishing the machine-written
    // country from an operator-selected one. Pre-fix this surfaced as a
    // street1 error; now the lone country is dropped silently.
    //
    // Accepted because a country with no other address field is not an
    // address, and the backend refine would reject it anyway — so the
    // alternatives are a confusing error or a 400. It is NOT the same as
    // #368, where a complete Nepali address was lost. The clean fix is to
    // pass down whether the country was derived (AddressFieldsNepal writes
    // it with shouldDirty:false, so RHF can tell), which needs the archetype
    // threaded into both this mapper and the step schema; filed separately.
    expect(cleanAddress({ country: 'USA' })).toBeUndefined()
  })

  it('treats a Nepal-only field as a real field', () => {
    // Anchoring on the legacy US keys alone would discard a Nepali address
    // that never has a `city` or `state`.
    expect(cleanAddress({ country: 'NPL', municipality: 'Lalitpur' })).toBeDefined()
  })
})

describe('cleanAddress — Nepal fields must survive the mapping (#368)', () => {
  it('carries province, district, municipality and ward', () => {
    const out = cleanAddress({
      street1: 'Jhamsikhel Marg',
      country: 'NPL',
      province: 'Bagmati',
      district: 'Lalitpur',
      municipality: 'Lalitpur Metropolitan City',
      wardNumber: '3',
    })

    expect(out).toEqual({
      street1: 'Jhamsikhel Marg',
      country: 'NPL',
      province: 'Bagmati',
      district: 'Lalitpur',
      municipality: 'Lalitpur Metropolitan City',
      wardNumber: '3',
    })
  })

  it('still honours the legacy street / postalCode aliases', () => {
    const out = cleanAddress({ street: '12 Main St', postalCode: '44600' })
    expect(out).toEqual({ street1: '12 Main St', zipCode: '44600' })
  })

  it('returns undefined for no address at all', () => {
    expect(cleanAddress(undefined)).toBeUndefined()
  })
})

describe('omitEmpty', () => {
  it('drops empty strings and undefined, keeps everything else', () => {
    expect(omitEmpty({ a: '', b: undefined, c: 0, d: false, e: 'x', f: null })).toEqual({
      c: 0,
      d: false,
      e: 'x',
      f: null,
    })
  })
})
