# EdForge Nepal Launch — Sprint Plan

## Architecture Context

| Aspect | Detail |
|--------|--------|
| **Monorepo** | pnpm 9.15 workspaces + Turborepo 2.8 |
| **Framework** | React 19, Rsbuild 1.7, Module Federation via `@module-federation/enhanced/rspack` |
| **Styling** | Tailwind CSS 4 (CSS `@theme` directive), design tokens in `packages/theme` |
| **State** | Zustand 5 (global), TanStack Query 5 (server), TanStack Router (routing) |
| **Auth** | AWS Cognito via `@edforge/auth` + aws-amplify |
| **Testing** | Vitest 4 configured, @testing-library/react — **110 tests passing** |
| **Env Vars** | `VITE_` prefix (via `loadEnv({ prefixes: ['VITE_'] })`) — Rsbuild supports this |
| **Deploy** | Vercel — consolidated shell + remotes output |
| **Shared Packages** | `@edforge/ui`, `@edforge/auth`, `@edforge/types`, `@edforge/theme`, `@edforge/abac`, `@edforge/forms`, `@edforge/wizard`, `@edforge/i18n`, `@edforge/date-utils`, `@edforge/config` |
| **Finance Module** | `apps/finance` — Module Federation micro-frontend with Billing, Ledger (GL/AP/AR), Expenses, Payroll, Tuition routes (MVP-PARKED) |
| **Ed-Fi Finance Models** | ChartOfAccount, FundDimension, BalanceSheetDimension, AccountabilityRating in `types/packages/edfi-ts-models` |

---

## Completion Status Summary

| Sprint | Status | Tests | Notes |
|--------|--------|-------|-------|
| Sprint 0: Foundation | **DONE** (3/4 tasks) | 110 passing | Task 0.4 (axe-core a11y) deferred |
| Sprint 1a: i18n Infrastructure | **DONE** (7/8 tasks) | All locale parity tests pass | Task 1.7 (API sync) partial — frontend persistence works, backend sync not wired |
| Sprint 1b: Shell String Extraction | **PARTIAL** (4/8 tasks) | — | Login, sidebar, header, breadcrumbs done; settings, error boundaries, landing page remain |
| Sprint 1c/3: Micro-Frontend Localization | **PARTIAL** | — | Academics namespace created (120 keys), student detail page partial; People namespace created (100 keys), components not wired |
| Sprint 2: Bikram Sambat / Dates | **DONE** (5/11 tasks) | 20+ converter tests pass | Core package done; DateDisplay + useDateFormatter done; BSDatePicker & raw date replacement deferred |
| Sprint 3: Payment Integration | **NOT STARTED** | — | Redesigned below with Ed-Fi alignment |
| Sprint 4: Maps & Landmarks | **NOT STARTED** | — | Ready for implementation |
| Sprint 5: IEMIS Export | **NOT STARTED** | — | — |

---

## Sprint 0: Foundation — DONE

### Task 0.1: Testing infrastructure — DONE

- `test-utils/index.ts` — `renderWithProviders()` helper
- `test-utils/setup.ts` — `@testing-library/jest-dom` matchers
- `vitest.config.ts` — configured with jsdom, path aliases, setup files
- 110 tests passing across packages (converter, i18n init, locale parity, module config)

### Task 0.2: Shared MF config — DONE

- `packages/config/src/mf-shared.ts` — `getMFSharedConfig('host' | 'remote')` with 20+ shared deps
- All 3 rsbuild configs import from single source of truth

### Task 0.3: turbo.json env vars — DONE

- 13 env vars in `globalPassThroughEnv` including `VITE_GOOGLE_MAPS_API_KEY`, `VITE_DEFAULT_LOCALE`, `VITE_MOCK_PAYMENTS`, etc.

### Task 0.4: axe-core a11y — DEFERRED

- Not installed. Low priority for Nepal launch — can add later.

---

## Sprint 1a: i18n Infrastructure — DONE

### Task 1.1: @edforge/i18n package — DONE

- `packages/i18n/` — i18next 25.x, react-i18next 16.5, browser-languagedetector 8.x
- `config.ts` — 8 namespaces (common, auth, nav, settings, dashboard, errors, academics, people)
- `initI18n()` — singleton pattern, `edforge-language` localStorage key

### Task 1.2: Translation files — DONE

- 8 namespaces × 2 languages = 16 JSON files, ~1600 lines total
- Automated key parity testing via `locale-parity.test.ts`

### Task 1.3: Noto Sans Devanagari font — DONE

- Dynamic `<link>` injection in `useLocaleEffect.ts` when locale is `ne`
- CSS: `html[lang="ne"] { font-family: var(--font-devanagari); }`
- Zero font downloads for English users

### Task 1.4: useLocaleEffect hook — DONE

- Sets `document.documentElement.lang`, manages Devanagari font loading
- Integrated in `apps/shell/src/router.tsx` → `RootLayout()`

### Task 1.5: LanguageSwitcher component — DONE

- `packages/ui/src/components/LanguageSwitcher.tsx`
- Headless UI menu, keyboard navigable, `variant="default" | "ghost"`

### Task 1.6: LanguageSwitcher placement — DONE

- Login page: top-right, `variant="ghost"`
- Shell header: right section alongside notifications

### Task 1.7: Language persistence to API — PARTIAL

- localStorage persistence: DONE (via i18next-browser-languagedetector)
- Backend schema exists (`person.schema.ts` has `language` field)
- `onLanguageChange` handler NOT wired in Header/LoginPage — needs backend API call

### Task 1.8: MF shared config for i18n — DONE

- `@edforge/i18n`, `i18next`, `react-i18next` registered as singletons in `mf-shared.ts`

---

## Sprint 1b: Shell String Extraction — PARTIAL

### Task 1.9: LoginPage.tsx — DONE

- `useTranslation('auth')` — all strings localized

### Task 1.10: Sidebar, Header, Breadcrumbs — DONE

