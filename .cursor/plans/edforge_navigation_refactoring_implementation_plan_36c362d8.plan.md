---
name: EdForge Navigation Refactoring Implementation Plan
overview: Comprehensive implementation plan for refactoring EdForge's navigation architecture across 4 phases, including module restructuring, route migrations, ABAC permission updates, and new module creation within the Module Federation architecture.
todos:
  - id: phase1-teachers
    content: Move Teachers from Academics to People Module - Update sidebar, routes, remote config, and ABAC permissions
    status: completed
  - id: phase1-payroll
    content: Move Payroll from Finance to People & HR - Create HR section, update routes, add redirects, update ABAC
    status: completed
  - id: phase1-urls
    content: Fix URL naming - Convert to kebab-case (schoolcalendar→calendar, gradelevels→grade-levels, etc.) and add redirects
    status: completed
  - id: phase2-academics
    content: Restructure Academics Module - Nest enrollment under students, add scheduling/timetables, separate assessment, create new routes
    status: completed
    dependencies:
      - phase1-urls
  - id: phase2-finance
    content: Restructure Finance Module - Replace financials with accounting sub-modules, organize billing section, expand expenses/reports
    status: completed
    dependencies:
      - phase1-urls
  - id: phase2-people
    content: Restructure People Module to People & HR - Create HR section, rename assignments to tasks, organize staff/parents sections
    status: completed
    dependencies:
      - phase1-teachers
      - phase1-payroll
  - id: phase3-special-programs
    content: Create Special Programs Module - New MFE module with IEPs, 504 Plans, Accommodations, Support Services
    status: completed
  - id: phase3-professional-dev
    content: Add Professional Development to People & HR - Create component, add route, update ABAC permissions
    status: completed
    dependencies:
      - phase2-people
  - id: phase3-scheduling
    content: Enhance Scheduling in Academics - Create Class Schedules and Timetables components, add routes, update ABAC
    status: completed
    dependencies:
      - phase2-academics
  - id: phase4-labels
    content: Update All Labels to Professional Terminology - Update sidebar module labels, ensure consistency
    status: completed
    dependencies:
      - phase1-teachers
      - phase1-payroll
      - phase2-academics
      - phase2-finance
      - phase2-people
  - id: phase4-breadcrumbs
    content: Add Breadcrumbs for Deep Navigation - Create Breadcrumbs component, useBreadcrumbs hook, integrate into AppShell
    status: completed
  - id: phase4-documentation
    content: Update Documentation - Update DEVELOPER.md, README.md, create migration guide
    status: completed
    dependencies:
      - phase1-teachers
      - phase1-payroll
      - phase2-academics
      - phase2-finance
      - phase2-people
      - phase3-special-programs
---

# EdForge Navigat

ion Refactoring - Implementation Plan

## Architecture Context

EdForge uses a **Module Federation (MFE)** architecture:

- **Shell** (host) at `edforge-mfe/apps/shell` - orchestrates all modules
- **Remote modules** (academics, finance, edfi) - expose components via Module Federation
- **Shared packages** (`@edforge/types`, `@edforge/abac`, `@edforge/ui`) - shared across modules
- **Routing** - TanStack Router in shell with route definitions in `router.tsx`
- **Navigation** - Sidebar modules configured in `config/sidebar-modules.ts`

---

## Phase 1: Critical Refactoring (Weeks 1-2)

### Task 1.1: Move Teachers from Academics to People Module

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Remove teachers from academics, add to people
- `edforge-mfe/apps/shell/src/router.tsx` - Remove `/academics/teachers` route, add redirect
- `edforge-mfe/apps/academics/rsbuild.config.ts` - Remove `TeachersModule` from exposes
- `edforge-mfe/apps/academics/src/routes/teachers/index.tsx` - Move to people module (or create new)
- `edforge-mfe/packages/abac/src/permissions.ts` - Update resource permissions

**Steps:**

1. Update `academicsModule` in `sidebar-modules.ts`:

- Remove `teachers` item from MANAGEMENT group
- Update `academicsModule.groups[1].items` to exclude teachers

2. Update `peopleModule` in `sidebar-modules.ts`:

- Add `teachers` item under STAFF group with href `/people/staff` (will show teachers)
- Update label from "Directory" to "Staff Directory" to include teachers

