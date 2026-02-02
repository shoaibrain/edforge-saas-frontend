# EdForge Settings Module - API Integration Reference

**For frontend engineers implementing the Settings module UI**
**Last Updated:** 2026-01-30

---

## Settings Module Overview

Maps each Settings sidebar item to its backend API support:

| Settings Section | API Support | Endpoints |
|---|---|---|
| **ACCOUNT** | | |
| My Account | Supported | `GET /users/me`, `PATCH /users/:id` |
| Preferences | Supported | `GET/PATCH /users/:id/preferences` |
| Notifications | Supported (via Preferences) | Embedded in preferences API |
| Security | Supported | `/users/:id/security/*` |
| **WORKSPACE** | | |
| Workspace Settings | Supported | `GET/PATCH /tenants/:tenantId` |
| School Settings | Supported | `/schools/:id`, `/schools/:id/configuration`, `/schools/:id/departments` |
| RBAC Security | Supported | `/users/:id/roles/*` |
| Billing | Not yet implemented | -- |
| Integrations | Not yet implemented | -- |
| Import/Export | Not yet implemented | -- |
| Danger Zone | Partial | `DELETE /users/:id`, admin session revocation |

---

## 1. My Account

### Get Current User Profile

```
GET /users/me
```

**Response:**
```json
{
  "userId": "uuid",
  "email": "user@school.edu",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "A",
  "displayName": "John Doe",
  "phone": "+15551234567",
  "avatarUrl": "https://...",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62701",
    "country": "US"
  },
  "globalRole": "TenantAdmin",
  "status": "active",
  "tenantId": "tenant-uuid",
  "tenantName": "Demo School District",
  "assignments": [
    {
      "schoolId": "school-uuid",
      "schoolName": "Elmwood Elementary",
      "role": "Principal"
    }
  ],
  "lastLoginAt": "2026-01-29T17:46:18.000Z",
  "mfaEnabled": false,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-29T17:46:18.000Z"
}
```

### Update User Profile

```
PATCH /users/:id
```

