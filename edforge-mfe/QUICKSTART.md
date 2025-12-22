# EdForge MFE Quick Start Guide

## 🚀 Run Locally (5 min)

### Step 1: Install & Build

```bash
cd edforge-mfe
pnpm install
pnpm build:packages
```

### Step 2: Start All Apps

```bash
pnpm dev
```

This starts all services:
- Shell: http://localhost:3000
- Ed-Fi: http://localhost:3001  
- Academics: http://localhost:3002
- Finance: http://localhost:3003

### Step 3: Open Browser

Go to **http://localhost:3000**

---

## 🧪 Verification Tests

### Test 1: Remote Manifest Check

```bash
# Ed-Fi should show exposes
curl -s http://localhost:3001/mf-manifest.json | grep -o '"exposes":\[.*\]'
```

Expected: Shows array of exposed modules (not empty `[]`)

### Test 2: Remote Entry Available

```bash
curl -I http://localhost:3001/remoteEntry.js
# Should return HTTP 200
```

### Test 3: Shell Loads Correctly

1. Open http://localhost:3000
2. See login page
3. Click any user role to login
4. Navigate sidebar → should load modules

---

## 🔍 Debugging

### Console Logs

Open browser DevTools → Console. Look for:
- `[MFE] Resolved remote: edfi →` (success)
- `[MFE] Failed to load remote:` (error)

### Network Tab

Check for:
- `remoteEntry.js` from each port (3001, 3002, 3003)
- No 404 errors on federation files

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `apps/shell/rsbuild.config.ts` | Host config (defines remotes) |
| `apps/edfi/rsbuild.config.ts` | Ed-Fi remote (defines exposes) |
| `apps/*/src/bootstrap.tsx` | Module entry points |
| `packages/ui/src/` | Shared components |

---

## ⚡ Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm build:packages` | Build shared packages |
| `pnpm build` | Build all apps |
| `pnpm dev` | Start all in dev mode |
| `pnpm typecheck` | Type check all |
| `pnpm --filter @edforge/shell dev` | Run shell only |

