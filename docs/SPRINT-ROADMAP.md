# EdForge MFE Sprint Roadmap

> Comprehensive sprint breakdown for completing the EdForge EMIS micro-frontend platform.
> Each sprint results in demoable software that builds on previous work.

---

## Current State Assessment

### Implementation Status Summary

| Component | Status | Completeness |
|-----------|--------|--------------|
| **Shell (Host)** | Production-ready | ~90% |
| **@edforge/abac** | Complete | 95% |
| **@edforge/auth** | Complete | 90% |
| **@edforge/wizard** | Complete | 90% |
| **@edforge/types** | Complete | 85% |
| **@edforge/forms** | Complete | 80% |
| **@edforge/ui** | Needs expansion | 70% |
| **EdFi Module** | Complete | 95% |
| **People Module** | Mostly complete | 80% |
| **Finance Module** | Partial | 40% |
| **Messages Module** | Partial | 35% |
| **Academics Module** | Scaffolded only | 30% |
| **Analytics Module** | Scaffolded only | 25% |
| **Special Programs Module** | Placeholders only | 10% |
| **Student/Parent Portals** | Not started | 0% |

---

## Sprint Overview

| Sprint | Name | Goal |
|--------|------|------|
| 5 | UI Polish & Foundation | Complete Shell UI refinements + testing/i18n infrastructure (current) |
| 6 | People Module Completion | Full staff/HR management + notification infrastructure |
| 7 | Academics Core | Student management, enrollment, attendance |
| 8 | Academics Extended | Gradebook, curriculum, scheduling |
| 9 | Finance Module | Billing, tuition, payroll, expenses |
| 10 | Messages & Communication | Inbox, announcements, meetings |
| 11 | Analytics & Reporting | Dashboards, reports, data visualization |
| 12 | Special Programs | IEPs, 504 plans, accommodations |
| 13 | Portals | Student and parent self-service |
| 14 | Ed-Fi Integration Enhancement | State reporting, sync completion |
| 15 | Production Hardening | Final testing, monitoring, documentation |

---

## Risk Assessment

### Highest Risk Tasks (Require Extra Attention)

| Task | Risk | Reason | Mitigation |
|------|------|--------|------------|
| **8.3.1 Master schedule builder** | 🔴 High | Complex drag-drop + conflict detection | Spike in Sprint 7, use `react-grid-layout` |
| **8.3.4 Student schedule generation** | 🔴 High | Constraint satisfaction problem | Research algorithms early, limit constraints |
| **10.3.2 Meeting integrations** | 🔴 High | Third-party OAuth, token refresh | Start with Zoom only, add others later |
| **11.1 Dashboard framework** | 🟠 Medium | Custom dashboard scope | Evaluate `react-grid-layout` + existing charts |
| **9.3.1 Payroll calculations** | 🟠 Medium | Financial compliance | Domain expert review, extensive testing |
| **12.1.2 IEP document editor** | 🟠 Medium | Compliance requirements | Research state requirements early |

---

## Cross-Sprint Dependencies

```
Sprint 5 (Foundation)
    │
    ├──► Sprint 6 (People) ──────► Sprint 9 (Finance - needs staff entities)
    │         │
    │         └──► Sprint 7 (Academics Core - needs guardian from People context)
    │                   │
    │                   └──► Sprint 8 (Academics Extended)
    │                             │
    │                             └──► Sprint 11 (Analytics - needs data from 7-9)
    │
    ├──► Sprint 6.6 (Notifications) ──► Used by Sprints 7, 9, 10
    │
    └──► Sprint 10 (Messages)
              │
              └──► Sprint 13 (Portals - needs messaging)
                        │
                        └──► Sprint 14 (Ed-Fi)
                                  │
                                  └──► Sprint 15 (Hardening)
```

---

## Sprint Testing Policy

**Every sprint must include:**
1. **Unit tests** for new utility functions and hooks (target: 80% coverage for new code)
2. **Component tests** for new UI components using Testing Library
3. **Integration tests** for new API interactions
4. **Accessibility checks** for new components (keyboard nav, screen reader labels)
5. **Loading states** with Skeleton components for all list/data views
6. **Error states** for all API operations

**Test command must pass before sprint completion:**
```bash
pnpm test --filter=@edforge/{module-name}
```

---

## Sprint 5: UI Polish & Foundation (In Progress)

> **Goal:** Complete Shell UI refinements + establish testing/i18n/error handling foundations.
> **Demo:** Polished settings, avatar consistency, security page redesign, running test suite.

See `SPRINT-5-PLAN.md` for UI polish tickets (5.1-5.9).

### 5.10 Testing Infrastructure Setup

#### 5.10.1 Configure Vitest and Testing Library
**Files:** `vitest.config.ts`, `packages/config/vitest.base.ts`

- Set up Vitest configuration for monorepo
- Configure React Testing Library
- Add `@testing-library/jest-dom` matchers
- Create test setup file with mock providers

**Acceptance criteria:**
- `pnpm test` runs successfully from root
- Test utilities available for mocking auth/tenant context
- Coverage reporting configured
- Watch mode works for development

**Validation:**
- Run `pnpm test` - verify passes
- Run `pnpm test:coverage` - verify report generates

---

#### 5.10.2 Create test utilities package
**Files:** `packages/test-utils/`

- Create shared test utilities package
- Mock `ShellProvider` with configurable user/tenant
- Mock `ABACProvider` with configurable permissions
- API mock helpers using MSW (Mock Service Worker)

**Acceptance criteria:**
- Test utilities importable as `@edforge/test-utils`
- Can render components with mocked context
- API mocks work for common endpoints

**Validation:**
- Import and use in shell tests - verify works

---

#### 5.10.3 Add pre-commit hooks for tests
**Files:** `.husky/pre-commit`, `package.json`

- Configure Husky for pre-commit hooks
- Run lint-staged with TypeScript check
- Run affected tests on commit
- Block commit on test failure

**Acceptance criteria:**
- Pre-commit hook runs on every commit
- Only affected tests run (fast feedback)
- Can bypass with `--no-verify` flag for emergencies

**Validation:**
- Make change and commit - verify hook runs
- Introduce failing test - verify commit blocked

---

### 5.11 Error Handling Foundation

#### 5.11.1 Module-level Error Boundaries
**Files:** `packages/ui/src/components/ErrorBoundary.tsx`, `apps/shell/src/components/ModuleErrorBoundary.tsx`

- Create reusable `ErrorBoundary` component in @edforge/ui
- Create `ModuleErrorBoundary` for remote module failures
- Display user-friendly error message with retry button
- Log errors to console (Sentry integration in Sprint 15)

**Acceptance criteria:**
- Error boundary catches render errors
- Retry button attempts re-render
- Module error boundary handles remote load failures
- Errors logged with component stack

**Validation:**
- Trigger render error - verify boundary catches
- Simulate remote module failure - verify fallback UI

---

#### 5.11.2 API error handling pattern
**Files:** `apps/shell/src/lib/api.ts`, `packages/types/src/api.ts`

- Standardize API error response type
- Add retry logic with exponential backoff (3 attempts)
- Create `useApiError` hook for consistent error handling
- Add toast notification for transient errors

**Acceptance criteria:**
- All API calls use consistent error handling
- Retry works for 5xx errors
- Toast shows for network errors
- Error type exported from @edforge/types

**Validation:**
- Simulate 503 error - verify retry and eventual toast
- Verify error type is consistent across app

---

#### 5.11.3 Remote module fallback UI
**Files:** `apps/shell/src/components/RemoteFallback.tsx`

- Create fallback component for failed remote loads
- Show module name and error description
- Retry button with circuit breaker (max 3 retries)
- Contact support link

**Acceptance criteria:**
- Fallback displays when remote fails to load
- Circuit breaker prevents infinite retry loops
- User can manually retry after circuit resets

**Validation:**
- Stop a remote server - navigate to route - verify fallback
- Retry 3 times - verify circuit breaker activates

---

### 5.12 Internationalization (i18n) Foundation

#### 5.12.1 Set up react-intl infrastructure
**Files:** `apps/shell/src/i18n/`, `packages/i18n/`

- Add `react-intl` to shell and create `@edforge/i18n` package
- Create `IntlProvider` wrapper with locale detection
- Set up message extraction script
- Create English (en-US) base messages file

**Acceptance criteria:**
- IntlProvider wraps app with correct locale
- Message extraction generates JSON
- English messages file created
- Locale persists across sessions

**Validation:**
- Run message extraction - verify JSON generated
- Change browser locale - verify detected

---

#### 5.12.2 Extract shell strings to i18n
**Files:** `apps/shell/src/**/*.tsx`

- Replace hardcoded strings with `<FormattedMessage>` or `intl.formatMessage`
- Extract navigation labels, button text, error messages
- Create shell message catalog

**Acceptance criteria:**
- All user-visible shell strings extracted
- No hardcoded English in UI components
- Message IDs follow naming convention (`shell.{section}.{key}`)

**Validation:**
- Grep for remaining hardcoded strings - verify minimal
- Switch locale - verify strings ready for translation

---

### 5.13 UI Component Expansion

#### 5.13.1 Add Modal/Dialog component
**Files:** `packages/ui/src/components/Modal.tsx`

- Create accessible modal component with Radix UI
- Support sizes: sm, md, lg, xl, full
- Header, body, footer slots
- Close on escape, backdrop click (configurable)
- Focus trap and scroll lock

**Acceptance criteria:**
- Modal renders with correct size
- Focus trapped inside modal
- Escape closes modal (when enabled)
- Works with screen readers

**Validation:**
- Open modal - verify focus trap
- Press Escape - verify closes
- Tab through - verify focus stays in modal

---

#### 5.13.2 Add Toast notifications
**Files:** `packages/ui/src/components/Toast.tsx` or integrate Sonner

- Integrate Sonner toast library (already used in Sprint 5)
- Export `toast` function from @edforge/ui
- Support types: success, error, warning, info
- Position: bottom-right (configurable)

**Acceptance criteria:**
- Toasts render correctly
- Auto-dismiss after timeout
- Can be manually dismissed
- Multiple toasts stack

**Validation:**
- Trigger success toast - verify appears
- Trigger multiple - verify stacking
- Click dismiss - verify removes

---

#### 5.13.3 Add Tabs component
**Files:** `packages/ui/src/components/Tabs.tsx`

- Create accessible tabs component with Radix UI
- Support horizontal and vertical orientations
- Keyboard navigation (arrow keys)
- Controlled and uncontrolled modes

**Acceptance criteria:**
- Tabs render correctly
- Keyboard navigation works
- ARIA attributes correct
- Supports both modes

**Validation:**
- Navigate with arrow keys - verify works
- Test with screen reader - verify announces

---

