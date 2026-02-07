/**
 * Master Scheduling Module
 *
 * Unified scheduling interface for the Academics domain.
 * - Class Schedules tab: Live section data with filters, table, and drawer
 * - Timetables tab: Placeholder (FullCalendar integration in future phase)
 * - Classrooms tab: Placeholder (Room API deferred)
 *
 * Sprint 5 — Class Sections & Scheduling
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  Building2,
  Users,
  Clock,
  MoreHorizontal,
  Plus,
  Download,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSectionFilters } from '../../stores/sections.store'
import {
  useSections,
  flattenSectionPages,
  getSectionTotalFromPages,
  useUpdateSection,
} from '../../hooks/useSections'
import { SectionTable } from '../../components/scheduling/SectionTable'
import { SectionFilters } from '../../components/scheduling/SectionFilters'
import { SectionDrawer, type DrawerMode } from '../../components/scheduling/SectionDrawer'
import type { SectionResponseDto } from '@edforge/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type SchedulingTab = 'schedules' | 'timetables' | 'classrooms'

const TABS = [
  {
    id: 'schedules' as const,
    label: 'Class Sections',
    icon: CalendarDays,
  },
  {
    id: 'timetables' as const,
    label: 'Timetables',
    icon: LayoutGrid,
  },
  {
    id: 'classrooms' as const,
    label: 'Classrooms',
    icon: Building2,
  },
]

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof Calendar
  label: string
  value: string | number
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE ACTIONS DROPDOWN
// ============================================================================

function PageActionsDropdown({
  onAddSection,
}: {
  onAddSection: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Page actions"
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
                onAddSection()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Sections
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// SCHEDULING MODULE
// ============================================================================

export function SchedulingModule() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SchedulingTab>('schedules')

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [selectedSection, setSelectedSection] = useState<SectionResponseDto | null>(null)

  // Filters from store
  const filters = useSectionFilters()

  // Section query
  const {
    data: sectionsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSections({
    schoolId,
    filters: {
      courseId: filters.courseId || undefined,
      teacherId: filters.teacherId || undefined,
      academicYearId: filters.academicYearId || undefined,
      termId: filters.termId || undefined,
      isActive: filters.isActive ?? undefined,
      searchTerm: filters.searchTerm || undefined,
    },
    enabled: !!schoolId,
  })

  const sections = flattenSectionPages(sectionsData)
  const total = getSectionTotalFromPages(sectionsData)

  const updateMutation = useUpdateSection()

  // Computed stats
  const stats = useMemo(() => {
    const totalSections = sections.length
    const totalEnrolled = sections.reduce((sum, s) => sum + s.currentEnrollment, 0)
    const totalCapacity = sections.reduce((sum, s) => sum + s.maxEnrollment, 0)
    const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
    const uniqueTeachers = new Set(sections.map((s) => s.primaryTeacherId)).size

    return { totalSections, totalEnrolled, utilization, uniqueTeachers }
  }, [sections])

  // Drawer handlers
  const openCreateDrawer = () => {
    setSelectedSection(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }

  const openViewDrawer = (section: SectionResponseDto) => {
    setSelectedSection(section)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  const openEditDrawer = (section: SectionResponseDto) => {
    setSelectedSection(section)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedSection(null)
  }

  const handleToggleActive = async (section: SectionResponseDto) => {
    await updateMutation.mutateAsync({
      sectionId: section.sectionId,
      schoolId,
      data: { isActive: !section.isActive } as any,
    })
  }

  const handleViewRoster = (section: SectionResponseDto) => {
    navigate({ to: `/scheduling/${section.sectionId}` })
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Master Scheduling
                </h1>
                <p className="text-text-secondary mt-1">
                  Build and manage class sections, assign teachers, and manage rosters
                </p>
              </div>
            </div>
            <PageActionsDropdown onAddSection={openCreateDrawer} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Scheduling tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="schedulingTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
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
            {activeTab === 'schedules' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={CalendarDays}
                    label="Total Sections"
                    value={total ?? stats.totalSections}
                    accent="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-500/10"
                  />
                  <StatCard
                    icon={Users}
                    label="Total Enrolled"
                    value={stats.totalEnrolled}
                    accent="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-500/10"
                  />
                  <StatCard
                    icon={Clock}
                    label="Capacity Utilization"
                    value={`${stats.utilization}%`}
                    accent="text-purple-600 dark:text-purple-400"
                    bg="bg-purple-500/10"
                  />
                  <StatCard
                    icon={Users}
                    label="Teachers Scheduled"
                    value={stats.uniqueTeachers}
                    accent="text-amber-600 dark:text-amber-400"
                    bg="bg-amber-500/10"
                  />
                </div>

                {/* Filters */}
                <SectionFilters
                  schoolId={schoolId}
                  totalResults={total}
                />

                {/* Table */}
                <SectionTable
                  sections={sections}
                  isLoading={isLoading}
                  hasMore={hasNextPage}
                  isFetchingMore={isFetchingNextPage}
                  onLoadMore={() => fetchNextPage()}
                  onViewSection={openViewDrawer}
                  onEditSection={openEditDrawer}
                  onToggleActive={handleToggleActive}
                  onViewRoster={handleViewRoster}
                />
              </div>
            )}

            {activeTab === 'timetables' && (
              <div className="space-y-6">
                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-indigo-500/10">
                      <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Visual Timetable Grid
                      </h3>
                      <p className="text-text-secondary leading-relaxed mb-4">
                        View and print weekly timetables for teachers, students, or classrooms.
                        Calendar integration with Outlook and Google Calendar is coming soon,
                        powered by FullCalendar for a first-class scheduling experience.
                      </p>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>- Weekly view with color-coded subjects</li>
                        <li>- Export to PDF for distribution</li>
                        <li>- Teacher and student personalized views</li>
                        <li>- Outlook / Google Calendar integration (upcoming)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
                  <LayoutGrid className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
                  <h4 className="text-lg font-medium text-text-primary mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-text-secondary max-w-md mx-auto">
                    Timetable views will be available in a future release with full
                    calendar integration.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="space-y-6">
                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Room & Facility Management
                      </h3>
                      <p className="text-text-secondary leading-relaxed mb-4">
                        Define classrooms with capacity limits, equipment inventory, and
                        accessibility features. The system will prevent over-enrollment and
                        ensure ADA-compliant room assignments.
                      </p>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>- Capacity tracking and enrollment limits</li>
                        <li>- Equipment and resource inventory per room</li>
                        <li>- Accessibility compliance tracking</li>
                        <li>- Utilization reports and optimization suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
                  <h4 className="text-lg font-medium text-text-primary mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-text-secondary max-w-md mx-auto">
                    Room management will be available once the Classroom API is deployed.
                    For now, you can assign rooms as text labels when creating sections.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Section Drawer */}
      <SectionDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        mode={drawerMode}
        section={selectedSection}
        onModeChange={setDrawerMode}
        onSuccess={closeDrawer}
      />
    </div>
  )
}

export default SchedulingModule
