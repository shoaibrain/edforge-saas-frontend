/**
 * Unit tests for the exam pilot-card write-side + print logic (Batch D/E):
 *   - buildComponents (Add-Subject Theory/Practical split validation)
 *   - evalComponents / sameComponentScores (per-component score entry)
 *   - buildReportCardHtml (scheme-aware printable card)
 *
 * These cover the highest-risk correctness surface — the Nepal Σ/pass rules and
 * the division-vs-letter_gpa print branching — as pure functions.
 */

import { describe, it, expect } from 'vitest'
import type { ExamResponseDto, ResultCardResponseDto } from '@aibrains/shared-types'
import { buildComponents, evalComponents, sameComponentScores } from '../exam-scoring'
import { buildReportCardHtml } from '../ReportCardPrint'

describe('buildComponents (Add-Subject split validation)', () => {
  it('returns ok with empty components for no drafts', () => {
    expect(buildComponents([], 100)).toEqual({ ok: true, components: [] })
  })

  it('accepts a Theory/Practical split whose full marks sum to maxMarks', () => {
    const r = buildComponents(
      [
        { label: 'Theory', fullMarks: '100', passMarks: '40' },
        { label: 'Practical', fullMarks: '50', passMarks: '20' },
      ],
      150,
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.components).toEqual([
        { code: 'theory', label: 'Theory', fullMarks: 100, passMarks: 40 },
        { code: 'practical', label: 'Practical', fullMarks: 50, passMarks: 20 },
      ])
    }
  })

  it('rejects when Σ full marks ≠ maxMarks', () => {
    expect(buildComponents([{ label: 'Theory', fullMarks: '100', passMarks: '40' }], 150).ok).toBe(false)
  })

  it('rejects passMarks > fullMarks', () => {
    expect(buildComponents([{ label: 'Theory', fullMarks: '100', passMarks: '120' }], 100).ok).toBe(false)
  })

  it('rejects duplicate component codes', () => {
    const r = buildComponents(
      [
        { label: 'Theory', fullMarks: '50', passMarks: '20' },
        { label: 'Theory', fullMarks: '50', passMarks: '20' },
      ],
      100,
    )
    expect(r.ok).toBe(false)
  })

  it('rejects an empty label', () => {
    expect(buildComponents([{ label: '  ', fullMarks: '100', passMarks: '40' }], 100).ok).toBe(false)
  })
})

describe('evalComponents (per-component score entry)', () => {
  const defs = [
    { code: 'theory', label: 'Theory', fullMarks: 100, passMarks: 40 },
    { code: 'practical', label: 'Practical', fullMarks: 50, passMarks: 20 },
  ]

  it('sums a fully-filled valid row', () => {
    const r = evalComponents(defs, { components: { theory: '80', practical: '40' } })
    expect(r).toMatchObject({ sum: 120, complete: true, anyFilled: true, invalid: false })
    expect(r.scores).toEqual({ theory: 80, practical: 40 })
  })

  it('flags a partial fill as not complete', () => {
    const r = evalComponents(defs, { components: { theory: '80' } })
    expect(r.anyFilled).toBe(true)
    expect(r.complete).toBe(false)
  })

  it('flags an out-of-range component value as invalid', () => {
    const r = evalComponents(defs, { components: { theory: '120', practical: '10' } })
    expect(r.invalid).toBe(true)
  })

  it('treats a blank row as not filled', () => {
    expect(evalComponents(defs, { components: {} }).anyFilled).toBe(false)
    expect(evalComponents(defs, undefined).anyFilled).toBe(false)
  })
})

describe('sameComponentScores', () => {
  it('true for equal maps', () => {
    expect(sameComponentScores({ theory: 80, practical: 40 }, { theory: 80, practical: 40 })).toBe(true)
  })
  it('false for undefined vs populated', () => {
    expect(sameComponentScores(undefined, { theory: 80 })).toBe(false)
  })
  it('false for differing values', () => {
    expect(sameComponentScores({ theory: 80 }, { theory: 81 })).toBe(false)
  })
  it('false for differing key counts', () => {
    expect(sameComponentScores({ theory: 80, practical: 40 }, { theory: 80 })).toBe(false)
  })
})

// ---- buildReportCardHtml fixtures -------------------------------------------

const exam = { examName: 'Final Term', examType: 'final' } as unknown as ExamResponseDto

function divisionCard(overrides: Partial<ResultCardResponseDto> = {}): ResultCardResponseDto {
  return {
    courseId: 'x',
    cardId: 'card-1',
    studentId: 's1',
    studentIdentity: { legalName: 'Shruti Jha', gradeLevel: '10', emisStudentId: '111' },
    courseScores: [
      {
        courseId: 'c1',
        examCourseId: 'ec1',
        courseName: 'English',
        rawScore: 120,
        maxMarks: 150,
        passMarks: 60,
        pass: true,
        grade: 'A',
        gpa: 3.6,
        isPassing: true,
        components: [
          { code: 'theory', label: 'Theory', fullMarks: 100, passMarks: 40, obtained: 80, pass: true },
          { code: 'practical', label: 'Practical', fullMarks: 50, passMarks: 20, obtained: 40, pass: true },
        ],
      },
      {
        courseId: 'c2',
        examCourseId: 'ec2',
        courseName: 'Mathematics',
        rawScore: 0,
        maxMarks: 100,
        passMarks: 40,
        pass: false,
        notGraded: true,
        grade: 'NG',
        gpa: 0,
        isPassing: false,
      },
    ],
    totalScore: 120,
    totalMaxMarks: 250,
    termGpa: 0,
    overallGrade: 'NG',
    percentage: 78,
    division: 'First Division',
    result: 'pass',
    classRank: null,
    status: 'draft',
    ...overrides,
  } as unknown as ResultCardResponseDto
}

function letterCard(): ResultCardResponseDto {
  return {
    cardId: 'card-2',
    studentId: 's2',
    studentIdentity: { legalName: 'Yash Mandal' },
    courseScores: [
      { courseId: 'c1', examCourseId: 'ec1', courseName: 'English', rawScore: 78, maxMarks: 100, grade: 'B+', gpa: 3.2, isPassing: true },
    ],
    totalScore: 78,
    totalMaxMarks: 100,
    termGpa: 3.2,
    overallGrade: 'B+',
    status: 'published',
  } as unknown as ResultCardResponseDto
}

describe('buildReportCardHtml', () => {
  it('renders the division scheme (band, PASS, %, components, AB)', () => {
    const html = buildReportCardHtml(divisionCard(), exam, 'Sunshine Private')
    expect(html).toContain('Sunshine Private')
    expect(html).toContain('Shruti Jha')
    expect(html).toContain('First Division')
    expect(html).toContain('PASS')
    expect(html).toContain('78.0%')
    expect(html).toContain('Theory 80/100')
    expect(html).toContain('AB') // the notGraded Mathematics row
  })

  it('renders the letter_gpa scheme (GPA/Overall, no Division)', () => {
    const html = buildReportCardHtml(letterCard(), exam)
    expect(html).toContain('Term GPA')
    expect(html).toContain('Overall')
    expect(html).toContain('B+')
    expect(html).not.toContain('Division')
  })

  it('HTML-escapes dynamic text (no injection)', () => {
    const html = buildReportCardHtml(
      divisionCard({
        studentIdentity: { legalName: '<script>alert(1)</script>' },
      } as Partial<ResultCardResponseDto>),
      exam,
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert(1)')
  })
})
