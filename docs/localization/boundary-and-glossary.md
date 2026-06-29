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

## Terms Requiring Product Or Native Copy Review

- Whether to use `इनभ्वाइस`, `बिल`, or another finance term consistently.
- Whether Nepali UI should show `NPR 72,290`, `रू ७२,२९०`, or a hybrid.
- Whether short labels `BS`, `AD`, `PDF`, `CSV`, `PAN`, and `EMIS` remain as
  English acronyms in Nepali UI.
- Whether role names such as `TenantAdmin` should be localized display labels or
  preserved as platform role codes.
