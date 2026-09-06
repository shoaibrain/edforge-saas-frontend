/**
 * BillingSourceChip (FB-3.10 / FB-5.4 / FB-5.5) — locks the source → StatusBadge
 * tone mapping and the i18n label key so the chip reads consistently wherever
 * it's reused (bulk preview, provenance card, invoices-list filter).
 *
 * i18n is mocked to echo the key (same idiom as the M1.6 row-download spec) so
 * we assert on the resolved `billingSource.*` key rather than dragging in the
 * full @edforge/i18n init.
 */

import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const tMock = vi.fn((key: string) => key)
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: tMock }),
}))

const { BillingSourceChip } = await import('../BillingSourceChip')

describe('BillingSourceChip', () => {
  it('renders the billingSource i18n label for each source', () => {
    for (const source of ['standard', 'agreement', 'mixed'] as const) {
      const { container } = render(<BillingSourceChip source={source} />)
      expect(container.textContent).toContain(`billingSource.${source}`)
    }
  })

  it('maps standard → neutral tone (background-tertiary token)', () => {
    const { container } = render(<BillingSourceChip source="standard" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('background-tertiary')
  })

  it('maps agreement → info tone and mixed → warning tone', () => {
    const agreement = render(<BillingSourceChip source="agreement" />)
    expect(agreement.container.querySelector('span')?.className).toContain('state-info')

    const mixed = render(<BillingSourceChip source="mixed" />)
    expect(mixed.container.querySelector('span')?.className).toContain('state-warning')
  })
})
