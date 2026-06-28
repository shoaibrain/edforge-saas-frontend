#!/usr/bin/env bash
# scripts/validate-finance-d1-d4-bulks.sh
#
# Single-command gate for the "finance D1–D4 async-job bulks" PR
# (closes #230, #231, #232, #236). Runs in order:
#   1. workspace typecheck across @edforge/*
#   2. lint on the 2 touched apps (finance + the finance-services package)
#   3. all unit/integration tests (vitest) including the 4 new helper specs
#   4. the 4 new Playwright bulk specs (self-skip unless BULK_E2E=1)
#   5. production builds for the 2 touched apps
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
#   scripts/validate-finance-d1-d4-bulks.sh             # all gates
#   GATES="typecheck,lint,test" scripts/validate-finance-d1-d4-bulks.sh
#                                                       # comma-list to run a subset

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
  echo "[2/5] lint (finance, finance-services)"
  pnpm \
    --filter "@edforge/finance" \
    --filter "@edforge/finance-services" \
    lint
  echo
fi

if contains test; then
  echo "[3/5] unit + integration tests (vitest)"
  pnpm vitest run
  echo
fi

if contains e2e; then
  echo "[4/5] playwright bulk D1-D4 specs"
  if [[ "${BULK_E2E:-0}" != "1" ]]; then
    echo "  ⓘ BULK_E2E not set — Playwright specs will self-skip. Set BULK_E2E=1 to actually run."
  fi
  pnpm playwright test \
    e2e/tests/payments-bulk-send-receipt.spec.ts \
    e2e/tests/invoices-bulk-send-reminder.spec.ts \
    e2e/tests/accounts-bulk-send-statement.spec.ts \
    e2e/tests/accounts-bulk-adjust-balance.spec.ts
  echo
fi

if contains build; then
  echo "[5/5] production builds (finance)"
  VITE_API_URL="${VITE_API_URL:-http://stub}" pnpm \
    --filter "@edforge/finance" \
    build
  echo
fi

echo "✔ all selected gates passed"
