/**
 * Course Detail Page
 *
 * Detailed view for a single course with tabs:
 * - Overview: classification, grade levels, description, objectives, materials, metadata
 * - Sections: sections belonging to this course with capacity indicators
 * - Standards: placeholder for future sprint
 */

import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers,
  Award,
  FileText,
  Clock,
  Target,
  MapPin,
  User,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Printer,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { z } from 'zod'
import { useResourcePermissions } from '@edforge/abac'
import { Tabs, type TabItem } from '@edforge/ui'
import { useCourse, useUpdateCourse } from '../../hooks/useCourses'
import {
  useSections,
  flattenSectionPages,
  getSectionTotalFromPages,
} from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  getSubjectAreaLabel,
  getCourseTypeLabel,
  getCreditTypeLabel,
  getDurationLabel,
  getGradeLevelLabel,
  SUBJECT_AREA_COLORS,
  COURSE_TYPE_COLORS,
} from '../../schemas/course.form'
import {
  getCapacityColor,
  getCapacityPercent,
  getCapacityLabel,
  getCapacityTextColor,
} from '../../schemas/section.form'
import { CourseDrawer, type DrawerMode } from '../../components/curriculum/CourseDrawer'
import { useAcademicsI18n } from '../../lib/i18n'
import type { CourseResponseDto, SectionResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type CourseTab = 'overview' | 'sections' | 'standards'

const TABS: { id: CourseTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'sections', label: 'Sections', icon: CalendarDays },
  { id: 'standards', label: 'Standards', icon: Target },
]

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CourseSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface-secondary" />
        <div className="space-y-2">
          <div className="h-6 w-56 rounded bg-surface-secondary" />
          <div className="h-4 w-36 rounded bg-surface-secondary" />
        </div>
      </div>
      <div className="h-10 w-64 rounded bg-surface-secondary" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  onEdit,
  onToggleActive,
  isActive,
}: {
  onEdit: () => void
  onToggleActive: () => void
  isActive: boolean
}) {
  const { t } = useAcademicsI18n()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label={t('common.actions')}
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {t('curriculumModule.courseDetail.actions.editCourse')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                window.print()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t('curriculumModule.courseDetail.actions.printDetails')}
            </button>
            <div className="border-t border-border-secondary my-1" />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onToggleActive()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {isActive ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  {t('curriculumModule.courseDetail.actions.deactivate')}
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  {t('curriculumModule.courseDetail.actions.activate')}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SectionHeader({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-secondary">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        {title}
      </h4>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-tertiary mb-0.5">{label}</dt>
      <dd className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-text-tertiary">—</span>}
      </dd>
    </div>
  )
}

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

function CapacityBar({ current, max }: { current: number; max: number }) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)
  const textColor = getCapacityTextColor(current, max)

  return (
    <div className="flex items-center gap-2 min-w-32">
      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${textColor}`}>
        {getCapacityLabel(current, max)}
      </span>
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ course }: { course: CourseResponseDto }) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  const subjectColors = SUBJECT_AREA_COLORS[course.subjectArea] ?? SUBJECT_AREA_COLORS.other
  const typeColors = COURSE_TYPE_COLORS[course.courseType] ?? COURSE_TYPE_COLORS.required

  // Avoid showing duplicate badges when creditType label matches courseType label
  const courseTypeLabel = getCourseTypeLabel(course.courseType)
  const creditTypeLabel = course.creditType ? getCreditTypeLabel(course.creditType) : null
  const showCreditBadge = creditTypeLabel && creditTypeLabel !== courseTypeLabel

  return (
    <div className="space-y-6">
      {/* Quick badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          label={getSubjectAreaLabel(course.subjectArea)}
          bg={subjectColors.bg}
          text={subjectColors.text}
        />
        <Badge
          label={courseTypeLabel}
          bg={typeColors.bg}
          text={typeColors.text}
        />
        {showCreditBadge && (
          <Badge
            label={creditTypeLabel}
            bg="bg-[rgb(var(--background-tertiary))]"
            text="text-[rgb(var(--text-secondary))]"
          />
        )}
      </div>

      {/* Classification */}
      <div className="rounded-xl border border-border-secondary p-5">
        <SectionHeader icon={GraduationCap} title={t('curriculumModule.form.classificationTitle')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <DetailField label={t('curriculumModule.filters.subjectArea')} value={getSubjectAreaLabel(course.subjectArea)} />
          <DetailField label={t('curriculumModule.filters.courseType')} value={getCourseTypeLabel(course.courseType)} />
          <DetailField
            label={t('tables.courses.columns.credits')}
            value={`${formatNumber(course.credits)}${course.creditType ? ` (${getCreditTypeLabel(course.creditType)})` : ''}`}
          />
          <DetailField label={t('tables.courses.columns.duration')} value={getDurationLabel(course.typicalDuration)} />
          <DetailField label={t('curriculumModule.form.courseCode')} value={course.courseCode} mono />
          {course.periodsPerWeek && (
            <DetailField label={t('curriculumModule.courseDetail.periodsPerWeekShort')} value={formatNumber(course.periodsPerWeek)} />
          )}
        </div>
      </div>

      {/* Grade Levels */}
      <div className="rounded-xl border border-border-secondary p-5">
        <SectionHeader icon={Layers} title={t('tables.courses.columns.grades')} />
        <div className="flex flex-wrap gap-2">
          {course.gradeLevels.map((g) => (
            <span
              key={g}
              className="px-2.5 py-1 text-sm font-medium bg-surface-tertiary text-text-primary rounded-lg"
            >
              {getGradeLevelLabel(g)}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div className="rounded-xl border border-border-secondary p-5">
          <SectionHeader icon={FileText} title={t('curriculumModule.courseDetail.description')} />
          <p className="text-sm text-text-secondary leading-relaxed">
            {course.description}
          </p>
        </div>
      )}

      {/* Objectives */}
      {course.objectives && course.objectives.length > 0 && (
        <div className="rounded-xl border border-border-secondary p-5">
          <SectionHeader icon={Award} title={t('curriculumModule.courseDetail.learningObjectives')} />
          <ul className="space-y-1.5">
            {course.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--state-info-fg))] flex-shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Materials */}
      {course.textbooks && course.textbooks.length > 0 && (
        <div className="rounded-xl border border-border-secondary p-5">
          <SectionHeader icon={BookOpen} title={t('curriculumModule.form.materialsTitle')} />
          <div className="space-y-2">
            {course.textbooks.map((mat, i) => (
              <div
                key={mat.materialId ?? i}
                className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg"
              >
                <BookOpen className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{mat.title}</p>
                  {mat.author && (
                    <p className="text-xs text-text-secondary">{t('curriculumModule.courseDetail.byAuthor', { author: mat.author })}</p>
                  )}
                  {mat.isbn && (
                    <p className="text-xs text-text-tertiary font-mono">ISBN: {mat.isbn}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-xl border border-border-secondary p-5">
        <SectionHeader icon={Clock} title={t('curriculumModule.courseDetail.metadata')} />
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label={t('curriculumModule.courseDetail.created')}
            value={
              course.createdAt
                ? formatDate(course.createdAt)
                : undefined
            }
          />
          <DetailField
            label={t('curriculumModule.courseDetail.lastUpdated')}
            value={
              course.updatedAt
                ? formatDate(course.updatedAt)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTIONS TAB
// ============================================================================

function SectionsTab({
  courseId,
  schoolId,
  onViewSection,
}: {
  courseId: string
  schoolId: string
  onViewSection: (section: SectionResponseDto) => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const navigate = useNavigate()

  const {
    data: sectionsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSections({
    schoolId,
    filters: { courseId },
    enabled: !!schoolId && !!courseId,
  })

  const sections = flattenSectionPages(sectionsData)
  const totalCount = getSectionTotalFromPages(sectionsData)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary" />
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {t('curriculumModule.courseDetail.noSectionsTitle')}
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          {t('curriculumModule.courseDetail.noSectionsDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('curriculumModule.courseDetail.goToScheduling')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {t('common.sections', {
            count: totalCount ?? sections.length,
          }).replace(String(totalCount ?? sections.length), formatNumber(totalCount ?? sections.length))}
        </p>
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {sections.map((section) => (
          <button
            key={section.sectionId}
            type="button"
            onClick={() => onViewSection(section)}
            className="w-full text-left rounded-xl border border-border-secondary p-4 hover:bg-surface-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)] flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary truncate">
                      {section.sectionName || t('curriculumModule.courseDetail.sectionTitle', { section: section.sectionNumber })}
                    </p>
                    <span className="text-xs text-text-tertiary font-mono">
                      #{section.sectionNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-text-tertiary">
                    {section.primaryTeacherName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {section.primaryTeacherName}
                      </span>
                    )}
                    {(section.locationRoomNumber || section.roomNumber) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {section.locationRoomNumber || section.roomNumber}
                      </span>
                    )}
                    {section.periodName && (
                      <span>{section.periodName}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <CapacityBar
                  current={section.currentEnrollment}
                  max={section.maxEnrollment}
                />
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      section.isActive ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--text-tertiary))]'
                    }`}
                  />
                  <span className="text-xs text-text-secondary">
                    {section.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--state-info-bg)/0.18)] rounded-lg transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? t('dataTable.loadingPage') : t('curriculumModule.courseDetail.loadMoreSections')}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STANDARDS TAB (PLACEHOLDER)
