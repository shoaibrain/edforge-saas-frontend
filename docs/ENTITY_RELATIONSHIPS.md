# Academics Service - Entity Relationships

Database schema, entity relationships, and access patterns for the Academics microservice.

---

## Architecture Overview

The Academics service uses **DynamoDB Single-Table Design** for high performance and scalability.

```
Table: edforge-academics-{tier}

Primary Key:
  PK: tenantId       (TENANT#{tid})
  SK: entityKey      (varies by entity type)

Global Secondary Indexes:
  GSI1: School-scoped queries
  GSI2: Student-centric queries
  GSI3: Date-based attendance queries
```

---

## Entity Types

| Entity | SK Pattern | Description |
|--------|------------|-------------|
| STUDENT | `STUDENT#{studentId}` | Student demographics & status |
| ENROLLMENT | `ENROLLMENT#{schoolId}#{yearId}#{studentId}` | Annual enrollment records |
| ATTENDANCE | `ATTENDANCE#{date}#{studentId}` | Daily attendance records |
| COURSE | `COURSE#{schoolId}#{courseId}` | Course catalog entries |
| SECTION | `SECTION#{schoolId}#{sectionId}` | Class sections |
| SEC_ENROLL | `SEC_ENROLL#{sectionId}#{studentId}` | Section enrollments |
| GRADE | `GRADE#{studentId}#{courseId}#{termId}` | Student grades |
| GRADEPOLICY | `GRADEPOLICY#{schoolId}#{policyId}` | Grading policies |
| SCHEDULE | `SCHEDULE#{schoolId}#{scheduleId}` | Schedule entries |
| CLASSROOM | `CLASSROOM#{schoolId}#{roomId}` | Physical rooms |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TENANT CONTEXT                                   │
│                        (All entities scoped by tenantId)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SCHOOL                                         │
│                         (From Identity Service)                              │
│  schoolId, schoolCode, name, academicYears[]                                │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   STUDENT    │    │   COURSE     │    │   GRADE      │    │  CLASSROOM   │
│              │    │              │    │   POLICY     │    │              │
│ studentId    │    │ courseId     │    │              │    │ roomId       │
│ firstName    │    │ courseCode   │    │ policyId     │    │ roomNumber   │
│ lastName     │    │ courseName   │    │ gradingScale │    │ capacity     │
│ gradeLevel   │    │ subjectArea  │    │ categoryWeights│  │ building     │
│ status       │    │ credits      │    │ roundingRule │    │              │
│ guardians[]  │    │ creditType   │    │ isDefault    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │                    │
        │                    ▼
        │           ┌──────────────┐
        │           │   SECTION    │
        │           │              │
        │           │ sectionId    │
        │           │ courseId ────┼───── (references Course)
        │           │ teacherId    │
        │           │ maxEnrollment│
        │           │ currentEnrollment│
        │           └──────────────┘
        │                    │
        │                    │
        ├────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  ENROLLMENT  │    │ SEC_ENROLL   │    │    GRADE     │
│  (Annual)    │    │(Section)     │    │              │
│              │    │              │    │ gradeId      │
│ enrollmentId │    │ studentId    │    │ studentId ───┼── (references Student)
│ studentId ───┼──  │ sectionId    │    │ courseId ────┼── (references Course)
│ academicYearId│   │ enrolledAt   │    │ termId       │
│ gradeLevel   │    │              │    │ assignments[]│
│ status       │    └──────────────┘    │ numericGrade │
└──────────────┘                        │ letterGrade  │
        │                               │ isFinal      │
        │                               └──────────────┘
        ▼
┌──────────────┐
│  ATTENDANCE  │
│              │
│ studentId ───┼── (references Student)
│ schoolId     │
│ date         │
│ status       │
│ periodId     │
└──────────────┘
```

---

## GSI Access Patterns

### GSI1: School-Scoped Queries

```
GSI1PK: TENANT#{tenantId}#SCHOOL#{schoolId}
GSI1SK: {ENTITY_TYPE}#{sortValue}
```

| Query | GSI1PK | GSI1SK | Use Case |
|-------|--------|--------|----------|
| Students by school | `TENANT#X#SCHOOL#Y` | `begins_with STUDENT#` | Student directory |
| Courses by school | `TENANT#X#SCHOOL#Y` | `begins_with COURSE#` | Course catalog |
| Sections by school | `TENANT#X#SCHOOL#Y` | `begins_with SECTION#` | Section list |
| Grading policies | `TENANT#X#SCHOOL#Y` | `begins_with GRADEPOLICY#` | Policy list |
| Grades by school | `TENANT#X#SCHOOL#Y` | `begins_with GRADE#` | Gradebook |

**Sort Value Patterns:**
- Students: `STUDENT#{LASTNAME}#{FIRSTNAME}` - Alphabetical listing
- Courses: `COURSE#{subjectArea}#{COURSENAME}` - Subject grouping
- Sections: `SECTION#{courseId}#{sectionNumber}` - Course grouping
- Grades: `GRADE#{courseId}#{termId}` - Course/term grouping

### GSI2: Student-Centric Queries

```
GSI2PK: {studentId}
GSI2SK: {ENTITY_TYPE}#{date/yearId}
```

