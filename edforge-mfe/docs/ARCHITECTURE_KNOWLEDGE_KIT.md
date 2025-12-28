# EdForge MFE Architecture Knowledge Kit

> A concise technical guide for backend engineers to understand the frontend architecture and design corresponding microservices.

---

## 1. Architecture Overview

EdForge is a **multi-tenant Education Management Information System (EMIS)** built as a **Micro-Frontend (MFE)** application using **Module Federation**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SHELL APPLICATION                               │
│    (Authentication, Routing, Layout, Theme, ABAC, Multi-tenant Context)     │
├────────────┬────────────┬────────────┬────────────┬────────────┬────────────┤
│ Academics  │  Finance   │   People   │  Messages  │ Analytics  │  Special   │
│   Remote   │   Remote   │   (Shell)  │   (Shell)  │   (Shell)  │  Programs  │
│  :3002     │   :3003    │            │            │            │   :3005    │
├────────────┴────────────┴────────────┴────────────┴────────────┴────────────┤
│                            Ed-Fi Remote (:3001)                              │
│                    (State Education Data Exchange)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Technologies
- **Build**: Rsbuild + Rspack with Module Federation
- **Routing**: TanStack Router (file-based, type-safe)
- **State**: Zustand (global stores)
- **Auth**: AWS Cognito (planned) with custom ABAC
- **Styling**: Tailwind CSS + CSS Variables theming

---

## 2. Frontend Domain Modules → Backend Services Mapping

The frontend is organized into **11 distinct modules**, each representing a bounded context. Here's the recommended backend microservice mapping:

### 2.1 Core Modules (Backend Service Recommendations)

| Frontend Module | Suggested Backend Service(s) | Primary Entities |
|-----------------|------------------------------|------------------|
| **Shell** | `auth-service`, `tenant-service` | User, Tenant, School, Session |
| **Academics** | `academics-service` | Student, Enrollment, Course, Class, Schedule, Attendance, Grade, Assessment |
| **Finance** | `finance-service` | Invoice, Payment, Fee, Expense, Budget, Payroll, Transaction |
| **People** | `hr-service` | Employee, Teacher, Staff, Guardian, Department, Contract |
| **Messages** | `communications-service` | Message, Announcement, Notification, MeetingIntegration |
| **Analytics** | `analytics-service` | Report, Dashboard, Metric, DataExport |
| **Special Programs** | `special-programs-service` | IEP, 504Plan, Accommodation, Intervention, Counseling |
| **Ed-Fi** | `edfi-integration-service` | EdFiConnection, DescriptorMapping, SyncJob, SyncError |
| **Student Portal** | *Uses academics-service APIs* | (Read-only student view) |
| **Parent Portal** | *Uses academics-service + finance-service APIs* | (Read-only parent view) |
| **Settings** | `tenant-service`, `user-service` | Preferences, SchoolConfig, Integration |