**Request (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Updated",
  "middleName": "B",
  "displayName": "Johnny",
  "phone": "+15551111111",
  "avatarUrl": "https://...",
  "address": {
    "street": "456 Oak Ave",
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62702"
  },
  "status": "active"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `firstName` | 2-50 characters |
| `lastName` | 2-50 characters |
| `middleName` | max 50 characters |
| `displayName` | max 100 characters |
| `phone` | max 30 characters |
| `avatarUrl` | valid URL |
| `status` | `active`, `inactive`, or `suspended` only (not `pending` or `locked`) |

**Zod schema:** `updateUserSchema` from `@edforge/shared-types`

### Get User Assignments

```
GET /users/:id/assignments
```

**Response:**
```json
{
  "userId": "uuid",
  "assignments": [
    {
      "schoolId": "school-uuid",
      "schoolName": "Elmwood Elementary",
      "role": "Principal"
    }
  ]
}
```

### Enums

- **Global Role:** `TenantAdmin | StandardUser`
- **User Status:** `active | inactive | pending | suspended | locked`
- **User Status (updatable):** `active | inactive | suspended`

---

## 2. Preferences

### Get Preferences

```
GET /users/:id/preferences
```

**Response:**
```json
{
  "tenantId": "tenant-uuid",
  "userId": "user-uuid",
  "theme": "system",
  "language": "en-US",
  "timezone": "America/New_York",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "weekStartsOn": "sunday",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false,
    "digest": "immediate"
  },
  "defaultSchoolId": "school-uuid",
  "version": 1,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Preferences

```
PATCH /users/:id/preferences
```

**Request (all fields optional):**
```json
{
  "theme": "dark",
  "language": "en-US",
  "timezone": "America/Chicago",
  "dateFormat": "DD/MM/YYYY",
  "timeFormat": "24h",
  "weekStartsOn": "monday",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false,
    "digest": "daily"
  },
  "defaultSchoolId": "school-uuid"
}
```

**Business Rules:**
- Preferences are auto-created with defaults when a user is created
- `version` is incremented on each update (optimistic concurrency)
- `defaultSchoolId` determines which school context loads on login

**Zod schema:** `updatePreferencesSchema` from `@edforge/shared-types`

### Enums

| Field | Values |
|-------|--------|
| `theme` | `light`, `dark`, `system` |
| `timeFormat` | `12h`, `24h` |
| `weekStartsOn` | `sunday`, `monday` |
| `digest` | `immediate`, `daily`, `weekly`, `never` |

---

## 3. Notifications (via Preferences)

Notification settings are managed through the Preferences API. There is no separate notifications endpoint.

### Notification Channels

```json
{
  "notifications": {
    "email": true,
    "push": true,
    "sms": false,
    "digest": "daily"
  }
}
```

| Channel | Default | Notes |
|---------|---------|-------|
| `email` | `true` | Email notifications enabled |
| `push` | `true` | Push notifications enabled |
| `sms` | `false` | SMS notifications (requires phone) |
| `digest` | `immediate` | Email digest frequency |

**Note:** The backend entity model has a richer nested structure (`channels.email.enabled`, `channels.email.digest`, `categories.announcements`, etc.) but the API currently exposes the flat notification structure shown above. The per-category notification toggles (announcements, attendance, grades, messages, calendar, billing, security) are defined in the schema but the flat format is what the API accepts and returns.

---

## 4. Security

### Security Overview

```
GET /users/:userId/security
```

**Response:**
```json
{
  "userId": "uuid",
  "email": "user@school.edu",
  "mfaEnabled": false,
  "mfaMethod": null,
  "lastLoginAt": "2026-01-29T17:46:18.000Z",
  "lastLoginIp": "192.168.1.1",
  "lastLoginDevice": "desktop",
  "passwordLastChangedAt": "2026-01-15T10:00:00.000Z",
  "accountLocked": false,
  "failedLoginAttempts": 0,
  "activeSessions": 1,
  "securityScore": 65,
  "recommendations": [
    "Enable multi-factor authentication for enhanced security",
    "Review your active sessions regularly"
  ]
}
```

`securityScore` (0-100) is computed server-side based on MFA status, password age, session count, and failed login attempts. `recommendations` is a server-computed list.

### Change Password

```
POST /users/:userId/security/change-password
```

**Request:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "passwordLastChangedAt": "2026-01-30T..."
}
```

**Password Requirements (Cognito policy):**

| Requirement | Rule |
|-------------|------|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Digit | At least 1 |
| Special character | At least 1 of: `^ $ * . [ ] { } ( ) ? " ! @ # % & / \ , > < ' : ; \| _ ~ \` + = -` |

Use `passwordSchema`, `isValidPassword()`, and `COGNITO_PASSWORD_REQUIREMENTS` from `@edforge/shared-types` for client-side validation.

### MFA Setup Flow

**Step 1: Initiate**
```
POST /users/:userId/security/mfa/setup
```

**Response:**
```json
{
  "secretKey": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/EdForge:user@school.edu?secret=JBSWY3DPEHPK3PXP&issuer=EdForge",
  "manualEntryKey": "JBSWY3DPEHPK3PXP",
  "expiresAt": "2026-01-29T18:46:18.000Z"
}
```

Display the `qrCodeUrl` as a QR code. Show `manualEntryKey` as fallback for manual entry.

**Step 2: Verify & Enable**
```
POST /users/:userId/security/mfa/verify
```

**Request:**
```json
{
  "code": "123456",
  "secretKey": "JBSWY3DPEHPK3PXP"
}
```

**Response:**
```json
{
  "success": true,
  "backupCodes": ["12345678", "87654321"],
  "message": "MFA enabled successfully"
}
```

**Step 3: Disable**
```
POST /users/:userId/security/mfa/disable
```

**Request:**
```json
{
  "password": "CurrentP@ss123",
  "code": "123456"
}
```

