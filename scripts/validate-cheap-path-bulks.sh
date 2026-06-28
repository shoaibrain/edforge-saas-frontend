#!/usr/bin/env bash
# scripts/validate-cheap-path-bulks.sh
#
# Single-command gate for the "cheap-path bulk drawers" PR (closes
# #223, #224, #229, #233, #234). Runs in order:
#   1. workspace typecheck across @edforge/*
#   2. lint on the 3 touched apps
#   3. all unit/integration tests (vitest)
#   4. the new Playwright bulk specs — only those whose fixture is
#      ready; the others are marked test.fixme() and self-skip.
#   5. production builds for the 3 touched apps
#
# All steps stream their own output. The script exits non-zero on the
# first failure.
#
# Required envs for step 4 (Playwright) — see e2e/tests/*.spec.ts:
#   BULK_E2E=1                          opt-in to the bulk specs
#   PLAYWRIGHT_START_SERVER=1           start the dev server, OR:
#   PLAYWRIGHT_BASE_URL=<preview-url>   point at a Vercel preview
#   VITE_API_URL=http://stub            stub for the prod-build step
#
# Usage:
#   scripts/validate-cheap-path-bulks.sh             # all gates
#   GATES="typecheck,lint,test" scripts/validate-cheap-path-bulks.sh
#                                                   # comma-list to run a subset

set -euo pipefail

GATES="${GATES:-typecheck,lint,test,e2e,build}"
contains() { [[ ",${GATES}," == *",$1,"* ]]; }

echo "→ gates: ${GATES}"
echo

if contains typecheck; then
  echo "[1/5] workspace typecheck"
  pnpm -r --filter "@edforge/*" typecheck
  echo
fi

if contains lint; then
  echo "[2/5] lint (academics, finance, shell)"
  pnpm \
    --filter "@edforge/academics" \
    --filter "@edforge/finance" \
    --filter "@edforge/shell" \
    lint
  echo
fi

if contains test; then
  echo "[3/5] unit + integration tests (vitest)"
  pnpm vitest run
  echo
fi

if contains e2e; then
  echo "[4/5] playwright bulk specs"
  if [[ "${BULK_E2E:-0}" != "1" ]]; then
    echo "  ⓘ BULK_E2E not set — Playwright specs will self-skip. Set BULK_E2E=1 to actually run."
  fi
  pnpm playwright test \
    e2e/tests/students-bulk-archive.spec.ts \
    e2e/tests/sections-bulk-status.spec.ts \
    e2e/tests/payments-bulk-void.spec.ts \
    e2e/tests/users-bulk-change-role.spec.ts \
    e2e/tests/users-bulk-suspend.spec.ts
  echo
fi

if contains build; then
  echo "[5/5] production builds (academics, finance, shell)"
  VITE_API_URL="${VITE_API_URL:-http://stub}" pnpm \
    --filter "@edforge/academics" \
    --filter "@edforge/finance" \
    --filter "@edforge/shell" \
    build
  echo
fi

echo "✔ all selected gates passed"
