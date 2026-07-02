// Playwright MCP page-init script (.mcp.json --init-script).
//
// Seeded E2E sessions have no real Cognito session, so the auth store's
// initializeAuth() would re-derive auth from Amplify after mount and null the
// user loaded from the storage-state cookies. The session-invalidated flag is
// the store's own early-return seam (apps/shell/src/stores/auth.store.ts) —
// setting it before app scripts run preserves the seeded session.
sessionStorage.setItem('edforge-session-invalidated', 'true')
