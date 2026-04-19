import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PILLAR_VISUALS, type PillarVisualId } from '../sections/pillars/visuals'

const IDS = Object.keys(PILLAR_VISUALS) as PillarVisualId[]

describe('PillarVisuals registry', () => {
  afterEach(() => cleanup())

  it('exposes 6 visuals for the expected module ids', () => {
    expect(IDS.sort()).toEqual(
      ['core', 'analytics', 'finance', 'chat', 'calendar', 'api'].sort()
    )
  })

  it.each(IDS)('each visual `%s` renders without error and has a hex palette', (id) => {
    const meta = PILLAR_VISUALS[id]
    expect(meta.palette.bg).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(meta.palette.ink).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(meta.palette.accent).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const { container } = render(<>{meta.render(meta.palette)}</>)
    expect(container.firstChild).toBeTruthy()
  })

  it('core visual shows 4 student rows', () => {
    const { container } = render(
      <>{PILLAR_VISUALS.core.render(PILLAR_VISUALS.core.palette)}</>
    )
    expect(container.textContent).toMatch(/Alex Morgan/)
    expect(container.textContent).toMatch(/Bria Chen/)
    expect(container.textContent).toMatch(/Cam Patel/)
    expect(container.textContent).toMatch(/Dani Ruiz/)
  })

  it('analytics visual shows the +12.4% headline', () => {
    const { getByText } = render(
      <>{PILLAR_VISUALS.analytics.render(PILLAR_VISUALS.analytics.palette)}</>
    )
    expect(getByText('+12.4%')).toBeInTheDocument()
  })

  it('finance visual shows the $4.2M headline + progressbar at 62%', () => {
    const { getByText, getByRole } = render(
      <>{PILLAR_VISUALS.finance.render(PILLAR_VISUALS.finance.palette)}</>
    )
    expect(getByText('$4.2M')).toBeInTheDocument()
    const bar = getByRole('progressbar', { name: /budget allocation/i })
    expect(bar.getAttribute('aria-valuenow')).toBe('62')
  })

  it('chat visual shows EN + ES language tags', () => {
    const { getByText } = render(
      <>{PILLAR_VISUALS.chat.render(PILLAR_VISUALS.chat.palette)}</>
    )
    expect(getByText('EN')).toBeInTheDocument()
    expect(getByText('ES')).toBeInTheDocument()
  })

  it('calendar visual shows the MARCH 2026 label', () => {
    const { getByText } = render(
      <>{PILLAR_VISUALS.calendar.render(PILLAR_VISUALS.calendar.palette)}</>
    )
    expect(getByText('MARCH 2026')).toBeInTheDocument()
  })

  it('api visual shows a POST /v1/students code block', () => {
    const { getByText } = render(
      <>{PILLAR_VISUALS.api.render(PILLAR_VISUALS.api.palette)}</>
    )
    expect(getByText('POST')).toBeInTheDocument()
    expect(getByText('/v1/students')).toBeInTheDocument()
  })
})
