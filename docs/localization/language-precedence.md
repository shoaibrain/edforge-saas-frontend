# Platform Language Precedence

EdForge has two related but separate concepts:

- **Platform language:** the UI language used by system copy, currently `en` or
  `ne`.
- **Tenant regional locale:** the school/workspace configuration for currency,
  timezone, calendar, week start, number format, and defaults.

Do not treat workspace `defaultLocale` as the same field as the logged-in user's
UI language preference.

## Proposed Precedence

When the shell starts, resolve platform language in this order:

1. Explicit user preference from `preferences.language`.
2. Existing `edforge-language` localStorage value.
3. Tenant/workspace default locale normalized to a platform language.
4. Browser language preferences.
5. English fallback.

The header language toggle should update i18n immediately, write
`edforge-language`, and persist `preferences.language` when an authenticated user
is available. A failed preference mutation should not roll back the visible UI
language.

## Normalization Rules

Use `normalizePlatformLanguage()` from `@edforge/i18n` for platform language
selection:

| Input             | Platform language   |
| ----------------- | ------------------- |
| `en`              | `en`                |
| `en-US`           | `en`                |
| `en_GB`           | `en`                |
| `ne`              | `ne`                |
| `ne-NP`           | `ne`                |
| unsupported value | configured fallback |

Use a separate locale or formatting helper when a feature needs a regional code
such as `ne-NP`.

## Implementation Notes

- i18next still owns runtime language state.
- `edforge-language` remains the browser persistence key because the current
  language detector already uses it.
- Components should compare language with `normalizePlatformLanguage()` rather
  than direct string equality, so `ne-NP` still activates the Nepali toggle.
- Currency/date helpers should normalize regional locale deliberately instead of
  inferring it from arbitrary UI strings.
