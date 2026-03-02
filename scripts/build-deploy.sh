#!/usr/bin/env bash
#
# Consolidated build script for Vercel deployment.
# Builds MVP apps via Turbo and merges outputs into a single directory
# so that remote modules are served from the same origin as the shell.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/output"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "==> Running turbo build (MVP modules only)..."
cd "$REPO_ROOT"
pnpm turbo build --filter=@edforge/shell --filter=@edforge/academics --filter=@edforge/people --filter=@edforge/finance --filter='./packages/*' --filter='./types/packages/*'

# Shell dist → output root (owns index.html and SPA routing)
echo "==> Copying shell..."
cp -r "$REPO_ROOT/apps/shell/dist/"* "$OUTPUT_DIR/"

# Each remote dist → output/remotes/{name}/
# Remote assets use publicPath: 'auto', which resolves chunks relative
# to the directory where remoteEntry.js was loaded from.
REMOTES=(academics people finance)
# [MVP-PARKED] Parked modules excluded from deployment
# REMOTES_PARKED=(edfi special-programs messages analytics)
# [/MVP-PARKED]
for remote in "${REMOTES[@]}"; do
  echo "==> Copying remote: $remote"
  mkdir -p "$OUTPUT_DIR/remotes/$remote"
  cp -r "$REPO_ROOT/apps/$remote/dist/"* "$OUTPUT_DIR/remotes/$remote/"
done

echo "==> Verifying output..."
for remote in "${REMOTES[@]}"; do
  if [ -f "$OUTPUT_DIR/remotes/$remote/remoteEntry.js" ]; then
    echo "  OK: /remotes/$remote/remoteEntry.js"
  else
    echo "  FATAL: Missing MVP remote: /remotes/$remote/remoteEntry.js"
    exit 1
  fi
done

# Verify no parked modules leaked into output
PARKED_REMOTES=(edfi special-programs messages analytics)
for parked in "${PARKED_REMOTES[@]}"; do
  if [ -d "$OUTPUT_DIR/remotes/$parked" ]; then
    echo "  FATAL: Parked module leaked into output: $parked"
    exit 1
  fi
done

echo "==> Build complete. Output integrity verified."
