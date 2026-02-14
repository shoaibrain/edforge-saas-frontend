/**
 * useOfflineAttendance Hook
 *
 * Provides offline-resilient attendance state management.
 * - Saves to localStorage on every status change
 * - Auto-saves to server every 30 seconds
 * - Tracks online/offline state
 * - Retries failed saves on reconnect
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AttendanceStatus } from '../services/academics.service'

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
  } catch (error) {
    console.warn('Failed to save attendance to localStorage:', error)
  }
}

function clearStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently ignore storage errors
  }
}

interface UseOfflineAttendanceOptions {
  schoolId: string
  sectionId: string
  date: string
  onSave: (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => Promise<void>
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
  const flushToServer = useCallback(async () => {
    const entries = entriesRef.current
    const records = entries
      .filter(e => e.status !== null)
      .map(e => ({
        studentId: e.studentId,
        status: e.status as AttendanceStatus,
        notes: e.notes || undefined,
      }))

    if (records.length === 0) return

    setSaveStatus('saving')
    try {
      await onSave(records)
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

  // Load from localStorage on mount
  useEffect(() => {
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
  const save = useCallback(() => {
    if (isOnline) {
      return flushToServer()
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
