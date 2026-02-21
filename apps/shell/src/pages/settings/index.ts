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

// Other
// [MVP-PARKED] export { default as IntegrationsSettingsPage } from './integrations'
// [MVP-PARKED] export { default as BillingSettingsPage } from './billing'
export { default as PeopleSettingsPage } from './people'
// [MVP-PARKED] export { default as DangerZonePage } from './danger'

