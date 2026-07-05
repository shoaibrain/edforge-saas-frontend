import { useCallback, useEffect, useRef } from 'react'
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { DataTableDensity } from '../types'

const STORAGE_PREFIX = 'dt:'
const SCHEMA_VERSION = 1

export interface PersistedTableState {
  v?: number
  density?: DataTableDensity
  columnVisibility?: VisibilityState
  pageSize?: number
  columnFilters?: ColumnFiltersState
  sorting?: SortingState
  /** Persisted search text (the table's global filter). Optional; back-compat. */
  globalFilter?: string
}

function readKey(tableId: string): PersistedTableState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + tableId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedTableState
    if (parsed.v !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeKey(tableId: string, value: PersistedTableState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + tableId,
      JSON.stringify({ v: SCHEMA_VERSION, ...value })
    )
  } catch {
    // localStorage can throw under quota / private mode — silently degrade.
  }
}

/**
 * Read-once snapshot of a table's persisted state. Returns `null` when the
 * tableId is unset or storage is empty / corrupt. Safe to call during render.
 */
export function readPersistedTableState(
  tableId: string | undefined
): PersistedTableState | null {
  if (!tableId) return null
  return readKey(tableId)
}

/**
 * Debounced writer hook. Whenever `value` changes the hook schedules a single
 * write on the next animation frame, coalescing rapid bursts (e.g. typing in
 * the search box). No-op when `tableId` is falsy.
 */
export function usePersistTableState(
  tableId: string | undefined,
  value: PersistedTableState
): void {
  const frameRef = useRef<number | null>(null)

  // We stringify once per render so dependency comparison is cheap and stable.
  const serialized = JSON.stringify(value)

  useEffect(() => {
    if (!tableId) return
    if (typeof window === 'undefined') return
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
    }
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      writeKey(tableId, JSON.parse(serialized) as PersistedTableState)
    })
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [tableId, serialized])
}

/** Imperative clear — exposed for tests / dev tools. */
export function clearPersistedTableState(tableId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + tableId)
  } catch {
    // no-op
  }
}

/** Helper: a memoised setter you can pass to the resolved table density. */
export function useDensitySetter(
  tableId: string | undefined,
  setDensity: (d: DataTableDensity) => void
): (d: DataTableDensity) => void {
  return useCallback(
    (d) => {
      setDensity(d)
      // The shared persistence effect picks it up; nothing to do here.
      void tableId
    },
    [tableId, setDensity]
  )
}