- **Sidebar.tsx** — `useTranslation('nav')`, render-time `tNav('sidebar.${item.id}')` pattern
- **Header.tsx** — `useTranslation('nav')`, `useTranslation('common')`, `useTranslation('settings')`
- **Breadcrumbs.tsx** — `useTranslation('nav')`, fallback chain: `tNav(breadcrumb.key)` → `tNav(segment)` → static map → title-case

### Task 1.11: Settings pages — NOT DONE

- `account.tsx`, `preferences.tsx`, etc. still have hardcoded English strings
- Toast messages hardcoded: "Profile updated successfully", "Failed to upload photo", etc.

### Task 1.12: HomePage/Dashboard — PARTIAL

- `HomePage.tsx` — `useTranslation('dashboard')`, `getGreeting(firstName, t)`
- **CarouselWidget** — `label={t('recentlyVisited')}`, `formatRelativeDate(date, t)`
- **UpcomingEventsWidget** — localized empty state, menu labels, day groups, date formatting
- **QuickActionsWidget** — `labelKey`/`descriptionKey` fields, render-time translation
- **WelcomeTipWidget** — `i18nKey` field per role, render-time translation

### Task 1.13: Error/toast messages — NOT DONE

- Hardcoded toast strings across shell components

### Task 1.14: Error boundaries/fallbacks — NOT DONE

- `ErrorBoundary.tsx` is a class component with hardcoded strings

### Task 1.15: Landing page — NOT DONE

- No `landing.json` namespace created
- Landing page components (`Navbar`, `HeroSection`, `Footer`, etc.) not localized

### Task 1.16: Integration test — NOT DONE

---

## Sprint 1c/3: Micro-Frontend Localization — PARTIAL

### Academics namespace — PARTIAL

- `packages/i18n/src/locales/en/academics.json` — CREATED (~120 keys)
- `packages/i18n/src/locales/ne/academics.json` — CREATED (matching Nepali)
- Registered in `config.ts`

**Components localized:**
- `$studentId.tsx` — tab labels, error states, permission denied
- `ProfileHeader.tsx` — status badge, actions dropdown, grade label
- `OverviewTab.tsx` — stat cards, section headers, empty states, chart labels, alerts, grade legend

**Components NOT YET localized:**
- `ProfileTab.tsx` — personal info fields, date of birth, gender, medical
- `EnrollmentTab.tsx` — enrollment history, programs, sections
- `FamilyTab.tsx` — guardian info, relationships, portal access
- `EditStudentModal`, `AddGuardianModal`, `AddToSectionModal`
- Student list page, enrollment wizard, attendance views

### People namespace — NAMESPACE ONLY

- `packages/i18n/src/locales/en/people.json` — CREATED (~100 keys)
- `packages/i18n/src/locales/ne/people.json` — CREATED (matching Nepali)
- Registered in `config.ts`
- **Zero components wired** — `apps/people/src/` has no `useTranslation('people')` calls

---

## Sprint 2: Bikram Sambat / Dates — CORE DONE

### Task 2.1: @edforge/date-utils package — DONE

- `packages/date-utils/` — `adToBS()`, `bsToAD()`, DST-safe UTC algorithms
- BS 2000–2090 lookup table, month/day names in both scripts
- `apps/academics/src/lib/bikram-sambat.ts` re-exports for backward compat

### Task 2.2: useDateFormatter hook — DONE

- `formatDate()`, `formatDateRange()`, `formatDual()`, auto BS/AD by locale

### Task 2.3: DateDisplay component — DONE

- `packages/ui/src/components/DateDisplay.tsx` — `showDual`, null handling, format options

### Task 2.4: BSDatePicker — NOT STARTED

### Task 2.5: BS month/day names in i18n — DONE

- 12 BS months + 7 days in both en/ne `common.json`

### Task 2.6: Calendar preference in settings — PARTIAL

- `dateFormat` preference exists; explicit `calendarSystem` field not added (inferred from locale)

### Tasks 2.7–2.10: Replace raw dates — NOT DONE

- Academics attendance uses migrated bikram-sambat re-exports
- Shell, dashboard, people not yet using `<DateDisplay>`

### Task 2.11: Integration test — PARTIAL

- Unit tests for converter: DONE (20+ pairs, round-trip, edge cases)
- Full integration test: NOT DONE

---

## Sprint 3: Payment Integration — Nepal School Fee Collection

> **REDESIGNED** — Ed-Fi aligned, scalable gateway architecture

### Architecture Overview

Nepal schools collect fees through local payment gateways (eSewa, Khalti). The payment system must:

1. **Align with Ed-Fi financial standards** — StudentAccountPayment, StudentAccountInvoice, ChartOfAccount
2. **Be gateway-agnostic** — Adapter pattern supporting eSewa, Khalti, and future gateways (Stripe, Fonepay, ConnectIPS)
3. **Keep secrets server-side** — Frontend calls EdForge backend, never gateway APIs directly
4. **Support Nepal-specific requirements** — NPR currency, BS date receipts, tax (PAN/VAT) on receipts
5. **Integrate with existing finance module** — Bridge from `apps/finance/` billing to payment execution

### Domain Model (Ed-Fi Enhanced)

