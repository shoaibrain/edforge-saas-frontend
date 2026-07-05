import type {
  DataTableExportFormat,
  DataTableLabels,
  DataTableLabelsInput,
} from './types'

export const DEFAULT_DATA_TABLE_LABELS: DataTableLabels = {
  errorTitle: 'Failed to load data',
  errorDescription: 'An unexpected error occurred.',
  retry: 'Retry',
  clearSearch: 'Clear search',
  clearFilters: 'Clear filters',
  clearActiveFilters: (count) => `Clear (${count})`,
  clearSelection: 'Clear selection',
  selectedRows: (count) => `${count} selected`,
  paginationShowing: (start, end, total) =>
    `Showing ${start}-${end} of ${total} results`,
  rowsPerPage: (size) => `${size} / page`,
  previousPage: 'Prev',
  nextPage: 'Next',
  loadingPage: 'Loading...',
  rowDensity: 'Row density',
  comfortableDensity: 'Comfortable',
  comfortableDensityTitle: 'Comfortable rows',
  compactDensity: 'Compact',
  compactDensityTitle: 'Compact rows',
  viewOptions: 'View',
  toggleColumns: 'Toggle columns',
  moreFilters: 'More filters',
  export: 'Export',
  exportFormat: (format: DataTableExportFormat) =>
    format === 'csv' ? 'Export as CSV' : 'Export as XLSX',
  xlsxUnavailable: 'XLSX export ships in a follow-up',
  filterAriaLabel: (title) => `${title} filter`,
  clearFilter: 'Clear filter',
  statusLabel: 'Status',
  facetTotal: (total) => `${total} results`,
}

export function resolveDataTableLabels(
  labels?: DataTableLabelsInput
): DataTableLabels {
  return {
    ...DEFAULT_DATA_TABLE_LABELS,
    ...labels,
  }
}
