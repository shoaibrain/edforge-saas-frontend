import { describe, it, expect } from 'vitest'
import { computeBatch, computeStudentInvoice } from '../compute'

/**
 * Issue #465 — the wizard priced agreement-covered students at catalog
 * rates, so two siblings on a NPR 20,000 agreement previewed at NPR 33,000.
 * The projection now consumes what bulk-preview says the agreement replaces.
 */
describe('agreement-aware projection (#465)', () => {
  const grade2: any = { studentId: 'stu-b', fullName: 'Aashik', currentGradeLevel: '2' }
  const grade3: any = { studentId: 'stu-a', fullName: 'Aadesh', currentGradeLevel: '3' }
  const feesFixture: any[] = [
    { id: 'fee-g3', name: 'Grade 3 Annual School Fee', amount: 18000, gradeLevels: ['3'] },
    { id: 'fee-g2', name: 'Grade 2 Annual School Fee', amount: 15000, gradeLevels: ['2'] },
    { id: 'fee-transport', name: 'Transport', amount: 900, gradeLevels: [] },
  ]
  const selected: Record<string, true> = { 'fee-g3': true, 'fee-g2': true, 'fee-transport': true }

  it('reproduces the reported batch: NPR 20,900 not NPR 33,900', () => {
    const batch = computeBatch([grade3, grade2], feesFixture, selected, [], {
      agreements: {
        'stu-a': { suppressedFeeStructureIds: ['fee-g3'], agreementAmount: 12000 },
        'stu-b': { suppressedFeeStructureIds: ['fee-g2'], agreementAmount: 8000 },
      },
    })
    // 12,000 + 900 + 8,000 + 900
    expect(batch.grossTotal).toBe(21800)
    // Catalog would have been 18,000 + 900 + 15,000 + 900 = 34,800.
    expect(batch.grossTotal).not.toBe(34800)
  })

  it('keeps the suppressed fee visible at zero rather than hiding it', () => {
    const inv = computeStudentInvoice(grade3, feesFixture, selected, [], {
      suppressedFeeStructureIds: ['fee-g3'],
      agreementAmount: 12000,
    })
    const suppressed = inv.lines.find(l => l.feeStructureId === 'fee-g3')
    expect(suppressed).toMatchObject({ base: 18000, total: 0, isSuppressed: true })
    expect(inv.lines.some(l => l.isAgreement && l.total === 12000)).toBe(true)
    expect(inv.total).toBe(12900)
  })

  it('leaves fees the agreement does not cover at catalog price', () => {
    const inv = computeStudentInvoice(grade3, feesFixture, selected, [], {
      suppressedFeeStructureIds: ['fee-g3'],
      agreementAmount: 12000,
    })
    expect(inv.lines.find(l => l.feeStructureId === 'fee-transport')).toMatchObject({ total: 900 })
  })

  it('falls back to catalog pricing when the preview has not loaded', () => {
    const without = computeBatch([grade3], feesFixture, selected, [])
    expect(without.grossTotal).toBe(18900)
  })

  it('falls back to catalog pricing for a student with no agreement', () => {
    const batch = computeBatch([grade3, grade2], feesFixture, selected, [], {
      agreements: { 'stu-a': { suppressedFeeStructureIds: ['fee-g3'], agreementAmount: 12000 } },
    })
    // stu-b untouched: 15,000 + 900
    const b = batch.perStudent.find(p => p.studentId === 'stu-b')
    expect(b?.total).toBe(15900)
  })

  it('suppresses without adding a line when the member has no allocation', () => {
    const inv = computeStudentInvoice(grade3, feesFixture, selected, [], {
      suppressedFeeStructureIds: ['fee-g3'],
      agreementAmount: 0,
    })
    expect(inv.lines.some(l => l.isAgreement)).toBe(false)
    expect(inv.total).toBe(900)
  })

  it('still adds custom lines on top of an agreement total', () => {
    const inv = computeStudentInvoice(
      grade3, feesFixture, selected,
      [{ id: 'c1', name: 'Picnic', amount: '250' } as any],
      { suppressedFeeStructureIds: ['fee-g3'], agreementAmount: 12000 },
    )
    expect(inv.total).toBe(13150)
  })
})
