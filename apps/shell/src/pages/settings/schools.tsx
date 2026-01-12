/**
 * School Settings Page
 * 
 * Premium enterprise-grade school management interface.
 * Features:
 * - Elegant empty state for first-time users
 * - Dedicated school creation page with collapsible sections
 * - Progressive disclosure for gradual information gathering
 * - Workspace settings inheritance preview
 */

import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate, useSearch, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  School,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldX,
  Plus,
  Search,
  MapPin,
  Users,
  Calendar,
  MoreHorizontal,
  Trash2,
  GraduationCap,
  ArrowRight,
  Globe,
  Layers,
  Zap,
  Check,
  Phone,
  Mail,
  Clock,
  Info,
  Save,
  Building2,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { tenantService, type CreateSchoolRequest, type WorkspaceSettings, type OperatingHours } from '@/services/tenant.service'
import type { School as SchoolType } from '@edforge/types'
import {
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES
// ============================================================================

interface SchoolFormData {
  // Basic Info
  name: string
  code: string
  type: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
  // Location
  street1: string
  street2: string
  city: string
  state: string
  postalCode: string
  country: string
  // Contact
  phone: string
  email: string
  website: string
  // Operating Hours
  operatingHours: OperatingHours[]
}

interface SectionStatus {
  completed: boolean
  skipped: boolean
}

interface SectionState {
  basic: SectionStatus
  location: SectionStatus
  contact: SectionStatus
  hours: SectionStatus
}

const DEFAULT_OPERATING_HOURS: OperatingHours[] = [
  { dayOfWeek: 0, isOpen: false }, // Sunday
  { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '16:00' },
  { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '16:00' },
  { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '16:00' },
  { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '16:00' },
  { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '16:00' },
  { dayOfWeek: 6, isOpen: false }, // Saturday
]

const initialFormData: SchoolFormData = {
  name: '',
  code: '',
  type: 'high',
  street1: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  phone: '',
  email: '',
  website: '',
  operatingHours: DEFAULT_OPERATING_HOURS,
}

const initialSectionState: SectionState = {
  basic: { completed: false, skipped: false },
  location: { completed: false, skipped: false },
  contact: { completed: false, skipped: false },
  hours: { completed: false, skipped: false },
}

// ============================================================================
// PREMIUM EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  onCreateSchool: () => void
  isTenantAdmin: boolean
}

function EmptyState({ onCreateSchool, isTenantAdmin }: EmptyStateProps) {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content - centered hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Animated school building illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          {/* Orbiting elements */}
          <div className="absolute inset-0 w-40 h-40">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i === 0 ? 'rgb(20, 184, 166)' : i === 1 ? 'rgb(6, 182, 212)' : 'rgb(251, 191, 36)',
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [
                    Math.cos((i * 2 * Math.PI) / 3) * 70,
                    Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 70,
                    Math.cos((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 70,
                  ],
                  y: [
                    Math.sin((i * 2 * Math.PI) / 3) * 70,
                    Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 70,
                    Math.sin((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 70,
                  ],
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Main icon container */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <School className="w-14 h-14 text-white" strokeWidth={1.5} />
            </div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-teal-400/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center max-w-lg mb-8"
        >
          <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))] mb-3 tracking-tight">
            Create your first school
          </h2>
          <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
            Schools are the foundation of EdForge. Set up academic calendars, 
            manage departments, and organize your educational programs.
          </p>
        </motion.div>

        {/* CTA Button */}
        {isTenantAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <button
              onClick={onCreateSchool}
              className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:from-teal-600 hover:to-cyan-700 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Create School</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom capabilities section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]/50"
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-5">
            <Zap className="w-3.5 h-3.5" />
            <span>What you can do with schools</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: GraduationCap, label: 'Academic Programs', desc: 'Courses & Curriculum' },
              { icon: Users, label: 'Staff Management', desc: 'Teachers & Admins' },
              { icon: Calendar, label: 'School Calendar', desc: 'Terms & Schedules' },
              { icon: Layers, label: 'Departments', desc: 'Organization Units' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-[rgb(var(--surface-tertiary))] transition-colors cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center mb-2">
                  <item.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.label}</span>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">{item.desc}</span>
              </motion.div>
            ))}
          </div>

          {/* Quick link to workspace settings */}
          {isTenantAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center mt-5 pt-5 border-t border-[rgb(var(--border-primary))]"
            >
              <Link
                to="/settings/workspace"
                className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Configure workspace defaults first</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-[rgb(var(--surface-tertiary))] rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-[rgb(var(--surface-tertiary))] rounded mt-2 animate-pulse" />
        </div>
      </div>
      <div className="h-11 w-full bg-[rgb(var(--surface-tertiary))] rounded-xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-[rgb(var(--surface-tertiary))] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-[rgb(var(--surface-tertiary))] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================

interface CollapsibleSectionProps {
  title: string
  description: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  status: SectionStatus
  required?: boolean
  children: React.ReactNode
  onSave?: () => void
  onSkip?: () => void
  isSaving?: boolean
  showSkip?: boolean
}

function CollapsibleSection({
  title,
  description,
  icon: Icon,
  isOpen,
  onToggle,
  status,
  required,
  children,
  onSave,
  onSkip,
  isSaving,
  showSkip = true,
}: CollapsibleSectionProps) {
  const getStatusBadge = () => {
    if (status.completed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400">
          <Check className="w-3 h-3" />
          Complete
        </span>
      )
    }
    if (status.skipped) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
          Skipped
        </span>
      )
    }
    if (required) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rust-500/10 text-rust-600 dark:text-rust-400">
          Required
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
        Optional
      </span>
    )
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgb(var(--surface-tertiary))]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            status.completed 
              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' 
              : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[rgb(var(--text-primary))]">{title}</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-2 border-t border-[rgb(var(--border-primary))]">
              {children}

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgb(var(--border-secondary))]">
                {showSkip && !required && onSkip ? (
                  <button
                    onClick={onSkip}
                    className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
                  >
                    I'll do this later
                  </button>
                ) : (
                  <div />
                )}
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