```
┌─────────────────────────────────────────────────────────┐
│                    Ed-Fi Financial Core                   │
│  ChartOfAccount ← FundDimension ← BalanceSheetDimension │
│                   (existing in edfi-ts-models)           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              EdForge Billing Domain                       │
│                                                          │
│  FeeStructure                                            │
│  ├─ id, schoolId, name, academicYear                     │
│  ├─ feeType (tuition|admission|exam|transport|library|   │
│  │          lab|hostel|uniform|miscellaneous|custom)      │
│  ├─ amount (NPR), currency, taxRate, taxType (PAN|VAT)   │
│  ├─ frequency (one_time|monthly|quarterly|annual)        │
│  ├─ gradeLevels[] (which grades this applies to)         │
│  └─ isActive, effectiveFrom, effectiveTo                 │
│                                                          │
│  StudentAccount                                          │
│  ├─ id, studentId, schoolId                              │
│  ├─ balance (current outstanding)                        │
│  └─ lastPaymentDate                                      │
│                                                          │
│  Invoice                                                 │
│  ├─ id, invoiceNumber, studentAccountId                  │
│  ├─ schoolId, academicYear, billingPeriod                │
│  ├─ lineItems[] { feeStructureId, description, amount,   │
│  │                quantity, discount, taxAmount, total }  │
│  ├─ subtotal, taxTotal, discountTotal, grandTotal        │
│  ├─ currency (NPR), dueDate, issuedDate                  │
│  ├─ status (draft|issued|partially_paid|paid|overdue|    │
│  │          cancelled|written_off)                       │
│  └─ notes                                                │
│                                                          │
│  Payment                                                 │
│  ├─ id, invoiceId, studentAccountId, schoolId            │
│  ├─ amount, currency (NPR)                               │
│  ├─ gateway (esewa|khalti|stripe|cash|bank_transfer|     │
│  │          cheque|fonepay|connectips)                    │
│  ├─ gatewayTransactionId, gatewaySessionId               │
│  ├─ status (pending|processing|completed|failed|         │
│  │          cancelled|refunded|partially_refunded)       │
│  ├─ paidAt, paidBy (userId)                              │
│  ├─ receiptNumber                                        │
│  ├─ metadata {} (gateway-specific response data)         │
│  └─ refunds[] { amount, reason, refundedAt,              │
│                  gatewayRefundId }                        │
│                                                          │
│  PaymentGatewayConfig                                    │
│  ├─ id, schoolId, gateway                                │
│  ├─ isEnabled, isTestMode                                │
│  ├─ displayName, displayOrder                            │
│  └─ credentials (server-side only, never sent to client) │
│                                                          │
│  Receipt                                                 │
│  ├─ receiptNumber, payment, invoice, school              │
│  ├─ paidDate (BS + AD), amount, currency                 │
│  ├─ taxBreakdown { PAN, VAT }                            │
│  └─ printable (PDF-ready layout)                         │
└──────────────────────────────────────────────────────────┘
```

### Gateway Adapter Architecture

```
Frontend (React)                    Backend (Node/Spring)
─────────────────                   ─────────────────────

PaymentForm.tsx                     POST /api/payments/initiate
  │                                   │
  ├─ Select gateway (eSewa/Khalti)    ├─ Resolve GatewayAdapter
  ├─ POST /api/payments/initiate      │   ├─ EsewaAdapter
  │                                   │   ├─ KhaltiAdapter
  │                                   │   ├─ StripeAdapter (future)
  │   ◄─── { redirectUrl } ──────────┤   └─ CashAdapter (manual)
  │                                   │
  ├─ window.location = redirectUrl    ├─ adapter.initiate(amount, meta)
  │                                   ├─ Create Payment record (pending)
  │                                   └─ Return redirect URL
  │
  │  ... user pays on gateway page ...
  │
PaymentCallback.tsx                 GET /api/payments/verify/:sessionId
  │                                   │
  ├─ Parse URL params                 ├─ adapter.verify(sessionId)
  ├─ GET /api/payments/verify         ├─ Update Payment (completed/failed)
  │                                   ├─ Update Invoice (paid/partial)
  │   ◄─── { receipt } ──────────────┤   └─ Post to GL (journal entry)
  │                                   │
  └─ Show receipt                     └─ Return receipt data
```

### API Contract

```typescript
// ─── Initiate Payment ───
POST /api/v1/schools/:schoolId/payments/initiate
Body: {
  invoiceId: string
  gateway: 'esewa' | 'khalti' | 'stripe' | ...
  amount: number          // NPR (or invoice total if omitted)
  currency: 'NPR'
  returnUrl: string       // Frontend callback URL
  cancelUrl: string       // Frontend cancel URL
}
Response: {
  paymentSessionId: string
  redirectUrl: string     // Gateway-hosted payment page
  expiresAt: string       // Session TTL
}

// ─── Verify Payment (callback) ───
GET /api/v1/payments/verify/:sessionId
Response: {
  payment: Payment
  invoice: Invoice
  receipt: Receipt | null  // null if failed
  status: 'completed' | 'failed' | 'cancelled'
}

// ─── Payment History ───
GET /api/v1/schools/:schoolId/invoices/:invoiceId/payments
Response: { payments: Payment[] }

// ─── Invoice CRUD ───
GET    /api/v1/schools/:schoolId/invoices?status=&studentId=&academicYear=
POST   /api/v1/schools/:schoolId/invoices          (generate invoice)
GET    /api/v1/schools/:schoolId/invoices/:id
PATCH  /api/v1/schools/:schoolId/invoices/:id       (update status, add discount)

// ─── Fee Structures ───
GET    /api/v1/schools/:schoolId/fee-structures
POST   /api/v1/schools/:schoolId/fee-structures
PUT    /api/v1/schools/:schoolId/fee-structures/:id
DELETE /api/v1/schools/:schoolId/fee-structures/:id

// ─── Student Accounts ───
GET    /api/v1/schools/:schoolId/student-accounts?studentId=
GET    /api/v1/schools/:schoolId/student-accounts/:id/ledger

// ─── Gateway Config (Admin) ───
GET    /api/v1/schools/:schoolId/payment-gateways          (no secrets)
PUT    /api/v1/schools/:schoolId/payment-gateways/:gateway  (save config)

// ─── Receipt ───
GET    /api/v1/payments/:paymentId/receipt
GET    /api/v1/payments/:paymentId/receipt/pdf
```

---

### Task 3.0: Define payment types in `@edforge/types`

**Description**: Create the core domain types for the billing and payment system. These types are shared between frontend and backend, so they live in the shared types package. They extend Ed-Fi financial concepts (ChartOfAccount, FundDimension) into a concrete school fee collection domain.