#### 5.13.4 Add Badge component
**Files:** `packages/ui/src/components/Badge.tsx`

- Create badge component with variants
- Variants: default, success, warning, error, info
- Sizes: sm, md
- Support dot indicator style

**Acceptance criteria:**
- All variants render correctly
- Sizes work as expected
- Dot style works

**Validation:**
- Render all variants - verify styles

---

#### 5.13.5 Add Input component
**Files:** `packages/ui/src/components/Input.tsx`

- Create input component with states
- States: default, focus, error, disabled
- Support prefix/suffix icons
- Support helper text and error message

**Acceptance criteria:**
- All states render correctly
- Icons position correctly
- Helper text shows below
- Works with react-hook-form

**Validation:**
- Test all states - verify styles
- Test with form - verify validation works

---

### 5.14 CI/CD Pipeline Setup

#### 5.14.1 Configure GitHub Actions CI
**Files:** `.github/workflows/ci.yml`

- Lint check on all PRs
- TypeScript type check
- Unit test run with coverage
- Build verification
- Fail PR if any step fails

**Acceptance criteria:**
- CI runs on every PR
- All steps complete in < 10 minutes
- Coverage report posted as comment
- Status check blocks merge on failure

**Validation:**
- Create PR - verify CI runs
- Introduce lint error - verify fails
- Fix and push - verify passes

---

#### 5.14.2 Configure preview deployments
**Files:** `vercel.json`, `.github/workflows/preview.yml`

- Enable Vercel preview deployments for PRs
- Post preview URL as PR comment
- Clean up preview on PR close

**Acceptance criteria:**
- Preview deploys on PR creation
- URL posted as comment
- Preview accessible and functional

**Validation:**
- Create PR - verify preview deploys
- Access preview URL - verify works

---

### 5.15 Data Fetching Standardization

#### 5.15.1 Standardize on TanStack Query patterns
**Files:** `apps/shell/src/lib/query-client.ts`, update existing queries

- Create shared query client configuration
- Define query key factory pattern
- Standardize `useQuery` / `useMutation` patterns
- Document patterns in README

**Acceptance criteria:**
- Query client configured consistently
- Query keys follow factory pattern
- Mutations handle optimistic updates
- Patterns documented

**Validation:**
- Review existing queries - verify pattern followed
- Test cache invalidation - verify works

---

### 5.16 Accessibility (a11y) Foundation

#### 5.16.1 Add accessibility linting
**Files:** `eslint.config.js`, `package.json`

- Add `eslint-plugin-jsx-a11y` to ESLint config
- Configure rules for critical violations
- Add to CI pipeline

**Acceptance criteria:**
- a11y rules active in ESLint
- Critical violations fail build
- Warnings for less severe issues

**Validation:**
- Run lint - verify a11y rules active
- Introduce violation - verify caught

---

#### 5.16.2 Create a11y testing utilities
**Files:** `packages/test-utils/src/a11y.ts`

- Add `@axe-core/react` for automated a11y testing
- Create test helper for axe checks
- Document a11y testing patterns

**Acceptance criteria:**
- Axe checks available in tests
- Can check component for violations
- Results human-readable

**Validation:**
- Add a11y test to component - verify runs
- Introduce violation - verify caught

---

### 5.17 Demo Environment

#### 5.17.1 Create seed data scripts
**Files:** `scripts/seed-demo.ts`

- Create script to seed demo environment
- Generate realistic tenant, schools, staff
- Configurable seed size (small, medium, large)
- Reset capability

**Acceptance criteria:**
- Script creates realistic demo data
- Can reset to clean state
- Data suitable for demos

**Validation:**
- Run seed script - verify data created
- Run reset - verify cleaned

---

## Sprint 6: People Module Completion

> **Goal:** Complete staff directory, HR functions, department management, and notification infrastructure.
> **Demo:** Full CRUD for staff, departments, roles; HR dashboard; working notifications.

### 6.1 Staff Detail Page Enhancement

**Files:** `apps/people/src/pages/staff/StaffDetail.tsx`

**Current state:** Basic detail view exists but lacks complete functionality.

**Tasks:**

#### 6.1.1 Staff profile header with avatar and role badge
- Display staff avatar using `getUserAvatar` with consistent `lorelei` style
- Show role badge with color-coded background (Principal=purple, Teacher=blue, Staff=gray)
- Display department affiliation
- Add "Edit Profile" action button (ABAC-gated)

**Acceptance criteria:**
- Avatar renders correctly with `lorelei` style
- Role badge displays with correct color
- Edit button only shows for users with `edit:staff` permission
- Responsive layout for mobile

**Validation:**
- Navigate to `/people/staff/:id`
- Verify avatar, role badge, department display
- Toggle between admin/teacher user - verify edit button visibility
- Test at 375px viewport width

---

#### 6.1.2 Staff contact information section
- Display phone, email, emergency contact
- Email clickable as `mailto:` link
- Phone clickable as `tel:` link
- Show "Not provided" placeholder for missing fields

**Acceptance criteria:**
- Contact section renders below profile header
- Clickable links work correctly
- Missing fields show placeholder text
- Dark mode styling correct

**Validation:**
- View staff with complete contact info - verify display
- View staff with partial contact info - verify placeholders
- Click email/phone links - verify they open correctly

---

#### 6.1.3 Employment information section
- Display hire date, employment status, contract type
- Show assigned schools (for multi-school staff)
- Display credentials and certifications
- Show teaching assignments (for teachers)

**Acceptance criteria:**
- Employment section renders with all fields
- Multi-school assignments displayed as pills/chips
- Credentials show expiration status (expired=red, expiring soon=amber)
- Teaching assignments link to class pages

**Validation:**
- View teacher with multiple school assignments
- View staff with expiring credential
- Click teaching assignment link - verify navigation

---

#### 6.1.4 Staff activity timeline
- Show recent activity (attendance, assignments updated, grades submitted)
- Paginated with "Load more" button
- Filter by activity type
- Empty state for no recent activity

**Acceptance criteria:**
- Timeline renders with recent activity
- Load more loads additional items
- Filter dropdown filters correctly
- Empty state displays when no activity

**Validation:**
- View staff with activity history
- Use filter dropdown
- Click "Load more"
- View new staff with no activity

---

### 6.2 Department Management

**Files:** `apps/people/src/pages/departments/`

**Current state:** Route exists, implementation unclear.

**Tasks:**

#### 6.2.1 Department list page with CRUD
- Display all departments in sortable table
- Columns: Name, Head, Staff Count, Status
- Actions: View, Edit, Delete (ABAC-gated)
- Add "New Department" button

**Acceptance criteria:**
- Table renders with all departments
- Sorting by name and staff count works
- Pagination works for >10 departments
- Actions respect ABAC permissions

**Validation:**
- View department list as admin - all actions visible
- View as teacher - only view action visible
- Sort by staff count - verify order
- Create new department - verify it appears in list

---

#### 6.2.2 Department detail/edit modal
- Modal form with name, description, department head (dropdown)
- Validation: name required, unique within tenant
- Display current staff in department
- Reassign staff to different department

**Acceptance criteria:**
- Modal opens on View/Edit click
- Form validates correctly
- Department head dropdown shows eligible staff
- Staff reassignment updates in real-time

**Validation:**
- Open edit modal - verify form populates
- Submit with empty name - verify validation error
- Change department head - verify update
- Reassign staff member - verify they move

---

#### 6.2.3 Department staff assignment
- Drag-and-drop or checkbox-based assignment
- Bulk assign/unassign staff
- Show unassigned staff pool
- Confirmation for removing staff from department

**Acceptance criteria:**
- Can assign staff to department
- Can remove staff from department
- Bulk operations work
- Confirmation dialog on remove

**Validation:**
- Assign single staff member
- Bulk assign 3 staff members
- Remove staff member - verify confirmation
- Verify unassigned pool updates

---

### 6.3 HR Dashboard

**Files:** `apps/people/src/pages/hr/`

**Current state:** Route exists as placeholder.

**Tasks:**

#### 6.3.1 HR overview dashboard with metrics
- Cards: Total Staff, Active, On Leave, New Hires (this month)
- Mini charts: Staff by department (pie), Hiring trend (line)
- Quick actions: Add Staff, Process Leave, Generate Report

**Acceptance criteria:**
- Dashboard renders with metrics cards
- Charts display correctly with real data
- Quick actions navigate to correct pages
- Responsive grid layout

**Validation:**
- View dashboard - verify metrics match data
- Click chart segment - verify tooltip shows details
- Click quick action - verify navigation
- Test at tablet viewport

---

#### 6.3.2 Staff attendance tracking
- Calendar view showing staff attendance
- Mark attendance: Present, Absent, Late, Leave
- Bulk mark attendance for day
- Export attendance report

**Acceptance criteria:**
- Calendar renders with attendance data
- Can mark individual attendance
- Bulk mark updates all selected
- Export downloads CSV

**Validation:**
- Mark single staff absent - verify calendar updates
- Bulk mark all present - verify updates
- Export report - verify CSV contents

---

#### 6.3.3 Leave management
- Leave requests list with status
- Approve/Reject with comments
- Leave balance display per staff
- Leave calendar view

**Acceptance criteria:**
- Leave requests render in table
- Can approve/reject with comment
- Balance updates on approval
- Calendar shows leaves across staff

**Validation:**
- Approve leave request - verify status updates
- Reject with comment - verify comment saved
- Check balance decremented
- View calendar - verify leave displayed

---

#### 6.3.4 Contract management list
- Table: Staff name, Contract type, Start date, End date, Status
- Filter: Active, Expiring soon, Expired
- Action: View contract, Renew
- Alert for contracts expiring within 30 days

**Acceptance criteria:**
- Table renders with contract data
- Filters work correctly
- Expiring contracts highlighted
- Renew action opens renewal flow

**Validation:**
- Filter by "Expiring soon" - verify correct results
- View expiring contract - verify highlight
- Click Renew - verify renewal flow opens

---

### 6.4 Role Management

**Files:** `apps/people/src/pages/roles/`

**Tasks:**

#### 6.4.1 Role list and detail view
- Display custom roles created by tenant
- Show permission summary per role
- System roles marked as read-only

**Acceptance criteria:**
- Roles table renders
- System roles show "System" badge
- Permission summary shows resource counts
- Custom roles have edit action

**Validation:**
- View roles list
- Verify system roles cannot be edited
- View custom role permissions

---

#### 6.4.2 Role permission editor
- Permission matrix: Resources (rows) x Actions (columns)
- Checkbox toggle for each permission
- Group permissions by resource category
- Preview affected users

**Acceptance criteria:**
- Matrix renders correctly
- Can toggle individual permissions
- Group toggle enables all in category
- User preview shows affected count

**Validation:**
- Toggle single permission - verify saved
- Toggle category - verify all permissions toggle
- Check user preview updates

