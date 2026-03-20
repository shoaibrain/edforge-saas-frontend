/**
 * Curriculum Management Module — V2
 *
 * Unified curriculum interface for the Academics domain.
 * - Courses tab: Live data from API with V2 chips, filters, table, and drawer
 * - Grade Levels tab: Collapsible grade sections with enrollment bars
 * - Standards tab: Purposeful empty state with import CTA
 *
 * V2 redesign — matches Academics Overview header pattern.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useResourcePermissions } from '@edforge/abac'
import { StatCard } from '@edforge/ui'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Layers,
  Plus,
  Upload,
  ShieldCheck,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolGradeRange } from '../../hooks/useSchool'
import { useCourseFilters } from '../../stores/courses.store'
import {
  useCourses,
  flattenCoursePages,
  getCourseTotalFromPages,
  useUpdateCourse,
} from '../../hooks/useCourses'
import { CourseTable } from '../../components/curriculum/CourseTable'
import { CourseFilters } from '../../components/curriculum/CourseFilters'
import { CourseDrawer, type DrawerMode } from '../../components/curriculum/CourseDrawer'
import { GradeLevelsTab } from '../../components/curriculum/GradeLevelsTab'
import type { CourseResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type CurriculumTab = 'courses' | 'grade-levels' | 'standards'

// ============================================================================
// TAB SVG ICONS (inline to match prototype exactly)
// ============================================================================

function CoursesIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 2h12v12H2z"
        stroke={active ? '#7F77DD' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 6h6M5 9h4"
        stroke={active ? '#7F77DD' : 'currentColor'}
        strokeWidth="1.4"
      />
    </svg>
  )
}

function GradeLevelsIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h4v4H2zM10 4h4v4h-4zM6 8h4v4H6zM2 12h4M10 12h4"
        stroke={active ? '#7F77DD' : 'currentColor'}
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  )
}

function StandardsIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke={active ? '#7F77DD' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 8l2 2 4-3"
        stroke={active ? '#7F77DD' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  )
}

// ============================================================================
// STANDARDS EMPTY STATE (V2)
// ============================================================================

function StandardsContent() {
  const handleImport = () => {
    // Toast: coming soon
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('edforge:toast', {
        detail: { message: 'Standards import coming soon', type: 'info' },
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 340,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(127,119,221,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <ShieldCheck style={{ width: 24, height: 24, color: '#7F77DD' }} />
      </div>

      {/* Heading */}
      <h3
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--v2-text-primary, var(--text-primary, #e8eaf0))',
          marginBottom: 6,
        }}
      >
        Standards alignment
      </h3>

      {/* Body */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--v2-text-faint, var(--text-muted, #5a6070))',
          maxWidth: 320,
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        Map courses to academic standards to track curriculum coverage and EdFi
        compliance. Standards can be imported or configured per course.
      </p>

      {/* Import button */}
      <button
        type="button"
        onClick={handleImport}
        className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
        style={{
          height: 36,
          padding: '0 14px',
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 8,
          background: 'var(--v2-bg-elevated, rgba(255,255,255,0.05))',
          border: '1px solid var(--v2-border-default, rgba(255,255,255,0.09))',
          color: 'var(--v2-text-secondary, #9aa0b8)',
          cursor: 'pointer',
        }}
      >
        <Upload style={{ width: 12, height: 12 }} />
        Import standards
      </button>
    </div>
  )
}

// ============================================================================
// CURRICULUM MODULE
// ============================================================================

