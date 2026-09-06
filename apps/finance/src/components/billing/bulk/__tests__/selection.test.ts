/**
 * selection.ts — pure-function tests
 *
 * Pins the wizard's selection state machine:
 *   - toggleStudent / addStudents / removeStudents are immutable + idempotent
 *   - gradeGroupState returns tri-state correctly
 *   - toggleGradeGroup off → on → off
 *   - applySegmentMembers only adds on toggle-ON (toggle-OFF does NOT auto-remove)
 *   - summarize buckets by grade in canonical order
 */

import { describe, it, expect } from 'vitest'
import {
  toggleStudent,
  addStudents,
  removeStudents,
  clearSelection,
  setMode,
  gradeGroupState,
  toggleGradeGroup,
  toggleSegment,
  applySegmentMembers,
  bucketByGrade,
  summarize,
} from '../selection'
import { emptySelection } from '../types'
import type { StudentSearchResult } from '@edforge/finance-services'

function S(id: string, grade: string, name = id): StudentSearchResult {
  return {
    studentId: id,
    firstName: name,
    lastName: '',
    fullName: name,
    currentGradeLevel: grade,
    status: 'active',
  }
}

const G4_A = S('g4-a', '4', 'Alice')
const G4_B = S('g4-b', '4', 'Bob')
const G4_C = S('g4-c', '4', 'Charlie')
const G5_D = S('g5-d', '5', 'Dipa')
const G5_E = S('g5-e', '5', 'Eli')

describe('toggleStudent', () => {
  it('adds an unselected student; removes a selected one', () => {
    const s0 = emptySelection()
    const s1 = toggleStudent(s0, 'x')
    expect(s1.selectedIds.has('x')).toBe(true)
    const s2 = toggleStudent(s1, 'x')
    expect(s2.selectedIds.has('x')).toBe(false)
  })

  it('does not mutate the input state (immutability)', () => {
    const s0 = emptySelection()
    toggleStudent(s0, 'x')
    expect(s0.selectedIds.size).toBe(0)
  })
})

describe('addStudents / removeStudents', () => {
  it('addStudents is idempotent on already-selected IDs', () => {
    const s0 = addStudents(emptySelection(), ['a', 'b'])
    const s1 = addStudents(s0, ['b', 'c'])
    expect([...s1.selectedIds].sort()).toEqual(['a', 'b', 'c'])
  })

  it('removeStudents handles unselected IDs gracefully', () => {
    const s0 = addStudents(emptySelection(), ['a'])
    const s1 = removeStudents(s0, ['x', 'a'])
    expect(s1.selectedIds.size).toBe(0)
  })

  it('empty array → same reference (no-op short-circuit)', () => {
    const s0 = emptySelection()
    expect(addStudents(s0, [])).toBe(s0)
    expect(removeStudents(s0, [])).toBe(s0)
  })
})

describe('clearSelection / setMode', () => {
  it('clearSelection drops IDs and segments', () => {
    let s = addStudents(emptySelection(), ['a', 'b'])
    s = toggleSegment(s, 'outstanding')
    s = clearSelection(s)
    expect(s.selectedIds.size).toBe(0)
    expect(s.activeSegments.size).toBe(0)
  })

  it('clearSelection is a no-op when nothing is selected', () => {
    const s = emptySelection()
    expect(clearSelection(s)).toBe(s)
  })

  it('setMode flips the view; selectedIds untouched', () => {
    const s0 = addStudents(emptySelection(), ['a'])
    const s1 = setMode(s0, 'student')
    expect(s1.mode).toBe('student')
    expect(s1.selectedIds).toBe(s0.selectedIds)
  })

  it('setMode is a no-op when mode unchanged', () => {
    const s = setMode(emptySelection(), 'grade') // default IS grade
    expect(setMode(s, 'grade')).toBe(s)
  })
})

describe('gradeGroupState (tri-state)', () => {
  const students = [G4_A, G4_B, G4_C]

  it('off when none selected', () => {
    expect(gradeGroupState(emptySelection(), students)).toBe('off')
  })

  it("mixed when some selected", () => {
    const s = addStudents(emptySelection(), [G4_A.studentId])
    expect(gradeGroupState(s, students)).toBe('mixed')
  })

  it('on when all selected', () => {
    const s = addStudents(emptySelection(), students.map(x => x.studentId))
    expect(gradeGroupState(s, students)).toBe('on')
  })

  it('empty student list → off', () => {
    expect(gradeGroupState(emptySelection(), [])).toBe('off')
  })
})

