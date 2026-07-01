/**
 * StatBand contract (S0 scaffold → filled in S1).
 *
 * Executable spec for the unified KPI stat band. Each `it.todo` below is a
 * contract line the S1 implementation turns green one at a time. See
 * docs/design-system/handoff-token-map.md for the state → token resolution.
 */
import { describe, it } from 'vitest'

describe('StatBand contract', () => {
  it.todo('renders one segment per metric from the metrics config')
  it.todo('drives the single accent color from each metric.state (calm by default)')
  it.todo('renders a neutral segment for state="normal" (no semantic color)')
  it.todo('renders exactly one micro-viz per metric (delta | pill | meter | donut)')
  it.todo('renders the delta chip with up/down tone')
  it.todo('renders the status pill by composing StatusPill')
  it.todo('renders the SABER meter by composing AnimatedProgressBar with a target notch')
  it.todo('renders the readiness donut by composing the shared Ring primitive')
  it.todo('applies the live pulse only for state="live"')
  it.todo('exposes each segment as role="status" with an accessible label')
  it.todo('disables entrance/pulse motion under prefers-reduced-motion')
  it.todo('uses logical properties so the band mirrors correctly under dir="rtl"')
})