---

### 6.5 Notification Infrastructure (Foundation for Later Sprints)

**Note:** This is a foundational feature needed by Sprint 7 (attendance alerts), Sprint 9 (payment reminders), and Sprint 10 (messaging). Implementing early avoids blocking dependencies.

#### 6.5.1 Notification service API integration
**Files:** `apps/shell/src/services/notification.service.ts`

- Create notification service client
- Endpoints: list, markRead, markAllRead, getUnreadCount
- Real-time updates via WebSocket or SSE (if backend supports)
- Fallback to polling

**Acceptance criteria:**
- Service fetches notifications from API
- Real-time updates work (or polling fallback)
- Unread count updates correctly
- Mark read updates state

**Validation:**
- Fetch notifications - verify list renders
- Mark as read - verify count decrements
- Test real-time update - verify notification appears

---

#### 6.5.2 Notification center UI
**Files:** `apps/shell/src/components/layout/NotificationCenter.tsx`

- Bell icon in header with unread count badge
- Dropdown with recent notifications (last 10)
- Click notification to navigate/dismiss
- "Mark all as read" action
- "View all" link to full notifications page

**Acceptance criteria:**
- Bell icon shows in header
- Badge shows unread count (max "99+")
- Dropdown lists recent notifications
- Actions work correctly

**Validation:**
- Verify bell icon visible
- Click bell - verify dropdown opens
- Click notification - verify action taken
- Click "Mark all as read" - verify cleared

---

#### 6.5.3 Notification preferences foundation
**Files:** `apps/shell/src/pages/settings/notifications.tsx`

- Notification preferences page structure
- Categories: System, Academic, Financial, Communication
- Toggles: In-app, Email, Push (future)
- Save preferences to API

**Acceptance criteria:**
- Preferences page renders categories
- Toggles save correctly
- Email toggle enables/disables email notifications
- Changes persist across sessions

**Validation:**
- Toggle email off - verify saved
- Reload page - verify persisted
- Generate notification - verify respects preference

---

#### 6.5.4 Toast notifications for real-time alerts
**Files:** Update to use Sonner from 5.13.2

- Show toast for important real-time notifications
- Support notification priority (low=silent, medium=toast, high=toast+sound)
- Link toast to relevant page
- Auto-dismiss configurable

**Acceptance criteria:**
- High priority notifications show toast
- Toast has action button to navigate
- Low priority only appears in center
- Sound plays for high priority (if enabled)

**Validation:**
- Trigger high priority notification - verify toast
- Click toast action - verify navigates
- Trigger low priority - verify no toast

---

### 6.6 People Module Unit Tests

#### 6.6.1 Staff CRUD unit tests
- Test staff list component rendering
- Test staff form validation
- Test staff detail view
- Test department assignment logic

**Acceptance criteria:**
- 80% coverage for new staff components
- All edge cases tested
- Mock API responses

**Validation:**
- Run `pnpm test --filter=@edforge/people` - verify passes
- Check coverage report - verify ≥ 80%

---

### 6.7 People Module Integration Tests

#### 6.7.1 Staff CRUD integration test
- Create staff → Verify in list → Edit → Verify changes → Delete → Verify removed

#### 6.7.2 Department assignment integration test
- Create department → Assign staff → View in detail → Unassign → Delete department

#### 6.7.3 Role permission integration test
- Create custom role → Assign to staff → Verify ABAC enforcement → Remove role

#### 6.7.4 Notification integration test
- Generate notification → Verify appears in center → Mark read → Verify count updates

**Validation:** All tests pass with `pnpm test:integration --filter=@edforge/people`

---

## Sprint 7: Academics Core

> **Goal:** Complete student management, enrollment, and attendance.
> **Demo:** Student directory with CRUD, enrollment workflows, attendance tracking.

### 7.1 Student Directory

**Files:** `apps/academics/src/pages/students/`

#### 7.1.1 Student list page with search and filters
- Table: Photo, Name, Grade Level, Status, Guardian
- Search by name, student ID
- Filter: Grade level, Status (Active, Inactive, Transferred)
- Sort: Name (A-Z, Z-A), Grade level, Enrollment date

**Acceptance criteria:**
- Table renders with pagination
- Search filters results in real-time (debounced)
- Multi-filter combination works
- 50+ students loads without performance issues

**Validation:**
- Search for partial name - verify results
- Filter by grade level - verify filter works
- Combine search + filter - verify combined results
- Load page with 100+ students - verify < 2s load time

---

#### 7.1.2 Student profile header component
- Avatar using `lorelei` style with student seed
- Name, student ID, grade level badge
- Status pill (Active=green, Inactive=gray, Transferred=amber)
- Quick action buttons: View Schedule, Contact Guardian, Edit

**Acceptance criteria:**
- Consistent with staff profile header pattern
- Grade level badge color-coded by level
- Quick actions respect ABAC
- Responsive layout

**Validation:**
- View student profile - verify all elements
- Test as teacher vs admin - verify action visibility
- Test mobile layout

---

#### 7.1.3 Student personal information section
- Demographics: DOB, Gender, Address
- Guardian contacts (primary, secondary)
- Emergency contacts
- Medical alerts (flagged prominently)

**Acceptance criteria:**
- Information displays in organized sections
- Medical alerts show red warning icon
- Guardian contact clickable
- Edit inline for authorized users

**Validation:**
- View student with medical alert - verify prominence
- Click guardian phone - verify tel: link
- Edit as admin - verify inline edit works

---

#### 7.1.4 Student academic summary section
- Current classes list with grades
- GPA calculation (current term, cumulative)
- Attendance summary (% present)
- Recent activity (assignments, tests)

**Acceptance criteria:**
- Classes show with current grade
- GPA displays with calculation visible
- Attendance shows visual progress bar
- Activity timeline shows recent items

**Validation:**
- View student with grades - verify GPA calculation
- Verify attendance percentage matches data
- Check activity items link to source

---

#### 7.1.5 Student create/edit form using wizard
- Multi-step wizard: Personal Info → Guardian Info → Enrollment → Review
- Validation at each step
- Guardian search or create new
- Enrollment date and grade level selection

**Acceptance criteria:**
- Wizard uses @edforge/wizard package
- Can navigate back without losing data
- Guardian search finds existing guardians
- Review step shows all entered data

**Validation:**
- Complete wizard with new guardian - verify student created
- Complete wizard with existing guardian - verify linked
- Navigate back and forth - verify data preserved
- Submit with validation errors - verify blocks submission

---

### 7.2 Enrollment Management

**Files:** `apps/academics/src/pages/enrollment/`

#### 7.2.1 Enrollment dashboard with metrics
- Cards: Total Enrolled, New This Term, Withdrawn, Pending Applications
- Trend chart: Enrollment by month
- By grade level breakdown (bar chart)

**Acceptance criteria:**
- Metrics reflect current data
- Charts interactive with tooltips
- Cards link to filtered lists
- Data refreshes on school year change

**Validation:**
- View dashboard - verify metrics
- Click "New This Term" - verify navigates to filtered list
- Change school year - verify data updates

---

#### 7.2.2 New student enrollment workflow
- Step 1: Student search (prevent duplicates)
- Step 2: Personal information form
- Step 3: Guardian information
- Step 4: Enrollment details (grade, start date, previous school)
- Step 5: Document checklist
- Step 6: Review and submit

**Acceptance criteria:**
- Duplicate check runs on student info submission
- Documents can be marked as received/pending
- Enrollment creates student and guardian records
- Confirmation email sent (mock in dev)

**Validation:**
- Enroll new student - verify all records created
- Try duplicate enrollment - verify warning shown
- Mark all documents received - verify checklist complete

---

#### 7.2.3 Transfer student workflow
- Select student
- Select destination school (or external)
- Transfer date selection
- Record transfer reason
- Generate transfer documents

**Acceptance criteria:**
- Student status updates to "Transferred"
- Transfer record created with details
- Documents generated (PDF)
- Receiving school notified (if internal)

**Validation:**
- Transfer student internally - verify appears at new school
- Transfer externally - verify status updated
- Download transfer documents - verify PDF content

---

#### 7.2.4 Withdrawal workflow
- Select student
- Withdrawal date and reason
- Exit interview record (optional)
- Document generation

**Acceptance criteria:**
- Student status updates to "Withdrawn"
- Withdrawal record with reason saved
- Final documents generated
- Student removed from active classes

**Validation:**
- Withdraw student - verify status change
- Check classes - verify student removed
- Generate documents - verify content

---

### 7.3 Attendance Management

**Files:** `apps/academics/src/pages/attendance/`

#### 7.3.1 Daily attendance entry view
- Class list for teacher
- Student roster with attendance buttons
- Quick mark: All Present, All Absent
- Save with confirmation

**Acceptance criteria:**
- Teacher sees assigned classes only
- Can mark P/A/T/E for each student
- Quick mark updates all students
- Unsaved changes warning on navigate

**Validation:**
- Mark attendance for class - verify saved
- Use quick mark - verify all updated
- Navigate away without saving - verify warning
- View as different teacher - verify different classes

---

#### 7.3.2 Attendance calendar view
- Monthly calendar with attendance summary
- Color-coded days (green=good, amber=concern, red=poor)
- Click day to see detail
- Student filter

**Acceptance criteria:**
- Calendar renders for current month
- Color coding reflects attendance percentage
- Day click shows student breakdown
- Filter persists across month navigation

**Validation:**
- View month with mixed attendance - verify colors
- Click day with absences - verify detail shows
- Navigate to previous month - verify data loads

---

#### 7.3.3 Attendance reports
- By student: Individual attendance history
- By class: Class attendance summary
- By date range: Bulk attendance report
- Export to CSV/PDF

**Acceptance criteria:**
- All three report types functional
- Date range picker works
- Export generates correct format
- Report shows accurate calculations

**Validation:**
- Generate student report - verify history
- Generate class report - verify summary
- Export PDF - verify formatting
- Compare calculations to manual check

---

#### 7.3.4 Attendance alerts configuration
- Threshold settings (e.g., alert at 80% attendance)
- Notification recipients (guardian, admin)
- Alert frequency (daily, weekly)
- Alert history log

**Acceptance criteria:**
- Can configure thresholds
- Recipients selectable
- Alerts trigger when threshold crossed
- History shows past alerts

**Validation:**
- Set threshold to 90% - mark student below - verify alert
- Check guardian notification
- View alert history - verify logged

---

### 7.4 Guardian/Parent Management

**Files:** `apps/academics/src/pages/guardians/`

#### 7.4.1 Guardian directory
- List all guardians with linked students
- Search by name, email, phone
- Filter by school
- Quick actions: View, Edit, Contact

**Acceptance criteria:**
- Table shows guardian with student count
- Search is case-insensitive
- School filter works for multi-school
- Contact opens email/phone

