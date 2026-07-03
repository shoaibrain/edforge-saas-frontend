import type { SelectionContextBarLabels } from './SelectionContextBar'

/** English defaults — apps pass localized labels (mirrors data-table/labels). */
export const DEFAULT_SELECTION_LABELS: SelectionContextBarLabels = {
  selected: (count) => `${count} selected`,
  selectAll: (total) => `Select all ${total}`,
  clear: 'Clear selection',
}