export function CurriculumModule() {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('courses')
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()
  const { gradeRange } = useSchoolGradeRange(schoolId)

  // ABAC: check course/curriculum permissions
  const coursePerms = useResourcePermissions('courses')
  const filters = useCourseFilters()

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [selectedCourse, setSelectedCourse] = useState<CourseResponseDto | null>(null)

  // Update course mutation (for toggle active)
  const updateMutation = useUpdateCourse()

  // Build the filters object for the API query
  const queryFilters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (filters.subjectArea) f.subjectArea = filters.subjectArea
    if (filters.courseType) f.courseType = filters.courseType
    if (filters.creditType) f.creditType = filters.creditType
    if (filters.isActive !== null) f.isActive = filters.isActive
    if (filters.searchTerm) f.searchTerm = filters.searchTerm
    return f
  }, [filters])

  // Fetch courses
  const { data: coursesData, isLoading } = useCourses({
    schoolId: schoolId || '',
    filters: queryFilters,
    enabled: !!schoolId,
  })

  const courses = flattenCoursePages(coursesData)
  const totalCount = getCourseTotalFromPages(coursesData)

  // Computed stats
  const stats = useMemo(() => {
    const total = totalCount ?? courses.length
    const active = courses.filter((c) => c.isActive).length
    const elective = courses.filter((c) => c.courseType === 'elective').length
    const subjects = new Set(courses.map((c) => c.subjectArea)).size
    const specializedTypes = new Set(
      courses
        .filter((c) =>
          ['honors', 'ap', 'dual_enrollment'].includes(c.courseType)
        )
        .map((c) => c.courseType)
    ).size
    const electiveName =
      elective === 1
        ? courses.find((c) => c.courseType === 'elective')?.courseName
        : undefined
    return { total, active, elective, subjects, specializedTypes, electiveName }
  }, [courses, totalCount])

  // Drawer handlers
  const openCreateDrawer = () => {
    setSelectedCourse(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }

  const openViewDrawer = (course: CourseResponseDto) => {
    setSelectedCourse(course)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  const openEditDrawer = (course: CourseResponseDto) => {
    setSelectedCourse(course)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const handleToggleActive = async (course: CourseResponseDto) => {
    try {
      await updateMutation.mutateAsync({
        courseId: course.courseId,
        schoolId: schoolId || course.schoolId,
        data: { isActive: !course.isActive } as any,
      })
    } catch {
      // Error toast handled in mutation hook
    }
  }

  const navigateToCourse = (course: CourseResponseDto) => {
    navigate({ to: `/curriculum/${course.courseId}` })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedCourse(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div data-v2 className="min-h-full" style={{ padding: '18px 20px' }}>
      {/* ---- V2 Page Header ---- */}
      <div className="flex items-center justify-between" style={{ height: 44, marginBottom: 4 }}>
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(127,119,221,0.10)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 2h12v12H2z"
                stroke="#7F77DD"
                strokeWidth="1.5"
                fill="none"
              />
              <path d="M5 6h6M5 9h4" stroke="#7F77DD" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Title */}
          <h1
            className="text-[18px] font-semibold"
            style={{ color: 'var(--v2-text-primary, var(--text-primary, #e8eaf0))', letterSpacing: -0.3 }}
          >
            Curriculum
          </h1>

          {/* Separator + Date */}
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>|</span>
          <span
            className="text-[13px]"
            style={{ color: 'var(--v2-text-faint, var(--text-muted, #4a5068))' }}
          >
            {today}
          </span>
        </div>

        {/* Right-side action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              height: 36,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              background: 'var(--v2-bg-elevated, rgba(255,255,255,0.05))',
              border: '1px solid var(--v2-border-default, rgba(255,255,255,0.09))',
              color: 'var(--v2-text-secondary, #9aa0b8)',
              cursor: 'pointer',
            }}
          >
            <Upload style={{ width: 12, height: 12 }} />
            Import courses
          </button>
          {coursePerms.create && (
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-1.5 transition-colors hover:opacity-90"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 8,
                background: 'var(--v2-brand-primary, #1D9E75)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: 12, height: 12 }} />
              Add course
            </button>
          )}
        </div>
      </div>

      {/* ---- Context Banner ---- */}
      <p
        className="text-[12px]"
        style={{
          color: 'var(--v2-text-faint, var(--text-muted, #4a5068))',
          marginBottom: 14,
        }}
      >
        <span style={{ color: 'var(--color-info, #378ADD)', fontWeight: 500 }}>
          {stats.total}
        </span>{' '}
        courses across{' '}
        <span style={{ color: 'var(--color-info, #378ADD)', fontWeight: 500 }}>
          {stats.subjects}
        </span>{' '}
        subject areas · {stats.elective} elective ·{' '}
        <span style={{ color: 'var(--color-info, #378ADD)', fontWeight: 500 }}>
          {stats.specializedTypes}
        </span>{' '}
        specialized course types (Honors, AP, Dual Enrollment)
      </p>

      {/* ---- KPI Tiles ---- */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 14,
        }}
      >
        <StatCard
          label="Total Courses"
          value={String(stats.total)}
          icon={BookOpen}
          accentColor="rgba(127,119,221,0.10)"
          iconColor="#7F77DD"
          barColor="#7F77DD"
          tag={{
            text: `${stats.active} active`,
            color: '#1D9E75',
            bg: 'rgba(29,158,117,0.1)',
          }}
          loading={isLoading}
        />
        <StatCard
          label="Subject Areas"
          value={String(stats.subjects)}
          icon={Layers}
          accentColor="rgba(55,138,221,0.10)"
          iconColor="#378ADD"
          barColor="#378ADD"
          hint="Math · Science · ELA · SS · Arts · Voc."
          loading={isLoading}
        />
        <StatCard
          label="Electives"
          value={String(stats.elective)}
          icon={BookOpen}
          accentColor="rgba(216,90,48,0.10)"
          iconColor="#D85A30"
          barColor="#D85A30"
          tag={
            stats.electiveName
              ? {
                  text: stats.electiveName,
                  color: '#7F77DD',
                  bg: 'rgba(127,119,221,0.1)',
                }
              : undefined
          }
          loading={isLoading}
        />
        <StatCard
          label="Specialized Types"
          value={String(stats.specializedTypes)}
          icon={BookOpen}
          accentColor="rgba(239,159,39,0.10)"
          iconColor="#EF9F27"
          barColor="#EF9F27"
          tag={{
            text: 'Honors · AP · Dual Enroll.',
            color: '#EF9F27',
            bg: 'rgba(239,159,39,0.1)',
          }}
          loading={isLoading}
        />
      </div>

      {/* ---- Tab Bar ---- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 14,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Courses tab */}
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: activeTab === 'courses' ? 500 : 400,
            color: activeTab === 'courses' ? '#7F77DD' : 'var(--text-hint, #5a6070)',
            cursor: 'pointer',
            borderBottom: `2px solid ${activeTab === 'courses' ? '#7F77DD' : 'transparent'}`,
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'courses' ? '#7F77DD' : 'transparent',
          }}
        >
          <CoursesIcon active={activeTab === 'courses'} />
          Courses
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 5px',
              borderRadius: 8,
              background: activeTab === 'courses' ? 'rgba(127,119,221,0.12)' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'courses' ? '#7F77DD' : 'var(--text-hint, #5a6070)',
            }}
          >
            {stats.total}
          </span>
        </button>

        {/* Grade Levels tab */}
        <button
          type="button"
          onClick={() => setActiveTab('grade-levels')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: activeTab === 'grade-levels' ? 500 : 400,
            color: activeTab === 'grade-levels' ? '#7F77DD' : 'var(--text-hint, #5a6070)',
            cursor: 'pointer',
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'grade-levels' ? '#7F77DD' : 'transparent',
          }}
        >
          <GradeLevelsIcon active={activeTab === 'grade-levels'} />
          Grade levels
        </button>

        {/* Standards tab */}
        <button
          type="button"
          onClick={() => setActiveTab('standards')}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: activeTab === 'standards' ? 500 : 400,
            color: activeTab === 'standards' ? '#7F77DD' : 'var(--text-hint, #5a6070)',
            cursor: 'pointer',
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'standards' ? '#7F77DD' : 'transparent',
          }}
        >
          <StandardsIcon active={activeTab === 'standards'} />
          Standards
        </button>
      </div>

      {/* ---- Tab Content ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {activeTab === 'courses' && (
            <div>
              {/* Filter strip */}
              <CourseFilters totalCount={totalCount} />

              {/* Course Table */}
              <div style={{ marginTop: 12 }}>
                <CourseTable
                  courses={courses}
                  isLoading={isLoading}
                  onAddCourse={coursePerms.create ? openCreateDrawer : undefined}
                  onViewCourse={openViewDrawer}
                  onEditCourse={coursePerms.edit ? openEditDrawer : undefined}
                  onToggleActive={coursePerms.edit ? handleToggleActive : undefined}
                  onNavigateToCourse={navigateToCourse}
                />
              </div>
            </div>
          )}

          {activeTab === 'grade-levels' && (
            <GradeLevelsTab
              courses={courses}
              isLoading={isLoading}
              onViewCourse={openViewDrawer}
              schoolGradeRange={gradeRange ?? undefined}
            />
          )}

          {activeTab === 'standards' && <StandardsContent />}
        </motion.div>
      </AnimatePresence>

      {/* Course Drawer */}
      <CourseDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        mode={drawerMode}
        course={selectedCourse}
        onModeChange={setDrawerMode}
        schoolGradeRange={gradeRange}
      />
    </div>
  )
}

export default CurriculumModule
