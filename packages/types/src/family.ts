/**
 * Family Domain Types (academics)
 *
 * A "family" groups students (siblings) under a single primary contact for
 * consolidated billing. Owned by the academics service; the finance service
 * reads family/open-invoices for multi-target payment allocation.
 *
 * P1d: response shapes carry `status` where a lifecycle exists — never
 * `isActive` (soft-delete flag stays server-side).
 */

// ============================================================================
// FAMILY
// ============================================================================

/** Primary contact for a family — a person the school bills / notifies. */
export interface FamilyPrimaryContact {
  name: string
  phone?: string
  email?: string
}

/**
 * A family record (academics service). Groups siblings under one primary
 * contact. No `isActive` in the response — soft-delete is server-side only.
 */
export interface FamilyResponse {
  id: string
  schoolId: string
  name: string
  primaryContact: FamilyPrimaryContact
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** A student who belongs to a family (sibling), as returned on the student→family read. */
export interface FamilySibling {
  studentId: string
  studentName: string
  gradeLevel?: string
  status?: string
}

/**
 * Response for GET /academics/students/:studentId/family — the student's
 * family (or null if unaffiliated) plus the sibling set.
 */
export interface StudentFamily {
  family: FamilyResponse | null
  siblings: FamilySibling[]
}

/** A membership row (student ↔ family) returned by the members read. */
export interface FamilyMember {
  familyId: string
  studentId: string
  studentName: string
  relationshipNote?: string
  addedBy: string
  createdAt: string
}

/** Response for GET .../families/:familyId/members */
export interface FamilyMembersResponse {
  items: FamilyMember[]
}

// ============================================================================
// FAMILY WRITE DTOs (academics)
// ============================================================================

export interface CreateFamilyDto {
  schoolId: string
  name: string
  primaryContact: FamilyPrimaryContact
  notes?: string
}

export interface UpdateFamilyDto {
  version: number
  name?: string
  primaryContact?: FamilyPrimaryContact
  notes?: string
}

export interface AddFamilyMemberDto {
  studentId: string
  relationshipNote?: string
}

// ============================================================================
// FAMILY OPEN INVOICES (finance)
// ============================================================================

/**
 * Response for GET /finance/schools/:schoolId/families/:familyId/open-invoices.
 * Drives the multi-target payment allocation UI: the operator sees every
 * open invoice across the family's students plus a suggested allocation.
 */
export interface FamilyOpenInvoicesResponse {
  students: Array<{
    studentId: string
    studentName: string
  }>
  openInvoices: Array<{
    invoiceId: string
    invoiceNumber: string
    studentId: string
    studentName: string
    amountDue: number
    dueDate: string
  }>
  totalDue: number
  suggestedAllocation: Array<{
    invoiceId: string
    amount: number
  }>
}