| Query | GSI2PK | GSI2SK | Use Case |
|-------|--------|--------|----------|
| Student enrollments | `{studentId}` | `begins_with ENROLLMENT#` | Enrollment history |
| Student grades | `{studentId}` | `begins_with GRADE#{yearId}` | Report card |
| Student attendance | `{studentId}` | `begins_with ATTENDANCE#` | Attendance history |
| Student sections | `{studentId}` | `begins_with SEC_ENROLL#` | Student schedule |

### GSI3: Date-Based Attendance

```
GSI3PK: TENANT#{tenantId}#SCHOOL#{schoolId}#DATE#{date}
GSI3SK: ATTENDANCE#{studentId}
```

| Query | Use Case |
|-------|----------|
| All attendance for a date | Daily attendance list |
| Attendance summary by date | Dashboard stats |

---

## Key Relationships

### Student → Enrollment (1:Many)

Each student can have multiple enrollments (one per academic year).

```typescript
// Find student's enrollment history
Query:
  GSI2PK = studentId
  GSI2SK begins_with "ENROLLMENT#"
```

### Student → Section Enrollment (Many:Many)

Students are enrolled in multiple sections; sections have multiple students.

```typescript
// Find student's sections
Query:
  GSI2PK = studentId
  GSI2SK begins_with "SEC_ENROLL#"

// Find section roster
Query:
  GSI1PK = TENANT#{tid}#SCHOOL#{sid}
  GSI1SK begins_with "SEC_ENROLL#{sectionId}#"
```

### Course → Section (1:Many)

A course can have multiple sections (different class times/teachers).

```typescript
// Find sections for a course
Query:
  GSI1PK = TENANT#{tid}#SCHOOL#{sid}
  GSI1SK begins_with "SECTION#{courseId}#"
```

### Student + Course + Term → Grade (1:1)

Each student has one grade record per course per term.

```typescript
// Direct lookup
GetItem:
  PK = TENANT#{tid}
  SK = GRADE#{studentId}#{courseId}#{termId}

// All grades for student in a year
Query:
  GSI2PK = studentId
  GSI2SK begins_with "GRADE#{academicYearId}#"
```

### School → Grading Policy (1:Many)

Each school can have multiple grading policies (one default).

```typescript
// Find policies for a school
Query:
  GSI1PK = TENANT#{tid}#SCHOOL#{sid}
  GSI1SK begins_with "GRADEPOLICY#"
```

---

## Data Flow: Grade Calculation

When recording an assignment grade:

```
1. Find existing Grade document
   PK=TENANT#{tid}, SK=GRADE#{studentId}#{courseId}#{termId}

2. If not exists, create new Grade with first assignment

3. If exists, append assignment to assignments[]

4. Get school's default grading policy
   Query GSI1: begins_with "GRADEPOLICY#"
   Filter: isDefault = true

5. Calculate category grades
   - Group assignments by categoryId
   - Apply dropLowestScores rules
   - Calculate category percentages

6. Calculate overall grade
   - Apply category weights
   - Apply rounding rule
   - Map to letter grade + GPA points

7. Update Grade document with calculated values

8. Publish GradeRecorded event
```

---

## Data Flow: Student Profile

Aggregated query for student profile page:

```
1. Get Student entity
   PK=TENANT#{tid}, SK=STUDENT#{studentId}

2. Get enrollment history
   Query GSI2: PK=studentId, SK begins_with "ENROLLMENT#"

3. Get current enrollment (status = 'enrolled')
   Filter from step 2

4. Get attendance summary
   Query GSI2: PK=studentId, SK begins_with "ATTENDANCE#"
   Calculate: present, absent, late, excused counts

5. Combine into StudentProfileResponse
```

---

## Cross-Service Dependencies

```
┌─────────────────┐         ┌─────────────────┐
│    Identity     │ ◄────── │    Academics    │
│    Service      │         │    Service      │
│                 │         │                 │
│ - Schools       │         │ - Students      │
│ - Staff         │         │ - Enrollments   │
│ - Academic Years│         │ - Courses       │
│ - Terms         │         │ - Sections      │
│                 │         │ - Grades        │
│                 │         │ - Attendance    │
└─────────────────┘         └─────────────────┘
        │
        ▼
   Validates:
   - School exists before student creation
   - Staff exists before section teacher assignment
   - Academic year exists before enrollment
```

---

## Tenant Isolation

All operations are tenant-scoped using the Token Vending Machine pattern:

```
1. Request arrives with JWT token

2. Extract tenantId from token claims

3. Call Token Vending Machine for tenant-scoped DynamoDB credentials

4. All DynamoDB operations use:
   - PK prefix: TENANT#{tenantId}
   - GSI1PK prefix: TENANT#{tenantId}#SCHOOL#...
   - GSI3PK prefix: TENANT#{tenantId}#SCHOOL#...

5. AWS IAM policy restricts access to tenant's partition only
```

---

## Optimistic Locking

All entities include a `version` field for optimistic concurrency:

```typescript
// Update with version check
UpdateItem:
  ConditionExpression: version = :currentVersion
  UpdateExpression: SET ... version = version + 1

// If version mismatch → ConditionalCheckFailedException → 409 Conflict
```

---

## Audit Fields

All entities include standard audit fields:

```typescript
interface AuditFields {
  createdAt: string;    // ISO 8601 timestamp
  createdBy: string;    // User ID who created
  updatedAt: string;    // ISO 8601 timestamp
  updatedBy: string;    // User ID who last updated
  version: number;      // Optimistic lock version
}
```