### 2.2 Domain Boundaries Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN BOUNDED CONTEXTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   IDENTITY &    │  │    ACADEMIC     │  │    FINANCIAL    │              │
│  │  MULTI-TENANT   │  │    DOMAIN       │  │     DOMAIN      │              │
│  │                 │  │                 │  │                 │              │
│  │ • Tenants       │  │ • Students      │  │ • Billing       │              │
│  │ • Schools       │  │ • Enrollment    │  │ • Payments      │              │
│  │ • Users         │  │ • Courses       │  │ • Fees          │              │
│  │ • Roles         │  │ • Classes       │  │ • Expenses      │              │
│  │ • Sessions      │  │ • Schedules     │  │ • Budgets       │              │
│  │ • Permissions   │  │ • Attendance    │  │ • Transactions  │              │
│  │                 │  │ • Grades        │  │ • Ledger        │              │
│  │                 │  │ • Assessments   │  │                 │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           └────────────────────┼────────────────────┘                        │
│                                │                                             │
│  ┌─────────────────┐  ┌───────┴───────┐  ┌─────────────────┐                │
│  │  HR & PEOPLE    │  │  SHARED CORE  │  │ COMMUNICATIONS  │                │
│  │    DOMAIN       │  │   (PERSON)    │  │     DOMAIN      │                │
│  │                 │  │               │  │                 │                │
│  │ • Employees     │  │ • BasePerson  │  │ • Messages      │                │
│  │ • Teachers      │  │ • Address     │  │ • Announcements │                │
│  │ • Contracts     │  │ • Contact     │  │ • Notifications │                │
│  │ • Payroll       │  │ • Emergency   │  │ • Meeting Integ │                │
│  │ • Performance   │  │               │  │                 │                │
│  │ • Prof. Dev     │  │               │  │                 │                │
│  └─────────────────┘  └───────────────┘  └─────────────────┘                │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ SPECIAL PROGS   │  │   ANALYTICS     │  │  INTEGRATIONS   │              │
│  │    DOMAIN       │  │    DOMAIN       │  │    DOMAIN       │              │
│  │                 │  │                 │  │                 │              │
│  │ • IEPs          │  │ • Reports       │  │ • Ed-Fi ODS     │              │
│  │ • 504 Plans     │  │ • Dashboards    │  │ • Google Suite  │              │
│  │ • Accommodations│  │ • Metrics       │  │ • Microsoft 365 │              │
│  │ • Counseling    │  │ • Data Export   │  │ • Sync Jobs     │              │
│  │ • Interventions │  │                 │  │                 │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Multi-Tenancy Model

### 3.1 Tenant Hierarchy

```
Tenant (District/Organization)
 └── Schools[]
      └── SchoolYears[]
           └── Terms[]
      └── Users[] (with school-specific roles)
```

### 3.2 Key Tenant Types (from `@edforge/types`)

```typescript
interface Tenant {
  id: string
  name: string
  subdomain: string           // e.g., "springfield" → springfield.edforge.io
  schools: string[]           // School IDs
  activeSchoolYear: string
  features?: TenantFeatures   // Feature flags
  branding?: TenantBranding   // Custom theming
  integrations?: TenantIntegrations // Ed-Fi, Google, MS365
}

interface School {
  id: string
  tenantId: string
  name: string
  code: string
  type?: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
  isActive: boolean
}
```

### 3.3 Backend Considerations for Multi-Tenancy

1. **Tenant Resolution**: Shell resolves tenant from URL subdomain or path
2. **Data Isolation**: All API requests must include `tenantId` in context
3. **Database Strategy**: Recommend schema-per-tenant or tenant column approach
4. **Caching**: Tenant-aware cache keys required

---

## 4. Authentication & Authorization (ABAC)

### 4.1 Role Hierarchy

```
GlobalRole (Tenant-level)
 ├── TenantAdmin     → Full access across all schools
 └── StandardUser    → School-specific access

SchoolRole (Per-school assignment)
 ├── Principal       → Full school access + approval rights
 ├── Teacher         → Class-level access + grading
 ├── Accountant      → Finance access
 ├── Staff           → Limited operational access
 ├── Student         → Student portal only
 └── Parent          → Parent portal only (read-only)
```

### 4.2 User Identity Structure

```typescript
interface UserIdentity {
  id: string
  email: string
  name: string
  globalRole: 'TenantAdmin' | 'StandardUser'
  tenantId: string
  // Map of SchoolID → Role within that school
  assignments: Record<string, SchoolRole>
  childrenIds?: string[]  // For Parent users
}
```

### 4.3 Permission Check Pattern (ABAC Engine)

```typescript
// Frontend checks permissions like this:
const canEditStudents = usePermission('edit', 'students')

// Backend should implement equivalent:
// canPerform(userId, action, resource, context) → boolean
//
// Context includes: tenantId, schoolId, targetResourceId
```

### 4.4 ABAC Resources & Actions

**Actions**: `view`, `create`, `edit`, `delete`, `manage`, `approve`, `send`, `export`

**Resources** (organized by domain):