**Validation:**
- Search by partial name - verify results
- Filter by school - verify correct guardians
- Click contact - verify opens mailto

---

#### 7.4.2 Guardian profile page
- Guardian information section
- Linked students list
- Communication preferences
- Login credentials status (if portal enabled)

**Acceptance criteria:**
- Profile displays complete information
- Students show as clickable links
- Communication preferences editable
- Portal status shows enabled/disabled

**Validation:**
- View guardian with multiple students - verify links
- Update communication preferences - verify saved
- Check portal status display

---

#### 7.4.3 Guardian-student linking
- Add student to guardian
- Remove student link (with confirmation)
- Set primary guardian flag
- Custody/access notes

**Acceptance criteria:**
- Can link existing student
- Remove requires confirmation
- Only one primary guardian per student
- Notes saved and displayed

**Validation:**
- Link student to guardian - verify appears
- Set as primary - verify flag updates
- Remove link - verify confirmation shown
- Add custody notes - verify saved

---

### 7.5 Data Import Tools

#### 7.5.1 Student CSV import
**Files:** `apps/academics/src/pages/import/StudentImport.tsx`

- Upload CSV file
- Column mapping interface
- Validation preview with error highlighting
- Import progress with skip/retry options
- Import history log

**Acceptance criteria:**
- CSV upload works
- Can map columns to fields
- Validation shows errors before import
- Progress shows during import
- History tracks past imports

**Validation:**
- Import valid CSV - verify all students created
- Import CSV with errors - verify validation shows
- Check import history - verify logged

---

#### 7.5.2 Guardian CSV import
- Similar to student import
- Link to existing students by ID/name
- Bulk import with relationship mapping

**Acceptance criteria:**
- Import creates guardians
- Relationships linked correctly
- Errors handled gracefully

**Validation:**
- Import guardians - verify linked to students

---

### 7.6 Academics Core Unit Tests

#### 7.6.1 Student component unit tests
- Test student list rendering and filtering
- Test student form validation
- Test GPA calculation logic
- Test attendance percentage calculation

**Acceptance criteria:**
- 80% coverage for new student components
- GPA calculation tested with edge cases
- Attendance percentage tested

**Validation:**
- Run tests - verify passing
- Check coverage - verify ≥ 80%

---

#### 7.6.2 Enrollment workflow unit tests
- Test enrollment form steps
- Test duplicate detection logic
- Test transfer/withdrawal state changes

**Acceptance criteria:**
- All form steps tested
- Duplicate detection covered
- State transitions validated

---

### 7.7 Academics Core Integration Tests

#### 7.7.1 Student lifecycle integration test
- Create → Enroll → View → Edit → Transfer → Verify status

#### 7.7.2 Attendance workflow integration test
- Take attendance → Verify saved → Generate report → Verify accuracy

#### 7.7.3 Guardian-student integration test
- Create guardian → Link students → Update → Unlink → Verify

#### 7.7.4 Data import integration test
- Upload CSV → Map columns → Validate → Import → Verify records

**Validation:** All tests pass with `pnpm test:integration --filter=@edforge/academics`

---

## Sprint 8: Academics Extended

> **Goal:** Complete gradebook, curriculum, and scheduling modules.
> **Demo:** Teachers can manage grades, classes follow a schedule, curriculum is defined.

### 8.1 Gradebook

**Files:** `apps/academics/src/pages/gradebook/`

#### 8.1.1 Gradebook class view
- Grid: Students (rows) x Assignments (columns)
- Inline grade entry (click cell to edit)
- Color coding: A=green, B=blue, C=amber, D/F=red
- Running average column

**Acceptance criteria:**
- Grid renders with virtual scrolling for large classes
- Inline edit saves on blur/enter
- Colors match grade thresholds
- Average recalculates on grade change

**Validation:**
- Enter grade - verify saved
- Check color coding matches grade
- Verify average calculation
- Test with 50 students - verify performance

---

#### 8.1.2 Assignment creation and management
- Create assignment: Name, Type, Points, Due date
- Assignment types: Homework, Quiz, Test, Project
- Weight by category
- Duplicate assignment across sections

**Acceptance criteria:**
- Assignment form validates
- Type selection works
- Weights sum to 100% per category
- Duplicate creates in selected sections

**Validation:**
- Create assignment - verify appears in gradebook
- Set weights - verify they apply
- Duplicate to another section - verify created

---

#### 8.1.3 Grade calculation settings
- Grading scale editor (A/B/C/D/F thresholds)
- Category weights (Tests 40%, Homework 30%, etc.)
- Rounding rules
- Extra credit handling

**Acceptance criteria:**
- Scale editor saves correctly
- Weights validate to 100%
- Rounding applies to calculated grades
- Extra credit adds to total

**Validation:**
- Change grading scale - verify grade letters update
- Adjust category weights - verify averages change
- Test rounding - verify correct

---

#### 8.1.4 Grade reports and export
- Student report card (individual)
- Class grades summary
- Progress report (mid-term)
- Export: CSV, PDF

**Acceptance criteria:**
- Report card shows all classes
- Class summary shows distribution
- Progress report shows current standing
- Exports match display data

**Validation:**
- Generate report card - verify all grades
- Export CSV - verify data accuracy
- Print PDF - verify formatting

---

### 8.2 Curriculum Management

**Files:** `apps/academics/src/pages/curriculum/`

#### 8.2.1 Course catalog
- List all courses with details
- Filter by grade level, department, status
- Course detail: Description, prerequisites, standards
- Add/Edit/Archive courses

**Acceptance criteria:**
- Catalog renders with all courses
- Filters combine correctly
- Detail shows complete information
- Archive removes from active list

**Validation:**
- Filter by department - verify results
- View course detail - verify all fields
- Archive course - verify removed from active

---

#### 8.2.2 Learning standards management
- Standards hierarchy (Domain → Standard → Objective)
- Import from state standards (CSV)
- Link standards to courses
- Standards coverage report

**Acceptance criteria:**
- Tree view displays hierarchy
- Import parses CSV correctly
- Standards linkable to multiple courses
- Coverage shows % of standards addressed

**Validation:**
- Import standards CSV - verify hierarchy
- Link standard to course - verify saved
- Generate coverage report - verify accuracy

---

#### 8.2.3 Lesson planning
- Calendar view by teacher/class
- Lesson entry: Topic, objectives, materials, activities
- Link to standards covered
- Copy lesson to another date

**Acceptance criteria:**
- Calendar shows lessons by day
- Lesson form saves all fields
- Standards link shows coverage
- Copy duplicates correctly

**Validation:**
- Create lesson - verify on calendar
- Link standards - verify displayed
- Copy lesson - verify new instance created

---

### 8.3 Scheduling

**Files:** `apps/academics/src/pages/scheduling/`

**⚠️ HIGH RISK:** Schedule builder is complex. Consider technical spike in Sprint 7 to validate approach.

#### 8.3.1a Schedule grid display
- Grid: Periods (rows) x Days (columns)
- Display existing schedule assignments
- Color-code by subject/department
- Responsive for smaller screens

**Acceptance criteria:**
- Grid renders with correct period/day structure
- Existing assignments display in correct slots
- Colors differentiate subjects
- Readable at tablet size

**Validation:**
- View populated schedule - verify assignments display
- Test at 1024px viewport - verify readable

---

#### 8.3.1b Schedule drag-and-drop placement
- Use `react-beautiful-dnd` or `@dnd-kit` library
- Drag section from unassigned pool to slot
- Drag between slots to reschedule
- Visual feedback during drag

**Acceptance criteria:**
- Drag from pool to slot works
- Drag between slots works
- Visual indicator shows drop target
- Changes persist on drop

**Validation:**
- Drag unassigned section to slot - verify saved
- Move existing section - verify updated
- Test drag cancel - verify reverts

---

#### 8.3.1c Schedule conflict detection
- Detect teacher conflicts (same period)
- Detect room conflicts (same period)
- Detect student conflicts (enrolled in overlapping sections)
- Visual warning for conflicts

**Acceptance criteria:**
- Teacher conflicts highlighted in red
- Room conflicts highlighted in orange
- Hover shows conflict details
- Can still place (with warning)

**Validation:**
- Create teacher conflict - verify highlighted
- Hover on conflict - verify details show
- Save with conflict - verify warning

---

#### 8.3.1d Schedule auto-suggestions (Optional/Future)
- Algorithm suggests valid placements
- Respects constraints (teacher availability, room features)
- Shows top 3 suggestions
- User can accept or modify

**Acceptance criteria:**
- Suggestions respect constraints
- Shows multiple options
- Accept applies suggestion
- Can be manually adjusted

**Validation:**
- Request suggestions - verify valid
- Accept suggestion - verify applied

**Note:** This can be deferred to a later sprint if the basic scheduler meets MVP needs.

---

#### 8.3.2 Room management
- Room list with capacity
- Room features (projector, lab equipment)
- Room availability calendar
- Room utilization report

**Acceptance criteria:**
- Room list shows all details
- Features displayed as tags
- Calendar shows bookings
- Utilization shows % usage

**Validation:**
- View room with features - verify display
- Check availability - verify bookings shown
- Generate utilization - verify calculation

---

#### 8.3.3 Bell schedule configuration
- Define periods with start/end times
- Multiple schedules (regular, early release, delay)
- Apply schedule to calendar dates
- Bell schedule display widget

**Acceptance criteria:**
- Can create multiple schedules
- Times validate (no overlap)
- Can assign schedule to dates
- Widget shows current schedule

**Validation:**
- Create regular schedule - verify saved
- Create early release - verify different times
- Assign to date - verify applies

---

#### 8.3.4a Student class request collection
- Student/parent can submit course requests
- Priority ranking for electives
- Alternate course selection
- Request deadline enforcement

**Acceptance criteria:**
- Request form captures required and elective courses
- Priority ranking saves correctly
- Alternates stored for fallback
- Deadline blocks late requests

**Validation:**
- Submit course requests - verify saved
- Rank priorities - verify order persists
- Test after deadline - verify blocked

---

#### 8.3.4b Manual student section assignment
- Admin assigns individual students to sections
- View section capacity and current enrollment
- Bulk assignment for homeroom groups
- Assignment validation (prerequisites, grade level)

**Acceptance criteria:**
- Can assign student to section
- Capacity enforcement works
- Bulk assignment efficient
- Validation prevents invalid assignments

**Validation:**
- Assign student to section - verify saved
- Fill section to capacity - verify can't add more
- Bulk assign group - verify all added

---

#### 8.3.4c Student schedule conflicts resolution
- List students with scheduling conflicts
- Show conflict details (overlapping periods)
- Manual resolution interface
- Mark as resolved

