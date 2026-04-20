import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TenantBadge } from './TenantBadge'

describe('TenantBadge', () => {
  afterEach(cleanup)

  it('renders name + archetype + country for a PABSON NPL tenant', () => {
    const { getByTestId } = render(
      <TenantBadge
        tenantName="saraswatiboardingschool"
        archetype="PABSON"
        country="NPL"
      />,
    )
    const badge = getByTestId('tenant-badge')
    expect(badge.textContent).toContain('saraswatiboardingschool')
    expect(badge.textContent).toContain('PABSON')
    expect(badge.textContent).toContain('NPL')
    const aria = badge.getAttribute('aria-label')
    expect(aria).toContain('Tenant saraswatiboardingschool')
    expect(aria).toContain('archetype PABSON')
    expect(aria).toContain('country NPL')
  })

  it('renders name + archetype + country for a GENERIC USA tenant', () => {
    const { getByTestId } = render(
      <TenantBadge tenantName="demo-district" archetype="GENERIC" country="USA" />,
    )
    const badge = getByTestId('tenant-badge')
    expect(badge.textContent).toContain('demo-district')
    expect(badge.textContent).toContain('GENERIC')
    expect(badge.textContent).toContain('USA')
  })

  it('degrades gracefully when archetype is missing (legacy tenant)', () => {
    const { getByTestId } = render(
      <TenantBadge tenantName="legacy-tenant" country={null} archetype={null} />,
    )
    const badge = getByTestId('tenant-badge')
    expect(badge.textContent).toContain('legacy-tenant')
    expect(badge.textContent).not.toMatch(/PABSON|GENERIC|NPL|USA/)
  })

  it('returns null when everything is missing', () => {
    const { container } = render(<TenantBadge />)
    expect(container.firstChild).toBeNull()
  })
})
