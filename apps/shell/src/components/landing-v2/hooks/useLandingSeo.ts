import { useEffect } from 'react'

/**
 * useLandingSeo — sets <title> and canonical link while the landing is
 * mounted. The base OG / Twitter / JSON-LD tags in index.html already
 * cover the marketing page; this hook just ensures the runtime title
 * reflects "Edforge" (not whatever an authed route left behind on SPA
 * navigation).
 *
 * Restores the previous <title> + canonical on unmount so the authed
 * portal doesn't inherit the landing title after navigation.
 */
const DEFAULT_TITLE =
  'Edforge — One platform to power every school in your district'
const CANONICAL = 'https://www.edforge.app/'

export function useLandingSeo(title: string = DEFAULT_TITLE) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const head = document.head
    let canonical = head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    let created = false
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      head.appendChild(canonical)
      created = true
    }
    const prevHref = canonical.getAttribute('href')
    canonical.setAttribute('href', CANONICAL)

    return () => {
      document.title = prevTitle
      if (created) {
        canonical?.remove()
      } else if (canonical && prevHref !== null) {
        canonical.setAttribute('href', prevHref)
      }
    }
  }, [title])
}
