/**
 * Section Detail Page
 *
 * Detailed view for a single class section with tabs:
 * - Overview: section info, teacher, enrollment, logistics
 * - Roster: enrolled students with add/remove
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  BookOpen,
  User,
  Users,
  MapPin,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Printer,
  AlertCircle,
  ClipboardCheck,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useSection, useUpdateSection } from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  getCapacityColor,
  getCapacityPercent,
} from '../../schemas/section.form'
import { SectionRoster } from '../../components/scheduling/SectionRoster'
import { SectionDrawer } from '../../components/scheduling/SectionDrawer'

// ============================================================================
// TYPES
// ============================================================================

type SectionTab = 'overview' | 'roster'

const tabs: { id: SectionTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'roster', label: 'Roster', icon: Users },
]

// ============================================================================
// LOADING SKELETON
// ============================================================================

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface-secondary" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-surface-secondary" />
          <div className="h-4 w-32 rounded bg-surface-secondary" />
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
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
              Edit Section
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
              Print Roster
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
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Activate
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
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ section }: { section: NonNullable<ReturnType<typeof useSection>['data']> }) {
  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const barColor = getCapacityColor(section.currentEnrollment, section.maxEnrollment)

  const cards = [
    {
      icon: BookOpen,
      label: 'Course',
      value: section.courseName || '—',
      sub: section.courseCode,
      accent: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-600',
    },
    {
      icon: User,
      label: 'Primary Teacher',
      value: section.primaryTeacherName || '—',
      sub: undefined,
      accent: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-600',
    },
    {
      icon: MapPin,
      label: 'Room',
      value: section.roomNumber || 'Not assigned',
      sub: undefined,
      accent: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-600',
    },
    {
      icon: CalendarDays,
      label: 'Section Number',
      value: `#${section.sectionNumber}`,
      sub: section.sectionName,
      accent: 'from-purple-500/20 to-violet-500/20',
      iconColor: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border-secondary p-4"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.accent}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div>
                <div className="text-xs text-text-tertiary">{card.label}</div>
                <div className="text-sm font-medium text-text-primary mt-0.5">
                  {card.value}
                </div>
                {card.sub && (
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {card.sub}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment Card */}
      <div className="rounded-xl border border-border-secondary p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Users className="w-4 h-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-text-primary">
            Enrollment Capacity
          </h3>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-text-primary">
            {section.currentEnrollment}
          </span>
          <span className="text-sm text-text-tertiary">
            of {section.maxEnrollment} max ({percent}%)
          </span>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-text-tertiary">
            {section.maxEnrollment - section.currentEnrollment} spots remaining
          </span>
          <span className="text-xs text-text-tertiary">
            {section.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Quick Links - Cross-Module Navigation */}
      <div className="rounded-xl border border-border-secondary p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/attendance"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 rounded-lg transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            Take Attendance
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/grades"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 rounded-lg transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Open Gradebook
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION DETAIL PAGE
// ============================================================================

export function SectionDetailPage() {
  const { sectionId } = useParams({ from: '/scheduling/$sectionId' })
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''
  const [activeTab, setActiveTab] = useState<SectionTab>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Validate sectionId
  const isValidId = useMemo(() => {
    try {
      z.string().uuid().parse(sectionId)
      return true
    } catch {
      return false
    }
  }, [sectionId])

  const { data: section, isLoading, error } = useSection({
    sectionId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  const updateMutation = useUpdateSection()

  const handleToggleActive = async () => {
    if (!section) return
    await updateMutation.mutateAsync({
      sectionId: section.sectionId,
      schoolId,
      data: { isActive: !section.isActive } as any,
    })
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-full p-6">
        <SectionSkeleton />
      </div>
    )
  }

  // Not found / error
  if (!isValidId || error || !section) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Section Not Found
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            This section may have been removed or you don't have access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/scheduling' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scheduling
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {section.sectionName || `Section ${section.sectionNumber}`}
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  {section.courseName}
                  {section.courseCode && ` (${section.courseCode})`}
                  {' · '}
                  {section.primaryTeacherName || 'No teacher assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  section.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    section.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                {section.isActive ? 'Active' : 'Inactive'}
              </div>
              <ActionsDropdown
                onEdit={() => setDrawerOpen(true)}
                onToggleActive={handleToggleActive}
                isActive={section.isActive}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Section tabs">
            {tabs.map((tab) => {
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
                      layoutId="sectionDetailTab"
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
            {activeTab === 'overview' && <OverviewTab section={section} />}
            {activeTab === 'roster' && <SectionRoster section={section} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Drawer */}
      <SectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode="edit"
        section={section}
      />
    </div>
  )
}
