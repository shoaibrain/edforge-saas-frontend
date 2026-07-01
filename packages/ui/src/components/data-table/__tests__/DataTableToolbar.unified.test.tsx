/**
 * Unified TableToolbar contract (S0 scaffold → filled in S1).
 *
 * The unified toolbar docks status presets (TablePresetTabs), a primary facet,
 * "More filters", and a quiet right cluster (density · columns · export) around
 * a single search field, and swaps in a bulk-action bar (TableBulkBar) with the
 * same footprint on selection. The existing DataTable data wiring is preserved.
 */
import { describe, it } from 'vitest'

describe('unified TableToolbar contract', () => {
  it.todo('renders the docked status presets from the presets config')
  it.todo('marks the active preset and shows per-preset counts')
  it.todo('supports keyboard navigation across presets (roving tabindex)')
  it.todo('renders a single search field (no second search box)')
  it.todo('swaps the toolbar row for the bulk-action bar on selection with no height change')
  it.todo('keeps existing DataTable search/facet/pagination behavior intact')
})