describe('toggleGradeGroup (the per-row deselection power tool)', () => {
  const students = [G4_A, G4_B, G4_C]

  it('off → on (ticks every student in the group)', () => {
    const s = toggleGradeGroup(emptySelection(), students)
    expect([...s.selectedIds].sort()).toEqual(['g4-a', 'g4-b', 'g4-c'])
  })

  it('on → off (unticks every student in the group)', () => {
    let s = toggleGradeGroup(emptySelection(), students)
    s = toggleGradeGroup(s, students)
    expect(s.selectedIds.size).toBe(0)
  })

  it("mixed → on (only adds the unselected rest, doesn't toggle the picked ones)", () => {
    const s0 = addStudents(emptySelection(), [G4_A.studentId])
    const s1 = toggleGradeGroup(s0, students)
    expect([...s1.selectedIds].sort()).toEqual(['g4-a', 'g4-b', 'g4-c'])
  })

  it('per-row deselect inside a fully-ticked group is preserved', () => {
    // Tick the whole grade, then untick one student — the prototype's key
    // workflow. Resulting state has 2 of 3 selected.
    let s = toggleGradeGroup(emptySelection(), students)
    s = toggleStudent(s, G4_B.studentId)
    expect(s.selectedIds.has(G4_A.studentId)).toBe(true)
    expect(s.selectedIds.has(G4_B.studentId)).toBe(false)
    expect(s.selectedIds.has(G4_C.studentId)).toBe(true)
  })
})

describe('toggleSegment / applySegmentMembers', () => {
  it("toggleSegment flips chip on/off; doesn't touch selectedIds", () => {
    const s0 = addStudents(emptySelection(), ['ind-1'])
    const s1 = toggleSegment(s0, 'outstanding')
    expect(s1.activeSegments.has('outstanding')).toBe(true)
    expect(s1.selectedIds.has('ind-1')).toBe(true)
  })

  it('applySegmentMembers on toggle-ON adds members; toggle-OFF leaves selectedIds intact', () => {
    const s0 = emptySelection()
    const s1 = applySegmentMembers(s0, 'outstanding', ['a', 'b'])
    expect([...s1.selectedIds].sort()).toEqual(['a', 'b'])
    expect(s1.activeSegments.has('outstanding')).toBe(true)

    const s2 = applySegmentMembers(s1, 'outstanding', ['a', 'b'])
    expect(s2.activeSegments.has('outstanding')).toBe(false)
    // selectedIds preserved — operator may want to keep them
    expect([...s2.selectedIds].sort()).toEqual(['a', 'b'])
  })

  it('applySegmentMembers union-merges with existing individual ticks', () => {
    const s0 = addStudents(emptySelection(), ['ind-1'])
    const s1 = applySegmentMembers(s0, 'outstanding', ['seg-1', 'seg-2'])
    expect([...s1.selectedIds].sort()).toEqual(['ind-1', 'seg-1', 'seg-2'])
  })
})

describe('bucketByGrade', () => {
  it('groups students by grade, sorts buckets by canonical order, sorts names alphabetically inside', () => {
    const buckets = bucketByGrade([G5_E, G4_C, G4_A, G5_D, G4_B])
    expect(buckets.map(b => b.grade)).toEqual(['4', '5'])
    expect(buckets[0].students.map(s => s.fullName)).toEqual(['Alice', 'Bob', 'Charlie'])
    expect(buckets[1].students.map(s => s.fullName)).toEqual(['Dipa', 'Eli'])
  })

  it('puts unknown grades at the end', () => {
    const u = S('u-1', 'Unknown', 'Unk')
    const buckets = bucketByGrade([u, G4_A])
    expect(buckets.map(b => b.grade)).toEqual(['4', 'Unknown'])
  })

  it('returns empty array on empty input', () => {
    expect(bucketByGrade([])).toEqual([])
  })
})

describe('summarize (rail rollup)', () => {
  const all = [G4_A, G4_B, G4_C, G5_D, G5_E]

  it('zero selected → total 0, empty perGrade', () => {
    expect(summarize(emptySelection(), all)).toEqual({ total: 0, perGrade: [] })
  })

  it('mixed selection counts per grade in canonical order', () => {
    const s = addStudents(emptySelection(), [G4_A.studentId, G4_C.studentId, G5_E.studentId])
    expect(summarize(s, all)).toEqual({
      total: 3,
      perGrade: [
        { grade: '4', count: 2 },
        { grade: '5', count: 1 },
      ],
    })
  })
})