**Files to create**:
- `packages/types/src/billing.ts` — `FeeStructure`, `FeeType`, `FeeFrequency`, `Invoice`, `InvoiceLineItem`, `InvoiceStatus`, `StudentAccount`
- `packages/types/src/payment.ts` — `Payment`, `PaymentStatus`, `PaymentGateway`, `PaymentMethod`, `Receipt`, `Refund`, `PaymentGatewayConfig`

**Files to modify**:
- `packages/types/src/index.ts` — export new types

**Acceptance Criteria**:
- Types cover full invoice lifecycle: draft → issued → paid/overdue → cancelled
- Types cover full payment lifecycle: pending → processing → completed/failed/cancelled → refunded
- Gateway type is extensible: `'esewa' | 'khalti' | 'stripe' | 'cash' | 'bank_transfer' | 'cheque' | 'fonepay' | 'connectips'`
- Currency type supports NPR with paisa precision (2 decimal places)
- Invoice supports line items with per-item tax and discount
- `PaymentGatewayConfig` never includes credentials on the client side

**Test**: Type compilation — no errors.

---

### Task 3.1: Create payment service layer

**Description**: Frontend service functions that call EdForge backend endpoints. The frontend NEVER calls eSewa/Khalti directly. All payment initiation goes through our backend, which resolves the correct gateway adapter.

**Files to create**:
- `apps/shell/src/services/payments.service.ts`:
  - `initiatePayment(schoolId, request)` → `{ paymentSessionId, redirectUrl, expiresAt }`
  - `verifyPayment(sessionId)` → `{ payment, invoice, receipt, status }`
  - `getPaymentHistory(schoolId, invoiceId)` → `Payment[]`
  - `getPaymentReceipt(paymentId)` → `Receipt`
- `apps/shell/src/services/invoices.service.ts`:
  - `getInvoices(schoolId, filters)` → paginated Invoice list
  - `getInvoice(schoolId, invoiceId)` → Invoice with line items
  - `generateInvoice(schoolId, request)` → Invoice
- `apps/shell/src/services/fee-structures.service.ts`:
  - `getFeeStructures(schoolId)` → FeeStructure[]
  - `createFeeStructure(schoolId, data)` → FeeStructure
  - `updateFeeStructure(schoolId, id, data)` → FeeStructure
  - `deleteFeeStructure(schoolId, id)` → void
- `apps/shell/src/services/payment-gateways.service.ts`:
  - `getEnabledGateways(schoolId)` → `PaymentGatewayConfig[]` (no secrets)
  - `saveGatewayConfig(schoolId, gateway, config)` → void

**Acceptance Criteria**:
- All functions call EdForge backend (`/api/v1/schools/:schoolId/*`)
- Proper error handling (network failures, 4xx/5xx)
- TypeScript return types match `@edforge/types` billing/payment types
- Uses existing `apiClient` (axios instance with auth headers)

**Test**: Unit tests with mocked axios.

---

### Task 3.2: Create TanStack Query hooks for payment operations

**Description**: React Query hooks wrapping the service layer. Provides caching, optimistic updates, and mutation state management.

**Files to create**:
- `apps/shell/src/hooks/usePayments.ts`:
  - `useInvoices(schoolId, filters)` — query
  - `useInvoice(schoolId, invoiceId)` — query
  - `useGenerateInvoice()` — mutation
  - `usePaymentHistory(schoolId, invoiceId)` — query
  - `useInitiatePayment()` — mutation
  - `useVerifyPayment(sessionId)` — query (enabled on callback page)
  - `usePaymentReceipt(paymentId)` — query
- `apps/shell/src/hooks/useFeeStructures.ts`:
  - `useFeeStructures(schoolId)` — query
  - `useCreateFeeStructure()` — mutation
  - `useUpdateFeeStructure()` — mutation
  - `useDeleteFeeStructure()` — mutation
- `apps/shell/src/hooks/usePaymentGateways.ts`:
  - `useEnabledGateways(schoolId)` — query
  - `useSaveGatewayConfig()` — mutation

**Acceptance Criteria**:
- Proper query key factories for cache invalidation
- Mutations invalidate related queries on success
- Loading, error, and success states properly exposed
- `staleTime` appropriate per data type (gateways: 5min, invoices: 30s)

---

### Task 3.3: Create mock payment backend (MSW handlers)

**Description**: MSW handlers for all payment endpoints so frontend dev proceeds without backend. Configurable via `VITE_MOCK_PAYMENTS=true`.

**Files to create**:
- `apps/shell/src/mocks/handlers/payments.ts` — mock handlers for payment endpoints
- `apps/shell/src/mocks/data/invoices.ts` — realistic mock invoices with NPR amounts
- `apps/shell/src/mocks/data/fee-structures.ts` — mock fee structures for a Nepal school
- `apps/shell/src/mocks/data/payments.ts` — mock payment records with gateway references

**Acceptance Criteria**:
- Mocks simulate: success, failure, timeout, cancelled
- Configurable delay (200–1000ms)
- Realistic NPR amounts (5000, 12000, 25000, etc.)
- Mock receipt numbers in Nepal format
- eSewa mock redirects to `/payments/callback?status=success&sessionId=xxx`
- Khalti mock follows same pattern

---

### Task 3.4: Build `PaymentMethodSelector` component

**Description**: Cards showing available payment gateways for the parent's school, with logos.

**Files to create**:
- `apps/shell/src/components/payments/PaymentMethodSelector.tsx`
- `apps/shell/src/assets/gateway-logos/esewa.svg`
- `apps/shell/src/assets/gateway-logos/khalti.svg`
- `apps/shell/src/assets/gateway-logos/stripe.svg` (for future)

**Props**: `gateways: PaymentGatewayConfig[]`, `selected?: PaymentGateway`, `onSelect: (gateway) => void`

