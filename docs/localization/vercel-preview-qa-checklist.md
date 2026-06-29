# Vercel Preview QA Checklist: Nepali Platform Localization

Use the latest Vercel Preview linked from PR #244 after the branch is pushed.

## Language Toggle

- Open the preview in a fresh browser session and sign in to a Nepal pilot tenant.
- Verify the avatar menu language toggle switches `EN` and `NP` without a page reload.
- Switch to `NP`, refresh the page, and verify the Nepali selection persists.
- Switch back to `EN`, refresh again, and verify English selection persists.

## Currency Regression

- With tenant regional `defaultLocale` set to `ne-NP`, switch the platform language to `EN`.
- Open Finance Overview and verify amounts use English-style formatting, for example `NPR 72,290`, not `रू ७२,२९०`.
- Switch the platform language to `NP` and verify the same Finance Overview amounts use Nepali symbol/digits, for example `रू ७२,२९०`.
- Check the overview KPI cards, collection performance card, overdue alert, billing health card, and recent payments/invoices.

## Fee Structures

- Open Finance > Configuration > Fee Structures.
- In `EN`, verify the amount table header is `Amount`, not `Amount (NPR)`.
- In `NP`, verify the amount table header is `रकम`, not `रकम (रू)`.
- Verify row amount sublabels still show the resolved currency code, for example `NPR · monthly`.
- Smoke the fee structure filters (`All`, `Active`, `Inactive`) and confirm the list does not disappear unexpectedly.

## Navigation And Basic Smoke

- From Finance Overview, click `Bulk invoice` and verify the bulk invoice route loads.
- Return to Finance Overview, click `Record payment`, and verify the record-payment route loads.
- Change date filters on Finance Overview and verify the page remains interactive.
- Open the browser console and confirm there are no module federation load errors or React render crashes.

## Visual Pass

- Repeat the Finance Overview and Fee Structures checks in light and dark theme.
- Resize to a narrow/mobile viewport and confirm translated labels do not overlap or clip in the header menu, KPI cards, and fee structure table.
