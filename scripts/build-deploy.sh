#!/usr/bin/env bash
#
# Consolidated build script for Vercel deployment.
# Builds all apps via Turbo and merges outputs into a single directory
# so that remote modules are served from the same origin as the shell.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$REPO_ROOT/output"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "==> Running turbo build..."
cd "$REPO_ROOT"
pnpm turbo build

# Shell dist → output root (owns index.html and SPA routing)
echo "==> Copying shell..."
cp -r "$REPO_ROOT/apps/shell/dist/"* "$OUTPUT_DIR/"

# Each remote dist → output/remotes/{name}/
# Remote assets use publicPath: 'auto', which resolves chunks relative
# to the directory where remoteEntry.js was loaded from.
REMOTES=(academics edfi finance special-programs people messages analytics)
for remote in "${REMOTES[@]}"; do
  echo "==> Copying remote: $remote"
  mkdir -p "$OUTPUT_DIR/remotes/$remote"
  cp -r "$REPO_ROOT/apps/$remote/dist/"* "$OUTPUT_DIR/remotes/$remote/"
done

echo "==> Build complete."
for remote in "${REMOTES[@]}"; do
  if [ -f "$OUTPUT_DIR/remotes/$remote/remoteEntry.js" ]; then
    echo "  OK: /remotes/$remote/remoteEntry.js"
  else
    echo "  MISSING: /remotes/$remote/remoteEntry.js"
  fi
done
