# EdForge Navigation Refactoring - Testing Checklist

This document provides a comprehensive testing checklist for verifying all navigation refactoring changes are working correctly.

## Build & Compilation Tests

### ✅ Module Federation Configuration
- [ ] Shell builds without errors
- [ ] Academics module builds without errors
- [ ] Finance module builds without errors
- [ ] People module builds without errors
- [ ] Special Programs module builds without errors
- [ ] All remotes are properly configured in shell's `rsbuild.config.ts`
- [ ] Module Federation names are valid JavaScript identifiers (camelCase)

### ✅ TypeScript Compilation
- [ ] All packages typecheck successfully
- [ ] No type errors in router configuration
- [ ] No type errors in sidebar modules configuration
- [ ] ABAC permissions types are correct

## Route & Navigation Tests

### ✅ URL Structure & Redirects
- [ ] `/academics/teachers` redirects to `/people/staff`
- [ ] `/academics/enrollment` redirects to `/academics/students/enrollment`
- [ ] `/academics/schoolcalendar` redirects to `/academics/calendar`
- [ ] `/academics/gradelevels` redirects to `/academics/grade-levels`
- [ ] `/finance/payroll` redirects to `/people/hr/payroll`
- [ ] `/finance/tuitionandfees` redirects to `/finance/billing/tuition-fees`
- [ ] All new routes are accessible (no 404s)

### ✅ Academics Module Routes
- [ ] `/academics` - Overview page loads
- [ ] `/academics/students` - Student directory loads
- [ ] `/academics/students/enrollment` - Enrollment page loads
- [ ] `/academics/students/profiles` - Student profiles page loads
- [ ] `/academics/classrooms` - Classrooms page loads
- [ ] `/academics/schedules` - Class schedules page loads
- [ ] `/academics/timetables` - Timetables page loads
- [ ] `/academics/grade-levels` - Grade levels page loads
- [ ] `/academics/curriculum` - Curriculum overview loads
- [ ] `/academics/curriculum/courses` - Courses page loads
- [ ] `/academics/curriculum/standards` - Standards page loads
- [ ] `/academics/assessment` - Assessment overview loads
- [ ] `/academics/assessment/gradebooks` - Gradebooks page loads
- [ ] `/academics/assessment/assessments` - Assessments page loads
- [ ] `/academics/assessment/exams` - Exams page loads
- [ ] `/academics/calendar` - Academic calendar loads

### ✅ Finance Module Routes
- [ ] `/finance` - Overview page loads
- [ ] `/finance/accounting` - Accounting overview loads
- [ ] `/finance/accounting/general-ledger` - General ledger loads
- [ ] `/finance/accounting/accounts-payable` - Accounts payable loads
- [ ] `/finance/accounting/accounts-receivable` - Accounts receivable loads
- [ ] `/finance/billing` - Billing overview loads
- [ ] `/finance/billing/tuition-fees` - Tuition & fees loads
- [ ] `/finance/billing/fee-structures` - Fee structures loads
- [ ] `/finance/billing/collections` - Collections loads
- [ ] `/finance/expenses` - Expense tracking loads
- [ ] `/finance/expenses/approvals` - Expense approvals loads
- [ ] `/finance/expenses/budgets` - Budgets loads
- [ ] `/finance/reports` - Financial reports loads
- [ ] `/finance/reports/audit-trail` - Audit trail loads

### ✅ People & HR Module Routes
- [ ] `/people` - Overview page loads
- [ ] `/people/staff` - Staff directory loads
- [ ] `/people/tasks` - Tasks page loads (renamed from assignments)
- [ ] `/people/hr` - HR overview loads
- [ ] `/people/hr/payroll` - Payroll loads
- [ ] `/people/hr/contracts` - Contracts loads
- [ ] `/people/hr/professional-development` - Professional development loads
- [ ] `/people/hr/performance-reviews` - Performance reviews loads
- [ ] `/people/hr/attendance` - Staff attendance loads
- [ ] `/people/parents` - Parents directory loads

### ✅ Special Programs Module Routes
- [ ] `/special-programs` - Overview page loads
- [ ] `/special-programs/ieps` - IEPs page loads
- [ ] `/special-programs/ieps/meetings` - IEP meetings loads
- [ ] `/special-programs/ieps/goals` - Goals & objectives loads
- [ ] `/special-programs/504-plans` - 504 Plans page loads
- [ ] `/special-programs/accommodations` - Accommodations page loads
- [ ] `/special-programs/accessibility` - Accessibility services loads
- [ ] `/special-programs/counseling` - Counseling loads
- [ ] `/special-programs/interventions` - Interventions loads

## Sidebar Navigation Tests

