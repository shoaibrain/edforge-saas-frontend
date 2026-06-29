import { useCallback, useMemo } from 'react'
import {
  normalizeLocaleCode,
  useTranslation,
  type LocaleCode,
} from '@edforge/i18n'
import enAcademics from '@edforge/i18n/locales/en/academics.json'
import type { DataTableExportFormat, DataTableLabels } from '@edforge/ui'
import type { AttendanceStatus } from '../services/academics.service'

const DATE_FALLBACK = '—'
type TranslateOptions = Record<string, unknown> & { defaultValue?: string; count?: number | string }

const ATTENDANCE_STATUS_LABEL_FALLBACKS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Tardy',
  excused: 'Excused',
  remote: 'Remote',
  half_day: 'Half Day',
  early_departure: 'Early Dep.',
}

function humanizeEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function lookupFallback(key: string, options?: TranslateOptions): string | undefined {
  const pluralKey =
    typeof options?.count === 'number' &&
    options.count !== 1 &&
    getStringByPath(enAcademics, `${key}_plural`)
      ? `${key}_plural`
      : key
  return getStringByPath(enAcademics, pluralKey)
}

function getStringByPath(source: unknown, key: string): string | undefined {
  let cursor: unknown = source
  for (const segment of key.split('.')) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return typeof cursor === 'string' ? cursor : undefined
}

function interpolate(template: string, options?: TranslateOptions): string {
  if (!options) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token) => {
    const value = options[token]
    return value == null ? match : String(value)
  })
}

export function useAcademicsI18n() {
  const { t: rawT, i18n } = useTranslation('academics')
  const locale = normalizeLocaleCode(i18n.language) as LocaleCode

  const t = useCallback(
    (key: string, options?: TranslateOptions): string => {
      const translated = rawT(key, options as never) as unknown
      if (typeof translated === 'string' && translated !== key) return translated
      const fallback = options?.defaultValue ?? lookupFallback(key, options) ?? key
      return interpolate(fallback, options)
    },
    [rawT],
  )

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  )

  const formatDate = useCallback(
    (
      value: string | Date | null | undefined,
      options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    ) => {
      if (!value) return DATE_FALLBACK
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return DATE_FALLBACK
      return new Intl.DateTimeFormat(locale, options).format(date)
    },
    [locale],
  )

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined) =>
      formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [formatDate],
  )

  const enumLabel = useCallback(
    (keyPrefix: string, value: string | null | undefined) => {
      if (!value) return DATE_FALLBACK
      return t(`${keyPrefix}.${value}`, { defaultValue: humanizeEnum(value) })
    },
    [t],
  )

  const attendanceStatusLabel = useCallback(
    (value: AttendanceStatus | null | undefined) => {
      if (!value) return DATE_FALLBACK
      return t(`attendance.status.${value}.label`, {
        defaultValue: ATTENDANCE_STATUS_LABEL_FALLBACKS[value] ?? humanizeEnum(value),
      })
    },
    [t],
  )

  const attendanceStatusShortLabel = useCallback(
    (value: AttendanceStatus | null | undefined, fallback = '') => {
      if (!value) return fallback
      return t(`attendance.status.${value}.short`, { defaultValue: fallback || humanizeEnum(value) })
    },
    [t],
  )

  const dataTableLabels = useMemo<DataTableLabels>(
    () => ({
      errorTitle: t('dataTable.errorTitle'),
      errorDescription: t('dataTable.errorDescription'),
      retry: t('dataTable.retry'),
      clearSearch: t('dataTable.clearSearch'),
      clearFilters: t('dataTable.clearFilters'),
      clearActiveFilters: (count) => t('dataTable.clearActiveFilters', { count }),
      clearSelection: t('dataTable.clearSelection'),
      selectedRows: (count) => t('dataTable.selectedRows', { count }),
      paginationShowing: (start, end, total) =>
        t('dataTable.paginationShowing', { start, end, total }),
      rowsPerPage: (size) => t('dataTable.rowsPerPage', { size }),
      previousPage: t('dataTable.previousPage'),
      nextPage: t('dataTable.nextPage'),
      loadingPage: t('dataTable.loadingPage'),
      rowDensity: t('dataTable.rowDensity'),
      comfortableDensity: t('dataTable.comfortableDensity'),
      comfortableDensityTitle: t('dataTable.comfortableDensityTitle'),
      compactDensity: t('dataTable.compactDensity'),
      compactDensityTitle: t('dataTable.compactDensityTitle'),
      viewOptions: t('dataTable.viewOptions'),
      toggleColumns: t('dataTable.toggleColumns'),
      export: t('dataTable.export'),
      exportFormat: (format: DataTableExportFormat) =>
        t(`dataTable.exportFormats.${format}`),
      xlsxUnavailable: t('dataTable.xlsxUnavailable'),
      filterAriaLabel: (title) => t('dataTable.filterAriaLabel', { title }),
      clearFilter: t('dataTable.clearFilter'),
    }),
    [t],
  )

  return {
    t,
    i18n,
    locale,
    dataTableLabels,
    formatNumber,
    formatDate,
    formatDateTime,
    enumLabel,
    attendanceStatusLabel,
    attendanceStatusShortLabel,
  }
}