> **Note:** MFA setup/verify flow works but enforcement on login is not yet active for MVP.

### Login History

```
GET /users/:userId/security/login-history?limit=20
```

**Response:**
```json
{
  "entries": [
    {
      "timestamp": "2026-01-29T17:46:18.000Z",
      "status": "success",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "macOS",
      "location": "Springfield, IL, US",
      "failureReason": null
    }
  ],
  "total": 15,
  "hasMore": false
}
```

**Enums:**
- **Login Status:** `success | failed | blocked`
- **Device Type:** `desktop | mobile | tablet | unknown`

### Security Sessions

```
GET /users/:userId/security/sessions
```

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "uuid",
      "createdAt": "...",
      "lastActivityAt": "...",
      "expiresAt": "...",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "macOS",
      "location": "Springfield, IL",
      "isCurrent": true
    }
  ],
  "total": 1,
  "currentSessionId": "uuid"
}
```

**Revoke single session:**
```
DELETE /users/:userId/security/sessions/:sessionId
```

**Revoke all sessions:**
```
POST /users/:userId/security/sessions/revoke-all?exceptCurrent=true
```

---

## 5. Workspace Settings

### Get Tenant Details

```
GET /tenants/:tenantId
```

**Response:**
```json
{
  "tenantId": "uuid",
  "name": "Demo School District",
  "subdomain": "demo-district",
  "contactEmail": "admin@demo-district.edu",
  "contactPhone": "+15551234567",
  "address": {
    "street1": "100 District Way",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "tier": "premium",
  "status": "active",
  "features": {},
  "limits": {},
  "branding": {
    "logoUrl": "https://...",
    "faviconUrl": "https://...",
    "primaryColor": "#0D9488",
    "secondaryColor": "#F59E0B",
    "customDomain": null
  },
  "schoolCount": 3,
  "userCount": 45,
  "studentCount": 1200,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-29T17:46:18.000Z"
}
```

### Update Tenant

```
PATCH /tenants/:tenantId
```

**Request (all fields optional):**
```json
{
  "name": "Updated District Name",
  "contactEmail": "new-admin@district.edu",
  "contactPhone": "+15559876543",
  "address": {
    "street1": "200 New Street",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62702",
    "country": "USA"
  },
  "status": "active",
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#1E40AF",
    "secondaryColor": "#F97316"
  }
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `name` | 2-100 characters |
| `contactEmail` | valid email |
| `branding.primaryColor` | hex color `#RRGGBB` format |
| `branding.secondaryColor` | hex color `#RRGGBB` format |
| `branding.logoUrl` | valid URL |

**Enums:**
- **Tier:** `basic | premium | advanced`
- **Status:** `active | inactive | suspended | trial`

**Zod schema:** `updateTenantSchema` from `@edforge/shared-types`

---

## 6. School Settings

### List Schools

```
GET /schools?limit=50
```

Returns paginated list. See [Pagination](#appendix-a-pagination).

### Get School

```
GET /schools/:schoolId
```

**Response:**
```json
{
  "schoolId": "uuid",
  "schoolCode": "ELM001",
  "name": "Elmwood Elementary",
  "shortName": "Elmwood",
  "schoolType": "elementary",
  "gradeRange": { "start": "K", "end": "5" },
  "phone": "+15551234567",
  "email": "admin@elmwood.edu",
  "website": "https://elmwood.edu",
  "address": {
    "street1": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  },
  "principalName": "Dr. Jane Smith",
  "principalEmail": "jane.smith@elmwood.edu",
  "status": "active",
  "timezone": "America/New_York",
  "locale": "en-US",
  "academicCalendarType": "semester",
  "currentAcademicYearId": "year-uuid",
  "studentCount": 450,
  "staffCount": 35,
  "teacherCount": 22,
  "logoUrl": "https://...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Create School

```
POST /schools
```

**Request:**
```json
{
  "schoolCode": "ELM001",
  "name": "Elmwood Elementary",
  "shortName": "Elmwood",
  "schoolType": "elementary",
  "gradeRange": { "start": "K", "end": "5" },
  "phone": "+15551234567",
  "email": "admin@elmwood.edu",
  "website": "https://elmwood.edu",
  "address": {
    "street1": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  },
  "principalName": "Dr. Jane Smith",
  "principalEmail": "jane.smith@elmwood.edu",
  "timezone": "America/Chicago",
  "locale": "en-US",
  "academicCalendarType": "semester"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `schoolCode` | 2-10 chars, **unique per tenant** (409 on duplicate) |
| `name` | 2-100 chars |
| `shortName` | max 50 chars |
| `schoolType` | required, must be valid enum |
| `gradeRange` | required object with `start` and `end` |
| `timezone` | defaults to `America/Chicago` |
| `locale` | defaults to `en-US` |
| `academicCalendarType` | defaults to `semester` |

**Zod schema:** `createSchoolSchema` from `@edforge/shared-types`

### Update School

```
PATCH /schools/:schoolId
```

All fields from create are updatable **except `schoolCode`**. Same validation rules apply.

**Zod schema:** `updateSchoolSchema` from `@edforge/shared-types`

### Delete School

```
DELETE /schools/:schoolId
```

Returns 204 No Content. Returns 404 if not found.

### School Status Lifecycle

```
setup -> active -> inactive -> closed
                -> suspended -> active
```

New schools start in `setup` status.

### Enums

- **School Type:** `elementary | middle | high | k12 | charter | private | vocational | special_education`
- **School Status:** `active | inactive | setup | suspended | closed`
- **Calendar Type:** `semester | quarter | trimester`

---

## 7. School Configuration

Each school has a configuration record. It is auto-created with defaults when the school is created. If missing, it is auto-created on the first PATCH.

### Get Configuration

```
GET /schools/:schoolId/configuration
```

**Response:**
```json
{
  "schoolId": "uuid",
  "timezone": "America/New_York",
  "locale": "en-US",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "academicCalendarType": "semester",
  "gradingScale": {
    "type": "letter",
    "passingGrade": 60,
    "scale": [
      { "letter": "A", "minScore": 90, "maxScore": 100, "gpa": 4.0 },
      { "letter": "B", "minScore": 80, "maxScore": 89, "gpa": 3.0 },
      { "letter": "C", "minScore": 70, "maxScore": 79, "gpa": 2.0 },
      { "letter": "D", "minScore": 60, "maxScore": 69, "gpa": 1.0 },
      { "letter": "F", "minScore": 0, "maxScore": 59, "gpa": 0.0 }
    ]
  },
  "attendanceRequired": true,
  "schoolDays": [1, 2, 3, 4, 5],
  "startTime": "08:00",
  "endTime": "15:30",
  "periodDuration": 50,
  "notificationsEnabled": true,
  "emailNotifications": true,
  "smsNotifications": false,
  "features": {
    "attendance": true,
    "grades": true,
    "enrollment": true,
    "curriculum": true,
    "scheduling": true,
    "specialPrograms": false,
    "parentPortal": false,
    "studentPortal": false
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Configuration

```
PATCH /schools/:schoolId/configuration
```

**Request (all fields optional):**
```json
{
  "timezone": "America/Chicago",
  "locale": "en-US",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "24h",
  "academicCalendarType": "quarter",
  "attendanceRequired": true,
  "schoolDays": [1, 2, 3, 4, 5],
  "startTime": "07:30",
  "endTime": "14:45",
  "periodDuration": 45,
  "notificationsEnabled": true,
  "emailNotifications": true,
  "smsNotifications": false,
  "gradingScale": {
    "type": "letter",
    "passingGrade": 65,
    "scale": [
      { "letter": "A", "minScore": 90, "maxScore": 100, "gpa": 4.0 },
      { "letter": "B", "minScore": 80, "maxScore": 89, "gpa": 3.0 },
      { "letter": "C", "minScore": 70, "maxScore": 79, "gpa": 2.0 },
      { "letter": "D", "minScore": 65, "maxScore": 69, "gpa": 1.0 },
      { "letter": "F", "minScore": 0, "maxScore": 64, "gpa": 0.0 }
    ]
  },
  "features": {
    "attendance": true,
    "grades": true,
    "enrollment": true,
    "scheduling": true
  }
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `timeFormat` | `12h` or `24h` |
| `academicCalendarType` | `semester`, `quarter`, or `trimester` |
| `schoolDays` | array of integers 0-6 (0=Sun, 1=Mon, ..., 6=Sat) |
| `startTime` / `endTime` | `HH:MM` 24-hour format (regex validated) |
| `periodDuration` | 15-120 minutes |
| `gradingScale.type` | `letter`, `percentage`, `points`, or `custom` |
| `gradingScale.passingGrade` | 0-100 |
| `gradingScale.scale[].minScore` | 0-100 |
| `gradingScale.scale[].maxScore` | 0-100 |
| `gradingScale.scale[].gpa` | 0-5.0 (optional) |

**Zod schema:** `updateSchoolConfigSchema` from `@edforge/shared-types`

### Known PATCH Behavior

**Features field uses shallow merge.** When you send a `features` object, it is shallow-merged with the existing features. This means:
- Sending `{ "features": { "attendance": false } }` will set `attendance` to `false` while preserving all other feature flags
- You do NOT need to send the entire features object to change one flag

**`gradingScale` is fully replaced.** When you send a `gradingScale` object, the entire grading scale is replaced (not merged). Always send the complete scale array.

**Auto-creation:** If no configuration exists for the school (edge case), the API auto-creates one with default values before applying your update.

---

## 8. Departments

### Create Department

```
POST /schools/:schoolId/departments
```

**Request:**
```json
{
  "code": "MATH",
  "name": "Mathematics Department",
  "description": "Math department for all grade levels",
  "headUserId": "user-uuid"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `code` | 2-10 chars, **unique per school** (409 on duplicate) |
| `name` | 2-100 chars |
| `description` | max 500 chars |

### List Departments

```
GET /schools/:schoolId/departments?limit=50
```

### Get Department

```
GET /schools/:schoolId/departments/:departmentId
```

**Response:**
```json
{
  "departmentId": "uuid",
  "schoolId": "uuid",
  "code": "MATH",
  "name": "Mathematics Department",
  "description": "...",
  "headUserId": "user-uuid",
  "headName": "Dr. Smith",
  "isActive": true,
  "teacherCount": 8,
  "courseCount": 12,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Department

```
PATCH /schools/:schoolId/departments/:departmentId
```

**Request (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "headUserId": "new-user-uuid",
  "isActive": false
}
```

### Delete Department

```
DELETE /schools/:schoolId/departments/:departmentId
```

Returns 204 No Content.

**Zod schemas:** `createDepartmentSchema`, `updateDepartmentSchema` from `@edforge/shared-types`

---

## 9. RBAC Security

### Assign Role to User

```
POST /users/:id/roles
```

**Request:**
```json
{
  "schoolId": "school-uuid",
  "role": "Teacher",
  "departmentId": "dept-uuid",
  "permissionOverrides": [
    {
      "resource": "grades",
      "action": "export",
      "effect": "allow"
    }
  ],
  "expiresAt": "2026-06-30T23:59:59.000Z"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `schoolId` | required |
| `role` | required, must be valid school role enum |
| `departmentId` | optional |
| `expiresAt` | optional ISO date, auto-deactivates role after this date |
| `permissionOverrides` | optional array of override objects |

**Duplicate assignment** (same user + same school) returns **409 Conflict**.

### List User Roles

```
GET /users/:id/roles
```

**Response:**
```json
{
  "userId": "uuid",
  "globalRole": "StandardUser",
  "schoolRoles": [
    {
      "userId": "uuid",
      "schoolId": "school-uuid",
      "schoolName": "Elmwood Elementary",
      "role": "Teacher",
      "departmentId": "dept-uuid",
      "permissionOverrides": [],
      "isActive": true,
      "assignedAt": "...",
      "assignedBy": "admin-uuid",
      "expiresAt": null
    }
  ]
}
```

### Get Role at School

```
GET /users/:id/roles/:schoolId
```

### Update Role

```
PATCH /users/:id/roles/:schoolId
```

**Request:**
```json
{
  "role": "VicePrincipal",
  "permissionOverrides": [
    { "resource": "users", "action": "manage", "effect": "allow" }
  ],
  "isActive": true,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### Deactivate Role

```
DELETE /users/:id/roles/:schoolId
```

**Request body (optional):**
```json
{
  "reason": "End of contract"
}
```

Returns 204 No Content.

### Check Permission

```
POST /users/:id/roles/permissions/check
```

**Request:**
```json
{
  "resource": "grades",
  "action": "edit",
  "schoolId": "school-uuid"
}
```

**Response:**
```json
{
  "allowed": true,
  "reason": "Permission granted via Teacher role"
}
```

**Business Rules:**
- `TenantAdmin` users **always** return `allowed: true` regardless of school roles
- Use this endpoint to determine UI access rather than hardcoding permission logic
- Permission results can be cached for ~5 minutes per user/resource/action/school combination
- `schoolId` is optional in the request; if omitted, checks against global permissions only

### Enums

| Enum | Values |
|------|--------|
| **School Role** | `Principal`, `VicePrincipal`, `Teacher`, `Accountant`, `Staff`, `Counselor`, `Nurse`, `Student`, `Parent` |
| **Permission Action** | `view`, `create`, `edit`, `delete`, `manage`, `approve`, `send`, `export` |
| **Permission Effect** | `allow`, `deny` |

**Zod schemas:** `assignRoleSchema`, `updateRoleSchema`, `checkPermissionSchema`, `deactivateRoleSchema` from `@edforge/shared-types`

---

## 10. User Management (CRUD)

### Create User

```
POST /users
```

**Request:**
```json
{
  "email": "newuser@school.edu",
  "firstName": "Jane",
  "lastName": "Smith",
  "middleName": "A",
  "phone": "+15551234567",
  "globalRole": "StandardUser",
  "temporaryPassword": "TempP@ss123"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `email` | required, valid email, **unique per tenant** (409 on duplicate) |
| `firstName` | 2-50 chars |
| `lastName` | 2-50 chars |
| `middleName` | max 50 chars |
| `phone` | max 30 chars |
| `globalRole` | defaults to `StandardUser` |
| `temporaryPassword` | min 8 chars, must meet Cognito password policy |

**Business Rules:**
- Creates the user in both AWS Cognito and DynamoDB
- `temporaryPassword` is optional; if omitted, Cognito generates one and sends it via email
- New users start with `active` status

**Zod schema:** `createUserSchema` from `@edforge/shared-types`

### List Users

```
GET /users?limit=50&cursor=<base64-cursor>
```

Returns paginated list. See [Pagination](#appendix-a-pagination).

### Get User

```
GET /users/:id
```

### Update User

```
PATCH /users/:id
```

Same as "Update User Profile" in Section 1.

### Delete User (Soft Delete)

```
DELETE /users/:id
```

Returns 204 No Content. The record is soft-deleted (status set to `inactive`). Subsequent GET by ID returns 404.

---

## 11. Sessions

### List Current User Sessions

```
GET /sessions
```

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "uuid",
      "userId": "uuid",
      "status": "active",
      "createdAt": "...",
      "expiresAt": "...",
      "deviceInfo": {
        "deviceType": "desktop",
        "os": "macOS",
        "browser": "Chrome"
      },
      "ipAddress": "192.168.1.1",
      "lastActiveAt": "..."
    }
  ],
  "total": 1
}
```

### Get Session

```
GET /sessions/:id
```

### Revoke Session

```
DELETE /sessions/:id
```

Returns 204 No Content.

### Revoke All Sessions

```
POST /sessions/revoke-all
```

**Request:**
```json
{
  "exceptCurrentSession": "current-session-id",
  "reason": "Security precaution"
}
```

### Admin: List User Sessions

```
GET /sessions/user/:userId
```

### Admin: Revoke All User Sessions

```
POST /sessions/user/:userId/revoke-all
```

**Enums:**
- **Session Status:** `active | expired | revoked`

---

## 12. Danger Zone

### Delete User Account

```
DELETE /users/:id
```

Soft-deletes the user. See User Management section.

### Admin: Revoke All User Sessions

```
POST /sessions/user/:userId/revoke-all
```

Force-logout a user from all devices.

### Not Yet Implemented

- Account data export
- Full account deletion (hard delete from Cognito + DynamoDB)
- Tenant deletion
- Bulk user deactivation

---

## Appendix A: Pagination

All list endpoints use cursor-based pagination.

**Request:**
```
GET /endpoint?limit=20&cursor=<base64-cursor>
```

**Response shape:**
```json
{
  "items": [],
  "lastEvaluatedKey": "eyJ0ZW5hbnRJZCI6Ii4uLiJ9",
  "hasMore": true
}
```

- Pass `lastEvaluatedKey` as the `cursor` query parameter for the next page
- When `hasMore` is `false` and `lastEvaluatedKey` is absent, you've reached the last page
- The cursor is opaque; do not parse or construct it client-side

---

## Appendix B: Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": "Validation failed",
  "timestamp": "2026-01-29T17:46:22.674Z",
  "requestId": "uuid",
  "path": "/schools"
}
```

| Status | When | Action |
|--------|------|--------|
| 400 | Zod validation failure | Show `message` directly |
| 401 | Expired/missing JWT | Refresh token, then redirect to login |
| 403 | Insufficient permissions | "You do not have permission" |
| 404 | Resource not found | "Not found" |
| 409 | Duplicate (email, school code, role assignment) | Show `message` (e.g., "School code already exists") |
| 500 | Server error | "An unexpected error occurred" + include `requestId` for support |

---

## Appendix C: Shared Types Reference

Settings-relevant exports from `@edforge/shared-types`:

| Category | Schemas |
|----------|---------|
| **User** | `createUserSchema`, `updateUserSchema`, `userResponseSchema`, `currentUserProfileSchema` |
| **Preferences** | `updatePreferencesSchema`, `userPreferencesResponseSchema`, `themeSchema`, `timeFormatSchema`, `weekStartSchema`, `digestFrequencySchema` |
| **Security** | `changePasswordSchema`, `mfaVerifySchema`, `mfaDisableSchema`, `securityOverviewSchema`, `loginHistoryResponseSchema`, `passwordSchema`, `COGNITO_PASSWORD_REQUIREMENTS` |
| **Sessions** | `sessionResponseSchema`, `sessionListResponseSchema`, `revokeAllSessionsSchema` |
| **School** | `createSchoolSchema`, `updateSchoolSchema`, `schoolResponseSchema`, `schoolTypeSchema`, `schoolStatusSchema`, `academicCalendarTypeSchema` |
| **School Config** | `updateSchoolConfigSchema`, `schoolConfigResponseSchema`, `schoolGradingScaleSchema`, `schoolFeaturesSchema`, `gradeLevelConfigSchema` |
| **Departments** | `createDepartmentSchema`, `updateDepartmentSchema`, `departmentResponseSchema` |
| **Roles** | `assignRoleSchema`, `updateRoleSchema`, `checkPermissionSchema`, `deactivateRoleSchema`, `abacSchoolRoleSchema`, `permissionActionSchema`, `permissionEffectSchema` |
| **Tenant** | `updateTenantSchema`, `tenantResponseSchema`, `tenantBrandingSchema`, `tenantTierSchema`, `tenantStatusSchema` |
| **Validators** | `isValidPassword()`, `validatePassword()`, `COGNITO_PASSWORD_REQUIREMENTS` |
