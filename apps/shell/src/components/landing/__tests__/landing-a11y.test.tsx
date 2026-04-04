import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * Landing page accessibility assertions.
 *
 * These verify semantic HTML, ARIA attributes, heading hierarchy,
 * and touch target sizes without requiring axe-core (which can be
 * added later for full WCAG automated scanning).
 */

// Minimal mock for TanStack Router's Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock avatar utils
vi.mock('../../../../lib/avatar', () => ({
  getUserAvatar: () => 'data:image/svg+xml,<svg/>',
  getStudentAvatar: () => 'data:image/svg+xml,<svg/>',
  getStaffAvatar: () => 'data:image/svg+xml,<svg/>',
}))

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
  LineChart: () => <div data-testid="line-chart" />,
  PieChart: () => <div data-testid="pie-chart" />,
  Area: () => null,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}))

// Mock custom hooks
vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}))

describe('Dashboard heading hierarchy', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('TeacherParentDashboard does not render an <h1>', async () => {
    const { TeacherParentDashboard } = await import('../dashboards/TeacherParentDashboard')
    const { container } = render(<TeacherParentDashboard activeState="classroom" />)
    const h1Elements = container.querySelectorAll('h1')
    expect(h1Elements).toHaveLength(0)
  })

  it('StudentDashboard does not render an <h1>', async () => {
    const { StudentDashboard } = await import('../dashboards/StudentDashboard')
    const { container } = render(<StudentDashboard activeState="learning" />)
    const h1Elements = container.querySelectorAll('h1')
    expect(h1Elements).toHaveLength(0)
  })

  it('AdminDashboard does not render an <h1>', async () => {
    const { AdminDashboard } = await import('../dashboards/AdminDashboard')
    const { container } = render(<AdminDashboard activeState="overview" />)
    const h1Elements = container.querySelectorAll('h1')
    expect(h1Elements).toHaveLength(0)
  })
})

describe('Dashboard ARIA attributes', () => {
  it('AdminDashboard has role="img" and aria-label', async () => {
    const { AdminDashboard } = await import('../dashboards/AdminDashboard')
    const { container } = render(<AdminDashboard activeState="overview" />)
    const dashboardEl = container.firstElementChild as HTMLElement
    expect(dashboardEl.getAttribute('role')).toBe('img')
    expect(dashboardEl.getAttribute('aria-label')).toBeTruthy()
  })

  it('TeacherParentDashboard has role="img" and aria-label', async () => {
    const { TeacherParentDashboard } = await import('../dashboards/TeacherParentDashboard')
    const { container } = render(<TeacherParentDashboard activeState="classroom" />)
    const dashboardEl = container.firstElementChild as HTMLElement
    expect(dashboardEl.getAttribute('role')).toBe('img')
    expect(dashboardEl.getAttribute('aria-label')).toBeTruthy()
  })

  it('StudentDashboard has role="img" and aria-label', async () => {
    const { StudentDashboard } = await import('../dashboards/StudentDashboard')
    const { container } = render(<StudentDashboard activeState="learning" />)
    const dashboardEl = container.firstElementChild as HTMLElement
    expect(dashboardEl.getAttribute('role')).toBe('img')
    expect(dashboardEl.getAttribute('aria-label')).toBeTruthy()
  })
})

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('dismiss button has minimum 44px touch target', async () => {
    const { AnnouncementBanner } = await import('../sections/AnnouncementBanner')
    render(<AnnouncementBanner />)
    const dismissBtn = screen.getByLabelText('Dismiss announcement')
    expect(dismissBtn.classList.contains('min-w-[44px]')).toBe(true)
    expect(dismissBtn.classList.contains('min-h-[44px]')).toBe(true)
  })
})

describe('Footer', () => {
  it('has a <nav> with aria-label', async () => {
    const { Footer } = await import('../Footer')
    const { container } = render(<Footer />)
    const nav = container.querySelector('nav')
    expect(nav).toBeTruthy()
    expect(nav?.getAttribute('aria-label')).toBe('Footer navigation')
  })

  it('uses single-column grid at smallest breakpoint', async () => {
    const { Footer } = await import('../Footer')
    const { container } = render(<Footer />)
    const nav = container.querySelector('nav')
    expect(nav?.classList.contains('grid-cols-1')).toBe(true)
  })
})
