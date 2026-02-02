# EdForge Shared Types: Frontend Integration Guide

## Core Principles

- **Single Source of Truth**: All data validation and TypeScript types are defined once in `@edforge/shared-types`
- **Zod Schema-First**: Runtime validation ensures data integrity across frontend and backend
- **Ed-Fi Compliance**: Schemas align with Ed-Fi standards for scalable EMIS data management
- **Type Safety**: TypeScript types auto-inferred from Zod schemas (`z.infer<typeof schema>`)
- **Multi-Tenant**: Built-in tenant isolation and cross-tenant operation patterns

## Import Patterns

```typescript
// For form validation and data submission
import { createUserSchema, updateStudentSchema } from '@edforge/shared-types';

// For type-safe interfaces and API responses
import type { CreateUserDto, StudentResponseDto, UserListResponseDto } from '@edforge/shared-types';

// For validation utilities
import { isValidPassword, validatePassword } from '@edforge/shared-types';
```

## Form Validation Patterns

### Basic Form Validation Setup

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createUserSchema, type CreateUserDto } from '@edforge/shared-types';

function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
    mode: 'onBlur', // Validate on field blur for better UX
  });

  const onSubmit = async (data: CreateUserDto) => {
    try {
      // API call with validated data
      await createUser(data);
    } catch (error) {
      // Handle API validation errors
      if (error.field) {
        setError(error.field, { message: error.message });
      }
    }
  };
}
```

### Partial Updates for Edit Forms

```typescript
import { updateStudentSchema, type UpdateStudentDto } from '@edforge/shared-types';

// For updates, use partial schemas that make all fields optional
const {
  register,
  handleSubmit,
} = useForm<UpdateStudentDto>({
  resolver: zodResolver(updateStudentSchema),
  defaultValues: existingStudent, // Pre-populate with current data
});
```

### Client-Side Validation Before API Calls

```typescript
import { createStudentSchema } from '@edforge/shared-types';

function validateAndSubmit(formData: unknown) {
  const result = createStudentSchema.safeParse(formData);

  if (!result.success) {
    // Transform Zod errors to user-friendly messages
    const fieldErrors = result.error.flatten().fieldErrors;
    setFormErrors(fieldErrors);
    return false;
  }

  // Data is valid, proceed with API call
  submitToAPI(result.data);
  return true;
}
```

## CRUD Operation Patterns

### Create Operations

```typescript
import type { CreateUserDto, UserResponseDto } from '@edforge/shared-types';

async function createUser(userData: CreateUserDto): Promise<UserResponseDto> {
  // Validate before sending (optional - backend will validate too)
  const validatedData = createUserSchema.parse(userData);

  const response = await api.post('/users', validatedData);
  return userResponseSchema.parse(response.data); // Type-safe response
}
```

### Read Operations

```typescript
import type { UserResponseDto, UserListResponseDto } from '@edforge/shared-types';

async function getUser(userId: string): Promise<UserResponseDto> {
  const response = await api.get(`/users/${userId}`);
  return userResponseSchema.parse(response.data);
}

async function listUsers(params?: { limit?: number; cursor?: string }): Promise<UserListResponseDto> {
  const response = await api.get('/users', { params });
  return userListResponseSchema.parse(response.data);
}
```

### Update Operations

```typescript
import type { UpdateUserDto, UserResponseDto } from '@edforge/shared-types';

async function updateUser(userId: string, updates: UpdateUserDto): Promise<UserResponseDto> {
  // Only send changed fields
  const validatedUpdates = updateUserSchema.parse(updates);

  const response = await api.patch(`/users/${userId}`, validatedUpdates);
  return userResponseSchema.parse(response.data);
}
```

### Delete Operations

```typescript
async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
  // Handle optimistic UI updates
}
```

## Complex Form Patterns

### Array Fields (Guardians, Emergency Contacts)

```typescript
import { useFieldArray } from 'react-hook-form';
import type { CreateStudentDto } from '@edforge/shared-types';

