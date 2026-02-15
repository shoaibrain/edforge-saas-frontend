/**
 * School Detail Page
 * 
 * Redesigned with a modern, enterprise-grade UI.
 * Features:
 * - Clean header with logo, metadata badges
 * - Right-aligned animated tab navigation
 * - Fluid transitions and responsive layout
 */

import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  Trash2,
  AlertTriangle,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useAuthStore } from '@/stores/auth.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import type { School as SchoolType } from '@edforge/types'
import { Button } from '@edforge/ui'

// Sub-page components
import SchoolConfigurationPage from './school-configuration'
import SchoolDepartmentsPage from './school-departments'
import SchoolAcademicYearsPage from './school-academic-years'
import SchoolCalendarPage from './school-calendar'
import SchoolBellSchedulePage from './school-bell-schedule'
import SchoolRoomsPage from './school-rooms'

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  k12: 'K-12',
  charter: 'Charter',
  private: 'Private',
  vocational: 'Vocational',
  special_education: 'Special Ed',
}

// ============================================================================
// TYPES
// ============================================================================

type SchoolTab = 'configuration' | 'departments' | 'academic-years' | 'calendar' | 'bell-schedule' | 'rooms'

const TABS: { id: SchoolTab; label: string; icon: typeof Settings }[] = [
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'departments', label: 'Departments', icon: Users },
  { id: 'academic-years', label: 'Academic Years', icon: Calendar },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'bell-schedule', label: 'Bell Schedule', icon: Clock },
  { id: 'rooms', label: 'Rooms', icon: MapPin },
]

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteSchoolModalProps {
  school: SchoolType
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteSchoolModal({ school, isOpen, onClose, onConfirm, isDeleting }: DeleteSchoolModalProps) {
  const [confirmText, setConfirmText] = useState('')
  
  if (!isOpen) return null
  
  const canDelete = confirmText === school.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-rust-500/10">
              <AlertTriangle className="w-5 h-5 text-rust-500" />
            </div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Delete School</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            This action <strong className="text-[rgb(var(--text-primary))]">cannot be undone</strong>. This will permanently delete:
          </p>
          
          <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500" />
              All departments associated with this school
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500" />
              All academic years and grading periods
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500" />
              All staff and user assignments to this school
            </li>
          </ul>
          
          <div className="pt-2">
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              Type <strong className="text-[rgb(var(--text-primary))]">{school.name}</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={school.name}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-rust-500/40 focus:border-rust-500 transition-all"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete School
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolDetailPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Source of Truth: URL Params
  const params = useParams({ strict: false }) as { schoolId?: string }
  const schoolId = params.schoolId || 'school-001'

  const [activeTab, setActiveTab] = useState<SchoolTab>('configuration')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Permission Check
  if (!user) return null // Or redirect to login

  const isTenantAdmin = user.globalRole === 'TenantAdmin'

  // (Optional) Permissions logic - keeping it simple for UI focus
  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:school',
    schoolId: schoolId,
  })

  // Fetch School Data
  const {
    data: school,
    isLoading,
  } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => tenantService.deleteSchool(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      navigate({ to: '/settings/organization' })
    },
  })

  const displaySchool: SchoolType | undefined = school

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="animate-pulse space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[rgb(var(--surface-secondary))] rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-[rgb(var(--surface-secondary))] rounded-lg" />
              <div className="h-4 w-48 bg-[rgb(var(--surface-secondary))] rounded" />
            </div>
          </div>
          <div className="h-64 bg-[rgb(var(--surface-secondary))] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view this school's settings." />
  }

  if (!displaySchool) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="text-center text-[rgb(var(--text-tertiary))]">
          School not found or could not be loaded.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Logo, Title & Metadata */}
          <div className="flex items-start gap-4">
            {/* School Logo/Avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20 flex-shrink-0">
              {displaySchool.name.charAt(0)}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
                {displaySchool.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Code Badge */}
                <span className="font-mono bg-[rgb(var(--surface-tertiary))] px-2 py-0.5 rounded text-xs font-medium text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-primary))]">
                  {displaySchool.code}
                </span>
                
                {/* Type Badge */}
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]">
                  {SCHOOL_TYPE_LABELS[displaySchool.type || ''] || displaySchool.type || 'School'}
                </span>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${displaySchool.isActive
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                  : 'bg-rust-500/10 text-rust-700 dark:text-rust-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${displaySchool.isActive ? 'bg-teal-500' : 'bg-rust-500'}`} />
                  {displaySchool.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Right: Actions */}
          {isTenantAdmin && (
            <Menu as="div" className="relative">
              <MenuButton className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20">
                <MoreHorizontal className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              </MenuButton>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg focus:outline-none overflow-hidden">
                  <div className="py-1">
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className={`flex items-center w-full px-3 py-2.5 text-sm text-red-600 ${active ? 'bg-red-50 dark:bg-red-500/10' : ''}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2.5" />
                          Delete School
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center justify-end space-x-1 overflow-x-auto no-scrollbar -mb-px">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none
                    ${isActive
                      ? 'text-[rgb(var(--text-primary))]'
                      : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                    }
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'opacity-70'}`} />
                    {tab.label}
                  </span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Subtle Hover Background */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-lg bg-[rgb(var(--text-primary))] opacity-0 hover:opacity-[0.03] transition-opacity" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'configuration' && <SchoolConfigurationPage schoolId={schoolId} school={displaySchool} />}
              {activeTab === 'departments' && <SchoolDepartmentsPage schoolId={schoolId} />}
              {activeTab === 'academic-years' && <SchoolAcademicYearsPage schoolId={schoolId} />}
              {activeTab === 'calendar' && <SchoolCalendarPage schoolId={schoolId} />}
              {activeTab === 'bell-schedule' && <SchoolBellSchedulePage schoolId={schoolId} />}
              {activeTab === 'rooms' && <SchoolRoomsPage schoolId={schoolId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && displaySchool && (
          <DeleteSchoolModal
            school={displaySchool}
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-6">
          <Building2 className="w-10 h-10 text-rust-500" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))] max-w-md mx-auto">{message}</p>
      </motion.div>
    </div>
  )
}
