# Route Migration Guide

This document outlines all route changes made during the navigation refactoring. Use this guide to update any bookmarks, integrations, or external links.

## URL Changes

### Academics Module

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/academics/teachers` | `/people/staff` | Teachers moved to People module |
| `/academics/enrollment` | `/academics/students/enrollment` | Enrollment nested under Students |
| `/academics/schoolcalendar` | `/academics/calendar` | Renamed to Academic Calendar, kebab-case |
| `/academics/gradelevels` | `/academics/grade-levels` | Kebab-case for readability |

### Finance Module

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/finance/financials` | `/finance/accounting/general-ledger` | Replaced with specific accounting route |
| `/finance/payroll` | `/people/hr/payroll` | Payroll moved to HR section |
| `/finance/tuitionandfees` | `/finance/billing/tuition-fees` | Organized under billing, kebab-case |

### People Module

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/people/assignments` | `/people/tasks` | Renamed to avoid confusion with academic assignments |
| `/people/attendance` | `/people/hr/attendance` | Moved to HR section, explicitly staff attendance |

## New Routes

### Academics Module

- `/academics/students/profiles` - Student profiles
- `/academics/schedules` - Class schedules
- `/academics/timetables` - Timetables
- `/academics/courses` - Course management
- `/academics/standards` - Standards management
- `/academics/assessments` - Assessment management
- `/academics/exams` - Exam management

### Finance Module

- `/finance/accounting/general-ledger` - General ledger
- `/finance/accounting/accounts-payable` - Accounts payable
- `/finance/accounting/accounts-receivable` - Accounts receivable
- `/finance/billing/fee-structures` - Fee structures
- `/finance/billing/collections` - Collections
- `/finance/expenses/approvals` - Expense approvals
- `/finance/expenses/budgets` - Budget management
- `/finance/reports/audit-trail` - Audit trail

### People & HR Module

- `/people/staff` - Staff directory (includes teachers)
- `/people/hr/payroll` - Payroll management
- `/people/hr/contracts` - Contract management
- `/people/hr/professional-development` - Professional development
- `/people/hr/performance-reviews` - Performance reviews
- `/people/hr/attendance` - Staff attendance
- `/people/tasks` - Staff tasks
- `/people/tasks/assignments` - Duty assignments

### Special Programs Module (New)

- `/special-programs` - Overview
- `/special-programs/ieps` - IEP management
- `/special-programs/ieps/meetings` - IEP meetings
- `/special-programs/ieps/goals` - Goals & objectives
- `/special-programs/504-plans` - 504 Plans
- `/special-programs/accommodations` - Accommodations
- `/special-programs/accessibility` - Accessibility services
- `/special-programs/counseling` - Counseling services
- `/special-programs/interventions` - Interventions

## Redirects

All old URLs automatically redirect to their new locations. Redirects are handled at the route level using TanStack Router's `beforeLoad` hook.

## Breaking Changes

1. **Teachers Route**: `/academics/teachers` now redirects to `/people/staff`
2. **Payroll Route**: `/finance/payroll` now redirects to `/people/hr/payroll`
3. **Enrollment Route**: `/academics/enrollment` now redirects to `/academics/students/enrollment`

## Migration Checklist

- [ ] Update any bookmarks or favorites
- [ ] Update any external integrations that reference old URLs
- [ ] Update any documentation that references old routes
- [ ] Update any API documentation that includes route examples
- [ ] Test all redirects to ensure they work correctly

## Questions?

If you encounter any issues with route migrations, please contact the platform team.

