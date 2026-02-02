/**
 * School Detail Page
 * 
 * Redesigned with a modern, enterprise-grade UI.
 * Features:
 * - Clean, minimal header with key metadata
 * - "Apple-style" animated tab navigation (right-aligned)
 * - Fluid transitions and responsive layout
 */

import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Settings,
  Users,
  Calendar,
  Building2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import type { School as SchoolType } from '@edforge/types'

// Sub-page components
import SchoolConfigurationPage from './school-configuration'
import SchoolDepartmentsPage from './school-departments'
import SchoolAcademicYearsPage from './school-academic-years'

// ============================================================================
// TYPES
// ============================================================================

type SchoolTab = 'configuration' | 'departments' | 'academic-years'

const TABS: { id: SchoolTab; label: string; icon: typeof Settings }[] = [
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'departments', label: 'Departments', icon: Users },
  { id: 'academic-years', label: 'Academic Years', icon: Calendar },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolDetailPage() {
  const user = useAuthStore((s) => s.user)
  // Source of Truth: URL Params
  const params = useParams({ strict: false }) as { schoolId?: string }
  const schoolId = params.schoolId || 'school-001'

  const [activeTab, setActiveTab] = useState<SchoolTab>('configuration')

  // Permission Check
  if (!user) return null // Or redirect to login

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

  const displaySchool: SchoolType | undefined = school

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-1/3 bg-[rgb(var(--surface-secondary))] rounded-xl" />
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
      {/* 
        Main Container 
        Using max-width to keep content readable on ultra-wide screens, 
        but extensive enough for enterprise data tables.
      */}
      <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgb(var(--border-primary))] pb-0.5">
          {/* Left: Title & Metadata */}
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
              {displaySchool.name}
            </h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-[rgb(var(--text-tertiary))]">
              <span className="font-mono bg-[rgb(var(--surface-tertiary))] px-2 py-0.5 rounded text-xs font-medium text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-primary))]">
                {displaySchool.code}
              </span>
              <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
              <span className="capitalize font-medium">{displaySchool.type || 'School'}</span>

              <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />

              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${displaySchool.isActive
                ? 'bg-teal-500/5 border-teal-500/20 text-teal-700 dark:text-teal-400'
                : 'bg-rust-500/5 border-rust-500/20 text-rust-700 dark:text-rust-400'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${displaySchool.isActive ? 'bg-teal-500' : 'bg-rust-500'}`} />
                {displaySchool.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Right: Animated Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar -mb-px">
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

                  {/* Subtle Hover Background (Optional, good for accessibility) */}
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
              <div className="h-full">
                {activeTab === 'configuration' && <SchoolConfigurationPage schoolId={schoolId} school={displaySchool} />}
                {activeTab === 'departments' && <SchoolDepartmentsPage schoolId={schoolId} />}
                {activeTab === 'academic-years' && <SchoolAcademicYearsPage schoolId={schoolId} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
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