function StudentForm() {
  const { control, register } = useForm<CreateStudentDto>({
    resolver: zodResolver(createStudentSchema),
  });

  // For dynamic arrays like guardians
  const { fields: guardianFields, append, remove } = useFieldArray({
    control,
    name: 'guardians',
  });

  // Maximum 10 guardians as per schema validation
  const addGuardian = () => {
    if (guardianFields.length < 10) {
      append({ relationship: 'mother', firstName: '', lastName: '' });
    }
  };
}
```

### Conditional Fields

```typescript
import { useWatch } from 'react-hook-form';

function StudentForm() {
  const { register, control } = useForm<CreateStudentDto>({
    resolver: zodResolver(createStudentSchema),
  });

  // Watch for changes to show/hide conditional fields
  const hasIEP = useWatch({ control, name: 'medicalInfo.hasIEP' });

  return (
    <form>
      {/* IEP field affects visibility of related fields */}
      <input {...register('medicalInfo.hasIEP')} type="checkbox" />

      {hasIEP && (
        <textarea {...register('medicalInfo.notes')} placeholder="IEP Notes" />
      )}
    </form>
  );
}
```

## Validation Utilities Usage

### Password Validation

```typescript
import { validatePassword, COGNITO_PASSWORD_REQUIREMENTS } from '@edforge/shared-types';

function PasswordField() {
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const result = validatePassword(value);
    setErrors(result.errors);
  };

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
        minLength={COGNITO_PASSWORD_REQUIREMENTS.minLength}
        maxLength={COGNITO_PASSWORD_REQUIREMENTS.maxLength}
      />
      {errors.map((error, index) => (
        <div key={index} className="error">{error}</div>
      ))}
    </div>
  );
}
```

### Grade Level and Academic Year Validation

```typescript
import { isValidGradeLevel, normalizeGradeLevel, parseAcademicYear } from '@edforge/shared-types';

function GradeSelector() {
  const handleGradeChange = (grade: string) => {
    const normalized = normalizeGradeLevel(grade); // "Grade 9" -> "9"
    if (!isValidGradeLevel(normalized)) {
      setError('Invalid grade level');
      return;
    }
    setGrade(normalized);
  };
}

function AcademicYearSelector() {
  const { startYear, endYear } = parseAcademicYear('2023-2024');
  // Use parsed values for date calculations
}
```

## Error Handling Patterns

### API Response Validation

```typescript
import { z } from 'zod';

async function apiCall(endpoint: string, data: unknown) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API Error');
    }

    const responseData = await response.json();
    return responseData; // Will be validated by calling code

  } catch (error) {
    // Handle network errors, validation errors, etc.
    console.error('API call failed:', error);
    throw error;
  }
}
```

### Form-Level Error Handling

```typescript
function handleApiErrors(error: any, setError: (field: string, message: string) => void) {
  if (error.statusCode === 400 && error.field) {
    // Field-specific validation error from backend
    setError(error.field, { message: error.message });
  } else if (error.statusCode === 422) {
    // Zod validation error from backend
    error.errors.forEach((err: any) => {
      setError(err.field, { message: err.message });
    });
  } else {
    // Generic error
    setError('root', { message: 'An unexpected error occurred' });
  }
}
```

## Best Practices for Frontend Development

### 1. Always Use Type-Safe DTOs

```typescript
// ✅ Good - Type-safe from shared-types
import type { CreateUserDto } from '@edforge/shared-types';

function createUser(data: CreateUserDto) {
  // TypeScript ensures all required fields are present
}

// ❌ Bad - Manual interface definition
interface CreateUser {
  email: string;
  firstName: string;
  // Will drift from backend schema over time
}
```

### 2. Validate Data at Boundaries

```typescript
// ✅ Validate at API boundaries
async function submitForm(formData: unknown) {
  const validatedData = createUserSchema.safeParse(formData);
  if (!validatedData.success) {
    // Handle validation errors in UI
    return;
  }
  await api.createUser(validatedData.data);
}

// ✅ Validate API responses
async function fetchUser(userId: string) {
  const response = await api.getUser(userId);
  const validatedUser = userResponseSchema.parse(response);
  return validatedUser; // Now type-safe
}
```

### 3. Handle Optional vs Required Fields Correctly

```typescript
import type { UpdateStudentDto } from '@edforge/shared-types';