3. Create route redirect in `router.tsx`:
   ```typescript
         const academicsTeachersRedirect = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/teachers',
           beforeLoad: () => {
             throw redirect({ to: '/people/staff' })
           },
         })
   ```




4. Update academics remote config:

- Remove `'./TeachersModule': './src/routes/teachers/index.tsx'` from exposes in `academics/rsbuild.config.ts`

5. Update ABAC permissions:

- Ensure `teachers` resource maps to `staff` permissions
- Update `ROLE_PERMISSIONS` to use `staff` for teacher access

**Acceptance Criteria:**

- `/academics/teachers` redirects to `/people/staff`
- Teachers no longer appear in Academics sidebar
- Teachers appear in People sidebar under Staff
- All permissions work correctly

---

### Task 1.2: Move Payroll from Finance to People & HR

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Update finance and people modules
- `edforge-mfe/apps/shell/src/router.tsx` - Create `/people/hr` routes, add redirect
- `edforge-mfe/apps/finance/rsbuild.config.ts` - Remove PayrollModule from exposes
- `edforge-mfe/apps/finance/src/routes/payroll/index.tsx` - Move to people module
- `edforge-mfe/packages/abac/src/permissions.ts` - Add HR resources

**Steps:**

1. Create HR section in `peopleModule`:

- Add new group `{ id: 'human-resources', label: 'HUMAN RESOURCES', items: [...] }`
- Add payroll item with href `/people/hr/payroll`
- Add other HR items (contracts, professional-development, performance-reviews, staff-attendance)

2. Update `financeModule` in `sidebar-modules.ts`:

- Remove `payroll` item from MANAGEMENT group

3. Create HR route structure in `router.tsx`:
   ```typescript
         const peopleHrRoute = createRoute({
           getParentRoute: () => peopleRoute,
           path: '/hr',
           component: () => <div>HR Dashboard</div>,
         })
         
         const peopleHrPayrollRoute = createRoute({
           getParentRoute: () => peopleHrRoute,
           path: '/payroll',
           component: () => <PayrollModule />, // Load from finance remote or create new
         })
   ```




4. Add redirect for old payroll route:
   ```typescript
         const financePayrollRedirect = createRoute({
           getParentRoute: () => financeRoute,
           path: '/payroll',
           beforeLoad: () => {
             throw redirect({ to: '/people/hr/payroll' })
           },
         })
   ```




5. Update finance remote config:

- Remove `'./PayrollModule': './src/routes/payroll/index.tsx'` from exposes
- Or keep it but load it from people routes

6. Update ABAC permissions:

- Add `'hr'` and `'hr:payroll'` to Resource type
- Update `ROLE_PERMISSIONS` with HR permissions
- Map `payroll` resource to `hr:payroll`

**Acceptance Criteria:**

- `/finance/payroll` redirects to `/people/hr/payroll`
- Payroll no longer appears in Finance sidebar
- Payroll appears in People sidebar under HR section
- HR section is properly structured

---

### Task 1.3: Fix URL Naming - Convert to Kebab-Case

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Update all hrefs
- `edforge-mfe/apps/shell/src/router.tsx` - Update all route paths
- `edforge-mfe/apps/academics/rsbuild.config.ts` - Update exposed module paths if needed

**URL Mappings:**

- `/academics/schoolcalendar` → `/academics/calendar`
- `/academics/gradelevels` → `/academics/grade-levels`
- `/finance/tuitionandfees` → `/finance/billing/tuition-fees`
- `/people/assignments` → `/people/tasks`

**Steps:**

1. Update sidebar module hrefs:

- Change `href: '/academics/schoolcalendar'` to `href: '/academics/calendar'`
- Change `href: '/academics/gradelevels'` to `href: '/academics/grade-levels'`
- Change `href: '/finance/tuitionandfees'` to `href: '/finance/billing/tuition-fees'`
- Change `href: '/people/assignments'` to `href: '/people/tasks'`

2. Update route definitions in `router.tsx`:

- Rename `academicsCalendarRoute` path from `/schoolcalendar` to `/calendar`
- Rename `academicsGradelevelsRoute` path from `/gradelevels` to `/grade-levels`
- Rename `financeTuitionRoute` path from `/tuitionandfees` to `/billing/tuition-fees`
- Create nested billing route structure

