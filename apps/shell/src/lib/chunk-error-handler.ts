/**
 * Chunk Load Error Recovery
 *
 * Detects ChunkLoadError (stale deployment) and triggers a single page
 * reload so the browser fetches the latest remoteEntry.js and chunks.
 * Uses sessionStorage to prevent infinite reload loops.
 */

const RELOAD_KEY = 'edforge:chunk-reload'
const RELOAD_COOLDOWN_MS = 10_000

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    error.name === 'ChunkLoadError' ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes("unexpected token '<'")
  )
}

function canReload(): boolean {
  try {
    const lastReload = sessionStorage.getItem(RELOAD_KEY)
    if (!lastReload) return true
    return Date.now() - parseInt(lastReload, 10) > RELOAD_COOLDOWN_MS
  } catch {
    return true
  }
}

function markReload(): void {
  try {
    sessionStorage.setItem(RELOAD_KEY, Date.now().toString())
  } catch {
    // sessionStorage unavailable
  }
}

export function handleChunkLoadError(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false
  if (!canReload()) {
    console.error('[EdForge] Chunk load error detected but reload cooldown active. Please hard-refresh.')
    return false
  }

  console.warn('[EdForge] Stale deployment detected. Reloading to fetch latest version...')
  markReload()
  window.location.reload()
  return true
}

/**
 * Install global error handlers for chunk load errors.
 * Call once at app startup (main.tsx).
 */
export function installChunkErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    if (handleChunkLoadError(event.error)) {
      event.preventDefault()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (handleChunkLoadError(event.reason)) {
      event.preventDefault()
    }
  })
}
