# EdForge MFE: Technical Tasks & Validation Protocol
> **Scope:** Transition from Monolith Shell to Federated Platform
> **Status:** Implementation & Validation Guide

## 1. Prerequisites (Infrastructure Fixes)

### Task 1.1: Resolve Build Configuration Errors
**Context**: `historyApiFallback` was misplaced in `rsbuild.config.ts`, causing `pnpm typecheck` to fail.
**Action**:
- [x] Correct `apps/shell/rsbuild.config.ts`
- [x] Correct `apps/academics/rsbuild.config.ts`
- [x] Correct `apps/finance/rsbuild.config.ts`
- [x] Correct `apps/edfi/rsbuild.config.ts`
- [x] Correct `apps/special-programs/rsbuild.config.ts`

**Validation**:
```bash
pnpm typecheck
# Must exit with code 0
```

---

## 2. Phase I Implementation: "The Wire-Up"

### Task 2.1: Refactor Shell Router for Lazy Loading
**Target File**: `apps/shell/src/router.tsx`

**Implementation**:
Replace static imports of local placeholders with `loadRemote`.

```tsx
// 1. Remove
// import AcademicsPage from './pages/AcademicsPage'

// 2. Add
import { loadRemote } from '@module-federation/enhanced/runtime'
const AcademicsModule = React.lazy(() => loadRemote('academics/AcademicsModule'))

// 3. Update Route
const academicsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/academics',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <AcademicsModule />
    </Suspense>
  ),
})
```

**Logging & Validation**:
1.  **Browser Console**:
    -   Observe: `[MFE] Resolved remote: academics -> http://localhost:3002/remoteEntry.js`
2.  **Network Tab**:
    -   Verify request to `:3002/remoteEntry.js` (200 OK).
    -   Verify request to `:3002/src_bootstrap_tsx...js` (Feature chunk).

### Task 2.2: Ensure Remote Bootstrap is Valid
**Target File**: `apps/academics/src/bootstrap.tsx`

**Implementation**:
Ensure the default export is a React Component that can function as a route root.
```tsx
const AcademicsApp = () => {
  return (
    <ShellProvider> {/* Optional: If needed for local dev isolation */}
      <RouterProvider router={internalRouter} />
    </ShellProvider>
  )
}
export default AcademicsApp
```
*Note: In production (Shell consumption), `ShellProvider` should detect it's already provided.*

---

## 3. Phase II Implementation: Federated Routing

### Task 3.1: Implement Remote-Side Router
**Target Apps**: Academics, Finance, etc.

**Implementation**:
Remotes must handle their own sub-routes.
```tsx
// apps/academics/src/router.tsx
const router = createRouter({
  routeTree,
  basepath: '/academics' // IMPORTANT: Must match Shell mount point
})
```

**Validation**:
1.  Navigate to `/academics/students`.
2.  **Shell** matches `/academics`.
3.  **Academics Remote** matches `/students` (relative) or `/academics/students` (absolute).
4.  Verify Deep Linking works (Refresh page -> stays on Student list).

---

## 4. Logging & Observability Checklist

Implement the following logging in `tenant-resolver.ts` and `shell-context.tsx` to aid debugging:

| Event | Log Level | Message Pattern | Purpose |
|-------|-----------|-----------------|---------|
| **Tenant Resolved** | INFO | `[Tenant] Resolved ID: {id} from {host}` | Verify multi-tenancy logic. |
| **Remote Loading** | INFO | `[MFE] Loading Remote: {remote} @ {url}` | Verify resolver rewriting. |
| **Remote Error** | ERROR | `[MFE] FAILED Remote: {remote} - {error}` | Catch connection issues. |
| **Nav Event** | DEBUG | `[Nav] Path: {path}, Source: {shell/remote}` | Trace routing handoffs. |

---

## 5. Deployment Validation Strategy

### 5.1 Canary Tenant Test
1.  Update `tenant-resolver.ts` (or registry) to point "beta-district" to `v2` URL.
2.  Login as `admin@beta-district.edforge.app`.
3.  Verify Network Tab requests `v2` assets.
4.  Login as `admin@stable-district.edforge.app`.
5.  Verify Network Tab requests `v1` assets.