**Acceptance criteria:**
- Conflicts list accurately populated
- Details show exactly what conflicts
- Can resolve by reassigning
- Resolution clears from list

**Validation:**
- View conflicts list - verify accurate
- Resolve conflict - verify removed from list

---

#### 8.3.4d Schedule change request workflow (Post-MVP)
- Student/parent submits change request
- Approval workflow for counselors
- Automatic capacity check
- Notification on resolution

**Acceptance criteria:**
- Request submitted and tracked
- Approvers notified
- Capacity checked before approval
- Student notified of outcome

**Note:** This can be deferred if manual changes by admin suffice for MVP.

**Validation:**
- Submit change request - verify in queue
- Approve request - verify schedule updated

---

### 8.4 Class Sections

**Files:** `apps/academics/src/pages/classes/`

#### 8.4.1 Section list and management
- List sections with teacher, room, time
- Filter by course, teacher, period
- Section detail with roster
- Edit section details

**Acceptance criteria:**
- List shows all sections
- Filters work correctly
- Detail shows complete roster
- Edits save correctly

**Validation:**
- Filter by teacher - verify results
- View section roster - verify students
- Edit room - verify saved

---

#### 8.4.2 Section roster management
- Add/remove students
- Waitlist management
- Capacity enforcement
- Transfer between sections

**Acceptance criteria:**
- Can add students up to capacity
- Waitlist shown when full
- Capacity prevents over-enrollment
- Transfer moves student cleanly

**Validation:**
- Fill section to capacity - verify can't add more
- Add to waitlist - verify position
- Transfer student - verify moved

---

### 8.5 Academics Extended Unit Tests

#### 8.5.1 Gradebook calculation unit tests
- Test grade average calculation with weights
- Test grade letter assignment from percentage
- Test extra credit handling
- Test missing assignment handling

**Acceptance criteria:**
- Weight calculations tested
- Boundary conditions tested (89.5% → B or A?)
- Extra credit adds correctly
- Missing grades handled

---

#### 8.5.2 Schedule conflict detection unit tests
- Test teacher conflict detection
- Test room conflict detection
- Test time overlap logic

**Acceptance criteria:**
- All conflict types detected
- Overlap calculation correct
- Edge cases (same period different days) handled

---

### 8.6 Academics Extended Integration Tests

#### 8.6.1 Gradebook workflow integration test
- Create assignment → Enter grades → Calculate average → Generate report

#### 8.6.2 Scheduling integration test
- Create schedule → Assign rooms → Enroll students → Verify no conflicts

**Validation:** All tests pass

---

### 8.7 Component Duplication Audit

**Purpose:** After completing two major modules (People, Academics), audit for component duplication.

#### 8.7.1 Identify duplicated patterns
- Review People and Academics modules
- List similar components (profile headers, detail sections, list tables)
- Identify candidates for extraction to @edforge/ui

**Acceptance criteria:**
- Audit document created
- Duplicates identified with file locations
- Extraction candidates prioritized

---

#### 8.7.2 Extract common components
- Move shared components to @edforge/ui
- Update imports in People and Academics
- Add tests for extracted components

**Acceptance criteria:**
- Common components in @edforge/ui
- No duplicate implementations
- Tests cover extracted components

**Validation:**
- Verify no duplicate component code
- Run tests - verify passing

---

## Sprint 9: Finance Module

> **Goal:** Complete billing, tuition, payroll, and expense tracking.
> **Demo:** Create invoices, process payments, run payroll, track expenses.

### 9.1 Billing & Invoicing

**Files:** `apps/finance/src/pages/billing/`

#### 9.1.1 Invoice list and search
- Table: Invoice #, Student, Amount, Status, Due Date
- Status filter: Draft, Sent, Paid, Overdue
- Search by student, invoice number
- Bulk actions: Send, Mark paid

**Acceptance criteria:**
- Table renders with pagination
- Status filter works
- Search filters in real-time
- Bulk actions affect selected

**Validation:**
- Filter by Overdue - verify results
- Search by student name - verify matches
- Bulk send 3 invoices - verify status updates

---

#### 9.1.2 Invoice creation
- Select student(s)
- Add line items (fee types)
- Apply discounts
- Set payment terms
- Preview and send

**Acceptance criteria:**
- Student selector with multi-select
- Line items calculate total
- Discounts apply correctly
- Preview matches final invoice
- Send triggers email

**Validation:**
- Create invoice for one student - verify total
- Apply 10% discount - verify calculation
- Preview - verify matches
- Send - verify email (mock)

---

#### 9.1.3 Payment processing
- Record payment: Amount, Method, Date
- Partial payment handling
- Payment receipt generation
- Refund workflow

**Acceptance criteria:**
- Payment records against invoice
- Partial payment updates balance
- Receipt generates as PDF
- Refund creates credit

**Validation:**
- Record full payment - verify Paid status
- Record partial - verify balance remaining
- Download receipt - verify PDF
- Process refund - verify credit created

---

#### 9.1.4 Fee structure management
- Define fee types (Tuition, Registration, Activity)
- Set amounts by grade level
- Payment plans (monthly, quarterly, annual)
- Late fee configuration

**Acceptance criteria:**
- Fee types CRUD works
- Grade-level amounts saved
- Payment plans create installments
- Late fees calculate automatically

**Validation:**
- Create fee type - verify in list
- Set grade-level amounts - verify saved
- Create payment plan - verify installments
- Test late fee calculation

---

### 9.2 Tuition Management

**Files:** `apps/finance/src/pages/tuition/`

#### 9.2.1 Tuition schedule configuration
- Define tuition rates by grade level
- Set due dates
- Sibling discount rules
- Scholarship/financial aid adjustments

**Acceptance criteria:**
- Rates editable per grade
- Due dates configurable
- Sibling discount auto-applies
- Scholarships reduce amount

**Validation:**
- Set tuition rate - verify saved
- Enroll sibling - verify discount applies
- Apply scholarship - verify reduction

---

#### 9.2.2 Payment tracking dashboard
- Collected vs Outstanding chart
- Payment timeline
- Collection rate metrics
- Aging report (30/60/90 days)

**Acceptance criteria:**
- Charts display accurate data
- Timeline shows payment history
- Metrics calculate correctly
- Aging shows correct buckets

**Validation:**
- Verify collection amount matches sum
- Check aging buckets accurate
- Test with various payment dates

---

#### 9.2.3 Payment reminders
- Automated reminder schedule
- Manual reminder send
- Reminder history
- Template customization

**Acceptance criteria:**
- Reminders sent on schedule
- Manual send works
- History shows all sent
- Templates editable

**Validation:**
- Configure reminder schedule - verify triggers
- Send manual reminder - verify delivered
- Edit template - verify changes apply

---

### 9.3 Payroll

**Files:** `apps/finance/src/pages/payroll/`

#### 9.3.1 Payroll run workflow
- Select pay period
- Review hours/salaries
- Calculate deductions
- Generate pay stubs
- Mark as processed

**Acceptance criteria:**
- Pay period selection works
- Hours display correctly
- Deductions calculate
- Pay stubs generate as PDF
- Processed status updates

**Validation:**
- Run payroll for period - verify calculations
- Review individual - verify hours
- Download pay stub - verify PDF
- Mark processed - verify status

---

#### 9.3.2 Salary and deduction configuration
- Define salary structures (monthly, hourly)
- Configure deductions (tax, benefits, retirement)
- Tax table management
- Bonus/adjustment entry

**Acceptance criteria:**
- Salary structures CRUD works
- Deductions apply to payroll
- Tax tables calculate correctly
- Bonuses add to pay

**Validation:**
- Configure salary - verify applied
- Set deduction - verify subtracted
- Add bonus - verify added

---

#### 9.3.3 Payroll reports
- Payroll summary by period
- Tax liability report
- Deduction summary
- Year-to-date report

**Acceptance criteria:**
- Reports generate correctly
- Tax liability accurate
- Deductions sum correctly
- YTD shows cumulative

**Validation:**
- Generate summary - verify totals
- Check tax liability - verify calculation
- Run YTD - verify cumulative

---

### 9.4 Expense Tracking

**Files:** `apps/finance/src/pages/expenses/`

#### 9.4.1 Expense entry
- Form: Amount, Category, Vendor, Date, Description
- Receipt upload (image/PDF)
- Category autocomplete
- Recurring expense setup

**Acceptance criteria:**
- Form validates all fields
- Receipt uploads and displays
- Categories suggest from history
- Recurring creates schedule

**Validation:**
- Enter expense - verify saved
- Upload receipt - verify displays
- Set recurring - verify future entries

---

#### 9.4.2 Expense approval workflow
- Submit for approval
- Approval queue for approvers
- Approve/Reject with comments
- Approval history

**Acceptance criteria:**
- Submission sends notification
- Queue shows pending
- Actions record comments
- History shows timeline

**Validation:**
- Submit expense - verify in queue
- Approve - verify status updates
- Reject with comment - verify saved

---

#### 9.4.3 Budget tracking
- Budget definition by category
- Actual vs budget comparison
- Budget alerts (80%, 100%)
- Budget reports

**Acceptance criteria:**
- Budgets editable per category
- Comparison chart accurate
- Alerts trigger at thresholds
- Reports show status

**Validation:**
- Set budget - verify saved
- Expense to 80% - verify alert
- Generate report - verify comparison

---

### 9.5 General Ledger

**Files:** `apps/finance/src/pages/ledger/`

**Current state:** Partially implemented with tabs.

#### 9.5.1 Chart of accounts
- Account hierarchy display
- Add/edit/deactivate accounts
- Account type categories
- Balance summary

**Acceptance criteria:**
- Hierarchy renders as tree
- CRUD operations work
- Types categorize correctly
- Balances calculate

**Validation:**
- View hierarchy - verify structure
- Add account - verify appears
- Check balance - verify sum

---

#### 9.5.2 Journal entries
- Entry form: Date, Accounts, Amounts
- Debit/Credit balance validation
- Posting workflow
- Reverse entry capability

**Acceptance criteria:**
- Form captures all fields
- Balance validation enforced
- Posting updates ledger
- Reverse creates offsetting entry

**Validation:**
- Create balanced entry - verify posts
- Create unbalanced - verify rejected
- Reverse entry - verify offset

---

#### 9.5.3 Financial reports
- Balance sheet
- Income statement
- Trial balance
- Cash flow statement

**Acceptance criteria:**
- Reports calculate from ledger
- Period selection works
- Comparative reports available
- Export to PDF/CSV

**Validation:**
- Generate balance sheet - verify balances
- Generate income statement - verify net
- Export PDF - verify formatting

---

### 9.6 Finance Integration Tests

#### 9.6.1 Billing workflow integration test
- Create invoice → Send → Record payment → Verify status

