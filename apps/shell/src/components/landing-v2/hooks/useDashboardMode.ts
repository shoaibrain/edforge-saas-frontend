import { useEffect, useState } from 'react'

/**
 * useDashboardMode — reads `?mode=dashboard` from the current URL.
 *
 * When true, use-case sections render their static dashboard fallback
 * instead of the DemoVideo. Dev affordance for designers/stakeholders who
 * want to eyeball the static UI without the video overlay.
 *
 * Updates on popstate/hashchange so dev can toggle via the URL bar without
 * a full reload.
 */
export function useDashboardMode(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => read())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setEnabled(read())
    window.addEventListener('popstate', check)
    window.addEventListener('hashchange', check)
    return () => {
      window.removeEventListener('popstate', check)
      window.removeEventListener('hashchange', check)
    }
  }, [])

  return enabled
}

function read(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('mode') === 'dashboard'
  } catch {
    return false
  }
}
