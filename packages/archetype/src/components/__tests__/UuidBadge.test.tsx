/**
 * UuidBadge — dedicated unit tests.
 *
 * Covers clipboard guard behaviour, copy-state transitions, short-value
 * pass-through, and a11y attributes not exercised by the EntityIdDisplay
 * integration tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { UuidBadge } from '../UuidBadge'

afterEach(cleanup)

// ─── truncateUuid ────────────────────────────────────────────────────────────

describe('UuidBadge — truncation behaviour', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('does NOT truncate a value of 13 characters or fewer (boundary)', () => {
    const short = 'S-1234567890A' // exactly 13 chars
    const { container } = render(<UuidBadge value={short} />)
    expect(container.textContent).toContain(short)
    expect(container.textContent).not.toContain('…')
  })

  it('truncates a value of exactly 14 characters to first8…last4', () => {
    const v = '1234567890ABCD' // 14 chars → "12345678…ABCD"
    const { container } = render(<UuidBadge value={v} />)
    expect(container.textContent).toContain('12345678…ABCD')
    expect(container.textContent).not.toContain(v) // raw not present
  })

  it('uses first 8 and last 4 of a full UUID', () => {
    const uuid = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff'
    const { container } = render(<UuidBadge value={uuid} />)
    expect(container.textContent).toContain('aaaabbbb…ffff')
  })

  it('exposes the full value via the title attribute (tooltip) without truncation', () => {
    const uuid = '41136dda-a0e1-7083-7cb2-985af50d8280'
    const { container } = render(<UuidBadge value={uuid} />)
    const span = container.querySelector('[title]')
    expect(span?.getAttribute('title')).toBe(uuid)
  })
})

// ─── clipboard guard (insecure context / blocked API) ────────────────────────

describe('UuidBadge — clipboard API guard', () => {
  it('does not crash when navigator.clipboard is undefined', () => {
    // Simulate an insecure context where the API is absent entirely
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })

    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    expect(() => fireEvent.click(getByRole('button'))).not.toThrow()

    // Restore
    if (original) Object.defineProperty(navigator, 'clipboard', original)
    else Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  })

  it('does not crash when navigator.clipboard.writeText is undefined', () => {
    Object.assign(navigator, { clipboard: {} }) // present but no writeText
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    expect(() => fireEvent.click(getByRole('button'))).not.toThrow()
  })

  it('does not throw or change copied state when writeText rejects', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('NotAllowedError')) },
    })
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    const button = getByRole('button')
    // No state change — aria-label stays 'copy'
    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })
    // After rejected write, button should NOT show 'copied' aria-label
    expect(button.getAttribute('aria-label')).toBe('copy')
  })
})

// ─── copy-state transitions ───────────────────────────────────────────────────

describe('UuidBadge — copy-state (✓ flash) behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the "copied" aria-label immediately after a successful copy', async () => {
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    const button = getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('copy')

    await act(async () => {
      fireEvent.click(button)
      // Let the microtask (resolved promise) run
      await Promise.resolve()
    })

    expect(button.getAttribute('aria-label')).toBe('copied')
  })

  it('reverts from "copied" back to "copy" after 1500 ms', async () => {
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    const button = getByRole('button')

    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })

    expect(button.getAttribute('aria-label')).toBe('copied')

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    expect(button.getAttribute('aria-label')).toBe('copy')
  })

  it('shows ✓ icon while copied and reverts to ⧉ after timeout', async () => {
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    const button = getByRole('button')
    expect(button.textContent).toBe('⧉')

    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })

    expect(button.textContent).toBe('✓')

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    expect(button.textContent).toBe('⧉')
  })
})

// ─── masked rendering ─────────────────────────────────────────────────────────

describe('UuidBadge — masked prop', () => {
  it('shows the maskedIdentifier aria-label when masked', () => {
    const { container } = render(
      <UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" masked />,
    )
    const span = container.querySelector('[aria-label]')
    expect(span?.getAttribute('aria-label')).toBe('maskedIdentifier')
  })

  it('renders no copy button when masked', () => {
    const { queryByRole } = render(
      <UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" masked />,
    )
    expect(queryByRole('button')).toBeNull()
  })

  it('renders dots (not the UUID digits) when masked', () => {
    const { container } = render(
      <UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" masked />,
    )
    expect(container.textContent).not.toContain('41136dda')
    expect(container.textContent).toContain('••••••••')
  })
})