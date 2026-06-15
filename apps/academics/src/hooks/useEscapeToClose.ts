import { useEffect } from 'react'

/**
 * Dismiss a hand-rolled (raw-div) overlay on Escape.
 *
 * The Headless-UI / shared `Modal` overlays get this for free; this hook is for
 * the raw-div modals that don't, so keyboard dismissal is consistent across the
 * app. Pass `enabled` (typically the modal's `open`) so a closed/stacked modal
 * doesn't swallow the key.
 */
export function useEscapeToClose(onClose: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled, onClose])
}