### ✅ Module Detection
- [ ] Sidebar correctly detects current module from URL
- [ ] Sidebar switches modules when navigating between routes
- [ ] Back navigation works correctly
- [ ] Module icons display correctly

### ✅ Navigation Items
- [ ] All navigation items appear in sidebar
- [ ] Navigation items are grouped correctly
- [ ] Group labels are displayed (e.g., "STUDENTS", "ACCOUNTING")
- [ ] Icons display for all navigation items
- [ ] Active route is highlighted in sidebar
- [ ] Navigation items respect ABAC permissions (hidden if no access)

### ✅ Module-Specific Navigation
- [ ] Academics module sidebar shows correct items
- [ ] Finance module sidebar shows correct items
- [ ] People & HR module sidebar shows correct items
- [ ] Special Programs module sidebar shows correct items
- [ ] Home module sidebar shows correct items

## ABAC Permission Tests

### ✅ Permission Checks
- [ ] Navigation items are hidden based on user permissions
- [ ] Routes are protected (redirect if no permission)
- [ ] New resources are properly defined in ABAC
- [ ] Role permissions are correctly configured:
  - [ ] Principal has access to all modules
  - [ ] Teacher has access to academics, special programs
  - [ ] Accountant has access to finance
  - [ ] Staff has access to people & HR
  - [ ] Student has limited access
  - [ ] Parent has limited access

### ✅ New Resources
- [ ] `hr` resource permissions work
- [ ] `hr:payroll` permissions work
- [ ] `hr:contracts` permissions work
- [ ] `hr:professional-dev` permissions work
- [ ] `hr:performance-reviews` permissions work
- [ ] `hr:staff-attendance` permissions work
- [ ] `special-programs` resource permissions work
- [ ] `special-programs:ieps` permissions work
- [ ] `special-programs:504` permissions work
- [ ] `special-programs:accommodations` permissions work
- [ ] `special-programs:accessibility` permissions work
- [ ] `special-programs:counseling` permissions work
- [ ] `special-programs:interventions` permissions work
- [ ] `scheduling` resource permissions work
- [ ] `assessment` resource permissions work
- [ ] `courses` resource permissions work
- [ ] `standards` resource permissions work
- [ ] `exams` resource permissions work

## Breadcrumbs Tests

### ✅ Breadcrumb Navigation
- [ ] Breadcrumbs display correctly for all routes
- [ ] Breadcrumb labels are correct and readable
- [ ] Breadcrumbs are clickable (navigation works)
- [ ] Breadcrumbs show correct hierarchy
- [ ] Dynamic route parameters show in breadcrumbs (e.g., student ID)

## UI/UX Tests

### ✅ Labels & Terminology
- [ ] All labels use professional terminology
- [ ] Labels are consistent across modules
- [ ] No confusing or ambiguous labels
- [ ] Module titles are clear (e.g., "People & HR", "Finance & Billing")

### ✅ URL Readability
- [ ] URLs use kebab-case consistently
- [ ] URLs are readable and logical
- [ ] URLs reflect the navigation hierarchy

### ✅ Module Overview Pages
- [ ] Overview pages load correctly
- [ ] Overview pages show correct stats
- [ ] Action cards link to correct routes
- [ ] Action cards respect permissions

## Integration Tests

### ✅ Module Federation
- [ ] Remote modules load correctly
- [ ] No console errors when loading remotes
- [ ] Shared dependencies are properly loaded
- [ ] Type safety works across module boundaries

### ✅ State Management
- [ ] Sidebar state persists correctly
- [ ] Theme state works across modules
- [ ] Auth state works across modules
- [ ] App state (active school) works across modules

## Browser Compatibility Tests

### ✅ Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (if applicable)

### ✅ Responsive Design
- [ ] Sidebar collapses on mobile
- [ ] Navigation works on mobile
- [ ] Routes are accessible on mobile

## Performance Tests

### ✅ Load Times
- [ ] Initial page load is acceptable
- [ ] Route transitions are smooth
- [ ] Module loading doesn't block UI
- [ ] Lazy loading works correctly

## Error Handling Tests

### ✅ Error States
- [ ] 404 pages display correctly
- [ ] Permission denied pages display correctly
- [ ] Network errors are handled gracefully
- [ ] Module load failures are handled gracefully

---

## Test Execution Notes

1. **Manual Testing**: Use browser dev tools to test routes, check console for errors
2. **Permission Testing**: Switch between different user roles to test ABAC
3. **Navigation Testing**: Click through all sidebar items and verify routes
4. **Redirect Testing**: Test old URLs to ensure redirects work
5. **Module Federation**: Check Network tab to verify remote modules load

## Known Issues

- Type errors in rsbuild.config.ts files (pre-existing, doesn't affect runtime)
- Module Federation type generation may have permission issues in some environments