**Acceptance Criteria**:
- Only shows gateways enabled for the school
- Logo + name + description per gateway
- Selected state with border highlight
- Localized (en + ne)
- Accessible (keyboard navigable, aria-labels)

---

### Task 3.5: Build `usePaymentFlow` hook — state machine

**Description**: Manages the complete payment lifecycle UI state. Uses a finite state machine pattern for predictable transitions.

**Files to create**:
- `apps/shell/src/hooks/usePaymentFlow.ts`

**States**: `idle → selecting_gateway → confirming → initiating → redirecting → verifying → success | failed | cancelled`

**API**:
```typescript
const {
  state,              // { status, gateway, sessionId, receipt, error }
  selectGateway,      // (gateway) => void
  confirmAndPay,      // () => void — initiates payment, redirects
  verifyOnReturn,     // (sessionId) => void — called on callback page
  reset,              // () => void — back to idle
} = usePaymentFlow(invoice: Invoice, schoolId: string)
```

**Acceptance Criteria**:
- Clean state transitions, no invalid states
- `confirmAndPay()` calls service, gets redirect URL, sets `window.location.href`
- Handles redirect failure (gateway down)
- Timeout handling for verification

---

### Task 3.6: Build `FeePaymentPage` for parent portal

**Description**: The main parent-facing page replacing the `ComingSoon` placeholder at `/parent-portal/fees`. Shows outstanding invoices and allows payment.

**Files to create**:
- `apps/shell/src/pages/parent-portal/fees.tsx`
- `apps/shell/src/components/payments/InvoiceList.tsx` — table of invoices (issued, overdue, paid)
- `apps/shell/src/components/payments/InvoiceDetail.tsx` — line items, amounts, due date
- `apps/shell/src/components/payments/PaymentForm.tsx` — gateway selection + amount confirmation
- `apps/shell/src/components/payments/PaymentSummary.tsx` — NPR breakdown with tax

**Files to modify**:
- `apps/shell/src/router.tsx` — replace ComingSoon with actual component

**Acceptance Criteria**:
- Shows invoices for the parent's children
- Filter by status (outstanding, paid, overdue)
- "Pay Now" opens PaymentForm with gateway selection
- NPR currency display with "रू" symbol when locale is `ne`
- BS dates when locale is `ne`
- Empty state when no invoices
- Localized (en + ne)

---

### Task 3.7: Build payment callback page

**Description**: Handles redirect back from gateway after payment.

**Files to create**:
- `apps/shell/src/pages/payments/callback.tsx` — route: `/payments/callback`

**Files to modify**:
- `apps/shell/src/router.tsx` — add route

**Acceptance Criteria**:
- Parses URL params (sessionId, status from gateway)
- Calls `verifyPayment()` — shows loading spinner
- Success → show receipt summary with "View Full Receipt" link
- Failure → error state with "Try Again" button
- Cancelled → return to invoice with info message
- Direct navigation (no session) → redirect to parent portal
- Localized

---

### Task 3.8: Build `PaymentReceipt` component

**Files to create**:
- `apps/shell/src/components/payments/PaymentReceipt.tsx`
- `apps/shell/src/pages/payments/receipt.tsx` — route: `/payments/:paymentId/receipt`

**Displays**: Receipt number, transaction ID, student name, school name, invoice reference, payment date (BS + AD dual display), amount (NPR), gateway used, tax breakdown (PAN/VAT if applicable), status.

**Acceptance Criteria**:
- `<DateDisplay showDual />` for payment date
- NPR with "रू" symbol
- Print-friendly CSS (`@media print`)
- Localized (en + ne)

---

### Task 3.9: Build fee structure management (admin)

**Description**: School admin page for configuring fee structures (tuition rates, exam fees, transport fees, etc.).

**Files to create**:
- `apps/shell/src/pages/settings/fee-structures.tsx`
- `apps/shell/src/components/settings/FeeStructureForm.tsx` — create/edit form
- `apps/shell/src/components/settings/FeeStructureList.tsx` — table with actions

**Files to modify**:
- `apps/shell/src/router.tsx` — add route `/settings/fee-structures`
- Settings navigation — add menu item

**Acceptance Criteria**:
- CRUD for fee structures
- Fee types: tuition, admission, exam, transport, library, lab, hostel, uniform, miscellaneous, custom
- Frequency: one-time, monthly, quarterly, annual
- Grade level assignment (which grades)
- NPR amount input
- Optional tax rate (PAN/VAT percentage)
- Effective date range
- Localized

---

### Task 3.10: Build payment gateway configuration (admin)

**Files to create**:
- `apps/shell/src/pages/settings/payment-gateways.tsx`
- `apps/shell/src/components/settings/GatewayConfigCard.tsx`

**Files to modify**:
- `apps/shell/src/router.tsx` — add route
- Settings navigation — add menu item

**Acceptance Criteria**:
- Toggle enable/disable per gateway
- Credential fields per gateway (merchant code, API key, etc.)
- Test mode / production mode toggle
- Credentials masked after save (backend returns `****`)
- Test payment button (₹1 test transaction)
- Localized

---

### Task 3.11: Add payment translation keys (en + ne)

**Files to create**:
- `packages/i18n/src/locales/en/payments.json`
- `packages/i18n/src/locales/ne/payments.json`

**Files to modify**:
- `packages/i18n/src/config.ts` — register `payments` namespace

**Key structure**:
```json
{
  "title": "Fee Payments",
  "invoices": { "title": "Invoices", "outstanding": "Outstanding", "paid": "Paid", ... },
  "gateway": { "esewa": "eSewa", "khalti": "Khalti", "selectMethod": "Select Payment Method", ... },
  "receipt": { "title": "Payment Receipt", "receiptNumber": "Receipt #", "transactionId": "Transaction ID", ... },
  "status": { "pending": "Pending", "completed": "Completed", "failed": "Failed", ... },
  "feeStructure": { "title": "Fee Structures", "types": { "tuition": "Tuition", ... }, ... },
  "currency": { "npr": "NPR", "symbol": "रू" },
  "actions": { "payNow": "Pay Now", "viewReceipt": "View Receipt", "downloadPdf": "Download PDF", ... }
}
```

