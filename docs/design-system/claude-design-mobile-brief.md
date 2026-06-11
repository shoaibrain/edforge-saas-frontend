# EdForge — Mobile Design Brief for Claude Design (Fable 5)

> **How to use this document:** This is a prompt-style briefing. Paste it (or attach it) as
> context for Claude Design. It gives you EdForge's architecture, brand, design tokens,
> component primitives, and information architecture — all traceable to exact source files so
> your mobile designs stay faithful to the real system. **Your job:** design intuitive,
> professional **mobile** interfaces for EdForge. The current web view layer is desktop-first
> and largely unusable on phones; you are designing the mobile experience from the ground up,
> *on top of the existing design language and IA* (do not invent a new brand).

---

## 0. The one-paragraph context

**EdForge is a multi-tenant School Management / EMIS platform** (BASIC tier today) built for
**Nepal's private & boarding schools** under the **PABSON** governance archetype. It is a
**module-federation micro-frontend**: a **Shell** host app wraps federated **Academics**,
**Finance**, and **People** modules, plus shell-rendered **Student** and **Parent** portals.
Operators are school administrators, principals, teachers; portals serve students and parents.
The product is warm, calm, data-dense, and locale-aware (Nepali / Bikram Sambat calendar /
NPR currency). Repo: `edforge-saas-frontend` (monorepo: `apps/*` + `packages/*`).

---

## 1. Brand identity

- **Name:** EdForge (wordmark "Edforge", sub-label "Technologies"). Metaphor: *forging*
  education.
- **Mark:** a stroke-drawn angular **"E"** — source: `apps/shell/public/logo.svg`
  (viewBox `0 0 200 200`, `stroke-width 17`, round caps). Path:
  `M 32 158 L 85 52 Q 94 34 112 34 L 168 34  M 100 96 L 168 96  M 100 158 L 168 158`.
- **Mark gradient:** `#005f73` (teal) → `#0a9396` (cyan).
- **⚠️ Known brand split (ask the owner before relying on either):** the *mark* is teal/cyan,
  but the *app* is **green-forward** — primary action `#0F6E56`, brand-green focus `#1D9E75`,
  on a **warm cream** surface `#FAF7F2`. For mobile, **match the app palette** (warm + green),
  and treat the teal/cyan as logo-only unless told otherwise.
- **Personality:** trustworthy, calm, editorial-but-efficient. Not playful/childish — these are
  administrators running a school. Soft corners, quiet motion, generous-but-dense.

---

## 2. Design tokens (use these, not raw hex)

All colors are CSS custom properties consumed as `rgb(var(--token) / <alpha>)`. **Light & dark
are both first-class** (`darkMode: 'class'`). Source of truth: **`packages/theme/src/base.css`**
+ **`packages/theme/tailwind.config.js`**.

### Surfaces & text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background-primary` | `#FAF7F2` warm cream | `#0F1117` | app/page background |
| `--background-secondary` | `#FFFFFF` | `#161B27` | cards, tables |
| `--background-tertiary` | `#F4EFE6` | `#1E2436` | inset / selected / toolbar |
| `--background-elevated` | `#FFFFFF` | `#242D3E` | popovers, drawers, sheets |
| `--text-primary` | `#1A1F2E` | `#E8EAF0` | titles, primary content |
| `--text-secondary` | `#374151` | `#C8CCD8` | body, metadata |
| `--text-tertiary` / `--text-muted` | `#585F6F` | `#969CB2` | captions, low-emphasis |
| `--text-disabled` | `#B0B6C8` | `#4A5068` | disabled |
| `--border-primary` | `#968F7E` warm taupe | white @ low alpha | hairlines, dividers |
| `--border-focus` | `#1D9E75` | `#1D9E75` | focus ring (brand green) |

### Actions & states

| Token | Value | Use |
|---|---|---|
| `--action-primary-bg` | `#0F6E56` (hover `#0C5C48`) | primary buttons (AA on white text) |
| `--action-danger-bg` | `#AE2012` | destructive |
| `--state-success-fg / bg` | `#005F49` / `#E8F6F2` | paid, present, healthy |
| `--state-warning-fg / bg` | `#7F4300` / `#FFECC9` | due, late |
| `--state-danger-fg / bg` | `#691310` / `#F9CAC6` | overdue, absent, error |
| `--state-info-fg / bg` | `#005F73` / `#BDFAFB` | informational |

