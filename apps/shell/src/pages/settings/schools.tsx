/**
 * School Settings Page
 *
 * School list view + creation wizard routing.
 * The creation form lives in the SchoolWizard component.
 */

import { useState, useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useSearch, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  School,
  ShieldX,
  Plus,
  Search,
  MapPin,
  Users,
  Calendar,
  Trash2,
  GraduationCap,
  ArrowRight,
  Globe,
  Layers,
  Zap,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import type { School as SchoolType } from '@edforge/types'
import {
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SchoolWizard } from '@/components/settings/school-wizard'

// ============================================================================
// SCHOOL TYPE LABELS
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
  other: 'Other',
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
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
      ${isActive
        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
      }
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-teal-500' : 'bg-slate-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ============================================================================
// SCHOOL NAME CELL
// ============================================================================

function SchoolNameCell({ school }: { school: SchoolType }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
        {school.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-[rgb(var(--text-primary))] truncate">
          {school.name}
        </div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] font-mono">
          {school.code}
        </div>
      </div>
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolsSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Get query parameters
  let createParam: string | undefined
  let leaIdParam: string | undefined
  try {
    const searchParams = useSearch({ strict: false }) as { create?: string; leaId?: string }
    createParam = searchParams?.create
    leaIdParam = searchParams?.leaId
  } catch {
    createParam = undefined
    leaIdParam = undefined
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

  // Fetch schools using regular query
  const {
    data: schools = [],
    isLoading,
    error,
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
    navigate({ to: '/settings/schools', search: { create: 'true', leaId: undefined } })
    setIsCreateMode(true)
  }

  const handleCancelCreate = () => {
    navigate({ to: '/settings/schools', search: { create: undefined, leaId: undefined }, replace: true })
    setIsCreateMode(false)
  }

  const handleCreateSuccess = () => {
    navigate({ to: '/settings/schools', search: { create: undefined, leaId: undefined }, replace: true })
    setIsCreateMode(false)
    queryClient.invalidateQueries({ queryKey: ['schools', user.tenantId] })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleRowClick = (school: SchoolType) => {
    if (school.id) {
      navigate({ to: '/settings/schools/$schoolId', params: { schoolId: school.id } })
    }
  }

  const isTenantAdmin = user.globalRole === 'TenantAdmin'

  // Filter schools by search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools
    const query = searchQuery.toLowerCase()
    return schools.filter((school) =>
      school.name.toLowerCase().includes(query) ||
      school.code.toLowerCase().includes(query)
    )
  }, [schools, searchQuery])

  // Define table columns
  const columns: Column<SchoolType>[] = useMemo(() => [
    {
      key: 'name',
      header: 'School Name',
      sortable: true,
      render: (school) => <SchoolNameCell school={school} />,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (school) => (
        <span className="text-[rgb(var(--text-secondary))]">
          {SCHOOL_TYPE_LABELS[school.type || ''] || school.type || '\u2014'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (school) => <StatusBadge isActive={school.isActive} />,
    },
    {
      key: 'location',
      header: 'Location',
      render: (school) => (
        school.address?.city && school.address?.state ? (
          <span className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
            <MapPin className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            {school.address.city}, {school.address.state}
          </span>
        ) : (
          <span className="text-[rgb(var(--text-tertiary))]">{'\u2014'}</span>
        )
      ),
    },
  ], [])

  // Show wizard if in create mode
  if (isCreateMode) {
    return (
      <SchoolWizard
        onCancel={handleCancelCreate}
        onSuccess={handleCreateSuccess}
        initialLeaId={leaIdParam}
      />
    )
  }

  // Empty state - full width experience
  if (!isLoading && schools.length === 0 && !error) {
    return (
      <>
        {/* Alerts */}
        <div className="max-w-5xl mx-auto px-6 pt-6">
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

  // Schools list view with DataTable
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
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
              Manage schools in your organization
            </p>
          </div>
          {isTenantAdmin && (
            <Button onClick={handleCreateSchool} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create School
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
          <div className="relative max-w-md">
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

        {/* Schools DataTable */}
        <motion.div variants={fadeInUp}>
          <DataTable
            columns={columns}
            data={filteredSchools}
            keyExtractor={(school) => school.id}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            rowActions={isTenantAdmin ? (school) => (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${school.name}"?`)) {
                    deleteMutation.mutate(school.id)
                  }
                }}
                className="p-2 rounded-lg hover:bg-rust-500/10 text-[rgb(var(--text-tertiary))] hover:text-rust-500 transition-colors"
                title="Delete school"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : undefined}
            emptyState={{
              icon: <Search className="w-10 h-10" />,
              title: searchQuery ? `No schools match "${searchQuery}"` : 'No schools found',
              description: searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first school to get started',
              action: !searchQuery && isTenantAdmin ? {
                label: 'Create School',
                onClick: handleCreateSchool,
              } : undefined,
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
