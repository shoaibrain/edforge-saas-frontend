#!/usr/bin/env bash
#
# check-currentyear-gates.sh
#
# Regression guard for Sprint 1 (academic-year-current-flag-bug).
#
# Every file in `apps/academics/src/routes/**` that calls
# `useCurrentAcademicYear` must have ONE of the following:
#   (a) An entry-level gate: a line containing `NoCurrentAcademicYearEmptyState`.
#   (b) An explicit allow-list exemption below (e.g. the calendar page, which
#       is where operators *create* AYs — gating it would be a chicken-and-egg).
#
# If a new file is added that uses the hook without a gate and isn't on the
# allow-list, this script exits 1 with the file path.
#
# Run via `bash scripts/check-currentyear-gates.sh` from repo root.

set -euo pipefail

ROUTES_DIR="apps/academics/src/routes"

# Files explicitly allowed to use useCurrentAcademicYear without a gate.
# Document the reason inline so future maintainers can re-evaluate.
ALLOWLIST=(
  # Calendar / Academic Setup page — where operators CREATE academic years.
  # Gating it would block recovery from the very bug we're guarding against.
  "$ROUTES_DIR/calendar/index.tsx"
  # Enrollment page — has a year-selector dropdown that lets operators pick
  # any AY (planning / active / completed), so a current AY is not required.
  "$ROUTES_DIR/enrollment/index.tsx"
  # Curriculum page — delegates to GradeLevelsTab via `hasCurrentAY` prop,
  # which renders an inline empty-state in the affected tab only.
  "$ROUTES_DIR/curriculum/index.tsx"
  # Test files — these mock useCurrentAcademicYear, not consume it.
  "$ROUTES_DIR/attendance/AttendanceModule.test.tsx"
)

is_allowlisted() {
  local target="$1"
  for entry in "${ALLOWLIST[@]}"; do
    if [[ "$entry" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

violations=()

while IFS= read -r file; do
  # Skip allowlist
  if is_allowlisted "$file"; then
    continue
  fi
  # Require either an entry-level gate via the shared empty state, OR a
  # delegation pattern that propagates `hasCurrentAY` to a child component.
  if ! grep -q -E "NoCurrentAcademicYearEmptyState|hasCurrentAY=" "$file"; then
    violations+=("$file")
  fi
done < <(grep -rl "useCurrentAcademicYear" "$ROUTES_DIR" 2>/dev/null)

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "ERROR: the following files call useCurrentAcademicYear without an" >&2
  echo "entry-level gate. Either add <NoCurrentAcademicYearEmptyState/> when" >&2
  echo "currentYear is missing, or add the file to ALLOWLIST in" >&2
  echo "  scripts/check-currentyear-gates.sh" >&2
  echo "with a reason." >&2
  echo "" >&2
  printf "  %s\n" "${violations[@]}" >&2
  exit 1
fi

echo "OK — all useCurrentAcademicYear consumers in $ROUTES_DIR are gated or allowlisted."