function updateStudent(studentId: string, updates: UpdateStudentDto) {
  // All fields in UpdateStudentDto are optional
  // Send only changed fields to minimize payload
  const changedFields = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  return api.patch(`/students/${studentId}`, changedFields);
}
```

### 4. Use Schema Defaults Wisely

```typescript
// Schemas have sensible defaults built-in
const userData = createUserSchema.parse({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  // globalRole will default to 'StandardUser'
  // temporaryPassword can be omitted
});
```

### 5. Handle Array Constraints

```typescript
import type { CreateStudentDto } from '@edforge/shared-types';

function addGuardian(studentData: CreateStudentDto, newGuardian: Guardian) {
  // Schema enforces max 10 guardians
  if (studentData.guardians && studentData.guardians.length >= 10) {
    throw new Error('Maximum 10 guardians allowed');
  }

  // Safe to add guardian - schema validation will catch issues
  studentData.guardians = [...(studentData.guardians || []), newGuardian];
}
```

## Common Pitfalls to Avoid

### 1. Manual Type Definitions

```typescript
// ❌ Don't redefine types manually
interface User {
  userId: string;
  email: string;
  firstName: string;
  // This will become stale as schema evolves
}

// ✅ Use shared types
import type { UserResponseDto } from '@edforge/shared-types';
```

### 2. Skipping Validation

```typescript
// ❌ Don't skip validation
async function createUser(data: any) {
  return api.post('/users', data); // No validation!
}

// ✅ Always validate
async function createUser(data: unknown) {
  const validated = createUserSchema.parse(data);
  return api.post('/users', validated);
}
```

### 3. Ignoring Optional Fields

```typescript
// ❌ Undefined values cause API issues
const updateData = {
  firstName: 'John',
  middleName: undefined, // This gets sent as null/undefined
};

// ✅ Filter out undefined values
const updateData = {
  firstName: 'John',
  // middleName omitted entirely
};
```

### 4. Not Handling Schema Evolution

```typescript
// ✅ Use schema.parse() for runtime safety
const response = await api.getUser(userId);
const user = userResponseSchema.parse(response.data);
// Zod will catch if backend added/removed fields
```

## Performance Considerations

### 1. Lazy Import Validation Schemas

```typescript
// For large forms, lazy import schemas
const StudentForm = lazy(() => import('./StudentForm'));

// Inside StudentForm component
import { createStudentSchema } from '@edforge/shared-types';
```

### 2. Debounce Validation for Large Forms

```typescript
import { useDebounce } from 'use-debounce';

function StudentForm() {
  const [formData, setFormData] = useState<CreateStudentDto>({});
  const debouncedData = useDebounce(formData, 300); // 300ms delay

  // Validate only after user stops typing
  useEffect(() => {
    const result = createStudentSchema.safeParse(debouncedData);
    setErrors(result.success ? {} : result.error.flatten().fieldErrors);
  }, [debouncedData]);
}
```

### 3. Optimize Re-renders

```typescript
// Use React.memo for form field components
const TextField = React.memo(({ register, name, error }: TextFieldProps) => (
  <input {...register(name)} className={error ? 'error' : ''} />
));
```

## Multi-Tenant Considerations

### Tenant Context in API Calls

```typescript
// All API calls include tenant context
const api = {
  async getUsers() {
    const tenantId = getCurrentTenantId();
    return this.get('/users', {
      headers: { 'X-Tenant-Id': tenantId }
    });
  }
};
```

### Cross-Tenant Data Handling

```typescript
// Validate tenant permissions before cross-tenant operations
async function transferStudent(studentId: string, newSchoolId: string) {
  // Ensure user has permission for both schools' tenants
  const hasPermission = await checkCrossTenantPermission(newSchoolId);
  if (!hasPermission) {
    throw new Error('Insufficient permissions for cross-tenant operation');
  }

  const transferData = transferStudentSchema.parse({
    newSchoolId,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  return api.post(`/students/${studentId}/transfer`, transferData);
}
```

This guide provides essential patterns and practices for frontend engineers working with EdForge's shared-types package. Always reference the actual schemas in `@edforge/shared-types` for the latest field definitions and validation rules.