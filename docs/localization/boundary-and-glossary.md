# Localization Boundary and Glossary Seed

This document defines the first Nepal-pilot boundary for platform localization.
It is intentionally small and operational: it tells implementation PRs what to
translate, what to preserve as data, and which terms need product/native copy
review.

## Translate Platform Copy

Translate UI text owned by EdForge:

- Navigation, breadcrumbs, module titles, tabs, filters, and table headers.
- Button labels, menu items, dialog titles, placeholders, tooltips, and aria
  labels.
- Loading, empty, error, success, warning, and confirmation states.
- Toasts and inline validation.
- Generated system sentences with interpolation/plurals.
- Status, frequency, method, and type labels for platform enums.
- Date, relative time, count, percent, and currency formatting according to the
  active language and tenant regional settings.

## Preserve Tenant And User Data

Do not translate stored or imported values unless a future content-translation
feature explicitly owns that workflow:

- Student, guardian, staff, school, tenant, and user names.
- Email addresses, phone numbers, invoice numbers, receipt numbers, payment
  references, PAN, EMIS, tenant codes, and school codes.
- Operator-entered fee names, fee descriptions, academic-year names, billing
  period names, and notes.
- Gateway brand names: eSewa, Khalti, FonePay, ConnectIPS.
- Imported third-party records and freeform text.

## Seed Glossary

| Concept         | English         | Nepali seed     | Notes                          |
| --------------- | --------------- | --------------- | ------------------------------ |
| Home            | Home            | गृहपृष्ठ        | Shell navigation               |
| Finance         | Finance         | वित्त           | Module name                    |
| Billing         | Billing         | बिलिङ           | Finance sidebar group          |
| Configuration   | Configuration   | कन्फिगरेसन      | Finance/settings route segment |
| Invoice         | Invoice         | इनभ्वाइस        | Keep invoice numbers unchanged |
| Payment         | Payment         | भुक्तानी        | Finance and portal             |
| Student account | Student Account | विद्यार्थी खाता | Finance account ledger         |
| Fee structure   | Fee Structure   | शुल्क संरचना    | Operator fee names are data    |
| Receipt         | Receipt         | रसिद            | Receipt id remains data        |
| Record payment  | Record Payment  | भुक्तानी रेकर्ड | Action/route label             |
| Light           | Light           | उज्यालो         | Theme option                   |
| Dark            | Dark            | अँध्यारो        | Theme option                   |
| English         | English         | अंग्रेजी        | Language option                |
| Nepali          | Nepali          | नेपाली          | Language option                |

## Nepal Pilot Terminology Rules

Use a mixed Nepali-English product vocabulary where it improves operator
comprehension. The Nepal pilot UI should be understandable to school operators
who work in Nepali, but it should not translate institutional acronyms, imported
standards, or platform concepts into unfamiliar wording.

- Keep official acronyms and external standards unchanged: `Ed-Fi`, `IEMIS`,
  `EMIS`, `GPA`, `PAN`, `CSV`, `PDF`, `BS`, and `AD`.
- Keep platform nouns in English when they are already the operational term in
  school workflows or map to data concepts: `Course`, `Section`, `Grade`,
  `Academic Year`, `Term`, `Report Card`, `Attendance`, and `Enrollment`.
- Translate user actions, state messages, warnings, confirmations, empty states,
  helper text, and validation copy when Nepali wording makes the task clearer.
- Preserve tenant, user, and imported data exactly as stored. Localization owns
  platform copy and formatting, not content translation.
- Review compact controls, badges, table cells, and action buttons in both
  English and Nepali before merge. Nepali strings can be longer, so truncation
  and wrap behavior are part of localization QA.

## Formatting And Pluralization Rules

Never pass a locale-formatted string as the `count` option for an i18next
translation. `count` must stay numeric so plural rules remain valid. When a
localized number needs to appear in the rendered copy, pass it separately as
`value`.

```ts
formatCount('academics.someKey', total)
```

The `formatCount` helper passes `{ count: total, value: formatNumber(total) }`
and should be preferred for count-bearing Academics copy. Locale entries should
use `{{value}}` for the displayed number and reserve `{{count}}` for plural
selection only.

Avoid localization workarounds such as `t(...).replace(...)`. If translated
copy needs a formatted number, date, time, percent, or currency, add the correct
interpolation variable and use the shared helpers (`formatNumber`,
`formatCount`, `formatDate`, `formatDateTime`, currency formatters) at the call
site.

## Terms Requiring Product Or Native Copy Review

- Whether to use `इनभ्वाइस`, `बिल`, or another finance term consistently.
- Whether Nepali UI should show `NPR 72,290`, `रू ७२,२९०`, or a hybrid.
- Whether short labels `BS`, `AD`, `PDF`, `CSV`, `PAN`, and `EMIS` remain as
  English acronyms in Nepali UI.
- Whether role names such as `TenantAdmin` should be localized display labels or
  preserved as platform role codes.
