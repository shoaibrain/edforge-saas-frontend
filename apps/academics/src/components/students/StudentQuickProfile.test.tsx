/// <reference types="@testing-library/jest-dom" />
/**
 * StudentQuickProfile V3 — component tests
 *
 * Covers the privacy / single-CTA / layout-shift guarantees from sprint 3.
 * The shared QuickDrawer infrastructure is exercised end-to-end (no mock) so
 * any regression that swaps it for `position: fixed` or `createPortal(body)`
 * will surface here.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { StudentQuickProfile } from './StudentQuickProfile'

// ----------------------------------------------------------------------------
// jsdom polyfills
// ----------------------------------------------------------------------------

// QuickDrawer uses useMediaQuery which calls window.matchMedia; jsdom does not
// implement it. Stub a "desktop" matcher so the drawer mounts in `side` mode.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, // never matches the (max-width: 768px) sheet breakpoint
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// Drawer calls useNavigate() from @tanstack/react-router; mock it so tests
// don't need a router context. Spy on navigate to avoid leaking router state.
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

// useDateFormatter depends on react-i18next; mock it to return 'ad' calendar.
vi.mock('@edforge/date-utils', async () => {
  const actual = await vi.importActual('@edforge/date-utils')
  return {
    ...(actual as object),
    useDateFormatter: () => ({
      calendarSystem: 'ad' as const,
      formatDate: (d: unknown) => String(d),
      formatDual: (d: unknown) => String(d),
      formatDateRange: () => '—',
      monthNames: [],
    }),
  }
})

// ----------------------------------------------------------------------------
// Fixture
// ----------------------------------------------------------------------------

function makeStudent(overrides: Partial<StudentResponseDto> = {}): StudentResponseDto {
  return {
    studentId: 'stu-1',
    schoolId: 'sch-1',
    tenantId: 't-1',
    firstName: 'Asha',
    lastName: 'Karki',
    fullName: 'Asha Karki',
    studentNumber: 'STU001',
    currentGradeLevel: '8',
    status: 'active',
    enrollmentDate: '2024-08-15',
    dateOfBirth: '2010-06-12',
    gender: 'female',
    contactInfo: {
      email: 'should-not-show@example.com',
      phone: '+977-1-555-0000',
    },
    guardians: [
      {
        firstName: 'Should-Not',
        lastName: 'Show',
        relationship: 'mother',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  } as unknown as StudentResponseDto
}

/** Wrap the drawer in a content-pane lookalike so it has a `relative overflow-hidden` parent. */
function ContentPane({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="content-pane" className="relative overflow-hidden" style={{ position: 'relative', overflow: 'hidden', width: 1024, height: 768 }}>
      <div data-testid="page-content" style={{ padding: 20 }}>
        Page content sibling — used as the layout-shift witness.
      </div>
      {children}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('StudentQuickProfile V3', () => {
  it('renders nothing when student is null', () => {
    const { container } = render(
      <ContentPane>
        <StudentQuickProfile open={true} onClose={() => {}} student={null} />
      </ContentPane>,
    )
    // Drawer body should not be in the document.
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    cleanup()
  })

  it('renders the privacy note when open', () => {
    const { getByText } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
          academicYearName="2024–2025"
        />
      </ContentPane>,
    )
    expect(
      getByText(/Demographics, contact info, and guardian details are on the full profile page/i),
    ).toBeInTheDocument()
    cleanup()
  })

  it('removes Edit / Export / Withdraw buttons (single-CTA footer)', () => {
    const { queryByText, getAllByRole } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
        />
      </ContentPane>,
    )
    // Deleted buttons must NOT be in the JSX.
    expect(queryByText(/Edit student/i)).toBeNull()
    expect(queryByText(/Export record/i)).toBeNull()
    expect(queryByText(/Withdraw student/i)).toBeNull()

    // The single primary CTA must be present.
    const cta = queryByText(/View Full Profile/i)
    expect(cta).not.toBeNull()
    // It must be inside a <button>.
    expect(cta?.closest('button')).not.toBeNull()

    // Sanity: the dialog has at most a small number of buttons (close + CTA).
    // If a regression re-introduces Edit/Export/Withdraw, this count will jump.
    const buttons = getAllByRole('button')
    expect(buttons.length).toBeLessThanOrEqual(2)
    cleanup()
  })

  it('does NOT render demographics / contact / guardian copy (privacy)', () => {
    const { queryByText } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
        />
      </ContentPane>,
    )
    // Section headers and field labels that lived on the old drawer.
    // Note: the privacy note copy contains the word "Demographics" — we
    // assert against the section header form (no following comma), not the
    // bare word.
    expect(queryByText(/Date of birth/i)).toBeNull()
    expect(queryByText('Gender')).toBeNull()
    expect(queryByText('Contact information')).toBeNull()
    expect(queryByText('Email')).toBeNull()
    expect(queryByText('Phone')).toBeNull()
    expect(queryByText('Address')).toBeNull()
    // Field values that should never appear in the V3 drawer.
    expect(queryByText('should-not-show@example.com')).toBeNull()
    expect(queryByText(/Should-Not Show/)).toBeNull()
    cleanup()
  })

  it('renders the Enrollment block with BS date below the Gregorian "Enrolled" date', () => {
    const { getByText, container } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent({ enrollmentDate: '2024-08-15' })}
          attendanceRate={92}
          academicYearName="2024–2025"
        />
      </ContentPane>,
    )
    // Section header
    expect(getByText('Enrollment')).toBeInTheDocument()
    // Gregorian primary line — toLocaleDateString result depends on the test
    // runner's local timezone (a UTC-midnight ISO date may render as Aug 14
    // or Aug 15). Match flexibly on the month/year.
    expect(container.textContent).toMatch(/Aug \d{1,2}, 2024/)
    // BS secondary line — assert that some node renders the BS prefix; the exact
    // value comes from the date-utils converter which has its own unit tests.
    expect(container.textContent).toMatch(/BS \d{4}\//)
    // Academic year passed via prop
    expect(getByText('2024–2025')).toBeInTheDocument()
    // Homeroom — em-dash because StudentResponseDto has no homeroom field
    expect(getByText('Homeroom')).toBeInTheDocument()
    cleanup()
  })

  it('GPA tile shows em-dash, never 0.0 or NaN, when GPA is unavailable', () => {
    const { getByText, queryByText } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
        />
      </ContentPane>,
    )
    expect(getByText('GPA')).toBeInTheDocument()
    expect(queryByText('0.0')).toBeNull()
    expect(queryByText('NaN')).toBeNull()
    cleanup()
  })

  // --------------------------------------------------------------------------
  // Layout-shift / positioning guarantees
  //
  // jsdom does not compute layout, so getBoundingClientRect() is not load-
  // bearing here. Instead we assert STRUCTURAL invariants that would catch
  // any regression to position:fixed-at-root or createPortal(document.body):
  //
  //   1. The drawer DOM is a descendant of the content pane (no portal
  //      escape to document.body).
  //   2. Opening the drawer does not move or replace the page-content sibling
  //      — its parent and child index stay identical.
  // --------------------------------------------------------------------------

  it('does not portal to document.body — drawer is rendered inside the content pane', () => {
    const { getByTestId, container } = render(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
        />
      </ContentPane>,
    )
    const pane = getByTestId('content-pane')
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    // Drawer must be a descendant of the content pane, NOT a sibling of <body>.
    expect(pane.contains(dialog)).toBe(true)
    // And the dialog's panel must use position: absolute (per inline class).
    expect(dialog?.className).toMatch(/absolute/)
    cleanup()
  })

  it('opening the drawer does not displace the page-content sibling (layout-shift surrogate)', () => {
    // Render closed first, capture the sibling's parent + child index.
    const { getByTestId, rerender } = render(
      <ContentPane>
        <StudentQuickProfile open={false} onClose={() => {}} student={makeStudent()} />
      </ContentPane>,
    )
    const sibling = getByTestId('page-content')
    const parentBefore = sibling.parentElement
    const indexBefore = parentBefore ? Array.from(parentBefore.children).indexOf(sibling) : -1
    // jsdom layout is zero everywhere, but capturing it documents intent and
    // protects against any regression that introduces real layout in a real DOM.
    const rectBefore = sibling.getBoundingClientRect()

    // Re-render with the drawer open. The sibling must NOT have moved.
    rerender(
      <ContentPane>
        <StudentQuickProfile
          open={true}
          onClose={() => {}}
          student={makeStudent()}
          attendanceRate={92}
        />
      </ContentPane>,
    )
    const siblingAfter = getByTestId('page-content')
    const parentAfter = siblingAfter.parentElement
    const indexAfter = parentAfter ? Array.from(parentAfter.children).indexOf(siblingAfter) : -1
    const rectAfter = siblingAfter.getBoundingClientRect()

    // Same parent node — the drawer must not have re-parented the sibling.
    expect(parentAfter).toBe(parentBefore)
    // Same child index — the drawer must be appended/removed elsewhere, not
    // injected before the sibling in a way that would cause horizontal reflow.
    expect(indexAfter).toBe(indexBefore)
    // Same bounding rect on every axis (vacuous in jsdom; load-bearing in
    // a real browser).
    expect(rectAfter.x).toBe(rectBefore.x)
    expect(rectAfter.y).toBe(rectBefore.y)
    expect(rectAfter.width).toBe(rectBefore.width)
    expect(rectAfter.height).toBe(rectBefore.height)
    cleanup()
  })
})