**Acceptance Criteria**: Full en/ne parity. All payment components use these keys.

---

### Task 3.12: Sprint 3 integration test

**Scenarios**:
1. Parent views outstanding invoices for their child
2. Select eSewa → confirm → mock redirect → verify → receipt with BS date
3. Select Khalti → same flow
4. Payment failure → error state → retry
5. Payment cancelled → return to invoice
6. Receipt shows dual date (BS + AD) in `ne` locale
7. Admin creates fee structure → generates invoice → parent sees it
8. Admin configures gateway → toggle test/production mode

**Acceptance Criteria**: All pass with MSW mock backend.

---

## Sprint 4: Maps & Landmark-Based Addressing

**Goal**: Integrate Google Maps for landmark-based addressing (Nepal lacks standardized street addresses). Build a student density map for school admins. Map components live in the shell app (NOT in `@edforge/ui`) to avoid bloating shared bundle.

**Demo**: Student registration shows a landmark address autocomplete ("Near Boudhanath Stupa, Ward 6"). Admin dashboard shows student density clusters on a map of Kathmandu.

---

### Task 4.1: Install `@vis.gl/react-google-maps` and configure API key

**Dependencies**: `@vis.gl/react-google-maps`

**Files to create**:
- `apps/shell/src/config/maps.ts` — API key from `VITE_GOOGLE_MAPS_API_KEY`, default center: Kathmandu [27.7172, 85.3240], default zoom, map ID

**Acceptance Criteria**:
- API key loaded from env var, not hardcoded
- Config centralized with Nepal-specific defaults
- `pnpm build` succeeds

**Test**: Config test: verify defaults. Build test.

---

### Task 4.2: Build `MapContainer` wrapper with lazy loading

**Description**: Map components live in `apps/shell/src/components/maps/` (NOT in `@edforge/ui`).

**Files to create**:
- `apps/shell/src/components/maps/MapContainer.tsx` — `React.lazy()` + `Suspense`, wraps `@vis.gl/react-google-maps` `APIProvider` + `Map`
- `apps/shell/src/components/maps/MapSkeleton.tsx` — loading placeholder

**Acceptance Criteria**:
- Maps SDK lazy-loaded (code-split)
- Skeleton during load
- Handles API key errors gracefully
- Responsive

**Test**: Render with mock, verify lazy load, verify skeleton.

---

### Task 4.3: Create `@edforge/nepal-data` shared package for reference data

**Description**: Nepal-specific reference data (districts, provinces, municipalities, ward ranges) extracted into a shared package so it can be used by maps, IEMIS export, and address validation.

**Files to create**:
- `packages/nepal-data/package.json`
- `packages/nepal-data/src/index.ts`
- `packages/nepal-data/src/districts.ts` — all 77 districts (English + Devanagari names)
- `packages/nepal-data/src/provinces.ts` — all 7 provinces
- `packages/nepal-data/src/municipalities.ts` — municipalities by district
- `packages/nepal-data/src/validation.ts` — `isValidDistrict()`, `isValidProvince()`, `isValidWard()`
- `packages/nepal-data/tsconfig.json`

**Acceptance Criteria**:
- All 77 districts, 7 provinces enumerated
- Both English and Devanagari names
- Validation functions work with both scripts

**Test**: `packages/nepal-data/src/__tests__/validation.test.ts` — validate known districts, provinces, ward ranges.

---

### Task 4.4: Build `LandmarkAddressInput` component

**Files to create**:
- `apps/shell/src/components/maps/LandmarkAddressInput.tsx`
- `apps/shell/src/components/maps/types.ts` — `LandmarkAddress` (landmark, area, ward, district, formattedAddress, lat, lng)

**Props**: `value?: LandmarkAddress`, `onChange: (addr: LandmarkAddress) => void`, `placeholder?: string`

**Acceptance Criteria**:
- Google Places Autocomplete restricted to Nepal (`componentRestrictions: { country: 'np' }`)
- Landmark-based suggestions
- Extracts structured address components
- Debounced (300ms)
- Localized suggestions via `language` param (Nepali when `ne`)
- Accessible

**Test**: Mock Places API, verify suggestion rendering, selection callback. A11y check.

---

### Task 4.5: Integrate `LandmarkAddressInput` into student registration

**Files to modify**: Student registration form in academics — replace plain-text address fields.

**Acceptance Criteria**:
- Address field uses `LandmarkAddressInput`
- Stores landmark description + lat/lng
- Existing plain-text addresses still display
- Form validation: address required

**Test**: Form test: fill with landmark address, verify structured data.

---

### Task 4.6: Build `StudentDensityMap` with marker clustering

**Files to create**:
- `apps/shell/src/components/maps/StudentDensityMap.tsx`
- `apps/shell/src/components/maps/MarkerCluster.tsx`

**Props**: `students: Array<{ id, name, lat, lng }>`, `onStudentClick?: (id) => void`

**Acceptance Criteria**:
- Clusters students by proximity
- Click cluster to zoom into individuals
- Click marker for student info popup
- Color-coded density
- Performs with 500+ students

**Test**: Render with mock data, verify clusters, simulate zoom.

---

### Task 4.7: Build school admin maps dashboard page

**Files to create**:
- `apps/shell/src/pages/maps/student-density.tsx`
- `apps/shell/src/components/maps/DensityStats.tsx` — summary cards

**Files to modify**:
- `apps/shell/src/router.tsx` — add route
- Navigation — add "Student Map" menu item

**Acceptance Criteria**:
- Full-page density map + sidebar stats
- Filter by grade/class
- Empty state for no geocoded students
- Localized

**Test**: Page test with mock data.

---

### Task 4.8: Add map translation keys (en + ne)

