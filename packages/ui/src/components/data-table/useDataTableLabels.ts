import { useTranslation } from 'react-i18next'
import type { DataTableExportFormat, DataTableLabelsInput } from './types'

/**
 * Translated DataTable labels, sourced from the `common:dataTable.*` i18n keys.
 *
 * Wired as the default inside `<DataTable>`, so every table's toolbar and
 * pagination is localized (incl. Arabic RTL) without each consumer threading a
 * `labels` prop. An explicit `labels` prop still overrides these. Each string
 * carries its English `defaultValue`, so the hook degrades gracefully to
 * English when i18n isn't initialized (e.g. isolated component tests).
 */
export function useDataTableLabels(): DataTableLabelsInput {
  const { t } = useTranslation('common')
  const d = (key: string, defaultValue: string, opts?: Record<string, unknown>) =>
    t(`dataTable.${key}`, { defaultValue, ...opts })

  return {
    errorTitle: d('errorTitle', 'Failed to load data'),
    errorDescription: d('errorDescription', 'An unexpected error occurred.'),
    retry: d('retry', 'Retry'),
    clearSearch: d('clearSearch', 'Clear search'),
    clearFilters: d('clearFilters', 'Clear filters'),
    clearActiveFilters: (count) => d('clearActiveFilters', `Clear (${count})`, { count }),
    clearSelection: d('clearSelection', 'Clear selection'),
    selectedRows: (count) => d('selectedRows', `${count} selected`, { count }),
    paginationShowing: (start, end, total) =>
      d('paginationShowing', `Showing ${start}-${end} of ${total} results`, {
        start,
        end,
        total,
      }),
    rowsPerPage: (size) => d('rowsPerPage', `${size} / page`, { size }),
    previousPage: d('previousPage', 'Prev'),
    nextPage: d('nextPage', 'Next'),
    loadingPage: d('loadingPage', 'Loading...'),
    rowDensity: d('rowDensity', 'Row density'),
    comfortableDensity: d('comfortableDensity', 'Comfortable'),
    comfortableDensityTitle: d('comfortableDensityTitle', 'Comfortable rows'),
    compactDensity: d('compactDensity', 'Compact'),
    compactDensityTitle: d('compactDensityTitle', 'Compact rows'),
    viewOptions: d('viewOptions', 'View'),
    toggleColumns: d('toggleColumns', 'Toggle columns'),
    moreFilters: d('moreFilters', 'More filters'),
    export: d('export', 'Export'),
    exportFormat: (format: DataTableExportFormat) =>
      format === 'csv' ? d('exportCsv', 'Export as CSV') : d('exportXlsx', 'Export as XLSX'),
    xlsxUnavailable: d('xlsxUnavailable', 'XLSX export ships in a follow-up'),
    filterAriaLabel: (title) => d('filterAriaLabel', `${title} filter`, { title }),
    clearFilter: d('clearFilter', 'Clear filter'),
    statusLabel: d('statusLabel', 'Status'),
    facetTotal: (total) => d('facetTotal', `${total} results`, { total }),
  }
}
