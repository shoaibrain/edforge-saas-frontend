/**
 * School Detail Page
 * 
 * Displays school details with tabbed navigation for:
 * - Configuration
 * - Departments
 * - Academic Years
 */

import { useState } from 'react'
import { Navigate, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Settings,
  Users,
  Calendar,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
} from 'lucide-react'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import type { School as SchoolType, SchoolAddress } from '@edforge/types'

// Local type for SchoolConfiguration
interface SchoolConfiguration {
  schoolId: string
  identity: {
    displayName: string
    shortCode: string
    schoolType: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
    logoUrl?: string
    website?: string
  }
  location: {
    address: SchoolAddress
    timezone?: string
    phone?: string
    email?: string
    fax?: string
  }
  operations: {
    operatingHours: { dayOfWeek: number; isOpen: boolean; openTime?: string; closeTime?: string }[]
    gradeLevels: string[]
    capacity?: number
  }
  academic: {
    gradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    reportCardFormat: 'standard' | 'narrative' | 'standards-based'
    termStructure: 'semester' | 'trimester' | 'quarter' | 'custom'
  }
  attendance: {
    policy: 'daily' | 'period' | 'both'
    tardyThresholdMinutes: number
    excusedAbsenceTypes: string[]
    unexcusedAbsenceTypes: string[]
  }
  inheritsFromWorkspace: boolean
  createdAt: string
  updatedAt: string
}
import {
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// Sub-page components (will be created separately)
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
// SCHOOL HEADER
// ============================================================================

interface SchoolHeaderProps {
  school: SchoolType
  configuration?: SchoolConfiguration
}

function SchoolHeader({ school, configuration }: SchoolHeaderProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {school.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{school.name}</h1>
            <p className="text-white/80 mt-1">
              {school.code} • {school.type ? school.type.charAt(0).toUpperCase() + school.type.slice(1) : 'School'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${school.isActive ? 'bg-white/20 text-white' : 'bg-rust-500/80 text-white'}`}>
          {school.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {school.address && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin className="w-4 h-4" />
            <span>{school.address.city}, {school.address.state}</span>
          </div>
        )}
        {school.phone && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Phone className="w-4 h-4" />
            <span>{school.phone}</span>
          </div>
        )}
        {school.email && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="w-4 h-4" />
            <span>{school.email}</span>
          </div>
        )}
        {configuration?.identity.website && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Globe className="w-4 h-4" />
            <span>{configuration.identity.website}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

interface TabNavigationProps {
  activeTab: SchoolTab
  onTabChange: (tab: SchoolTab) => void
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-secondary))] rounded-xl"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] shadow-sm' 
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        )
      })}
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolDetailPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  
  // Get schoolId from URL params
  // Note: In TanStack Router, we'd use useParams or route context
  // For now, we'll use the activeSchoolId or a mock
  const schoolId = activeSchoolId || 'school-001'
  
  const [activeTab, setActiveTab] = useState<SchoolTab>('configuration')

  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:school',
    schoolId: schoolId,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view this school's settings." />
  }

  // Fetch school data
  const {
    data: school,
    isLoading: schoolLoading,
  } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch school configuration
  const {
    data: configuration,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Use mock data if API fails
  const displaySchool: SchoolType = school || {
    id: schoolId,
    tenantId: user.tenantId,
    name: MOCK_SCHOOLS[schoolId]?.name || 'Unknown School',
    code: MOCK_SCHOOLS[schoolId]?.code || 'UNK',
    type: 'high',
    isActive: true,
    address: {
      street1: '123 Education Way',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA',
    },
    phone: '(555) 123-4567',
    email: 'info@school.edu',
  }

  const isLoading = schoolLoading || configLoading

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-[rgb(var(--surface-secondary))] rounded-2xl" />
          <div className="h-12 bg-[rgb(var(--surface-secondary))] rounded-xl" />
          <div className="h-64 bg-[rgb(var(--surface-secondary))] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        {/* Back Link */}
        <motion.div variants={fadeInUp}>
          <Link
            to="/settings/schools"
            search={{ create: undefined }}
            className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Schools
          </Link>
        </motion.div>

        {/* School Header */}
        <SchoolHeader school={displaySchool} configuration={configuration} />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'configuration' && (
              <SchoolConfigurationPage schoolId={schoolId} />
            )}
            {activeTab === 'departments' && (
              <SchoolDepartmentsPage schoolId={schoolId} />
            )}
            {activeTab === 'academic-years' && (
              <SchoolAcademicYearsPage schoolId={schoolId} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
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
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-4">
          <Building2 className="w-8 h-8 text-rust-500" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
