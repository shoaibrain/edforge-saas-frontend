# Tailwind v4 Alias Strategy PoC

**Date:** 2026-06-08  
**Purpose:** Prove the token-rename strategy can preserve old utility names through CSS-variable aliases before any edit to `packages/theme/src/base.css`.

## Command

The PoC used the current repo theme CSS as an import and a temporary source file outside the repo:

```bash
printf '@import "tailwindcss";\n@source "/tmp/edforge-tailwind-alias-poc/repo-content.html";\n@theme { --color-background-primary: rgb(251 249 245); --color-surface-alias-poc: var(--color-background-primary); }\n@import "/workspace/packages/theme/src/base.css";\n' > "/tmp/edforge-tailwind-alias-poc/repo-input.css"

printf '<div class="bg-surface-alias-poc text-[13px]"></div>' > "/tmp/edforge-tailwind-alias-poc/repo-content.html"

"/tmp/edforge-tailwind-alias-poc/node_modules/.bin/tailwindcss" \
  -i "/tmp/edforge-tailwind-alias-poc/repo-input.css" \
  -o "/tmp/edforge-tailwind-alias-poc/repo-output.css"

rg -n --no-heading 'bg-surface-alias-poc|--color-surface-alias-poc|--color-background-primary' \
  "/tmp/edforge-tailwind-alias-poc/repo-output.css"
```

## Result

```css
--color-background-primary: rgb(251 249 245);
--color-surface-alias-poc: var(--color-background-primary);

.bg-surface-alias-poc {
  background-color: var(--color-surface-alias-poc);
}
```

## Conclusion

Tailwind v4 can generate a utility from an alias token where the legacy token points at the new semantic token. This supports the Stream 2 strategy:

```css
@theme {
  --color-background-primary: rgb(var(--background-primary));
  --color-surface-primary: var(--color-background-primary);
}
```

The production token PR still requires a dedicated review before touching `packages/theme/src/base.css`, plus a full repo build and visual-regression review.