### Module accents (wayfinding — each module/area has a color)

| Token | Hex | Module |
|---|---|---|
| `--accent-academics` | `#378ADD` blue | Academics |
| `--accent-finance` | `#E24B4A` red | Finance |
| `--accent-attendance` | `#EF9F27` amber | Attendance |
| `--accent-enrollment` | `#1D9E75` green | Enrollment |
| `--accent-coral` | `#D85A30` coral | People / Staff |
| `--accent-reports` | `#7F77DD` purple | Reports |
| `--accent-settings` | `#5A6070` slate | Settings |

### Type, spacing, radius, elevation, motion

- **Fonts:** **Inter** (UI sans), **Fraunces** (display/headlines), **Noto Sans Devanagari**
  (Nepali `lang="ne"`). Loaded in `apps/shell/index.html`.
- **Type scale:** `text-xs 12` · `sm 14` (body default) · `base 16` · `lg 18` · `xl 20` ·
  `2xl 24` · `3xl 30` · `4xl 36`. Dense dashboards also use micro sizes `11/10/9px`
  (`--text-2xs/3xs/4xs`). Typography primitives: `Heading variant="display|page|section|
  subsection"`, `Text variant="body|secondary|caption|label|code"` (`packages/ui/.../typography`).
- **Spacing:** 4px base. Named: `xs 8 · sm 12 · md 16 · lg 24 · xl 32` (the `Stack` primitive).
- **Radius:** `rounded-lg 8 · rounded-xl 12 · rounded-2xl 16 · pill 9999`. Cards = 16px.
- **Elevation:** `--elevation-raised | overlay | modal | popover` (subtle, warm shadows).
- **Motion:** durations `instant 80 · fast 150 · base 220 · slow 320 ms`; easings
  `standard | enter | exit`. **Quiet motion; honor `prefers-reduced-motion`.**

**Rule you must follow:** use **semantic tokens**, never raw Tailwind palette colors
(`bg-white`, `text-gray-500`) or arbitrary pixel sizes. The codebase enforces this with eslint
(`no-hardcoded-colors`, `no-arbitrary-tailwind-values`). Designing within the tokens keeps your
mobile work portable to code.

---

## 3. Component primitives you should reuse (`@edforge/ui`)

Mobile designs should **reuse these patterns** (restyled for touch), not invent parallels.
Source: `packages/ui/src/index.ts`.

- **Layout:** `Container`, `Stack`, `Inline`, `PageHeader`, `PageShell`, `SectionCard`.
- **Typography:** `Heading`, `Text`.
- **Controls:** `Button` (primary/secondary/outline/ghost/tonal/danger/link; sm/md/lg/icon),
  `Dropdown`, `Tabs`, `SegmentedControl`, `FilterTabs`, `Accordion`, `Tag`, `StatusBadge`,
  `StatusPill`, `Avatar`/`AvatarGroup`.
- **Forms:** `Field`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `RadioGroup`,
  `Switch`, `GradeRangeField` (+ Nepal-aware `AddressFields`, `PhoneInput` in `@edforge/forms`).
- **Data:** `Table` family + `DataTable` (TanStack: pagination, faceted filters, sorting, bulk
  actions, row actions) + `DataTableSkeleton`. **On mobile, tables must become cards/lists** —
  this is the single biggest adaptation.
- **Overlays:** `Modal`, `Drawer`, `QuickDrawer`, `Tooltip`. **On mobile, prefer bottom
  sheets / full-screen drawers.**
- **State:** `EmptyState`, `ErrorState`, `LoadingState`, `InlineAlert`, the `Skeleton` family.
- **Dashboard / data-viz:** `StatCard` (KPI tile w/ count-up + accent bar), `StatStrip`,
  `GpaRing`, `CourseCard`, `CategoryBar`, `AttendanceHeatmap`, `AttendanceTrend`,
  `AttendanceDonutRing`, `WeekTimetable`, `AnimatedProgressBar`.
- **Locale:** `DateDisplay`, `BsDatePicker`/`DateInput`, `SchoolDate`, `LanguageSwitcher`.
- **Loader (incoming):** an organic **"The Forge"** `BrandLoader` is being introduced — see
  [`boot-loader-and-school-resolution-plan.md`](boot-loader-and-school-resolution-plan.md) and
  [`prototypes/organic-loader.html`](prototypes/organic-loader.html). Mobile splash/inline
  loaders should use this language.

---

