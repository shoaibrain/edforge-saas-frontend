/**
 * EdForge Shell - App Component
 *
 * This component is no longer the root.
 * Routing and layout is now handled by router.tsx with proper TanStack Router structure.
 * This file is kept for backwards compatibility but the actual app structure
 * is defined in router.tsx -> RootLayout and ProtectedLayout.
 */

export function App() {
  // This should never render - router.tsx handles everything
  return null
}