**Files to create/modify**:
- `packages/i18n/src/locales/en/maps.json`
- `packages/i18n/src/locales/ne/maps.json`

**Files to modify**:
- `packages/i18n/src/config.ts` — register `maps` namespace

**Acceptance Criteria**: Key parity. Visual validation.

**Test**: Key parity test.

---

### Task 4.9: Sprint 4 integration test

**Scenarios**:
1. Landmark input shows suggestions, saves structured data
2. Density map renders with mock data
3. Locale toggle changes map labels
4. Address validation catches invalid districts
5. Density stats calculate correctly

**Acceptance Criteria**: All pass.

---

## Sprint 5: IEMIS Compliance Export

**Goal**: Generate Excel spreadsheets matching IEMIS (CEHRD) bulk-upload template format. Uses `exceljs` (NOT `xlsx`/SheetJS — exceljs supports full cell styling, bold headers, column widths, and borders).

**Demo**: Admin navigates to Settings → Compliance → IEMIS Export. Selects "Students". Preview table shows data mapped to IEMIS columns with BS dates. Click "Export to Excel" downloads `IEMIS_Students_2082.xlsx` — upload-ready for emis.cehrd.gov.np.

**Note**: Client-side generation is used for this sprint. If data volumes exceed browser capacity (2000+ rows on low-end devices), a follow-up task should move generation to a server-side endpoint.

---

### Task 5.1: Research and document IEMIS template structure

**Files to create**:
- `docs/iemis/template-spec.md` — exact column specs for: Student enrollment, Staff/Teacher records, School info
- `docs/iemis/field-mapping.md` — EdForge → IEMIS column mapping

**Acceptance Criteria**:
- Column names exact (Nepali headers where IEMIS requires)
- Data types and formats per column (BS date format, number format)
- Required vs optional fields identified
- At least student + staff templates fully mapped

**Validation**: Template spec verified by pilot school admin.

---

### Task 5.2: Create `@edforge/export` package with `exceljs` Excel utilities

**Dependencies**: `exceljs`

**Files to create**:
- `packages/export/package.json`
- `packages/export/src/index.ts`
- `packages/export/src/excel.ts` — `createWorkbook()`, `addSheet(wb, name, data, columns)`, `downloadWorkbook(wb, filename)`, `styleHeaderRow(sheet)`
- `packages/export/src/types.ts` — `ExportColumn`, `ExportSheet`, `ExportConfig`
- `packages/export/tsconfig.json`

**Acceptance Criteria**:
- `pnpm build --filter=@edforge/export` succeeds
- `exceljs` used (supports bold headers, background colors, auto column widths, borders)
- `downloadWorkbook()` triggers browser download of valid `.xlsx`
- Header row styled: bold, brand background color
- Column widths auto-sized

**Test**: `packages/export/src/__tests__/excel.test.ts` — create workbook, add data, parse generated xlsx back, verify structure

---

### Task 5.3: Define IEMIS-compatible data mapping types

**Files to create**:
- `packages/export/src/iemis/types.ts` — `IEMISStudentRow`, `IEMISStaffRow`, `IEMISSchoolRow`
- `packages/export/src/iemis/columns.ts` — column definitions with IEMIS header names (Nepali), data types, widths
- `packages/export/src/iemis/index.ts`

**Acceptance Criteria**:
- Types match IEMIS template exactly
- Column defs include Nepali + English headers
- Required IEMIS fields are non-optional in types

**Test**: Type compilation — enforces required fields.

---

### Task 5.4: Build student data → IEMIS transformer

**Files to create**:
- `packages/export/src/iemis/transformers/student.ts` — `transformStudentsForIEMIS(students: Student[]): IEMISStudentRow[]`

**Handles**: Name mapping, AD→BS date conversion (DOB, enrollment), grade codes → IEMIS codes, gender codes, address (district, municipality, ward from `@edforge/nepal-data`), missing data.

**Acceptance Criteria**:
- Rows match IEMIS column order
- Dates in BS format
- 1000 students < 100ms
- Edge cases handled (missing middle name, null address)

**Test**: `packages/export/src/__tests__/student-transformer.test.ts`

---

### Task 5.5: Build staff data → IEMIS transformer

**Files to create**:
- `packages/export/src/iemis/transformers/staff.ts` — `transformStaffForIEMIS(staff: Staff[]): IEMISStaffRow[]`

**Handles**: Name/qualification mapping, teacher license numbers, subject/position → IEMIS codes, employment dates in BS, salary grade.

**Acceptance Criteria**: Output matches IEMIS staff template. BS dates for employment dates.

**Test**: `packages/export/src/__tests__/staff-transformer.test.ts`

---

### Task 5.6: Build `IEMISExportWizard` UI component

**Files to create**:
- `apps/shell/src/components/export/IEMISExportWizard.tsx` — multi-step wizard (uses `@edforge/wizard`)
- `apps/shell/src/components/export/DataTypeSelector.tsx` — Step 1: Students / Staff / School Info
- `apps/shell/src/components/export/ExportPreview.tsx` — Step 2: data table preview (first 50 rows)
- `apps/shell/src/components/export/ExportOptions.tsx` — Step 3: academic year (BS), include/exclude fields
- `apps/shell/src/components/export/ExportActions.tsx` — Step 4: download + success

**Acceptance Criteria**:
- Clear wizard step progression
- Preview table with IEMIS column headers
- Academic year selector uses BS year ("2082/83")
- Download: `IEMIS_Students_2082_83.xlsx`
- Localized (en + ne)
- Loading state during data fetch

**Test**: `apps/shell/src/__tests__/IEMISExportWizard.test.tsx` — render, advance steps, verify download trigger

---

### Task 5.7: Build IEMIS export page and route

**Files to create**:
- `apps/shell/src/pages/settings/iemis-export.tsx`

**Files to modify**:
- `apps/shell/src/router.tsx` — add route `/settings/iemis-export`
- `apps/shell/src/pages/SettingsPage.tsx` — add "IEMIS Export" under Compliance section

