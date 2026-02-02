/**
 * School Departments Page
 * 
 * Manage departments for a school.
 * Supports both tenant-scoped (shared) and school-scoped departments.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Search,
  Building2,
  Globe,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCircle,
} from 'lucide-react'
import { tenantService } from '@/services/tenant.service'
import type { Department, CreateDepartmentDto } from '@edforge/types'
import {
  SettingsSection,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { Button } from '@edforge/ui'


// ============================================================================
// DEPARTMENT FORM MODAL (CREATE ONLY)
// Note: Edit functionality is disabled until backend API supports it
// ============================================================================

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateDepartmentDto) => void
  isLoading: boolean
  schoolId: string
}

function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  schoolId: _schoolId,
}: DepartmentFormModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setCode('')
      setDescription('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Note: Backend only accepts code, name, description, headUserId
    // Scope and schoolId are determined by the API endpoint path
    onSubmit({
      name,
      code,
      description: description || undefined,
    } as CreateDepartmentDto)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-[rgb(var(--border-primary))]">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Create Department
          </h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Department will be created for this school
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Department Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))]"
              placeholder="e.g. Science"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))]"
              placeholder="e.g. SCI"
              required
              minLength={2}
              maxLength={10}
            />
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              2-10 characters. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Description <span className="text-[rgb(var(--text-tertiary))]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))]"
              rows={3}
              maxLength={500}
              placeholder="Brief description of the department"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Create Department
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================================================
// DEPARTMENT CARD
// ============================================================================

interface DepartmentCardProps {
  department: Department
  onDelete: () => void
}

function DepartmentCard({ department, onDelete }: DepartmentCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      variants={fadeInUp}
      className="p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`
            p-2 rounded-lg
            ${department.scope === 'tenant'
              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
              : 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
            }
          `}>
            {department.scope === 'tenant' ? <Globe className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">{department.name}</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">{department.code}</p>
            {department.description && (
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">{department.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${department.scope === 'tenant'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                  : 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                }
              `}>
                {department.scope === 'tenant' ? 'Organization-wide' : 'School-specific'}
              </span>
              {department.headName && (
                <span className="text-xs text-[rgb(var(--text-tertiary))] flex items-center gap-1">
                  <UserCircle className="w-3 h-3" />
                  {department.headName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 w-40 bg-[rgb(var(--surface-primary))] rounded-xl shadow-lg border border-[rgb(var(--border-primary))] overflow-hidden z-10"
              >
                {/* Edit disabled: Backend API endpoint not yet implemented */}
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-tertiary))] cursor-not-allowed"
                  title="Edit functionality coming soon"
                >
                  <Edit className="w-4 h-4" />
                  Edit (Coming Soon)
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rust-500 hover:bg-rust-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolDepartmentsPageProps {
  schoolId: string
}

export default function SchoolDepartmentsPage({ schoolId }: SchoolDepartmentsPageProps) {
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterScope, setFilterScope] = useState<'all' | 'school' | 'tenant'>('all')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch departments
  const {
    data: departments,
    isLoading,
  } = useQuery({
    queryKey: ['departments', schoolId],
    queryFn: () => tenantService.getDepartments(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentDto) =>
      tenantService.createDepartment(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      setIsFormModalOpen(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to create department')
    },
  })

  // Note: Update mutation disabled - backend API endpoint not yet implemented
  // Will be re-enabled when PATCH /schools/{schoolId}/departments/{departmentId} is available

  const handleOpenCreate = () => {
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = (data: CreateDepartmentDto) => {
    createMutation.mutate(data)
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (departmentId: string) =>
      tenantService.deleteDepartment(schoolId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to delete department')
    },
  })

  const displayDepartments = departments || []

  // Filter departments
  const filteredDepartments = displayDepartments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesScope = filterScope === 'all' || dept.scope === filterScope
    return matchesSearch && matchesScope
  })

  const schoolDepts = filteredDepartments.filter((d) => d.scope === 'school')
  const tenantDepts = filteredDepartments.filter((d) => d.scope === 'tenant')

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-6"
    >
      {/* Alerts */}
      <AnimatePresence>
        {saveSuccess && (
          <SettingsAlert
            type="success"
            message="Department saved"
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

      {/* Search and Filters */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>

        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
          className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        >
          <option value="all">All Scopes</option>
          <option value="school">School Only</option>
          <option value="tenant">Organization</option>
        </select>

        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </motion.div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center text-[rgb(var(--text-secondary))]">
            <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent animate-spin mx-auto mb-2" />
            <p>Loading departments...</p>
          </div>
        ) : (
          <>
            {/* School-specific Departments */}
            {schoolDepts.length > 0 && (
              <SettingsSection
                title="School Departments"
                icon={Building2}
                description="Departments specific to this school"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {schoolDepts.map((dept) => (
                      <DepartmentCard
                        key={dept.id}
                        department={dept}
                        onDelete={() => {
                          if (confirm('Are you sure you want to delete this department?')) {
                            deleteMutation.mutate(dept.id)
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SettingsSection>
            )}

            {/* Tenant-wide Departments */}
            {tenantDepts.length > 0 && (
              <SettingsSection
                title="Organization Departments"
                icon={Globe}
                description="Shared across all schools in your organization"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {tenantDepts.map((dept) => (
                      <DepartmentCard
                        key={dept.id}
                        department={dept}
                        onDelete={() => {
                          if (confirm('Are you sure you want to delete this department?')) {
                            deleteMutation.mutate(dept.id)
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SettingsSection>
            )}

            {/* Empty State */}
            {filteredDepartments.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-[rgb(var(--surface-tertiary))] inline-flex mb-4">
                  <Users className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
                </div>
                <h3 className="font-medium text-[rgb(var(--text-primary))] mb-1">No Departments Found</h3>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first department to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Department
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <DepartmentFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isLoading={createMutation.isPending}
            schoolId={schoolId}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