#### 9.6.2 Payroll workflow integration test
- Configure salary → Run payroll → Generate stubs → Verify calculations

**Validation:** All tests pass

---

## Sprint 10: Messages & Communication

> **Goal:** Complete messaging, announcements, and meeting scheduling.
> **Demo:** Send messages, create announcements, schedule meetings with integrations.

### 10.1 Messaging System

**Files:** `apps/messages/src/pages/inbox/`

**Current state:** Partially implemented with mock data.

#### 10.1.1 Conversation list
- List conversations with preview
- Unread indicator
- Star/pin conversations
- Archive functionality

**Acceptance criteria:**
- Conversations load with real data
- Unread shows count badge
- Star persists
- Archive moves to archive folder

**Validation:**
- View inbox - verify conversations
- Star conversation - verify persists
- Archive - verify moved

---

#### 10.1.2 Message thread view
- Display all messages in thread
- Reply inline
- Attachments display
- Message timestamps

**Acceptance criteria:**
- Thread shows all messages
- Reply adds to thread
- Attachments downloadable
- Times show relative format

**Validation:**
- View thread - verify all messages
- Send reply - verify appears
- Download attachment - verify works

---

#### 10.1.3 Compose new message
- Recipient selector (search users, groups)
- Subject and body
- Attachment upload
- Draft save

**Acceptance criteria:**
- Recipient search works
- Rich text editor for body
- Attachments upload and attach
- Drafts save automatically

**Validation:**
- Search recipient - verify finds
- Compose with attachment - verify attaches
- Navigate away - verify draft saved

---

#### 10.1.4 Message search
- Full-text search across messages
- Filter by sender, date range
- Search within thread
- Highlight matches

**Acceptance criteria:**
- Search finds matching messages
- Filters refine results
- In-thread search works
- Matches highlighted

**Validation:**
- Search keyword - verify matches
- Filter by sender - verify filtered
- Search in thread - verify finds

---

### 10.2 Announcements

**Files:** `apps/messages/src/pages/announcements/`

#### 10.2.1 Announcement creation
- Title, body (rich text)
- Audience selection (school, grade, class, role)
- Schedule send time
- Attachment support

**Acceptance criteria:**
- Form captures all fields
- Audience selector shows options
- Schedule sets future send
- Attachments attach

**Validation:**
- Create announcement - verify saved
- Select audience - verify targets
- Schedule for future - verify pending status

---

#### 10.2.2 Announcement list
- Display all announcements with status
- Filter: Published, Scheduled, Draft
- Actions: Edit, Publish, Delete
- View recipients/read status

**Acceptance criteria:**
- List shows all announcements
- Filters work correctly
- Actions respect permissions
- Read tracking shows stats

**Validation:**
- Filter by Draft - verify results
- Publish announcement - verify status
- View read stats - verify numbers

---

#### 10.2.3 Announcement display
- Student/parent view of announcements
- Mark as read
- Pinned announcements
- Notification preferences

**Acceptance criteria:**
- Recipients see announcements
- Mark as read updates status
- Pinned show at top
- Preferences filter types

**Validation:**
- View as student - verify announcements
- Mark as read - verify recorded
- Check pinned order

---

### 10.3 Meeting Scheduling

**Files:** `apps/messages/src/pages/meetings/`

#### 10.3.1 Meeting creation
- Title, description, time, duration
- Participant selection
- Room booking (optional)
- Recurring meeting setup

**Acceptance criteria:**
- Form validates all fields
- Participants searchable
- Room availability checked
- Recurring creates series

**Validation:**
- Create meeting - verify saved
- Add participants - verify invited
- Book room - verify reserved
- Create recurring - verify series

---

#### 10.3.2a Zoom integration
**⚠️ HIGH RISK:** OAuth complexity, token refresh, rate limits. Start with this provider only.

- Zoom OAuth connection flow
- Store tokens securely (encrypted)
- Auto-generate Zoom meeting link on meeting creation
- Handle token refresh
- Join meeting link

**Acceptance criteria:**
- OAuth flow completes successfully
- Tokens stored and encrypted
- Meeting creation generates Zoom link
- Token refresh works transparently
- Join button opens Zoom

**Validation:**
- Connect Zoom account - verify OAuth
- Create meeting - verify Zoom link generated
- Wait for token expiry - verify refresh works
- Click join - verify opens Zoom

---

#### 10.3.2b Microsoft Teams integration (Post-MVP)
- Teams OAuth connection (Azure AD)
- Generate Teams meeting link
- Handle Microsoft token refresh
- Join Teams meeting link

**Acceptance criteria:**
- OAuth with Azure AD works
- Teams links generate correctly
- Token refresh handled
- Join opens Teams

**Note:** Defer to Sprint 10.5 or later based on customer demand.

---

#### 10.3.2c Google Meet integration (Post-MVP)
- Google OAuth connection
- Generate Google Meet link
- Handle Google token refresh
- Join Meet link

**Acceptance criteria:**
- OAuth with Google works
- Meet links generate correctly
- Token refresh handled
- Join opens Meet

**Note:** Defer to Sprint 10.5 or later based on customer demand.

---

#### 10.3.3 Meeting calendar view
- Calendar displaying meetings
- Day/week/month views
- Drag to reschedule
- Quick meeting creation

**Acceptance criteria:**
- Calendar renders meetings
- All views work
- Drag reschedules
- Quick create from slot

**Validation:**
- View week - verify meetings shown
- Drag meeting - verify time updates
- Click slot - verify create opens

---

### 10.4 Notifications

**Files:** `apps/messages/src/pages/notifications/`

#### 10.4.1 Notification preferences
- Configure by notification type
- Email, push, in-app toggles
- Quiet hours setting
- Digest vs immediate

**Acceptance criteria:**
- All types configurable
- Toggles save correctly
- Quiet hours respected
- Digest aggregates

**Validation:**
- Toggle email off - verify no email
- Set quiet hours - verify no notifications during
- Enable digest - verify aggregation

---

#### 10.4.2 Notification center
- Bell icon with unread count
- Dropdown list of recent
- Mark read/unread
- Clear all action

**Acceptance criteria:**
- Count shows unread
- Dropdown shows recent
- Mark actions work
- Clear all clears

**Validation:**
- Trigger notification - verify count
- Open dropdown - verify shows
- Mark as read - verify count decrements

---

### 10.5 Messages Integration Tests

#### 10.5.1 Messaging workflow integration test
- Send message → Receive → Reply → Verify thread

#### 10.5.2 Announcement workflow integration test
- Create → Schedule → Publish → Verify recipients

#### 10.5.3 Meeting workflow integration test
- Create → Add participants → Generate link → Verify calendar

**Validation:** All tests pass

---

## Sprint 11: Analytics & Reporting

> **Goal:** Complete dashboards, reports, and data visualization.
> **Demo:** View analytics dashboards, generate reports, explore data.

### 11.1 Dashboard Framework

**Files:** `apps/analytics/src/pages/dashboards/`

#### 11.1.1 Dashboard grid layout
- Widget grid with drag-and-drop
- Resize widgets
- Save layout per user
- Add/remove widgets

**Acceptance criteria:**
- Grid renders widgets
- Drag changes position
- Resize works
- Layout persists

**Validation:**
- Drag widget - verify position saves
- Resize widget - verify dimensions save
- Add widget - verify appears

---

#### 11.1.2 Widget library
- Chart widgets (line, bar, pie, area)
- Metric cards
- Tables
- Custom query widget

**Acceptance criteria:**
- All chart types available
- Metric cards configurable
- Tables paginate
- Custom query executes

**Validation:**
- Add line chart - verify renders
- Configure metric card - verify data
- Run custom query - verify results

---

#### 11.1.3 Dashboard sharing
- Share with users/roles
- Public link generation
- Embed code for external use
- Scheduled email delivery

**Acceptance criteria:**
- Share dialog shows users
- Public link works anonymously
- Embed renders in iframe
- Scheduled emails deliver

**Validation:**
- Share with user - verify access
- Generate public link - verify works
- Test embed - verify renders

---

### 11.2 Enrollment Analytics

**Files:** `apps/analytics/src/pages/enrollment/`

#### 11.2.1 Enrollment trends
- Historical enrollment chart
- Year-over-year comparison
- Forecast projection
- Grade level breakdown

**Acceptance criteria:**
- Charts display trends
- Comparison shows delta
- Forecast extrapolates
- Breakdown shows details

**Validation:**
- View trend - verify historical
- Compare YoY - verify delta calculation
- Check forecast - verify projection

---

#### 11.2.2 Demographic analysis
- Gender distribution
- Age distribution
- Geographic distribution (map)
- Special needs population

**Acceptance criteria:**
- Demographics charts render
- Map shows geographic spread
- All distributions accurate
- Filters work across charts

**Validation:**
- View gender distribution - verify pie
- View map - verify locations
- Filter by school - verify all update

---

### 11.3 Academic Analytics

**Files:** `apps/analytics/src/pages/performance/`

#### 11.3.1 Grade distribution analysis
- Distribution by class/teacher/school
- Trend over grading periods
- At-risk student identification
- Grade inflation detection

**Acceptance criteria:**
- Distribution charts accurate
- Trends show progression
- At-risk flagged correctly
- Inflation detected

**Validation:**
- View class distribution - verify grades
- Check at-risk - verify criteria
- View inflation metrics

---

#### 11.3.2 Attendance analytics
- Attendance rate trends
- Chronic absenteeism report
- Correlation with grades
- Predictive indicators

**Acceptance criteria:**
- Trends display correctly
- Chronic threshold configurable
- Correlation calculated
- Predictions shown

**Validation:**
- View attendance trend - verify data
- Check chronic report - verify threshold
- View correlation - verify calculation

---

### 11.4 Financial Analytics

**Files:** `apps/analytics/src/pages/finance/`

#### 11.4.1 Revenue analysis
- Revenue by source
- Collection rate trends
- Accounts receivable aging
- Budget vs actual

**Acceptance criteria:**
- Revenue breakdown accurate
- Collection rate calculated
- Aging buckets correct
- Budget comparison shown

**Validation:**
- View revenue sources - verify breakdown
- Check collection rate - verify %
- View AR aging - verify buckets

---

#### 11.4.2 Expense analysis
- Expense by category
- Trend analysis
- Per-student cost calculation
- Variance analysis

**Acceptance criteria:**
- Categories sum correctly
- Trends show history
- Per-student calculates
- Variances highlighted

**Validation:**
- View category breakdown - verify sums
- Calculate per-student - verify division
- Check variance - verify highlighted

---

### 11.5 Report Builder

**Files:** `apps/analytics/src/pages/reports/`

#### 11.5.1 Report template selection
- Pre-built report templates
- Clone and customize
- Template categories
- Template search

**Acceptance criteria:**
- Templates display
- Clone creates copy
- Categories filter
- Search finds matches

