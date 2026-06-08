## What changed

-

## Screenshots / visual evidence

- Before:
- After:

## Design-system checklist

- [ ] I did not introduce hardcoded presentation colors (`bg-white`, `text-gray-*`, `text-emerald-*`, raw hex, etc.).
- [ ] I did not introduce arbitrary spacing/type utilities (`p-[10px]`, `text-[11px]`, `gap-[3px]`, etc.) without an allow-comment and reason.
- [ ] Interactive elements have visible `:focus-visible` states in light and dark themes.
- [ ] New/changed text and UI-state pairs meet WCAG AA.
- [ ] Motion uses tokenized durations/easings and respects reduced motion.

## Gate results

- [ ] `pnpm turbo typecheck`
- [ ] `pnpm turbo lint`
- [ ] `pnpm vitest run`
- [ ] contrast test
- [ ] focus-ring test
- [ ] Playwright visual regression reviewed
- [ ] PABSON smoke: login → dashboard → one academic flow → one finance flow → settings, both themes, zero console errors

## Violation delta

- Hardcoded color warnings: `N → N`
- Arbitrary spacing/type warnings: `N → N`

## Notes

-
