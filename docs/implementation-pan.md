Enterprise Navigation & Module Plan
Goal Description
Enhance EdForge's navigation structure to reflect an enterprise-grade SaaS platform. This includes:

Restructuring "People": Elevating it to a comprehensive Human Capital Management (HCM) module.
Restructuring "Finance": Clearly separating functional areas (GL, AP, AR, Payroll).
Naming & Terminology: Adopting industry-standard enterprise terminology.
Breadcrumbs: Implementing a robust, path-aware breadcrumb system to improve wayfinding without cluttering the sidebar.
This plan preserves the existing sidebar animations and "context-aware" navigation behavior requested by the user.

User Review Required
IMPORTANT

Major Route Changes: This plan involves moving and renaming core routes.

people/colleague -> people/directory
people/assignments -> people/tasks
finance/human-resource (link) -> finance
NOTE

No UI Changes to Sidebar: The visual design and animations of the sidebar will remain exactly as they are. The changes are structural (what items appear) and navigational (where links go).

Proposed Changes
1. Breadcrumb Component
[NEW] 
Breadcrumbs.tsx
Create a new component using TanStack Router's useLocation or useMatches.
Logic: Map URL segments to human-readable labels.
/people -> "People"
/people/directory -> "Directory"
/finance/receivables/tuition -> "Finance" > "Receivables" > "Tuition"
Style: Subtle, top of the page (inside 
AppShell
 main area), using the design system's text colors.
[MODIFY] 
AppShell.tsx
Insert <Breadcrumbs /> at the top of the <main> content area.
2. People Module (HCM) Upgrade
[MODIFY] 
sidebar-modules.ts
Rename Module: "People" -> "People & HR" (internal ID stays people).
Structure:
Main:
Overview (Dashboard)
Directory (was "Colleague"): All staff/faculty list.
HR Management:
Personnel: Profiles, Contracts, Onboarding.
Attendance: Staff time tracking (moved from general attendance).
Leaves: Leave requests and approval workflows.
Performance: PD, Reviews (New).
Operations:
Tasks (was "Assignments"): Staff duties.
Recruitment: (Placeholder/Future).
[NEW/MOVE] Route Files
Create standardized route definitions for the new structure.
routes/_protected/people/directory.tsx (Migrate logic from staff/index)
routes/_protected/people/personnel.tsx
routes/_protected/people/leaves.tsx
3. Finance Module Enterprise Restructure
[MODIFY] 
sidebar-modules.ts
Rename Module: "Finance" -> "Finance & Operations"
Structure:
Main:
Overview (Financial Dashboard)
Receivables (AR):
Tuition & Fees: Student billing management.
Invoices: Generated invoices.
Payables (AP):
Expenses: Staff reimbursements.
Vendors: Vendor management.
General Ledger:
Allocations (was implicit): Budgeting.
Payroll: Link to Payroll processing.
4. Codebase Cleanup
[MODIFY] 
routeTree.gen.ts
(Auto-generated, but will reflect the file moves).
Ensure no "orphan" routes remain from the old structure.
Verification Plan
Automated Tests
npm run build: Verify no type errors in the new route structure.
Check route generation: Ensure TanStack Router generates the correct tree.
Manual Verification
Navigation Check:
Click "People" in Home -> Verify "People & HR" sidebar appears.
Click "Directory" -> Verify staff list loads.
Click "Finance" -> Verify new simplified structure.
Breadcrumb Check:
Navigate deep (e.g., Finance > Receivables > Tuition).
Verify Breadcrumb shows Home / Finance / Receivables / Tuition.
Click "Finance" in breadcrumb to jump up a level.