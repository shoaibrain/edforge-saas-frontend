# Backend Fix: PATCH /users/{id}/preferences Returns 403 Forbidden

## Issue Summary

**Endpoint**: `PATCH /users/{id}/preferences`  
**Status**: `403 Forbidden`  
**Priority**: P0 - Blocks user preference updates in Settings module  
**Environment**: Production API Gateway (`f3xlvrqt24.execute-api.us-east-1.amazonaws.com/prod`)

## Current Behavior

- ✅ `GET /users/{id}/preferences` → **200 OK** (works correctly)
- ❌ `PATCH /users/{id}/preferences` → **403 Forbidden** (authorization denied)

## Evidence

**Request Details:**
- **Method**: `PATCH`
- **URL**: `/users/34e824c8-00f1-704c-b091-49822a2ee82f/preferences`
- **Headers**: 
  - `Authorization: Bearer <valid-jwt-token>` ✅
  - `X-Tenant-Id: 6c24289d-2c03-4612-93b2-3a21a6785bcc` ✅
  - `X-Correlation-Id: <uuid>` ✅
  - `Content-Type: application/json` ✅
- **Body**: Valid JSON with flattened notification structure (matches backend DTO)

**Response:**
```json
{
  "statusCode": 403,
  "errorCode": "FORBIDDEN",
  "message": "Access denied"
}
```

## Root Cause Hypothesis

The authorization/ABAC policy for `PATCH /users/{id}/preferences` is either:
1. **Missing** - No policy defined for this endpoint
2. **Too restrictive** - Policy doesn't allow users to update their own preferences
3. **Incorrect resource matching** - Policy doesn't match the `/users/{id}/preferences` path pattern

## Expected Behavior

A user should be able to update their own preferences:
- User with ID `34e824c8-00f1-704c-b091-49822a2ee82f` should be able to `PATCH /users/34e824c8-00f1-704c-b091-49822a2ee82f/preferences`
- TenantAdmin role should have permission to update any user's preferences within their tenant

## Request DTO Format

Frontend sends flattened structure (matches backend expectation):

```typescript
{
  theme?: 'light' | 'dark' | 'system',
  language?: string,
  timezone?: string,
  dateFormat?: string,
  timeFormat?: '12h' | '24h',
  weekStartsOn?: 'sunday' | 'monday',
  notifications?: {
    email?: boolean,
    push?: boolean,
    sms?: boolean,
    digest?: 'immediate' | 'daily' | 'weekly' | 'never'
  },
  defaultSchoolId?: string
}
```

## Action Required

1. **Review ABAC/Authorization Policy** for `PATCH /users/{id}/preferences` endpoint
2. **Verify Policy Rules**:
   - User can update their own preferences (`userId === authenticatedUserId`)
   - TenantAdmin can update any user's preferences within their tenant
   - Policy correctly matches path pattern `/users/{id}/preferences`
3. **Test After Fix**:
   ```bash
   # As authenticated user updating own preferences
   PATCH /users/{userId}/preferences → 200 OK
   
   # As TenantAdmin updating another user's preferences
   PATCH /users/{otherUserId}/preferences → 200 OK
   ```

## Related Endpoints Status

- ✅ `GET /users/{id}/preferences` - Works (200 OK)
- ❌ `PATCH /users/{id}/preferences` - **Needs fix** (403 Forbidden)
- ✅ `PATCH /users/{id}` - Works (200 OK) - User profile updates work

## Notes

- Frontend CORS proxy is working correctly - requests reach backend with proper headers
- GET endpoint works, indicating the resource exists and is accessible
- Issue is specifically with PATCH authorization, not authentication or CORS

---

**Priority**: P0 - Blocks MVP Settings module functionality  
**Assigned To**: Backend Identity Service Team  
**Reference**: See `BACKEND_API_ISSUES_REPORT.md` Issue #8 (to be added)
