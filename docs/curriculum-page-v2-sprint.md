# Curriculum Page V2 — Sprint Plan

## Sprint 1: Utilities (Foundation)

### Task 1.1: `course-type.ts`
- **Type:** util
- **Path:** `apps/academics/src/utils/course-type.ts`
- **Acceptance:** `formatCourseType()` normalizes null, empty, standard, required, AP, honors, dual_enrollment, vocational, elective, and unknown values to `{ label, style }` pairs.
- **Validation:** Unit tests in `course-type.test.ts` pass.

### Task 1.2: `subject-colors.ts`
- **Type:** util
- **Path:** `apps/academics/src/utils/subject-colors.ts`
- **Acceptance:** `getSubjectChipStyle()` returns `{ bg, text }` with inline rgba/CSS-var values for math, science, ELA, social studies, arts, vocational, PE, and fallback.
- **Validation:** Unit tests cover all branches.

### Task 1.3: Verify `formatGradeLabel`
- **Type:** verification
- **Path:** `packages/types/src/academics-utils.ts`
- **Acceptance:** Confirm `formatGradeLabel` handles PK, K, 1–12, and unknown grades.
- **Validation:** Existing tests pass; no changes needed.

**Demo:** `npm run test -- course-type` passes; `npm run build` succeeds.

---

## Sprint 2: Column Fixes (Visual Bug Fix)

### Task 2.1: `CourseTypeChip.tsx`
- **Type:** component
- **Path:** `apps/academics/src/components/curriculum/CourseTypeChip.tsx`
- **Acceptance:** Renders colored chip via `formatCourseType`. Style map: standard (subtle), honors (amber), ap (red), dual (blue), vocational (amber), elective (purple).
- **Validation:** No blank white boxes in Type column with any courseType value.

### Task 2.2: `SubjectChip.tsx`
- **Type:** component
- **Path:** `apps/academics/src/components/curriculum/SubjectChip.tsx`
- **Acceptance:** Renders colored chip using `getSubjectChipStyle` + `getSubjectAreaLabel`. Inline styles for dark/light compat.
- **Validation:** All subject area values render with correct colors.

### Task 2.3: Code column chip
- **Type:** style
- **Path:** `CourseTable.tsx` Code column cell renderer
- **Acceptance:** Monospace font, 10px, rgba background/border, letter-spacing 0.3px.
- **Validation:** Visual match to HTML prototype code chips.

### Task 2.4: Grade chips V2
- **Type:** style
- **Path:** `CourseTable.tsx` Grades column cell renderer
- **Acceptance:** 10px chips, "+N more" overflow at >4 grades, subtle background.
- **Validation:** Grade arrays with 0, 1, 4, 5+ entries render correctly.

### Task 2.5: Credits annotation
- **Type:** fix
- **Path:** `CourseTable.tsx` Credits column cell renderer
- **Acceptance:** Superscript badge (AP/DE/H) based on `formatCourseType` style.
- **Validation:** AP courses show red "AP" super, dual shows blue "DE", honors shows amber "H".

**Demo:** Courses tab shows zero blank Type cells, all subject chips colored, code chips monospaced.

---

## Sprint 3: Page Chrome (Header + KPI + Tabs)

### Task 3.1: V2 page header
- **Type:** component
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** 32px purple icon, "Curriculum" at 18px/600, pipe separator, date, "Import courses" secondary + "Add course" primary green buttons at 36px height.
- **Validation:** Pixel-consistent with Academics Overview header pattern.

### Task 3.2: Context banner
- **Type:** style
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** Single text line with key counts in `--color-info` blue.
- **Validation:** Counts update dynamically from course data.

### Task 3.3: KPI tiles (StatCard from @edforge/ui)
- **Type:** component
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** 4-column grid using `StatCard` with V2 accent bars, count-up animation, loading skeleton.
- **Validation:** All four tiles render with correct accent colors and tags.

### Task 3.4: Tab bar V2
- **Type:** style
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** Active tab: 2px bottom border #7F77DD, font-weight 500. Inactive: transparent border. 12px SVG icons. Courses tab shows count badge.
- **Validation:** Tab switching works with AnimatePresence.

### Task 3.5: Filter strip integration
- **Type:** component
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** CourseFilters renders below tab bar (Courses tab only).
- **Validation:** Search, dropdowns, status chips, and Export CSV function.

**Demo:** Full page header matches Academics Overview screenshot.

---

## Sprint 4: Tab Content

### Task 4.1: GradeLevelsTab
- **Type:** component
- **Path:** `components/curriculum/GradeLevelsTab.tsx`
- **Acceptance:** Existing implementation retained (uses TanStack DataTable with grade-course mapping).
- **Validation:** Grade levels display with course counts and drawer.

### Task 4.2: StandardsTab
- **Type:** component
- **Path:** `routes/curriculum/index.tsx` (inline)
- **Acceptance:** Centered empty state with shield icon (48px, purple), "Standards alignment" heading, import button shows toast.
- **Validation:** Toast fires on click, no navigation or modal.

**Demo:** Grade Levels tab renders from course data, Standards tab shows purposeful empty state.

---

## Sprint 5: Polish & Responsive

### Task 5.1: Light theme verification
- **Type:** style
- **Path:** All V2 components
- **Acceptance:** Code chip uses `rgba(0,0,0,0.04)` background in light theme. All inline styles use CSS variables with fallbacks.
- **Validation:** Toggle theme and verify all chips/tiles.

### Task 5.2: Responsive breakpoints
- **Type:** style
- **Path:** `routes/curriculum/index.tsx`
- **Acceptance:** KPI tiles: 2-col at 1024px, 1-col at 768px. Filter strip stacks at 768px.
- **Validation:** Resize viewport to verify breakpoints.

### Task 5.3: Reduced motion
- **Type:** a11y
- **Path:** AnimatePresence usage
- **Acceptance:** `prefers-reduced-motion` disables tab/tile animations.
- **Validation:** Enable OS reduced motion setting and verify.

**Demo:** Full page works across dark/light themes and responsive breakpoints.