## 4. Architecture & information architecture (what to design)

### 4.1 Topology

- **Shell (host)** — auth, global nav (sidebar + topbar), tenant/school context, layout.
  `apps/shell` · router: `apps/shell/src/router.tsx` · nav config:
  `apps/shell/src/config/sidebar-modules.ts`.
- **Remotes (federated, lazy-loaded):** **Academics** (`apps/academics`, `/academics/*`),
  **Finance** (`apps/finance`, `/finance/*`), **People** (`apps/people`, `/people/*`).
- **Shell-rendered portals:** **Student** (`/student-portal/*`), **Parent** (`/parent-portal/*`).
- **Parked (do not design yet):** Analytics, Messages, Ed-Fi, Special Programs.

### 4.2 Navigation model (role-aware)

The sidebar swaps its contents by role and current module. Module accent colors apply.

- **Admin / staff home** → top-level: **Academics · People & HR · Finance · Settings**.
- **Student home ("My Portal")** → My Grades · My Attendance · My Schedule.
- **Parent home ("Family Portal")** → Overview · Grades · Attendance · Schedule · Fee Payments.

**Mobile nav guidance:** desktop uses a left sidebar that switches per module. On mobile,
collapse to (a) a **bottom tab bar** for the 3–4 top destinations of the current role, plus
(b) a **module switcher / hamburger drawer**, plus (c) a **school switcher** in the header
(critical — see §5). Settings' deep hierarchy must collapse to a drilldown list.

### 4.3 The app tree (design surface) — App → Module → Page → key features

```
Home (role-aware dashboard)
  ├─ Admin "Command Center": KPI cards [Students Enrolled · Active Sections ·
  │    Today's Attendance % · Outstanding Fees ₨] · Attendance trend (sparkline) ·
  │    Financial overview · Classroom attendance by section · Recent activity feed · alerts banner
  ├─ Teacher dashboard: my classes · grading status · class attendance
  └─ Student / Parent: see portals

Academics  (/academics)
  ├─ Overview (KPI snapshot)
  ├─ Students: directory (search/filter) · Student profile · Enrollment wizard ·
  │    Bulk profile edit · IEMIS import (PABSON gov't bulk import)
  ├─ Teachers (directory)
  ├─ Calendar (school calendar, holidays, terms)
  ├─ Classrooms: list (tabs: overview · gradebook · policies · attendance) ·
  │    Classroom detail (tabs: stream · classwork · people · progress · grades · attendance) ·
  │    create/edit · report cards
  ├─ Exams: list · exam detail (scores, result cards)
  ├─ Curriculum: courses · course detail · grade levels · standards
  └─ Government reports (IEMIS Flash I/II export)

Finance  (/finance)
  ├─ Overview (receivable · overdue · collection rate · recent payments · alerts)
  ├─ Invoices: list · invoice detail (PDF, line items, mark paid) · bulk generate
  ├─ Payments: list · record payment · receipt
  ├─ Student Accounts (ledger: balance / outstanding / paid)
  └─ Configuration: fee structures · payment gateways

People & HR  (/people)
  ├─ Overview (headcount, dept breakdown)
  ├─ Staff: directory · staff detail (profile, employment, documents) · create (wizard)
  ├─ Departments · Roles · Settings (leave, payroll)

Student Portal  (/student-portal)   → My Grades · My Attendance · My Schedule
Parent Portal   (/parent-portal)    → Overview (child selector) · Grades · Attendance ·
                                       Schedule · Fee Payments (with gateway)

Settings  (/settings)
  ├─ Overview · My Account · Preferences (theme, language, default school) · Security
  └─ Workspace · Organization (school hierarchy → school detail tabs:
       Academic Setup · Structure · Grade Levels · Audit Log) · RBAC Security · Auth Debug
```

### 4.4 Cross-cutting concepts you must design around

