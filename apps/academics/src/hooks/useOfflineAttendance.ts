/**
 * useOfflineAttendance Hook
 *
 * Provides offline-resilient attendance state management.
 * - Saves to localStorage on every status change
 * - Auto-saves to server every 30 seconds
 * - Tracks online/offline state
 * - Retries failed saves on reconnect
 *
 * Task 1.15: Fix partial-save data loss — only clear entries that succeeded
 * Task 5.1: localStorage cleanup + quota handling
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AttendanceStatus, BulkAttendanceResponse } from '../services/academics.service'

export type SaveStatus = 'idle' | 'saved' | 'saving' | 'offline' | 'error'

interface AttendanceEntry {
  studentId: string
  status: AttendanceStatus | null
  notes: string
}

interface OfflineAttendanceState {
  entries: AttendanceEntry[]
  lastSavedAt: number | null
  dirty: boolean
}

const STORAGE_PREFIX = 'attendance:'
const AUTO_SAVE_INTERVAL_MS = 30 * 1000 // 30 seconds
const CLEANUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getStorageKey(schoolId: string, sectionId: string, date: string) {
  return `${STORAGE_PREFIX}${schoolId}:${sectionId}:${date}`
}

function loadFromStorage(key: string): OfflineAttendanceState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as OfflineAttendanceState
  } catch {
    return null
  }
}

function saveToStorage(key: string, state: OfflineAttendanceState) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error: any) {
    // Task 5.1: Handle QuotaExceededError
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      cleanupOldEntries()
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {
        console.warn('Failed to save attendance to localStorage after cleanup:', error)
      }
    } else {
      console.warn('Failed to save attendance to localStorage:', error)
    }
  }
}

function clearStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently ignore storage errors
  }
}

/**
 * Task 5.1: Clean up old attendance entries from localStorage
 * Removes clean (non-dirty) entries older than 7 days
 */
function cleanupOldEntries() {
  try {
    const now = Date.now()
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key)
      }
    }
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const state = JSON.parse(raw) as OfflineAttendanceState
        // Only evict clean (non-dirty) entries older than 7 days
        if (!state.dirty && state.lastSavedAt && (now - state.lastSavedAt) > CLEANUP_MAX_AGE_MS) {
          localStorage.removeItem(key)
        }
      } catch {
        // Skip malformed entries
      }
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

interface UseOfflineAttendanceOptions {
  schoolId: string
  sectionId: string
  date: string
  // Task 1.15: Updated to return BulkAttendanceResponse so we can inspect errors
  onSave: (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string; studentName?: string }>) => Promise<BulkAttendanceResponse | void>
}

export function useOfflineAttendance({
  schoolId,
  sectionId,
  date,
  onSave,
}: UseOfflineAttendanceOptions) {
  const storageKey = getStorageKey(schoolId, sectionId, date)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const dirtyRef = useRef(false)
  const entriesRef = useRef<AttendanceEntry[]>([])
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Flush to server
  const flushToServer = useCallback(async (enrichedRecords?: Array<{ studentId: string; status: AttendanceStatus; notes?: string; studentName?: string }>) => {
    const entries = entriesRef.current
    const records = enrichedRecords || entries
      .filter(e => e.status !== null)
      .map(e => ({
        studentId: e.studentId,
        status: e.status as AttendanceStatus,
        notes: e.notes || undefined,
      }))

    if (records.length === 0) return

    setSaveStatus('saving')
    try {
      const result = await onSave(records)

      // Task 1.15: Check for partial failures
      if (result && 'errors' in result && Array.isArray(result.errors) && result.errors.length > 0) {
        // Some records failed — keep dirty flag, preserve failed entries
        const failedStudentIds = new Set(result.errors.map((e: any) => e.studentId))
        const failedEntries = entriesRef.current.filter(e => failedStudentIds.has(e.studentId))

        // Only keep failed entries in localStorage
        saveToStorage(storageKey, {
          entries: failedEntries,
          lastSavedAt: Date.now(),
          dirty: true,
        })
        dirtyRef.current = true
        setSaveStatus('error')
        return
      }

      // All records succeeded
      dirtyRef.current = false
      saveToStorage(storageKey, {
        entries: entriesRef.current,
        lastSavedAt: Date.now(),
        dirty: false,
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus(isOnline ? 'error' : 'offline')
    }
  }, [onSave, storageKey, isOnline])

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-flush pending changes on reconnect
      if (dirtyRef.current) {
        flushToServer()
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSaveStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushToServer])

  // Load from localStorage on mount + cleanup old entries
  useEffect(() => {
    // Task 5.1: Clean up old entries on mount
    cleanupOldEntries()

    const saved = loadFromStorage(storageKey)
    if (saved && saved.entries.length > 0) {
      entriesRef.current = saved.entries
      dirtyRef.current = saved.dirty
      if (saved.dirty) {
        setSaveStatus(isOnline ? 'idle' : 'offline')
      } else {
        setSaveStatus('saved')
      }
    }
  }, [storageKey, isOnline])

  // Auto-save timer
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (dirtyRef.current && isOnline) {
        flushToServer()
      }
    }, AUTO_SAVE_INTERVAL_MS)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [isOnline, flushToServer])

  // Save entries to localStorage (immediate, on every change)
  const persistLocally = useCallback((entries: AttendanceEntry[]) => {
    entriesRef.current = entries
    dirtyRef.current = true
    saveToStorage(storageKey, {
      entries,
      lastSavedAt: null,
      dirty: true,
    })
    if (!isOnline) {
      setSaveStatus('offline')
    }
  }, [storageKey, isOnline])

  // Manual save trigger
  const save = useCallback((enrichedRecords?: Array<{ studentId: string; status: AttendanceStatus; notes?: string; studentName?: string }>) => {
    if (isOnline) {
      return flushToServer(enrichedRecords)
    }
    setSaveStatus('offline')
    return Promise.resolve()
  }, [isOnline, flushToServer])

  // Clean up stored data for this date
  const clearSaved = useCallback(() => {
    clearStorage(storageKey)
    dirtyRef.current = false
    setSaveStatus('idle')
  }, [storageKey])

  return {
    saveStatus,
    isOnline,
    persistLocally,
    save,
    clearSaved,
    hasPendingChanges: dirtyRef.current,
  }
}