interface ProgressTrackerProps {
  sections: SectionState
}

function ProgressTracker({ sections }: ProgressTrackerProps) {
  const weights = { basic: 40, location: 25, contact: 15, hours: 20 }
  
  let progress = 0
  if (sections.basic.completed) progress += weights.basic
  if (sections.location.completed || sections.location.skipped) progress += weights.location
  if (sections.contact.completed || sections.contact.skipped) progress += weights.contact
  if (sections.hours.completed || sections.hours.skipped) progress += weights.hours

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Setup Progress
        </span>
        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
          {progress}% Complete
        </span>
      </div>
      <div className="h-2 bg-[rgb(var(--surface-tertiary))] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
        />
      </div>
    </div>
  )
}

// ============================================================================
// INHERITED SETTINGS PREVIEW
// ============================================================================

interface InheritedSettingsPreviewProps {
  settings?: WorkspaceSettings
  isLoading: boolean
}

function InheritedSettingsPreview({ settings, isLoading }: InheritedSettingsPreviewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--surface-tertiary))] animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
            <div className="h-3 w-60 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-[rgb(var(--text-primary))] mb-2">
            Inherited from Workspace Settings
          </h4>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
            This school will inherit these defaults. You can override them in school configuration after creation.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[rgb(var(--text-tertiary))]">Timezone:</span>
              <span className="ml-2 text-[rgb(var(--text-primary))]">
                {settings.regional?.defaultTimezone || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-[rgb(var(--text-tertiary))]">Date Format:</span>
              <span className="ml-2 text-[rgb(var(--text-primary))]">
                {settings.regional?.defaultDateFormat || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-[rgb(var(--text-tertiary))]">Grading Scale:</span>
              <span className="ml-2 text-[rgb(var(--text-primary))]">
                {settings.policies?.defaultGradingScale || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-[rgb(var(--text-tertiary))]">Term Structure:</span>
              <span className="ml-2 text-[rgb(var(--text-primary))]">
                {settings.calendar?.defaultTermStructure || 'Not set'}
              </span>
            </div>
          </div>

          <Link
            to="/settings/workspace"
            className="inline-flex items-center gap-1 mt-4 text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Configure workspace settings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SCHOOL CREATION PAGE
// ============================================================================

interface SchoolCreatePageProps {
  onCancel: () => void
  onSuccess: () => void
}

function SchoolCreatePage({ onCancel, onSuccess }: SchoolCreatePageProps) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<SchoolFormData>(initialFormData)
  const [sections, setSections] = useState<SectionState>(initialSectionState)
  const [openSection, setOpenSection] = useState<string>('basic')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SchoolFormData, string>>>({})

  // Fetch workspace settings for inheritance preview
  const { data: workspaceSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['workspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user?.tenantId || ''),
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSchoolRequest) => tenantService.createSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools', user?.tenantId] })
      onSuccess()
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create school. Please try again.')
    },
  })

  // Auto-generate code from name
  useEffect(() => {
    if (formData.name && !formData.code) {
      const code = formData.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 5)
      setFormData(prev => ({ ...prev, code }))
    }
  }, [formData.name])

  const updateField = useCallback((field: keyof SchoolFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (error) setError(null)
  }, [fieldErrors, error])

  // Validation functions
  const validateBasicInfo = (): boolean => {
    const errors: Partial<Record<keyof SchoolFormData, string>> = {}
    if (!formData.name.trim()) errors.name = 'School name is required'
    if (!formData.code.trim()) errors.code = 'School code is required'
    if (formData.code.length > 10) errors.code = 'Code must be 10 characters or less'
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateLocation = (): boolean => {
    const errors: Partial<Record<keyof SchoolFormData, string>> = {}
    if (!formData.street1.trim()) errors.street1 = 'Address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required'
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateContact = (): boolean => {
    const errors: Partial<Record<keyof SchoolFormData, string>> = {}
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  // Section save handlers
  const handleSaveBasic = () => {
    if (validateBasicInfo()) {
      setSections(prev => ({ ...prev, basic: { completed: true, skipped: false } }))
      setOpenSection('location')
    }
  }

  const handleSaveLocation = () => {
    if (validateLocation()) {
      setSections(prev => ({ ...prev, location: { completed: true, skipped: false } }))
      setOpenSection('contact')
    }
  }

  const handleSaveContact = () => {
    if (validateContact()) {
      setSections(prev => ({ ...prev, contact: { completed: true, skipped: false } }))
      setOpenSection('hours')
    }
  }

  const handleSaveHours = () => {
    setSections(prev => ({ ...prev, hours: { completed: true, skipped: false } }))
    setOpenSection('')
  }

  // Skip handlers
  const handleSkipLocation = () => {
    setSections(prev => ({ ...prev, location: { completed: false, skipped: true } }))
    setOpenSection('contact')
  }

  const handleSkipContact = () => {
    setSections(prev => ({ ...prev, contact: { completed: false, skipped: true } }))
    setOpenSection('hours')
  }

  const handleSkipHours = () => {
    setSections(prev => ({ ...prev, hours: { completed: false, skipped: true } }))
    setOpenSection('')
  }

  // Create school
  const handleCreateSchool = () => {
    if (!sections.basic.completed) {
      setError('Please complete the Basic Information section')
      setOpenSection('basic')
      return
    }

    const request: CreateSchoolRequest = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
    }

    // Include location if provided
    if (sections.location.completed) {
      request.address = {
        street1: formData.street1.trim(),
        street2: formData.street2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
      }
    }

    // Include contact if provided
    if (sections.contact.completed) {
      if (formData.phone.trim()) request.phone = formData.phone.trim()
      if (formData.email.trim()) request.email = formData.email.trim()
    }

    createMutation.mutate(request)
  }

  // Day names for operating hours
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Schools
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
              Create New School
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Add a new school to your organization
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <ProgressTracker sections={sections} />

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <SettingsAlert
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}
        </AnimatePresence>

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Basic Information (Required) */}
          <CollapsibleSection
            title="Basic Information"
            description="School name, code, and type"
            icon={Building2}
            isOpen={openSection === 'basic'}
            onToggle={() => setOpenSection(openSection === 'basic' ? '' : 'basic')}
            status={sections.basic}
            required
            onSave={handleSaveBasic}
            showSkip={false}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  School Name <span className="text-rust-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.name ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-rust-500">{fieldErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    School Code <span className="text-rust-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    placeholder="e.g., LHS"
                    maxLength={10}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.code ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all font-mono`}
                  />
                  {fieldErrors.code && <p className="mt-1 text-xs text-rust-500">{fieldErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    School Type <span className="text-rust-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  >
                    <option value="elementary">Elementary School</option>
                    <option value="middle">Middle School</option>
                    <option value="high">High School</option>
                    <option value="k12">K-12</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Location & Address */}
          <CollapsibleSection
            title="Location & Address"
            description="Physical address and location details"
            icon={MapPin}
            isOpen={openSection === 'location'}
            onToggle={() => setOpenSection(openSection === 'location' ? '' : 'location')}
            status={sections.location}
            onSave={handleSaveLocation}
            onSkip={handleSkipLocation}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Address Line 1 <span className="text-rust-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.street1}
                  onChange={(e) => updateField('street1', e.target.value)}
                  placeholder="123 Main Street"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.street1 ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                />
                {fieldErrors.street1 && <p className="mt-1 text-xs text-rust-500">{fieldErrors.street1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Address Line 2 <span className="text-[rgb(var(--text-tertiary))] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.street2}
                  onChange={(e) => updateField('street2', e.target.value)}
                  placeholder="Suite 100, Building A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    City <span className="text-rust-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Springfield"
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.city ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                  />
                  {fieldErrors.city && <p className="mt-1 text-xs text-rust-500">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    State <span className="text-rust-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                    placeholder="IL"
                    maxLength={2}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.state ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all font-mono`}
                  />
                  {fieldErrors.state && <p className="mt-1 text-xs text-rust-500">{fieldErrors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    Postal Code <span className="text-rust-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="62701"
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${fieldErrors.postalCode ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                  />
                  {fieldErrors.postalCode && <p className="mt-1 text-xs text-rust-500">{fieldErrors.postalCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                    Country <span className="text-rust-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  >
                    <option value="USA">United States</option>
                    <option value="CAN">Canada</option>
                    <option value="GBR">United Kingdom</option>
                    <option value="AUS">Australia</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Contact Information */}
          <CollapsibleSection
            title="Contact Information"
            description="Phone, email, and website"
            icon={Phone}
            isOpen={openSection === 'contact'}
            onToggle={() => setOpenSection(openSection === 'contact' ? '' : 'contact')}
            status={sections.contact}
            onSave={handleSaveContact}
            onSkip={handleSkipContact}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.phone ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-rust-500">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="office@school.edu"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.email ? 'border-rust-500 focus:ring-rust-500/40' : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500'} bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-rust-500">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://school.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] focus:ring-teal-500/40 focus:border-teal-500 bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Operating Hours */}
          <CollapsibleSection
            title="Operating Hours"
            description="School operating hours (Mon-Fri)"
            icon={Clock}
            isOpen={openSection === 'hours'}
            onToggle={() => setOpenSection(openSection === 'hours' ? '' : 'hours')}
            status={sections.hours}
            onSave={handleSaveHours}
            onSkip={handleSkipHours}
          >
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                Set the default operating hours for this school. These can be customized later in school configuration.
              </p>
              
              {formData.operatingHours.map((day, index) => (
                <div 
                  key={day.dayOfWeek} 
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    day.isOpen 
                      ? 'bg-[rgb(var(--surface-tertiary))]' 
                      : 'bg-slate-500/5'
                  }`}
                >
                  <div className="w-24">
                    <span className={`text-sm font-medium ${
                      day.isOpen 
                        ? 'text-[rgb(var(--text-primary))]' 
                        : 'text-[rgb(var(--text-tertiary))]'
                    }`}>
                      {dayNames[day.dayOfWeek]}
                    </span>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => {
                        const newHours = [...formData.operatingHours]
                        newHours[index] = {
                          ...newHours[index],
                          isOpen: e.target.checked,
                          openTime: e.target.checked ? '08:00' : undefined,
                          closeTime: e.target.checked ? '16:00' : undefined,
                        }
                        updateField('operatingHours', newHours)
                      }}
                      className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-teal-500 focus:ring-teal-500/40"
                    />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">Open</span>
                  </label>

                  {day.isOpen && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={day.openTime || '08:00'}
                        onChange={(e) => {
                          const newHours = [...formData.operatingHours]
                          newHours[index] = { ...newHours[index], openTime: e.target.value }
                          updateField('operatingHours', newHours)
                        }}
                        className="px-2 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      />
                      <span className="text-[rgb(var(--text-tertiary))]">to</span>
                      <input
                        type="time"
                        value={day.closeTime || '16:00'}
                        onChange={(e) => {
                          const newHours = [...formData.operatingHours]
                          newHours[index] = { ...newHours[index], closeTime: e.target.value }
                          updateField('operatingHours', newHours)
                        }}
                        className="px-2 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Inherited Settings Preview */}
          <InheritedSettingsPreview 
            settings={workspaceSettings} 
            isLoading={loadingSettings}
          />
        </div>

        {/* Create School CTA */}
        <div className="rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
              Ready to create your school?
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mb-6">
              After creation, you can configure academic settings, departments, and staff assignments.
            </p>

            <div className="flex items-center gap-4">
              <p className="text-xs text-[rgb(var(--text-tertiary))] text-left flex-1">
                <strong>After creation, configure:</strong><br />
                Academic Settings (Grading, Terms) • Departments & Organization • Principal & Staff Assignments
              </p>

              <button
                onClick={handleCreateSchool}
                disabled={!sections.basic.completed || createMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Creating School...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create School & Continue Setup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// SCHOOL CARD
// ============================================================================

interface SchoolCardProps {
  school: SchoolType
  onDelete?: () => void
}

function SchoolCard({ school, onDelete }: SchoolCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  const typeLabels: Record<string, string> = {
    elementary: 'Elementary',
    middle: 'Middle School',
    high: 'High School',
    k12: 'K-12',
    other: 'Other',
  }

  const handleNavigate = () => {
    navigate({ to: '/settings/schools/$schoolId', params: { schoolId: school.id } })
  }

  return (
    <motion.div variants={fadeInUp}>
      <div onClick={handleNavigate} className="block cursor-pointer">
        <div className="relative p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            {/* School Avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-md shadow-teal-500/20">
              {school.name.charAt(0)}
            </div>

            {/* School Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[rgb(var(--text-primary))] group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors truncate">
                  {school.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${school.isActive ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400' : 'bg-slate-500/10 text-slate-600'}`}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                <span className="font-mono">{school.code}</span>
                {school.type && (
                  <>
                    <span>•</span>
                    <span>{typeLabels[school.type] || school.type}</span>
                  </>
                )}
                {school.address?.city && school.address?.state && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {school.address.city}, {school.address.state}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-all"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )}
              <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMenu && onDelete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-4 top-14 w-36 bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl border border-[rgb(var(--border-primary))] overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rust-500 hover:bg-rust-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolsSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Get ?create=true query parameter
  let createParam: string | undefined
  try {
    const searchParams = useSearch({ strict: false }) as { create?: string }
    createParam = searchParams?.create
  } catch {
    createParam = undefined
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Enter create mode if ?create=true
  useEffect(() => {
    if (createParam === 'true') {
      setIsCreateMode(true)
    }
  }, [createParam])

  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:school',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage schools." />
  }

  const {
    data: schools,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schools', user.tenantId],
    queryFn: () => tenantService.getSchools(user.tenantId),
    enabled: !!user.tenantId,
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (schoolId: string) => tenantService.deleteSchool(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools', user.tenantId] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to delete school')
    },
  })

  const handleCreateSchool = () => {
    navigate({ to: '/settings/schools', search: { create: 'true' } })
    setIsCreateMode(true)
  }

  const handleCancelCreate = () => {
    navigate({ to: '/settings/schools', search: { create: undefined }, replace: true })
    setIsCreateMode(false)
  }

  const handleCreateSuccess = () => {
    navigate({ to: '/settings/schools', search: { create: undefined }, replace: true })
    setIsCreateMode(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const isTenantAdmin = user.globalRole === 'TenantAdmin'
  const displaySchools: SchoolType[] = Array.isArray(schools) ? schools : []
  const filteredSchools = displaySchools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.code.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const hasSchools = displaySchools.length > 0

  // Show create page if in create mode
  if (isCreateMode) {
    return (
      <SchoolCreatePage
        onCancel={handleCancelCreate}
        onSuccess={handleCreateSuccess}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <LoadingState />
      </div>
    )
  }

  // Empty state - full width experience
  if (!hasSchools && !isError) {
    return (
      <>
        {/* Alerts */}
        <div className="max-w-3xl mx-auto px-6 pt-6">
          <AnimatePresence>
            {saveSuccess && (
              <SettingsAlert
                type="success"
                message="School created successfully"
                onDismiss={() => setSaveSuccess(false)}
                autoDismiss
                autoDismissDelay={2000}
              />
            )}
            {saveError && (
              <SettingsAlert
                type="error"
                message={saveError}
                onDismiss={() => setSaveError(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <EmptyState 
          onCreateSchool={handleCreateSchool} 
          isTenantAdmin={isTenantAdmin}
        />
      </>
    )
  }

  // Schools list view
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Schools</h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
              {displaySchools.length} school{displaySchools.length !== 1 ? 's' : ''} in your organization
            </p>
          </div>
          {isTenantAdmin && (
            <Button onClick={handleCreateSchool} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add School
            </Button>
          )}
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {saveSuccess && (
            <SettingsAlert
              type="success"
              message="Changes saved"
              onDismiss={() => setSaveSuccess(false)}
              autoDismiss
              autoDismissDelay={2000}
            />
          )}
          {saveError && (
            <SettingsAlert
              type="error"
              message={saveError}
              onDismiss={() => setSaveError(null)}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div variants={fadeInUp}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
            />
          </div>
        </motion.div>

        {/* Schools List */}
        <div className="space-y-2">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onDelete={isTenantAdmin ? () => deleteMutation.mutate(school.id) : undefined}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                No schools match "{searchQuery}"
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-12 h-12 rounded-full bg-rust-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-6 h-6 text-rust-500" />
        </div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">Access Denied</h2>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