**Acceptance Criteria**:
- Accessible from Settings sidebar
- Breadcrumb: Settings → Compliance → IEMIS Export
- Localized title and description

**Test**: Navigation test.

---

### Task 5.8: Add export translation keys (en + ne)

**Files to create/modify**:
- `packages/i18n/src/locales/en/export.json`
- `packages/i18n/src/locales/ne/export.json`

**Files to modify**:
- `packages/i18n/src/config.ts` — register `export` namespace

**Acceptance Criteria**: Key parity, visual validation.

**Test**: Key parity test.

---

### Task 5.9: IEMIS template conformance tests

**Files to create**: `packages/export/src/__tests__/iemis-conformance.test.ts`

**Scenarios**:
1. Correct sheet name
2. Header row matches IEMIS column names exactly (character-for-character)
3. Correct column count
4. Required fields never empty for valid records
5. Dates in BS format
6. Grade/gender codes match IEMIS enumeration
7. Parse back and verify data integrity
8. 1000-row dataset generates in < 5 seconds
9. Generated file < 5MB for 2000 students

**Acceptance Criteria**: All conformance tests pass.

---

### Task 5.10: Sprint 5 integration test — full export flow

**Scenarios**:
1. Navigate to IEMIS export
2. Select Students → preview → export → valid .xlsx
3. Nepali locale → UI translated, file still valid
4. Select Staff → different columns, valid export
5. No data → empty state, no download
6. Performance: 2000 rows completes without OOM

**Acceptance Criteria**: All pass.

---

## Sprint Dependency Graph

```
Sprint 0 (Foundation) ✅
  └─ Sprint 1a (i18n Infrastructure) ✅
       └─ Sprint 1b (Shell String Extraction) ⬜ partial
            └─ Sprint 1c (Micro-Frontend Localization) ⬜ partial
                 └─ Sprint 2 (Bikram Sambat / Dates) ✅ core
                      ├─ Sprint 3 (Payments) ─── NEXT (redesigned) ──────┐
                      ├─ Sprint 4 (Maps) ──── NEXT (ready) ─────────────┤
                      └─ Sprint 5 (IEMIS Export) ── future ─────────────┘
```

**Sprints 3, 4, and 5 are independent and can be parallelized after Sprint 2 core.**

---

## Remaining Localization Work (can run in parallel with Sprints 3–5)

These items from Sprint 1b/1c are not blocking but should be completed:

| Area | Status | Effort |
|------|--------|--------|
| Settings pages (account, preferences, security) | NOT DONE | Medium |
| Error boundaries / fallbacks | NOT DONE | Small |
| Toast messages across shell | NOT DONE | Medium |
| Landing page + new `landing.json` namespace | NOT DONE | Large |
| Academics: ProfileTab, EnrollmentTab, FamilyTab | NOT DONE | Medium |
| Academics: modals (Edit, AddGuardian, AddToSection) | NOT DONE | Medium |
| People module: wire components to `useTranslation('people')` | NOT DONE | Large |
| Replace raw dates with `<DateDisplay>` across all modules | NOT DONE | Medium |
| Language preference API sync (Task 1.7) | NOT DONE | Small |

---

## New Packages Summary

| Package | Purpose | Status | Bundle Impact |
|---------|---------|--------|---------------|
| `@edforge/i18n` | i18next wrapper, translations, locale hooks | **DONE** | ~40KB (i18next) |
| `@edforge/date-utils` | BS conversion, date formatting, hooks | **DONE** | ~5KB (lookup table) |
| `@edforge/config` | Shared MF config, build utilities | **DONE** | ~2KB |
| `@edforge/nepal-data` | Districts, provinces, municipalities, validation | NOT STARTED | ~15KB |
| `@edforge/export` | Excel generation via exceljs, IEMIS transformers | NOT STARTED | ~200KB (lazy-loaded) |

---

## New Environment Variables

| Variable | Purpose | Sprint | Status |
|----------|---------|--------|--------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | 4 | In turbo.json |
| `VITE_ESEWA_MERCHANT_CODE` | eSewa merchant code (dev only) | 3 | In turbo.json |
| `VITE_ESEWA_SECRET_KEY` | eSewa secret (dev only) | 3 | In turbo.json |
| `VITE_KHALTI_PUBLIC_KEY` | Khalti public key (dev only) | 3 | In turbo.json |
| `VITE_DEFAULT_LOCALE` | Default locale override | 1a | In turbo.json |
| `VITE_MOCK_PAYMENTS` | Enable mock payment handlers | 3 | In turbo.json |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend payment endpoints not ready | Sprint 3 blocked | MSW mock handlers (Task 3.3) allow full frontend development |
| IEMIS template format changes | Sprint 5 rework | Template spec validated by pilot school before implementation |
| Google Maps API quota exceeded | Sprint 4 degraded | Implement API call budgets, cache geocoding results |
| Devanagari font loading on slow connections | UX degradation | `display=swap` + conditional loading only when `ne` active |
| Bundle size growth from new packages | Performance regression | exceljs lazy-loaded, maps lazy-loaded, set bundle budget checks |
| Gateway API changes (eSewa/Khalti) | Sprint 3 rework | Server-side adapter pattern isolates gateway specifics |
| Nepal tax regulation changes (PAN/VAT) | Receipt format rework | Tax config stored per school, not hardcoded |
| Payment reconciliation failures | Data integrity | Idempotency keys on all payment operations, audit trail |

---

## CI/CD Considerations (Post-Sprint Tasks)

- Update `build:mvp` script to include new packages in filter
- Add i18n key parity check to CI (prevent deploying with missing translations)
- Add bundle size budget check (fail CI if main bundle grows > threshold)
- Update `scripts/build-deploy.sh` if module structure changes
- Add Vitest to CI pipeline (`pnpm test` in CI)
- Add payment webhook signature verification in backend deploy
