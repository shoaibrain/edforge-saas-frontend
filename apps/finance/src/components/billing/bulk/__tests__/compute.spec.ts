/**
 * compute.ts — pure-function tests
 *
 * Pins the invoice math that drives the wizard's rail + per-student
 * preview + skipZeroTotal projection.
 */

import { describe, it, expect } from 'vitest'
import {
  feeApplies,
  coverageOf,
  computeStudentInvoice,
  computeBatch,
  resolveCustomLineItems,
  buildNumberPreview,
} from '../compute'
import type { StudentSearchResult } from '@edforge/finance-services'
import type { FeeStructure } from '@edforge/types'

function S(id: string, grade: string): StudentSearchResult {
  return {
    studentId: id,
    firstName: id,
    lastName: '',
    fullName: id,
    currentGradeLevel: grade,
    status: 'active',
  }
}

function F(opts: {
  id: string
  amount: number
  name?: string
  gradeLevels?: string[]
}): FeeStructure {
  return {
    id: opts.id,
    schoolId: 'school-1',
    name: opts.name ?? opts.id,
    amount: opts.amount,
    currency: 'NPR',
    feeType: 'tuition',
    frequency: 'monthly',
    gradeLevels: opts.gradeLevels ?? [],
    taxRate: 0,
    isActive: true,
    version: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as unknown as FeeStructure
}

describe('feeApplies', () => {
  it('empty gradeLevels → applies to every student', () => {
    expect(feeApplies(F({ id: 'f1', amount: 100 }), S('s1', '4'))).toBe(true)
  })

  it('explicit gradeLevels → applies only when student grade matches', () => {
    const fee = F({ id: 'f1', amount: 100, gradeLevels: ['4', '5'] })
    expect(feeApplies(fee, S('s1', '4'))).toBe(true)
    expect(feeApplies(fee, S('s2', '6'))).toBe(false)
  })
})

describe('coverageOf', () => {
  it('counts how many of the selected students a fee applies to', () => {
    const fee = F({ id: 'f1', amount: 100, gradeLevels: ['4'] })
    const students = [S('a', '4'), S('b', '5'), S('c', '4')]
    expect(coverageOf(fee, students)).toBe(2)
  })
})

describe('computeStudentInvoice', () => {
  it('sums applicable fees at FULL price; skips inapplicable fees', () => {
    const tui = F({ id: 'tui', name: 'Tuition', amount: 1000 })
    const lab = F({ id: 'lab', name: 'Lab', amount: 200, gradeLevels: ['6'] })
    const selected = { tui: true as const, lab: true as const }
    const inv = computeStudentInvoice(S('s1', '4'), [tui, lab], selected, [])
    expect(inv.lines).toHaveLength(1) // lab skipped
    expect(inv.lines[0].name).toBe('Tuition')
    expect(inv.lines[0].base).toBe(1000)
    expect(inv.lines[0].total).toBe(1000)
    expect(inv.total).toBe(1000)
  })

  it('appends custom lines (isCustom:true) on top of fee-structure lines', () => {
    const tui = F({ id: 'tui', amount: 500 })
    const selected = { tui: true as const }
    const customs = [
      { id: 'cl1', name: 'Annual picnic', amount: '300' },
      { id: 'cl2', name: 'Stationery', amount: '100' },
    ]
    const inv = computeStudentInvoice(S('s1', '4'), [tui], selected, customs)
    expect(inv.lines).toHaveLength(3)
    expect(inv.lines[1]).toMatchObject({ name: 'Annual picnic', base: 300, total: 300, isCustom: true })
    expect(inv.lines[2]).toMatchObject({ name: 'Stationery', base: 100, total: 100, isCustom: true })
    expect(inv.total).toBe(900)
  })

  it('drops empty / NaN / negative custom lines', () => {
    const customs = [
      { id: 'cl1', name: '', amount: '' }, // empty
      { id: 'cl2', name: 'half-typed', amount: 'NaN-ish' },
      { id: 'cl3', name: 'negative', amount: '-50' },
      { id: 'cl4', name: 'good', amount: '100' },
    ]
    const inv = computeStudentInvoice(S('s1', '4'), [], {}, customs)
    expect(inv.lines).toHaveLength(1)
    expect(inv.lines[0].name).toBe('good')
    expect(inv.total).toBe(100)
  })

  it('unselected fee structures are NOT included (selectedFees map is the gate)', () => {
    const tui = F({ id: 'tui', amount: 1000 })
    const inv = computeStudentInvoice(S('s1', '4'), [tui], {}, [])
    expect(inv.lines).toHaveLength(0)
    expect(inv.total).toBe(0)
  })
})

describe('computeBatch', () => {
  const tui = F({ id: 'tui', amount: 1000 })
  const lab = F({ id: 'lab', amount: 200, gradeLevels: ['5'] })
  const selected = { tui: true as const, lab: true as const }

  it('rolls up per-student totals; gross + billable agree when no zeros', () => {
    const batch = computeBatch([S('a', '4'), S('b', '5')], [tui, lab], selected, [])
    expect(batch.perStudent).toHaveLength(2)
    expect(batch.perStudent[0].total).toBe(1000) // tui only for grade 4
    expect(batch.perStudent[1].total).toBe(1200) // tui + lab for grade 5
    expect(batch.grossTotal).toBe(2200)
    expect(batch.billableTotal).toBe(2200)
    expect(batch.zeroCount).toBe(0)
  })

  // A zero-amount fee structure is the remaining zero-total path now that
  // bulk generation carries no discounts.
  const freeTui = F({ id: 'freeTui', amount: 0 })
  const zeroSelected = { freeTui: true as const, lab: true as const }

  it('skipZeroTotal:true excludes zero-total students from billableTotal/avg', () => {
    const batch = computeBatch([S('a', '4'), S('b', '5')], [freeTui, lab], zeroSelected, [], {
      skipZeroTotal: true,
    })
    // a: freeTui (0), lab inapplicable → ZERO
    // b: freeTui (0) + lab (200) = 200 → BILLABLE
    expect(batch.zeroCount).toBe(1)
    expect(batch.billableTotal).toBe(200)
    expect(batch.avgPerStudent).toBe(200) // 200/1 billable
  })

  it('skipZeroTotal:false (default) keeps zeros in billableTotal', () => {
    const batch = computeBatch([S('a', '4'), S('b', '5')], [freeTui, lab], zeroSelected, [])
    expect(batch.zeroCount).toBe(1)
    expect(batch.billableTotal).toBe(200) // a=0 + b=200
    // avg over 2 billable students = 100
    expect(batch.avgPerStudent).toBe(100)
  })
})

describe('resolveCustomLineItems (BE submit shape)', () => {
  it('drops empty + NaN + negative; coerces amount to number', () => {
    const out = resolveCustomLineItems(
      [
        { id: '1', name: '', amount: '' },
        { id: '2', name: 'NaN test', amount: 'xyz' },
        { id: '3', name: 'neg', amount: '-50' },
        { id: '4', name: 'Annual picnic', amount: '500' },
      ],
      'Custom line item',
    )
    expect(out).toEqual([{ name: 'Annual picnic', amount: 500 }])
  })

  it('falls back to the provided (t()-resolved) name when operator typed an amount but no name', () => {
    const out = resolveCustomLineItems(
      [{ id: '1', name: '', amount: '100' }],
      'अनुकूल लाइन आइटम',
    )
    expect(out).toEqual([{ name: 'अनुकूल लाइन आइटम', amount: 100 }])
  })

  it('hard-caps at 10 entries (BE mirror)', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      name: `Item ${i}`,
      amount: '10',
    }))
    expect(resolveCustomLineItems(many, 'Custom line item')).toHaveLength(10)
  })
})

describe('buildNumberPreview', () => {
  it('constructs INV-<code>-<year>-<term>-<seq>', () => {
    const { prefix, first, last } = buildNumberPreview({
      schoolCode: 'DPPSW',
      academicYear: '2083 BS · 2026-27 AD',
      billingPeriod: 'First Term',
      studentCount: 86,
    })
    expect(prefix).toBe('INV-DPPSW-2026-T1-')
    expect(first).toBe('INV-DPPSW-2026-T1-0001')
    expect(last).toBe('INV-DPPSW-2026-T1-0086')
  })

  it("falls back to YYYY when AY doesn't contain a 4-digit year", () => {
    const out = buildNumberPreview({
      schoolCode: '',
      academicYear: '',
      billingPeriod: '',
      studentCount: 1,
    })
    expect(out.prefix).toBe('INV-XXX-YYYY-BP-')
  })

  it('uppercases school code', () => {
    const out = buildNumberPreview({
      schoolCode: 'dppsw',
      academicYear: '2026',
      billingPeriod: 'Second Term',
      studentCount: 5,
    })
    expect(out.prefix).toBe('INV-DPPSW-2026-T2-')
  })
})
