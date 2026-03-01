/**
 * Settings Pages Index
 * 
 * Barrel exports for all settings sub-pages.
 */

// Account
export { default as AccountPage } from './account'
export { default as SecurityPage } from './security'
// [MVP-PARKED] export { default as NotificationsPage } from './notifications'  // merged into PreferencesPage
export { default as PreferencesPage } from './preferences'

// Workspace
export { default as WorkspaceSettingsPage } from './workspace'
export { default as SchoolDetailPage } from './school-detail'
export { default as SchoolCreatePage } from './school-create'
export { default as SchoolConfigurationPage } from './school-configuration'
export { default as SchoolDepartmentsPage } from './school-departments'
export { default as SchoolAcademicYearsPage } from './school-academic-years'
export { default as RBACSecurityPage } from './rbac-security'

// Organization
export { default as OrganizationSettingsPage } from './organization'
export { default as EducationOrgDetailPage } from './education-org-detail'
// [MVP-PARKED] export { default as EdFiExportPreviewPage } from './edfi-export-preview'

// Payments (Nepal Fee Collection)
export { default as FeeStructuresPage } from './fee-structures'
export { default as PaymentGatewaysPage } from './payment-gateways'
export { default as InvoicesPage } from './invoices'
export { default as InvoiceDetailPage } from './invoice-detail'
export { default as PaymentsPage } from './payments'
export { default as RecordPaymentPage } from './record-payment'
export { default as StudentAccountsPage } from './student-accounts'
export { default as FinancialDashboardPage } from './financial-dashboard'
export { default as BulkInvoicesPage } from './bulk-invoices'

// Other
// [MVP-PARKED] export { default as IntegrationsSettingsPage } from './integrations'
// [MVP-PARKED] export { default as BillingSettingsPage } from './billing'
export { default as PeopleSettingsPage } from './people'
// [MVP-PARKED] export { default as DangerZonePage } from './danger'

