# Shree Saraswati — Curriculum data completion checklist

**School:** Shree Saraswati Eng. Boa. Sec. School (`schoolId 61a247a4-44d6-4fc0-a414-062fd4d7e694`)
**Scope:** Academics → Curriculum (`/academics/curriculum`)
**Source of truth:** the school's official "Syllabus of 2083 / Book List" vs. the live course catalog
(full Export CSV, 55 courses).

---

## 1. Status — mapping is COMPLETE

All grades **1–10** are fully mapped against the syllabus (55 courses across the five grade bands
1–3, 4–5, 6–7, 8, 9–10). **Nothing remains to create.**

| Band | Syllabus subjects | Mapped |
|---|---|---|
| 1–3 | 12 (incl. Serofero, Translation) | ✅ 12/12 |
| 4–5 | 12 (incl. Samajik, Translation) | ✅ 12/12 |
| 6–7 | 12 (incl. Essay, Health, Opt. Maths) | ✅ 12/12 |
| 8 | 10 | ✅ 10/10 |
| 9–10 | 9 | ✅ 9/9 |

**Pre-primary (PG / Nursery / LKG / UKG): intentionally excluded.** The syllabus delivers these as
kits ("All in One", "Jhola set"), not per-subject courses, so they are not mapped as courses. This is
a deliberate decision, not a gap.

---

## 2. What's left — data-quality corrections

These are operator edits in the app (the catalog content is complete; a few records need cleanup).
The course list and the edit form now **flag** the records that need attention.

| Course | Issue | Fix | Code change? |
|---|---|---|---|
| `MAT-0` (Grade 8 Compulsory Maths) | Course code is a truncated `MAT-08` | Deactivate `MAT-0`, then **Add course** to recreate it (the form now suggests `MAT-8`). Course codes are immutable, so it can't be edited in place. | New code (immutable) |
| `SER-123` (Our Surroundings / Serofero) | Subject shows **Physical Education** (wrong) | **Edit** → set **Academic Subject = Social Studies**. The Ed-Fi subject rollup re-derives to `social_studies` on save. | No |
| `OP2-0910` (Optional II — Computer Science) | **Type = Required** (should be elective) | **Edit** → Course Type = **Elective**. | No |
| `OPM-067` (Optional Mathematics, 6–7) | **Type = Required** (should be elective) | **Edit** → Course Type = **Elective**. | No |
| Courses missing a granular **Academic Subject** | Subject column shows a `⚠`; report cards fall back to the coarse rollup | **Edit** → set Academic Subject (see the limitation in §4 for companion subjects). | No |

> While editing `OP2-0910` / `OPM-067` (which also lack a granular subject), set
> Academic Subject too: `optional_computer_science` and `optional_mathematics` respectively — both
> keep the existing rollup and clear the `⚠`.

---

## 3. How to apply the fixes

**Edit an attribute (Subject, Course Type, Credit Type, etc.)**
1. `/academics/curriculum` → Courses tab.
2. Find the course (use **search** or the **grade-level filter**), open its row menu → **Edit Course**.
3. In edit mode every field is editable **except the Course Code** (immutable by design). A missing
   Academic Subject is flagged with an amber warning banner + a `⚠` on the field.
4. Set the correct value(s) → **Save Changes**.

**Recreate a course with a bad code (`MAT-0`)**
1. Open `MAT-0` → row menu → **Deactivate** (soft delete; it drops out of the active list).
2. **Add course** → pick Academic Subject = *Mathematics* and Grade Levels = *Grade 8*. The
   **Course Code** auto-fills as `MAT-8` (editable if you prefer a different convention).
3. Re-enter the rest (name, credits, description, materials) → **Create Course**.

**Verify**
- Use the **grade-level filter** (e.g. *Grade 8*) to confirm the band's courses.
- Click **Export CSV** to pull the full catalog (all pages) and re-check the Subject / Type columns.

---

## 4. Known limitation — companion subjects have no granular Academic Subject

Several companion subjects in this syllabus have **no matching `AcademicSubjectDescriptor`** in the
platform today: **Translation, Cursive Writing, English Essay, Moral Science, General Knowledge,
Our Surroundings (Serofero)**. The only catch-all is `local_subject` (which rolls up to *Other*),
which would *downgrade* the ELA companions (Cursive, Essay) from *English Language Arts*.

So for these, either keep the closest existing descriptor that preserves the right rollup
(e.g. Cursive / Essay → *English*; Serofero → *Social Studies*) or leave the granular subject unset
until the platform adds proper descriptors. This is tracked as a backend follow-up (extend
`AcademicSubjectDescriptor` for PABSON companion subjects) — see the linked issue in `shoaibrain/edforge`.

---

*Generated as part of the curriculum MFE hardening epic (PR #190). The new course-code generation,
grade-level filter, sorted grade chips, Export CSV, and in-form data-gap flags directly support
completing and maintaining this data.*
