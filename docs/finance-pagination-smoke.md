# Finance table cursor-pagination — UAT smoke checklist

Run against UAT (`https://uat.edforge.app`) with a school that has **>50** invoices, payments, and student accounts where possible.

## Admin Finance MFE

### Invoices (`/finance/billing/invoices`)

- [ ] Table footer shows loaded count with `+` when more pages exist (e.g. `50+`)
- [ ] Click **Next** at end of client page buffer; network shows `cursor` query param on second request
- [ ] KPI dollar amounts (Total Invoiced, Collected, Outstanding, Overdue) match Finance Overview for same school
- [ ] Status filter chip change resets list to first page with new data
- [ ] Issue or cancel invoice refreshes list from page 1
- [ ] Bulk selection shows “loaded records only” hint when `hasMore`

### Payments (`/finance/billing/payments`)

- [ ] Same Next / `cursor` behavior as invoices
- [ ] Total Collected KPI matches dashboard summary
- [ ] Void/refund refreshes list from start

### Student accounts (`/finance/billing/accounts`)

- [ ] Main table loads beyond 50 accounts via Next
- [ ] Expanded **Ledger** tab: “Load more ledger entries” when >50 entries
- [ ] Expanded **Invoices** tab: “Load more invoices” when applicable

### Fee structures (`/finance/configuration/fee-structures`)

- [ ] Table supports server pagination when >50 structures (or mock with lowered limit)

### Record payment (`/finance/billing/payments/record`)

- [ ] Select student with >50 open invoices; unpaid invoice from page 2+ is selectable after auto-load

## Shell parent portal

- [ ] **Fee payment** page: “Load more invoices” loads page 2 (requires backend B-1 on UAT)
- [ ] **Parent overview** billing callout reflects loaded invoices

## Backend (B-1)

- [ ] `GET …/invoices` as Parent returns `lastEvaluatedKey` when `hasMore: true` for student-scoped list

## Notes

- Global table search filters **loaded rows only** until server search exists.
- Invoice list status filter does not change dashboard KPI breakdown unless backend adds filtered summary.