**Validation:**
- Select template - verify loads
- Clone - verify new copy
- Search - verify finds

---

#### 11.5.2 Report customization
- Field selection
- Filter configuration
- Grouping and sorting
- Calculated fields

**Acceptance criteria:**
- Fields toggle in/out
- Filters apply to data
- Groups organize data
- Calculations compute

**Validation:**
- Toggle field - verify column change
- Add filter - verify data filtered
- Add calculation - verify computes

---

#### 11.5.3 Report scheduling
- One-time generation
- Recurring schedule
- Email delivery
- Format selection (PDF, Excel, CSV)

**Acceptance criteria:**
- Generate creates report
- Schedule sets recurring
- Email delivers report
- Formats generate correctly

**Validation:**
- Generate one-time - verify created
- Schedule weekly - verify triggers
- Download Excel - verify format

---

### 11.6 Analytics Integration Tests

#### 11.6.1 Dashboard workflow integration test
- Create dashboard → Add widgets → Configure → Share

#### 11.6.2 Report workflow integration test
- Select template → Customize → Generate → Export

**Validation:** All tests pass

---

## Sprint 12: Special Programs

> **Goal:** Complete IEP, 504, accommodations, and support services modules.
> **Demo:** Create IEP, manage 504 plans, track accommodations.

### 12.1 IEP Management

**Files:** `apps/special-programs/src/pages/ieps/`

#### 12.1.1 IEP student list
- List students with active IEPs
- Status: Active, Due for review, Expired
- Filter by case manager, school
- Quick actions: View, Edit, Review

**Acceptance criteria:**
- List shows IEP students
- Status indicates correctly
- Filters work
- Actions available per permissions

**Validation:**
- View list - verify students
- Filter by status - verify results
- Click view - verify opens IEP

---

#### 12.1.2 IEP document editor
- Sections: Present levels, Goals, Services, Accommodations
- Goal progress tracking
- Service hour tracking
- Version history

**Acceptance criteria:**
- All sections editable
- Goals track progress %
- Services track hours
- Versions saved

**Validation:**
- Edit section - verify saves
- Update goal progress - verify %
- Add service hours - verify tracked

---

#### 12.1.3 IEP meeting management
- Schedule IEP meetings
- Participant invitations
- Document preparation
- Meeting minutes recording

**Acceptance criteria:**
- Meetings schedulable
- Invitations sent
- Documents attachable
- Minutes saveable

**Validation:**
- Schedule meeting - verify created
- Invite participants - verify notifications
- Record minutes - verify saved

---

#### 12.1.4 IEP compliance tracking
- Annual review due dates
- Triennial evaluation tracking
- Compliance dashboard
- Reminder notifications

**Acceptance criteria:**
- Due dates calculated
- Evaluations tracked
- Dashboard shows status
- Reminders sent

**Validation:**
- Check due dates - verify calculations
- View dashboard - verify accuracy
- Verify reminder sent at threshold

---

### 12.2 504 Plan Management

**Files:** `apps/special-programs/src/pages/504-plans/`

#### 12.2.1 504 plan list
- Students with 504 plans
- Annual review status
- Filter and search
- Quick actions

**Acceptance criteria:**
- List displays correctly
- Review status accurate
- Filters work
- Actions available

**Validation:**
- View list - verify students
- Filter by status - verify results

---

#### 12.2.2 504 plan editor
- Disability documentation
- Accommodation list
- Review schedule
- Parent acknowledgment

**Acceptance criteria:**
- Documentation section complete
- Accommodations editable
- Review date set
- Acknowledgment tracked

**Validation:**
- Edit accommodations - verify saves
- Set review date - verify scheduled
- Track acknowledgment - verify status

---

### 12.3 Accommodations Management

**Files:** `apps/special-programs/src/pages/accommodations/`

#### 12.3.1 Accommodation catalog
- Standard accommodation types
- Custom accommodation creation
- Category organization
- Implementation guidance

**Acceptance criteria:**
- Types display in catalog
- Custom creation works
- Categories organize
- Guidance displayed

**Validation:**
- View catalog - verify types
- Create custom - verify added
- View guidance - verify displayed

---

#### 12.3.2 Student accommodation profiles
- All accommodations for student
- Teacher notification system
- Accommodation usage logging
- Effectiveness tracking

**Acceptance criteria:**
- Profile shows all accommodations
- Teachers notified
- Usage logged
- Effectiveness trackable

**Validation:**
- View student profile - verify accommodations
- Check teacher notification - verify received
- Log usage - verify recorded

---

### 12.4 Counseling & Interventions

**Files:** `apps/special-programs/src/pages/counseling/`, `apps/special-programs/src/pages/interventions/`

#### 12.4.1 Counseling session management
- Schedule sessions
- Session notes (confidential)
- Referral tracking
- Outcome documentation

**Acceptance criteria:**
- Sessions schedulable
- Notes access-controlled
- Referrals trackable
- Outcomes documented

**Validation:**
- Schedule session - verify created
- Add notes - verify confidential access
- Add referral - verify tracked

---

#### 12.4.2 Intervention tracking
- RTI/MTSS tier tracking
- Intervention plans
- Progress monitoring
- Tier movement decisions

**Acceptance criteria:**
- Tiers assignable
- Plans documented
- Progress tracked
- Movement recorded

**Validation:**
- Assign tier - verify saved
- Create plan - verify documented
- Record progress - verify tracked

---

### 12.5 Special Programs Integration Tests

#### 12.5.1 IEP workflow integration test
- Create student IEP → Add goals → Schedule meeting → Record minutes

#### 12.5.2 504 workflow integration test
- Create 504 → Add accommodations → Track acknowledgment

**Validation:** All tests pass

---

## Sprint 13: Student & Parent Portals

> **Goal:** Self-service portals for students and parents.
> **Demo:** Students check grades, parents view child progress, both access announcements.

### 13.1 Student Portal

**Files:** `apps/shell/src/pages/student-portal/` or new `apps/student-portal/`

#### 13.1.1 Student dashboard
- Today's schedule
- Recent grades widget
- Upcoming assignments
- Announcements feed

**Acceptance criteria:**
- Schedule shows today
- Grades show recent
- Assignments show due
- Announcements display

**Validation:**
- Login as student - verify dashboard
- Check schedule - verify accuracy
- View grades - verify recent

---

#### 13.1.2 Grades view
- All classes with current grades
- Assignment details
- Grade history
- GPA display

**Acceptance criteria:**
- Classes list complete
- Assignments viewable
- History accessible
- GPA calculated

**Validation:**
- View grades - verify all classes
- Click assignment - verify details
- Check GPA - verify calculation

---

#### 13.1.3 Attendance view
- Attendance calendar
- Absence details
- Excuse submission
- Attendance summary

**Acceptance criteria:**
- Calendar shows attendance
- Absences detailed
- Excuses submittable
- Summary accurate

**Validation:**
- View calendar - verify attendance
- Submit excuse - verify received
- Check summary - verify %

---

#### 13.1.4 Schedule view
- Weekly schedule grid
- Class details on click
- Teacher contact
- Room information

**Acceptance criteria:**
- Grid shows all classes
- Details display on click
- Contact links work
- Rooms shown

**Validation:**
- View schedule - verify classes
- Click class - verify details
- Click teacher - verify contact

---

### 13.2 Parent Portal

**Files:** `apps/shell/src/pages/parent-portal/` or new `apps/parent-portal/`

#### 13.2.1 Parent dashboard
- Children selector (for multiple children)
- Academic summary per child
- Attendance alerts
- Payment status

**Acceptance criteria:**
- Children switchable
- Summary per child
- Alerts visible
- Payments shown

**Validation:**
- Switch child - verify data changes
- Check alerts - verify present
- View payments - verify status

---

#### 13.2.2 Child academic view
- Grades by class
- Assignment status
- Teacher comments
- Progress reports

**Acceptance criteria:**
- Grades visible
- Assignments listed
- Comments displayed
- Reports downloadable

**Validation:**
- View grades - verify classes
- Check assignments - verify status
- Download report - verify PDF

---

#### 13.2.3 Communication center
- Messages with teachers
- Announcement view
- Meeting requests
- Contact directory

**Acceptance criteria:**
- Messages functional
- Announcements visible
- Requests submittable
- Directory searchable

**Validation:**
- Send message to teacher - verify delivered
- View announcements - verify displayed
- Request meeting - verify submitted

---

#### 13.2.4 Payment portal
- Outstanding balances
- Payment history
- Make payment (integration)
- Payment plans

**Acceptance criteria:**
- Balances accurate
- History complete
- Payment processes
- Plans viewable

**Validation:**
- View balance - verify amount
- Make payment - verify processed
- Check history - verify recorded

---

### 13.3 Portal Common Components

#### 13.3.1 Profile management
- Update contact info
- Change password
- Notification preferences
- Photo upload

**Acceptance criteria:**
- Info editable
- Password changeable
- Preferences saveable
- Photo uploadable

**Validation:**
- Update phone - verify saved
- Change password - verify works
- Upload photo - verify displays

---

#### 13.3.2 Portal mobile responsiveness
- Responsive design
- Touch-friendly interactions
- Mobile navigation
- Offline capability (PWA)

**Acceptance criteria:**
- Layout adapts to mobile
- Touch targets adequate
- Navigation works on mobile
- Basic offline works

**Validation:**
- Test at 375px - verify layout
- Test touch interactions - verify usable
- Test offline - verify cached content

---

### 13.4 Portal Integration Tests

#### 13.4.1 Student portal integration test
- Login → View grades → Check schedule → Send message

#### 13.4.2 Parent portal integration test
- Login → Switch child → View grades → Make payment

**Validation:** All tests pass

---

## Sprint 14: Ed-Fi Integration Enhancement

> **Goal:** Complete Ed-Fi state reporting integration.
> **Demo:** Full sync to ODS, descriptor mapping, compliance reports.

### 14.1 Ed-Fi Sync Completion

**Files:** `apps/edfi/src/`

**Current state:** 95% complete with Connection Wizard, Descriptor Mapper, Sync Dashboard, Error Aggregator.

#### 14.1.1 Expand descriptor mapping coverage
- Map all remaining descriptor types
- Import state-specific descriptors
- Mapping validation
- Bulk mapping tools

**Acceptance criteria:**
- All descriptor types mappable
- State imports work
- Validation flags issues
- Bulk tools efficient

**Validation:**
- Map all descriptors - verify coverage
- Import state - verify imported
- Test validation - verify errors flagged

---

#### 14.1.2 Entity sync for remaining domains
- Finance domain sync
- Discipline domain sync
- Special Education domain sync
- Assessment domain sync

**Acceptance criteria:**
- Each domain syncs correctly
- Errors captured
- Progress tracked
- Retry mechanism works