| Domain | Resources |
|--------|-----------|
| Academics | `students`, `teachers`, `grades`, `gradelevels`, `curriculum`, `classes`, `classrooms`, `calendar`, `attendance`, `enrollment`, `assessments`, `gradebook`, `scheduling`, `courses`, `standards` |
| Finance | `billing`, `payroll`, `expenses`, `tuition`, `reports:finance` |
| HR | `staff`, `hr`, `hr:payroll`, `hr:contracts`, `hr:professional-dev`, `hr:performance-reviews` |
| Communications | `communications`, `announcements`, `messages`, `notifications` |
| Analytics | `analytics`, `analytics:academic`, `analytics:financial`, `analytics:attendance` |
| Special Programs | `special-programs`, `special-programs:ieps`, `special-programs:504` |
| Portals | `student-portal`, `student-portal:grades`, `parent-portal`, `parent-portal:fees`, etc. |
| Settings | `settings`, `settings:school`, `settings:tenant` |
| Integrations | `edfi`, `edfi:connections`, `integrations:google`, `integrations:microsoft` |

---

## 5. Shared Entity Types

The `@edforge/types` package defines canonical entity structures:

### 5.1 Person Entity (Discriminated Union)

```typescript
type Person = Student | Teacher | Staff | Admin | Guardian

interface BasePerson {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: Address
  status: 'active' | 'inactive' | 'pending' | 'on_leave' | 'graduated' | 'suspended' | 'terminated'
  createdAt: string
  updatedAt: string
}

// Student extends BasePerson with:
interface StudentData {
  type: 'student'
  studentId: string
  grade: string
  enrollmentDate: string
  guardianIds: string[]
}

// Teacher extends BasePerson with:
interface TeacherData extends EmployeeBase {
  type: 'teacher'
  subjects: string[]
  grades: string[]
}
```

### 5.2 Backend Type Guards

Implement server-side type guards mirroring frontend:

```typescript
function isStudent(person: Person): person is Student {
  return person.type === 'student'
}
```

---

## 6. API Design Recommendations

### 6.1 RESTful Endpoints by Module

```
# Auth/Identity (auth-service)
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
GET    /tenants/:tenantId
GET    /tenants/:tenantId/schools

# Academics (academics-service)
GET    /academics/students
POST   /academics/students
GET    /academics/students/:id
PATCH  /academics/students/:id
GET    /academics/enrollment
POST   /academics/enrollment
GET    /academics/attendance
POST   /academics/attendance
GET    /academics/grades
POST   /academics/grades

# Finance (finance-service)
GET    /finance/billing/invoices
POST   /finance/billing/invoices
GET    /finance/expenses
POST   /finance/expenses
GET    /finance/reports

# HR (hr-service)
GET    /hr/employees
POST   /hr/employees
GET    /hr/payroll
GET    /hr/contracts

# Communications (communications-service)
GET    /communications/messages
POST   /communications/messages
GET    /communications/announcements
POST   /communications/announcements

# Special Programs (special-programs-service)
GET    /special-programs/ieps
POST   /special-programs/ieps
GET    /special-programs/504-plans

# Ed-Fi Integration (edfi-integration-service)
GET    /edfi/connections
POST   /edfi/connections
POST   /edfi/sync
GET    /edfi/sync/:jobId/status
GET    /edfi/errors
```

### 6.2 Request Context (Required Headers)

Every API request from the frontend includes:

```
Authorization: Bearer <jwt>
X-Tenant-ID: <tenantId>
X-School-ID: <activeSchoolId>   // When school context is active
X-Request-ID: <uuid>            // For tracing
```

### 6.3 Standard Response Shape

```typescript
// Success
{
  data: T | T[],
  meta?: {
    total: number,
    page: number,
    pageSize: number
  }
}

// Error
{
  error: {
    code: string,
    message: string,
    details?: Record<string, string[]>
  }
}
```

---

## 7. Frontend → Backend Communication

### 7.1 Data Flow

```
┌──────────────┐     TanStack Query     ┌──────────────┐
│   UI Layer   │  ←─────────────────→   │  API Client  │
│  (Components)│                        │  (fetch/axios)│
└──────────────┘                        └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  API Gateway │
                                        │  (Kong/AWS)  │
                                        └──────────────┘
                                               │
              ┌────────────────────────────────┼────────────────────────────────┐
              ▼                                ▼                                ▼
       ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
       │ auth-service │               │academics-svc │               │ finance-svc  │
       └──────────────┘               └──────────────┘               └──────────────┘
```