3. Add redirect routes for backward compatibility: Backward compatibility spport not required 
   ```typescript
         const academicsSchoolCalendarRedirect = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/schoolcalendar',
           beforeLoad: () => {
             throw redirect({ to: '/academics/calendar' })
           },
         })
   ```




4. Update `detectModuleFromPath` function in `sidebar-modules.ts` to handle new paths

**Acceptance Criteria:**

- All URLs use kebab-case
- Old URLs redirect to new URLs
- Sidebar navigation uses new URLs
- No broken links

---

## Phase 2: Module Reorganization (Weeks 3-4)

### Task 2.1: Restructure Academics Module

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Restructure academicsModule
- `edforge-mfe/apps/shell/src/router.tsx` - Create nested student routes
- `edforge-mfe/apps/academics/rsbuild.config.ts` - Update exposed modules
- `edforge-mfe/apps/academics/src/routes/` - Reorganize route structure

**New Structure:**

```javascript
/academics
  /students
    / (directory)
    /enrollment
    /profiles
  /classrooms
  /schedules (new)
  /timetables (new)
  /grade-levels
  /courses (new)
  /standards (new)
  /gradebooks
  /assessments (new)
  /exams (new)
  /attendance
  /calendar
```

**Steps:**

1. Update `academicsModule` in `sidebar-modules.ts`:

- Reorganize groups: STUDENTS, CLASSES & SCHEDULING, CURRICULUM, ASSESSMENT, TRACKING
- Move enrollment under STUDENTS group
- Add new items: schedules, timetables, courses, standards, assessments, exams
- Update hrefs to match new structure

2. Create nested student routes in `router.tsx`:
   ```typescript
         const academicsStudentsRoute = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/students',
           component: () => <StudentsModule />,
         })
         
         const academicsStudentsEnrollmentRoute = createRoute({
           getParentRoute: () => academicsStudentsRoute,
           path: '/enrollment',
           component: () => <EnrollmentModule />,
         })
   ```




3. Add redirect for old enrollment route:
   ```typescript
         const academicsEnrollmentRedirect = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/enrollment',
           beforeLoad: () => {
             throw redirect({ to: '/academics/students/enrollment' })
           },
         })
   ```




4. Create new route components:

- `academics/src/routes/schedules/index.tsx`
- `academics/src/routes/timetables/index.tsx`
- `academics/src/routes/courses/index.tsx`
- `academics/src/routes/standards/index.tsx`
- `academics/src/routes/assessments/index.tsx`
- `academics/src/routes/exams/index.tsx`

5. Update academics remote config to expose new modules
6. Update ABAC permissions:

- Add `'scheduling'`, `'assessment'`, `'courses'`, `'standards'` resources
- Update `ROLE_PERMISSIONS`

**Acceptance Criteria:**

- Enrollment is under `/academics/students/enrollment`
- New routes are accessible
- Sidebar shows new structure
- All old routes redirect correctly

---

### Task 2.2: Restructure Finance Module

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Restructure financeModule
- `edforge-mfe/apps/shell/src/router.tsx` - Create nested accounting and billing routes
- `edforge-mfe/apps/finance/rsbuild.config.ts` - Update exposed modules
- `edforge-mfe/apps/finance/src/routes/` - Reorganize route structure

**New Structure:**

```javascript
/finance
  /accounting
    /general-ledger
    /accounts-payable
    /accounts-receivable
  /billing
    /tuition-fees
    /fee-structures (new)
    /collections (new)
  /expenses
    / (tracking)
    /approvals (new)
    /budgets (new)
  /reports
    / (financial reports)
    /audit-trail (new)
```

**Steps:**

1. Update `financeModule` in `sidebar-modules.ts`:

- Replace "Financials" with ACCOUNTING group containing general-ledger, accounts-payable, accounts-receivable
- Create BILLING group with tuition-fees, fee-structures, collections
- Expand EXPENSES group with approvals, budgets
- Expand REPORTS group with audit-trail

2. Create nested route structure in `router.tsx`:
   ```typescript
         const financeAccountingRoute = createRoute({
           getParentRoute: () => financeRoute,
           path: '/accounting',
           component: () => <AccountingModule />,
         })
         
         const financeAccountingGeneralLedgerRoute = createRoute({
           getParentRoute: () => financeAccountingRoute,
           path: '/general-ledger',
           component: () => <GeneralLedgerModule />,
         })
   ```




