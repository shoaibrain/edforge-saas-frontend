# EdForge Micro-Service Boundaries & Presentation Layer Architecture
> **Date:** December 23, 2025  
> **Type:** Architectural Specification  
> **Scope:** Domain Modeling & Frontend Architecture

## 1. Domain Bounded Contexts

The EdForge platform is decomposed into **9 Core Domains**. These boundaries define the Micro-Frontend (MFE) split. Each domain maps to a specific MFE Remote or a Shared Library.

### 1.1 Domain Map
| Domain | MFE Remote | Responsibilities | Key Entities |
|--------|------------|------------------|--------------|
| **Identity & Multi-Tenant** | `@edforge/shell` | **The Gatekeeper**. Handles auth, tenant resolution, and global access control. | Tenants, Schools, Users, Roles, Permissions |
| **Academic** | `@edforge/academics` | **Core Business**. Managing the educational lifecycle. | Students, Enrollment, Classes, Grades, Attendance |
| **Financial** | `@edforge/finance` | **The Ledger**. High-security financial operations. | Billing, Fees, Ledger, Payroll, Expenses |
| **HR & People** | `@edforge/people` | **Workforce**. Staff management and contracts. | Employees, Contracts, Prof. Dev, Performance |
| **Shared Core** | `@edforge/types` | **Common Language**. Universal data structures used across domains. | Person (Base), Address, Contact Info |
| **Communications** | `@edforge/messages` | **Engagement**. Real-time messaging and notifications. | Messages, Announcements, Notifications |
| **Special Programs** | `@edforge/special` | **Compliance**. Sensitive special education data (HIPAA/FERPA). | IEPs, 504 Plans, Interventions |
| **Analytics** | `@edforge/analytics` | **Intelligence**. Cross-domain reporting and insights. | Dashboards, Reports, Data Export |
| **Integrations** | `@edforge/edfi` | **Connectivity**. External system synchronization. | Ed-Fi, Google Workspace, Microsoft 365 |

---

## 2. Presentation Layer Architecture

To support a **Secure, Scalable, and Efficient** enterprise-grade solution, the presentation layer must strictly adhere to the following architectural patterns.

### 2.1 The "Shell & Remote" Pattern
*   **The Shell (`@edforge/shell`)**:
    *   **Role**: The "Operating System" of the browser.
    *   **Responsibilities**:
        *   **Bootstrapping**: Initializing React, QueryClient, and Theme.
        *   **Context Provider**: Injecting `User`, `Tenant`, and `Permissions` into the React Tree.
        *   **Layout Engine**: Rendering the Sidebar, Header, and Global Modals.
        *   **Routing**: Handling *Top-Level* routing only (`/academics/*`, `/finance/*`).
*   **The Remotes**:
    *   **Role**: The "Applications" running on the OS.
    *   **Responsibilities**:
        *   **Domain Logic**: Rendering the actual features (e.g., Gradebook, General Ledger).
        *   **Internal Routing**: Managing their own sub-routes (`/gradebook`, `/students/:id`).
        *   **Isolation**: They MUST NOT import from other Remotes securely. Communication happens via **Events** or **URL params**.

### 2.2 Security Architecture (Frontend)
*   **Zero-Trust Remotes**: Remotes do not hold authentication tokens. They receive the *result* of authentication (the User object) from the Shell.
*   **ABAC Enforcement**:
    *   **Shell**: Loads permissions on bootstrap.
    *   **Shared Library (`@edforge/abac`)**: Provides the `useCanAccess()` hook.
    *   **Usage**: Components conditionally render based on rights:
        ```tsx
        // Safe Pattern
        const { canEdit } = useCanAccess('grades');
        if (canEdit) return <GradeEditor />;
        ```

### 2.3 Scalability & Performance Strategy
*   **Lazy Loading**: ALL Remotes are loaded lazily via `React.Suspense`. This ensures the initial bundle size remains small (~100kb).
*   **Shared Dependencies**: React, ReactDOM, TanStack Query, and UI Library are **Singletons**. We do not download React 5 times.
*   **Tenant Caching**: The `TenantResolver` should cache the remote URL configuration to prevent blocking network calls on every refresh.

### 2.4 Navigation Design
*   **Federated Routing**:
    *   The Shell defines the "Dock" (Sidebar).
    *   Clicking "Academics" loads the `Academics remote`.
    *   The URL becomes `/academics/dashboard`.
    *   The `Academics remote` controls what is rendered in the functionality area.

---

## 3. Technical Verdict

**EdForge is designed correctly for an Enterprise SaaS.**
The separation of domains aligns perfectly with team boundaries and security requirements (e.g., isolating Finance from Academics).

**Architecture Grade: A-**
*   **Strengths**: Strong domain boundaries, excellent tooling choice (Rsbuild), sophisticated multi-tenant resolution.
*   **Gap**: The implementation currently mocks the separation. The transition to **Federated Routing** (as detailed in the Transition Strategy) is the critical last step to realizing this architecture.

**Final Recommendation**:
Proceed immediately with "Phase I: The Wire-Up" (see Transition Strategy) to Validate the boundaries in a live environment.