// ============================================================================

function StandardsTab() {
  const { t } = useAcademicsI18n()

  return (
    <div className="text-center py-12">
      <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] inline-block mb-4">
        <Target className="w-8 h-8 text-[rgb(var(--state-info-fg))]" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {t('curriculumModule.courseDetail.standardsTitle')}
      </h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto">
        {t('curriculumModule.courseDetail.standardsDescription')}
      </p>
    </div>
  )
}

// ============================================================================
// COURSE DETAIL PAGE
// ============================================================================

export function CourseDetailPage() {
  const { t, formatNumber } = useAcademicsI18n()
  const { courseId } = useParams({ from: '/curriculum/$courseId' })
  const navigate = useNavigate()
  // URL-synced active tab (deep-linkable / shareable).
  const { tab } = useSearch({ from: '/curriculum/$courseId' })
  const schoolId = useActiveSchoolId() || ''
  const activeTab: CourseTab = tab ?? 'overview'
  const setActiveTab = useCallback(
    (next: CourseTab) => {
      navigate({ to: '/curriculum/$courseId', params: { courseId }, search: { tab: next }, replace: true })
    },
    [navigate, courseId],
  )

  // Course drawer for editing
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false)
  const [courseDrawerMode, setCourseDrawerMode] = useState<DrawerMode>('edit')


  // Validate courseId
  const isValidId = useMemo(() => {
    try {
      z.string().uuid().parse(courseId)
      return true
    } catch {
      return false
    }
  }, [courseId])

  // ABAC: check course permissions
  const coursePerms = useResourcePermissions('courses')

  const { data: course, isLoading, error } = useCourse({
    courseId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  const updateMutation = useUpdateCourse()

  const handleToggleActive = async () => {
    if (!course) return
    await updateMutation.mutateAsync({
      courseId: course.courseId,
      schoolId,
      data: { isActive: !course.isActive } as any,
    })
  }

  const handleViewSection = (section: SectionResponseDto) => {
    navigate({ to: `/classrooms/${section.sectionId}` })
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-full p-6">
        <CourseSkeleton />
      </div>
    )
  }

  // Not found / error
  if (!isValidId || error || !course) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t('curriculumModule.courseDetail.notFoundTitle')}
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {t('curriculumModule.courseDetail.notFoundDescription')}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/curriculum' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('curriculumModule.courseDetail.backToCurriculum')}
          </button>
        </div>
      </div>
    )
  }

  const subjectColors = SUBJECT_AREA_COLORS[course.subjectArea] ?? SUBJECT_AREA_COLORS.other

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-danger-bg)/0.18)] to-[rgb(var(--state-danger-bg)/0.10)]">
                <BookOpen className="w-6 h-6 text-[rgb(var(--state-danger-fg))] " />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-text-primary">
                    {course.courseName}
                  </h1>
                  <Badge
                    label={getSubjectAreaLabel(course.subjectArea)}
                    bg={subjectColors.bg}
                    text={subjectColors.text}
                  />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="font-mono text-sm text-text-tertiary">
                    {course.courseCode}
                  </span>
                  <span className="text-text-tertiary">·</span>
                  <span className="text-sm text-text-secondary">
                    {getCourseTypeLabel(course.courseType)}
                  </span>
                  <span className="text-text-tertiary">·</span>
                  <span className="text-sm text-text-secondary">
                    {t('curriculumModule.courseDetail.credits', {
                      count: course.credits,
                      value: formatNumber(course.credits),
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  course.isActive
                    ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] dark:bg-[rgb(var(--state-success-bg)/0.18)] '
                    : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] dark:bg-[rgb(var(--background-tertiary)/0.1)] '
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    course.isActive ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--text-tertiary))]'
                  }`}
                />
                {course.isActive ? t('common.active') : t('common.inactive')}
              </div>
              {coursePerms.edit && (
                <ActionsDropdown
                  onEdit={() => setCourseDrawerOpen(true)}
                  onToggleActive={handleToggleActive}
                  isActive={course.isActive}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tabs — shared @edforge/ui primitive (house standard, accessible) */}
        <div className="px-6">
          <Tabs
            aria-label={t('curriculumModule.courseDetail.courseTabs')}
            value={activeTab}
            onChange={(value) => setActiveTab(value as CourseTab)}
            tabs={TABS.map((tab): TabItem => ({
              id: tab.id,
              label: (
                <span className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {t(`curriculumModule.courseDetail.tabs.${tab.id}`)}
                </span>
              ),
            }))}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && <OverviewTab course={course} />}
            {activeTab === 'sections' && (
              <SectionsTab
                courseId={course.courseId}
                schoolId={schoolId}
                onViewSection={handleViewSection}
              />
            )}
            {activeTab === 'standards' && <StandardsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Course Drawer */}
      <CourseDrawer
        open={courseDrawerOpen}
        onClose={() => setCourseDrawerOpen(false)}
        mode={courseDrawerMode}
        course={course}
        onModeChange={setCourseDrawerMode}
      />

    </div>
  )
}