3. Add redirect for old financials route:
   ```typescript
         const financeFinancialsRedirect = createRoute({
           getParentRoute: () => financeRoute,
           path: '/financials',
           beforeLoad: () => {
             throw redirect({ to: '/finance/accounting/general-ledger' })
           },
         })
   ```




4. Create new route components in finance module:

- `finance/src/routes/accounting/general-ledger/index.tsx`
- `finance/src/routes/accounting/accounts-payable/index.tsx`
- `finance/src/routes/accounting/accounts-receivable/index.tsx`
- `finance/src/routes/billing/fee-structures/index.tsx`
- `finance/src/routes/billing/collections/index.tsx`
- `finance/src/routes/expenses/approvals/index.tsx`
- `finance/src/routes/expenses/budgets/index.tsx`
- `finance/src/routes/reports/audit-trail/index.tsx`

5. Update finance remote config to expose new modules

**Acceptance Criteria:**

- `/finance/financials` redirects to `/finance/accounting/general-ledger`
- All new routes are accessible
- Sidebar shows new structure
- Billing is properly nested

---

### Task 2.3: Restructure People Module to People & HR

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Restructure peopleModule
- `edforge-mfe/apps/shell/src/router.tsx` - Create HR and tasks routes
- Create new `edforge-mfe/apps/people/` module (if doesn't exist)
- `edforge-mfe/packages/abac/src/permissions.ts` - Add HR resources

**New Structure:**

```javascript
/people
  /staff
    / (directory)
    /profiles (new)
    /departments
  /hr
    /payroll
    /contracts (new)
    /professional-development (new)
    /performance-reviews (new)
    /attendance
  /tasks
    / (staff tasks)
    /assignments (duty assignments)
  /parents
    / (directory)
    /profiles (new)
```

**Steps:**

1. Update `peopleModule` in `sidebar-modules.ts`:

- Change title from "People" to "People & HR"
- Reorganize into: STAFF, HUMAN RESOURCES, TASKS & DUTIES, PARENTS & GUARDIANS
- Rename "Assignments" to "Tasks" with href `/people/tasks`
- Add all HR items under HUMAN RESOURCES group
- Update "My People" label to "Overview"

2. Create People MFE module (if needed):
   ```bash
         mkdir -p apps/people/src/{routes,components,stores,lib}
   ```




- Create `apps/people/package.json`
- Create `apps/people/rsbuild.config.ts` with Module Federation config
- Expose PeopleModule, StaffModule, HRModule, etc.

3. Update routes in `router.tsx`:

- Create `/people/staff` routes
- Create `/people/hr` routes (from Task 1.2)
- Create `/people/tasks` routes
- Create `/people/parents` routes

4. Add redirect for assignments:
   ```typescript
         const peopleAssignmentsRedirect = createRoute({
           getParentRoute: () => peopleRoute,
           path: '/assignments',
           beforeLoad: () => {
             throw redirect({ to: '/people/tasks' })
           },
         })
   ```




5. Update ABAC permissions:

- Add `'hr:contracts'`, `'hr:professional-dev'`, `'hr:performance-reviews'` resources
- Update `ROLE_PERMISSIONS`

6. Register people remote in shell:

- Add to `shell/rsbuild.config.ts` remotes
- Update tenant resolver if needed

**Acceptance Criteria:**

- People module is properly structured
- HR section is complete
- Tasks section replaces Assignments
- All routes work correctly

---

## Phase 3: New Features (Weeks 5-8)

### Task 3.1: Create Special Programs Module

**Files to Create:**

- `edforge-mfe/apps/special-programs/` - New MFE module
- `edforge-mfe/apps/special-programs/package.json`
- `edforge-mfe/apps/special-programs/rsbuild.config.ts`
- `edforge-mfe/apps/special-programs/src/bootstrap.tsx`
- `edforge-mfe/apps/special-programs/src/routes/` - All route components

**New Module Structure:**

```javascript
/special-programs
  /ieps
    / (list)
    /meetings (new)
    /goals (new)
  /504-plans
  /accommodations
  /accessibility (new)
  /counseling (new)
  /interventions (new)
```

**Steps:**

1. Create module structure:
   ```bash
         mkdir -p apps/special-programs/src/{routes,components,stores,lib}
         mkdir -p apps/special-programs/src/routes/{ieps,504-plans,accommodations,accessibility,counseling,interventions}
   ```




2. Create `package.json`:
   ```json
         {
           "name": "@edforge/special-programs",
           "version": "0.0.1",
           "private": true,
           "scripts": {
             "dev": "rsbuild dev",
             "build": "rsbuild build",
             "typecheck": "tsc --noEmit"
           },
           "dependencies": {
             "@edforge/ui": "workspace:*",
             "@edforge/types": "workspace:*",
             "@edforge/abac": "workspace:*",
             "react": "^19.0.0",
             "react-dom": "^19.0.0"
           }
         }
   ```




3. Create `rsbuild.config.ts` with Module Federation:

- Expose `SpecialProgramsModule`, `IEPsModule`, `504PlansModule`, etc.
- Port: 3005

4. Create route components:

- `src/routes/ieps/index.tsx`
- `src/routes/ieps/meetings/index.tsx`
- `src/routes/ieps/goals/index.tsx`
- `src/routes/504-plans/index.tsx`
- `src/routes/accommodations/index.tsx`
- `src/routes/accessibility/index.tsx`
- `src/routes/counseling/index.tsx`
- `src/routes/interventions/index.tsx`

5. Add to shell sidebar modules:

- Create `specialProgramsModule` config in `sidebar-modules.ts`
- Add to `SIDEBAR_MODULES` registry
- Add to `SidebarModule` type

6. Add routes to shell router:

- Create `/special-programs` route
- Create nested routes for all sub-modules
- Load remote modules using `loadRemote`

7. Register remote in shell:

- Add to `shell/rsbuild.config.ts` remotes
- Update tenant resolver

8. Update ABAC permissions:

- Add `'special-programs'`, `'special-programs:ieps'`, `'special-programs:504'` resources
- Update `ROLE_PERMISSIONS`

**Acceptance Criteria:**

- Special Programs module is created and functional
- All routes are accessible
- Sidebar shows Special Programs module
- Permissions work correctly

---

### Task 3.2: Add Professional Development to People & HR

**Files to Modify:**

- `edforge-mfe/apps/people/src/routes/hr/professional-development/index.tsx` - Create component
- `edforge-mfe/apps/shell/src/router.tsx` - Add route
- `edforge-mfe/packages/abac/src/permissions.ts` - Add permissions

**Steps:**

1. Create Professional Development component:

- Training tracking
- Certification management
- Professional growth plans

2. Add route in shell router:
   ```typescript
         const peopleHrProfessionalDevRoute = createRoute({
           getParentRoute: () => peopleHrRoute,
           path: '/professional-development',
           component: () => <ProfessionalDevelopmentModule />,
         })
   ```




3. Update ABAC permissions:

- Add `'hr:professional-dev'` resource
- Update `ROLE_PERMISSIONS`

**Acceptance Criteria:**

- Professional Development is accessible at `/people/hr/professional-development`
- Component is functional
- Permissions work correctly

---

### Task 3.3: Enhance Scheduling in Academics

**Files to Modify:**

- `edforge-mfe/apps/academics/src/routes/schedules/index.tsx` - Create component
- `edforge-mfe/apps/academics/src/routes/timetables/index.tsx` - Create component
- `edforge-mfe/apps/shell/src/router.tsx` - Add routes
- `edforge-mfe/packages/abac/src/permissions.ts` - Add permissions

**Steps:**

1. Create Class Schedules component:

- Period assignments
- Teacher-class assignments
- Schedule conflicts detection

2. Create Timetables component:

- Weekly/daily timetables
- Room assignments
- Time slot management

3. Add routes in shell router:
   ```typescript
         const academicsSchedulesRoute = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/schedules',
           component: () => <SchedulesModule />,
         })
         
         const academicsTimetablesRoute = createRoute({
           getParentRoute: () => academicsRoute,
           path: '/timetables',
           component: () => <TimetablesModule />,
         })
   ```




4. Update ABAC permissions:

- Add `'scheduling'` resource
- Update `ROLE_PERMISSIONS`

5. Update academics remote config to expose new modules

**Acceptance Criteria:**

- Schedules and Timetables are accessible
- Components are functional
- Integrated with Classrooms

---

## Phase 4: Polish & Optimization (Weeks 9-10)

### Task 4.1: Update All Labels to Professional Terminology

**Files to Modify:**

- `edforge-mfe/apps/shell/src/config/sidebar-modules.ts` - Update all labels

**Label Updates:**

- "My People" → "People & HR" (module title)
- "Colleague" → "Staff Directory" (if exists)
- "Financials" → "Accounting" (group label)
- "Tuition Fees" → "Tuition & Fees"
- "Assignments" (People) → "Tasks"
- "Reporting" → Context-specific labels
- "School Calendar" → "Academic Calendar"

**Steps:**

1. Update all module titles
2. Update all group labels
3. Update all item labels
4. Ensure consistency across all modules

**Acceptance Criteria:**

- All labels are professional and clear
- No ambiguous terminology
- Consistent formatting

---

### Task 4.2: Add Breadcrumbs for Deep Navigation

**Files to Create/Modify:**

- `edforge-mfe/apps/shell/src/components/layout/Breadcrumbs.tsx` - Create component
- `edforge-mfe/apps/shell/src/components/layout/AppShell.tsx` - Add breadcrumbs
- `edforge-mfe/apps/shell/src/hooks/useBreadcrumbs.ts` - Create hook

**Steps:**

1. Create Breadcrumbs component:

- Parse current route
- Generate breadcrumb trail
- Handle nested routes

2. Create useBreadcrumbs hook:

- Get current pathname
- Map to breadcrumb labels
- Return breadcrumb array

3. Add to AppShell:

- Display breadcrumbs above content
- Style consistently

**Acceptance Criteria:**

- Breadcrumbs show for all deep routes
- Clickable navigation
- Consistent styling

---

### Task 4.3: Update Documentation

**Files to Create/Modify:**

- `edforge-mfe/DEVELOPER.md` - Update with new module info
- `edforge-mfe/README.md` - Update architecture docs
- Create migration guide for old URLs

**Steps:**

1. Update DEVELOPER.md:

- Add People module documentation
- Add Special Programs module documentation
- Update route examples

2. Create migration guide:

- Document all URL changes
- Provide redirect mappings
- Update API documentation

3. Update README:

- Reflect new module structure
- Update architecture diagram

**Acceptance Criteria:**

- Documentation is complete
- Migration guide is clear
- All examples are updated

---

## Technical Considerations

### Route Migration Strategy

Create a centralized redirect utility:

```typescript
// apps/shell/src/lib/route-migrations.ts
export const ROUTE_MIGRATIONS: Record<string, string> = {
  '/academics/teachers': '/people/staff',
  '/academics/enrollment': '/academics/students/enrollment',
  '/academics/schoolcalendar': '/academics/calendar',
  '/academics/gradelevels': '/academics/grade-levels',
  '/finance/financials': '/finance/accounting/general-ledger',
  '/finance/payroll': '/people/hr/payroll',
  '/finance/tuitionandfees': '/finance/billing/tuition-fees',
  '/people/assignments': '/people/tasks',
  '/people/attendance': '/people/hr/attendance',
}
```



### ABAC Permission Updates

All new resources must be added to:

- `packages/abac/src/permissions.ts` - Resource type and ROLE_PERMISSIONS
- Update all role permission mappings

### Module Federation Updates

When creating new modules:

1. Create module structure
2. Configure rsbuild.config.ts with Module Federation
3. Register in shell rsbuild.config.ts remotes
4. Update tenant resolver if needed
5. Generate types with `mf dts`

### Testing Strategy

- Test all route redirects
- Test all sidebar navigation
- Test ABAC permissions
- Test Module Federation loading
- Test deep linking

---

## Dependencies Between Tasks

```javascript
Task 1.1 (Teachers) → Task 2.3 (People restructure)
Task 1.2 (Payroll) → Task 2.3 (People restructure)
Task 1.3 (URLs) → All Phase 2 tasks
Task 2.1 (Academics) → Task 3.3 (Scheduling)
Task 2.3 (People) → Task 3.2 (Professional Dev)
All Phase 1-3 → Task 4.1 (Labels)
All Phase 1-3 → Task 4.2 (Breadcrumbs)
```

---

## Success Metrics

- All old URLs redirect correctly
- All new routes are accessible
- Sidebar navigation is intuitive
- ABAC permissions work correctly
- Module Federation loads correctly
- No broken links