- **Active-school context** — every operator screen is scoped to one **active school**; the
  user can switch schools from the header. This is being made deterministic (lands on the
  user's **Default School** on login) — see the plan. **The school switcher is a primary mobile
  header element**; design it well.
- **RBAC / ABAC** — nav items and actions are permission-gated (`packages/abac`). Design for
  graceful absence: a user may not see Finance, or may be read-only.
- **Roles** — TenantAdmin · Principal/HeadMaster · Administrator · Teacher · Student · Parent.

---

## 5. Nepal / PABSON archetype specifics (must-haves)

- **Calendar — Bikram Sambat (BS):** dates render like **"28 Jestha 2083 BS · Thursday, June 11,
  2026"**. Use BS-first display with a Gregorian secondary. Nepali month names. Source:
  `packages/date-utils` (+ `@aibrains/shared-types` BS table), `BsDatePicker`.
- **Currency — NPR (₨):** amounts like **"NPR 9.3 lakh"** / "₨1,000" — note **lakh** grouping.
  Source: `useCurrency` in `@edforge/types`.
- **Locale — `ne-NP`:** Noto Sans Devanagari; the language switcher toggles en/ne. Design must
  accommodate Devanagari line-height and longer strings.
- **Address & identifiers** — Province → District → Municipality → Ward → Tole (not state/city);
  ID formats are archetype-driven. Source: `@edforge/forms AddressFields`, `@edforge/archetype`.

---

## 6. The mobile problem & your priorities

The current view layer is desktop-first: dense tables, a left sidebar, hover affordances, wide
KPI rows — **unusable one-handed on a phone.** Priorities, highest impact first:

1. **App shell & navigation** — bottom tab bar (role-aware) + module/school switchers + a
   mobile header that fits the school context and BS date.
2. **Home dashboards** — reflow the KPI grid into a vertical, swipeable card stack; charts
   become compact, touch-readable.
3. **Lists over tables** — every `DataTable` (students, invoices, payments, staff) becomes a
   **card/list** with search, filter chips (`FilterTabs`), and a sticky action; bulk actions via
   long-press/selection mode.
4. **Detail + tabs** — Classroom detail, Student profile, Invoice detail use horizontal tab
   scrollers or segmented controls; long content in collapsible sections.
5. **Forms & wizards** — Enrollment, Staff create, Record payment: single-column, large touch
   targets, sticky primary action, step indicator (`@edforge/wizard`); Nepal-aware fields.
6. **Portals (student/parent)** — the most "consumer" surfaces; lean into the hero greeting,
   GPA ring, attendance donut, week timetable, fee payment flow.
7. **Loaders / empty / error states** — use the organic `BrandLoader`, `EmptyState`,
   `ErrorState`.

**Constraints / honor these:**
- Stay within the **token system** and **component primitives** above (restyle for touch; don't
  fork the brand).
- **Light + dark** parity.
- **Reduced motion** + accessibility (focus, contrast AA — the tokens are already AA-tuned).
- **BASIC tier only**; don't design parked modules (Analytics et al.).
- Permission-gating means screens must degrade gracefully when a section is hidden/read-only.

---

## 7. Source map (trace any decision back here)

| You want… | Look at |
|---|---|
| Tokens (colors, type, motion) | `packages/theme/src/base.css`, `packages/theme/tailwind.config.js` |
| Component primitives | `packages/ui/src/index.ts` (+ component files) |
| Brand mark | `apps/shell/public/logo.svg`, `favicon.svg` |
| Routes / IA | `apps/shell/src/router.tsx`, each MFE's `src/router.tsx` |
| Nav config (role-aware) | `apps/shell/src/config/sidebar-modules.ts` |
| Home dashboard | `apps/shell/src/pages/HomePage.tsx`, `components/home/AdminCommandCenter.tsx` |
| School context / switcher | `apps/shell/src/lib/shell-context.tsx`, `components/layout/SchoolSwitcher.tsx`, `packages/config/src/school-context-channel.ts` |
| Archetype (Nepal) | `packages/archetype`, `packages/date-utils`, `@edforge/forms AddressFields` |
| Permissions | `packages/abac` (`usePermission`, `useCanAccess`) |
| Design-system rules | `docs/design-system/README.md` |
| Loader language | `docs/design-system/boot-loader-and-school-resolution-plan.md` + `prototypes/organic-loader.html` |

---

### Deliverables we'd love from you (Claude Design)
1. A **mobile design language** note (how the tokens above translate to touch: target sizes,
   nav pattern, sheet/drawer conventions, table→card rules).
2. Key screens, light + dark: **mobile app shell + bottom nav + school switcher**, **admin home**,
   **a list→card screen** (students or invoices), **a detail-with-tabs** (classroom or student),
   **a wizard step** (enrollment or record payment), and the **parent portal fee-payment flow**.
3. Each screen annotated with the **tokens / primitives** it uses, so engineering can trace it
   straight back to `@edforge/ui` + `@edforge/theme`.