### 7.2 Frontend Query Keys (for backend cache coordination)

```typescript
// Query key patterns used by frontend:
['tenant', tenantId]
['schools', tenantId]
['students', { tenantId, schoolId, page, filters }]
['student', studentId]
['attendance', { schoolId, date, classId }]
['grades', { studentId, termId }]
['invoices', { tenantId, status, page }]
['employees', { schoolId, department }]
```

---

## 8. Module Federation Exposed Components

Remotes expose components that the shell lazy-loads:

| Remote | Exposed Modules |
|--------|-----------------|
| `academics` | `StudentsModule`, `EnrollmentModule`, `AttendanceModule`, `GradebookModule` |
| `finance` | `BillingModule`, `ExpensesModule`, `PayrollModule`, `TuitionModule` |
| `edfi` | `EdFiModule`, `ConnectionWizard`, `SyncDashboard`, `DescriptorMapper`, `ErrorAggregator` |
| `specialPrograms` | `IEPsModule`, `504PlansModule`, `AccommodationsModule`, `CounselingModule`, `InterventionsModule` |

**Backend Implication**: Each remote's API calls should be isolated to its service boundary.

---

## 9. Quick Reference: Service Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICE BOUNDARY SUMMARY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  auth-service           │ Authentication, JWT, Sessions                     │
│  tenant-service         │ Tenants, Schools, Feature Flags, Branding        │
│  user-service           │ User Profiles, Preferences, Assignments          │
│  academics-service      │ Students, Enrollment, Courses, Classes,          │
│                         │ Attendance, Grades, Assessments, Schedules       │
│  finance-service        │ Billing, Payments, Expenses, Budgets, Ledger     │
│  hr-service             │ Employees, Payroll, Contracts, Performance       │
│  communications-service │ Messages, Announcements, Notifications           │
│  analytics-service      │ Reports, Dashboards, Data Export                 │
│  special-programs-svc   │ IEPs, 504 Plans, Accommodations, Interventions   │
│  edfi-integration-svc   │ Ed-Fi ODS Connection, Mapping, Sync Jobs         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Key Takeaways for Backend Engineers

1. **Follow Frontend Module Boundaries**: Each frontend module maps to a backend service
2. **Multi-Tenant First**: Every entity needs `tenantId`, most need `schoolId`
3. **Implement ABAC**: Use the same `Action × Resource` matrix defined in `@edforge/abac`
4. **Person is Polymorphic**: Use discriminated unions with `type` field
5. **Portals are Views**: Student/Parent portals use existing service APIs with restricted permissions
6. **Ed-Fi is Integration**: Separate service for state data exchange, not core functionality
7. **Shared Types**: Mirror `@edforge/types` definitions in backend DTOs

---

## Appendix A: Environment & Ports

| App | Dev Port | Description |
|-----|----------|-------------|
| Shell | 3000 | Main orchestrator |
| Ed-Fi | 3001 | Ed-Fi integration remote |
| Academics | 3002 | Academic management remote |
| Finance | 3003 | Financial management remote |
| Special Programs | 3005 | Special education remote |

---

## Appendix B: Monorepo Package Structure

```
edforge-mfe/
├── apps/
│   ├── shell/          # Main orchestrator app
│   ├── academics/      # Remote: Academic features
│   ├── finance/        # Remote: Finance features
│   ├── edfi/           # Remote: Ed-Fi integration
│   └── special-programs/ # Remote: Special education
├── packages/
│   ├── types/          # Shared TypeScript types
│   ├── abac/           # Permission engine + hooks
│   ├── ui/             # Shared UI components
│   ├── theme/          # Tailwind theme + CSS
│   └── config/         # Shared build/lint configs
└── docs/
    └── ARCHITECTURE_KNOWLEDGE_KIT.md (this file)
```

---

*Last Updated: December 2024*
*Version: 1.0.0*