**Validation:**
- Sync finance - verify ODS updated
- Sync discipline - verify records
- Test retry on failure - verify retries

---

### 14.2 Compliance Reporting

#### 14.2.1 State reporting dashboard
- Submission status by report type
- Due date tracking
- Error summary
- Historical submissions

**Acceptance criteria:**
- Dashboard shows all report types
- Due dates highlighted
- Errors summarized
- History accessible

**Validation:**
- View dashboard - verify reports
- Check due dates - verify accurate
- View history - verify records

---

#### 14.2.2 Report generation
- Generate required state reports
- Data validation before submission
- Submit to state system
- Confirmation tracking

**Acceptance criteria:**
- Reports generate correctly
- Validation catches issues
- Submission works
- Confirmations saved

**Validation:**
- Generate report - verify data
- Run validation - verify issues found
- Submit - verify confirmation

---

### 14.3 Ed-Fi Mappers Expansion

#### 14.3.1 Additional domain mappers
- Student domain mapper
- Assessment domain mapper
- Attendance domain mapper
- Course/Section mapper

**Acceptance criteria:**
- Mappers convert EdForge → Ed-Fi
- All required fields mapped
- Validation included
- Tests pass

**Validation:**
- Map student - verify Ed-Fi format
- Map assessment - verify fields
- Run mapper tests - verify pass

---

### 14.4 Ed-Fi Integration Tests

#### 14.4.1 Full sync integration test
- Configure connection → Map descriptors → Run sync → Verify ODS

**Validation:** All tests pass with test ODS instance

---

## Sprint 15: Production Hardening

> **Goal:** Prepare for production deployment with comprehensive testing and documentation.
> **Demo:** All tests passing, monitoring active, documentation complete.

### 15.1 Testing

#### 15.1.1 Unit test coverage to 80%
- Add missing unit tests
- Mock external dependencies
- Test edge cases
- Coverage report

**Acceptance criteria:**
- Coverage ≥ 80% per package
- All critical paths tested
- Edge cases covered
- Report generated

**Validation:**
- Run `pnpm test:coverage`
- Verify all packages ≥ 80%

---

#### 15.1.2 E2E test suite with Playwright
- Critical user flows
- Cross-browser testing
- Mobile viewport tests
- Accessibility tests

**Acceptance criteria:**
- 20+ critical flows covered
- Chrome, Firefox, Safari pass
- Mobile tests pass
- a11y violations ≤ 5

**Validation:**
- Run `pnpm test:e2e`
- Verify all passing
- Check a11y report

---

#### 15.1.3 Performance testing
- Lighthouse audits
- Load testing
- Memory leak detection
- Bundle size analysis

**Acceptance criteria:**
- Lighthouse score ≥ 90
- Load test handles 100 concurrent
- No memory leaks
- Bundle ≤ 500KB gzipped

**Validation:**
- Run Lighthouse - verify scores
- Run load test - verify handles load
- Check bundle analyzer

---

### 15.2 Monitoring & Observability

#### 15.2.1 Error tracking setup (Sentry)
- Sentry integration
- Source map uploads
- Error alerting
- Release tracking

**Acceptance criteria:**
- Sentry captures errors
- Source maps resolve
- Alerts configured
- Releases tagged

**Validation:**
- Trigger error - verify in Sentry
- Check source map resolution
- Verify alert received

---

#### 15.2.2 Analytics tracking
- Page view tracking
- Event tracking
- User journey tracking
- Custom metrics

**Acceptance criteria:**
- Page views tracked
- Key events captured
- Journeys analyzable
- Metrics dashboarded

**Validation:**
- Navigate pages - verify tracked
- Perform key actions - verify events
- View analytics dashboard

---

#### 15.2.3 Health checks
- API health endpoint
- Remote module health
- Database connectivity
- External service status

**Acceptance criteria:**
- Health endpoint returns status
- Remotes health checked
- DB connectivity verified
- External services monitored

**Validation:**
- Call health endpoint - verify response
- Simulate remote failure - verify detected

---

### 15.3 Documentation

#### 15.3.1 API documentation
- OpenAPI/Swagger docs
- Request/response examples
- Error codes documented
- Authentication documented

**Acceptance criteria:**
- All endpoints documented
- Examples complete
- Errors listed
- Auth explained

**Validation:**
- Review API docs - verify complete
- Test examples - verify work

---

#### 15.3.2 User documentation
- Admin guide
- Teacher guide
- Parent/Student guide
- FAQ

**Acceptance criteria:**
- Guides cover all features
- Screenshots current
- FAQ addresses common issues
- Accessible format

**Validation:**
- Review guides - verify coverage
- Test procedures - verify accurate

---

#### 15.3.3 Developer documentation
- Architecture overview
- Setup guide
- Contribution guide
- Module development guide

**Acceptance criteria:**
- Architecture documented
- Setup works from docs
- Contribution process clear
- Module template provided

**Validation:**
- Fresh setup from docs - verify works
- Review contribution guide - verify clear

---

### 15.4 Security

#### 15.4.1 Security audit
- Dependency audit (npm audit)
- OWASP top 10 check
- Authentication review
- Authorization review

**Acceptance criteria:**
- No critical vulnerabilities
- OWASP issues addressed
- Auth flow secure
- ABAC correctly enforced

**Validation:**
- Run npm audit - verify clean
- Review security checklist - verify complete

---

#### 15.4.2 Penetration testing preparation
- Document attack surface
- Prepare test accounts
- Define scope
- Create remediation plan

**Acceptance criteria:**
- Surface documented
- Test accounts ready
- Scope defined
- Plan template ready

**Validation:**
- Review documentation - verify complete
- Verify test accounts work

---

### 15.5 Production Readiness Checklist

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Lighthouse ≥ 90
- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Health checks working
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Deployment pipeline tested
- [ ] Rollback procedure documented
- [ ] Monitoring dashboards active
- [ ] On-call rotation defined

---

## Appendix A: Package Gaps & Future Enhancements

### @edforge/ui Package Expansion

**Sprint 5 adds (required for later sprints):**
- `Modal` / `Dialog` — Modal dialogs (Sprint 5.13.1)
- `Toast` — Sonner integration (Sprint 5.13.2)
- `Tabs` — Tab navigation (Sprint 5.13.3)
- `Badge` — Status badges (Sprint 5.13.4)
- `Input` — Text input with states (Sprint 5.13.5)

**Future additions (as needed):**
- `Alert` — Inline alerts
- `Spinner` — Loading spinner
- `Accordion` — Collapsible sections
- `Pagination` — Page navigation (may exist in current UI)
- `Select` — Custom select dropdown
- `Checkbox` / `Radio` — Form inputs
- `Switch` — Toggle switch
- `Progress` — Progress bar
- `Breadcrumb` — Navigation breadcrumbs

### @edforge/forms Package Expansion

Recommended additional fields (add as needed per sprint):
- `FileUploadField` — File/image upload (Sprint 9 for receipts, Sprint 12 for IEP docs)
- `RichTextField` — WYSIWYG editor (Sprint 10 for announcements, Sprint 12 for IEP)
- `MultiSelectField` — Multi-select dropdown
- `DateRangeField` — Date range picker (Sprint 9 for reports)
- `TimeField` — Time picker (Sprint 8 for bell schedules)
- `SearchSelectField` — Searchable select
- `TagField` — Tag input

### @edforge/types Package Expansion

Recommended additional types (add per sprint):
- **Sprint 7:** Student, Guardian, Enrollment types
- **Sprint 8:** Course, Section, Schedule, Grade, Assignment types
- **Sprint 9:** Invoice, Payment, Payroll, Expense types
- **Sprint 10:** Message, Announcement, Meeting, Notification types
- **Sprint 12:** IEP, 504Plan, Accommodation types

---

## Appendix B: Technical Decisions & Recommendations

### Libraries to Use

| Need | Recommended Library | Notes |
|------|---------------------|-------|
| Drag and drop | `@dnd-kit` | More flexible than `react-beautiful-dnd` |
| Charts | `recharts` or `@tremor/react` | Tremor has nice defaults for dashboards |
| Schedule grid | `react-grid-layout` | Consider for dashboard and schedule builder |
| Rich text | `@tiptap/react` | Modern, extensible editor |
| Date picker | `react-day-picker` | Lightweight, accessible |
| File upload | `react-dropzone` | Well-supported |
| Virtualization | `@tanstack/react-virtual` | For large lists/grids |

### State Management Conventions

| Data Type | Where to Store | Example |
|-----------|----------------|---------|
| Server data | TanStack Query cache | Students list, user profile |
| Global UI state | Zustand (existing stores) | Active school, sidebar collapsed |
| Form state | React Hook Form | Student create form |
| URL state | TanStack Router search params | Filters, pagination |
| Local component state | useState | Dropdown open, input value |

### Query Key Factory Pattern

```typescript
// Recommended pattern for TanStack Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
}
```

---

## Appendix C: Accessibility (a11y) Requirements

### Per-Component Requirements

Every new component must:
1. Have proper ARIA labels/roles
2. Be keyboard navigable (Tab, Enter, Escape, Arrow keys where appropriate)
3. Have visible focus indicators
4. Pass axe-core automated checks
5. Work with screen readers (test with VoiceOver/NVDA)

### Critical Accessibility Points

| Feature | Requirement |
|---------|-------------|
| Student medical alerts | Screen reader announcement, high contrast |
| Form validation errors | Linked to inputs via aria-describedby |
| Modals | Focus trap, return focus on close |
| Toasts | aria-live region for announcements |
| Data tables | Proper th/scope for headers |
| Charts | Alternative text/table for data |

---

## Appendix D: Demo Environment Guidelines

### Demo Data Characteristics

- **Tenant:** "Greenfield Academy" with realistic branding
- **Schools:** 3 schools (Elementary, Middle, High)
- **Staff:** ~50 staff members across roles
- **Students:** ~500 students across grade levels
- **Guardians:** ~400 guardians with relationships
- **Data realism:** Real-sounding names, consistent demographics

### Demo Script Template

For each sprint demo:
1. Start from fresh demo environment
2. Login as appropriate role
3. Complete primary workflow
4. Show edge cases handled
5. Demonstrate error handling
6. Show mobile responsiveness
7. Verify dark mode works

---

## Notes

- Each sprint builds on previous sprints — ensure dependencies are complete
- Integration tests validate end-to-end workflows
- All UI should be tested at 1280px, 1024px, 768px, 375px viewports
- Dark mode support required for all new components
- ABAC permissions must be respected throughout
- Mock data should be clearly marked and replaceable
- API service layer should use consistent patterns from `tenant.service.ts`
- **Tests must pass before sprint is considered complete**
- **Coverage must be ≥ 80% for new code in each sprint**
