/**
 * School Departments Page
 * 
 * Manage departments for a school.
 * Supports both tenant-scoped (shared) and school-scoped departments.
 */

import { useState } from 'react'
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
import { useAuthStore } from '@/stores/auth.store'
import { tenantService } from '@/services/tenant.service'
import {
  SettingsSection,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { Button } from '@edforge/ui'

// ============================================================================
// LOCAL TYPES (until @edforge/types is rebuilt)
// ============================================================================

type DepartmentScope = 'tenant' | 'school'

interface Department {
  id: string
  tenantId: string
  scope: DepartmentScope
  schoolId?: string
  name: string
  code: string
  description?: string
  headId?: string
  headName?: string
  parentDepartmentId?: string
  isActive: boolean
  budget?: {
    fiscalYear: string
    allocatedAmount: number
    spentAmount: number
    currency: string
  }
  createdAt: string
  updatedAt: string
}

interface CreateDepartmentDto {
  name: string
  code: string
  scope: DepartmentScope
  schoolId?: string
  description?: string
  headId?: string
  parentDepartmentId?: string
}

// ============================================================================
// CREATE DEPARTMENT MODAL
// ============================================================================

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateDepartmentDto) => void
  isLoading: boolean
  schoolId: string
}

function CreateDepartmentModal({ isOpen, onClose, onSubmit, isLoading, schoolId }: CreateDepartmentModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [scope, setScope] = useState<DepartmentScope>('school')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      code,
      scope,
      schoolId: scope === 'school' ? schoolId : undefined,
      description: description || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-4">Create Department</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Mathematics"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Department Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g., MATH"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('school')}
                className={`
                  flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                  ${scope === 'school' 
                    ? 'border-teal-500 bg-teal-500/5' 
                    : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                  }
                `}
              >
                <Building2 className={`w-5 h-5 ${scope === 'school' ? 'text-teal-600' : 'text-[rgb(var(--text-tertiary))]'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${scope === 'school' ? 'text-teal-700 dark:text-teal-400' : 'text-[rgb(var(--text-primary))]'}`}>
                    School
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">This school only</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setScope('tenant')}
                className={`
                  flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                  ${scope === 'tenant' 
                    ? 'border-teal-500 bg-teal-500/5' 
                    : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                  }
                `}
              >
                <Globe className={`w-5 h-5 ${scope === 'tenant' ? 'text-teal-600' : 'text-[rgb(var(--text-tertiary))]'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${scope === 'tenant' ? 'text-teal-700 dark:text-teal-400' : 'text-[rgb(var(--text-primary))]'}`}>
                    Organization
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">All schools</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the department"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !code}
              className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Department'}
            </button>
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
  onEdit: () => void
  onDelete: () => void
}

function DepartmentCard({ department, onEdit, onDelete }: DepartmentCardProps) {
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
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))]"
                >
                  <Edit className="w-4 h-4" />
                  Edit
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
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterScope, setFilterScope] = useState<'all' | 'school' | 'tenant'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch departments
  const {
    data: departments,
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
      setIsCreateModalOpen(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to create department')
    },
  })

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

  // Mock data if API fails
  const displayDepartments: Department[] = departments || [
    {
      id: 'dept-1',
      tenantId: user?.tenantId || '',
      scope: 'school',
      schoolId,
      name: 'Mathematics',
      code: 'MATH',
      description: 'Math instruction and curriculum',
      headName: 'Dr. Smith',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'dept-2',
      tenantId: user?.tenantId || '',
      scope: 'school',
      schoolId,
      name: 'English',
      code: 'ENG',
      description: 'English language arts',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'dept-3',
      tenantId: user?.tenantId || '',
      scope: 'tenant',
      name: 'Human Resources',
      code: 'HR',
      description: 'Organization-wide HR department',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'dept-4',
      tenantId: user?.tenantId || '',
      scope: 'tenant',
      name: 'Finance',
      code: 'FIN',
      description: 'Organization-wide finance department',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

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

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </motion.div>

      {/* School-specific Departments */}
      {schoolDepts.length > 0 && (
        <SettingsSection
          title="School Departments"
          icon={Building2}
          description="Departments specific to this school"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schoolDepts.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                onEdit={() => console.log('Edit:', dept.id)}
                onDelete={() => deleteMutation.mutate(dept.id)}
              />
            ))}
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
            {tenantDepts.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                onEdit={() => console.log('Edit:', dept.id)}
                onDelete={() => deleteMutation.mutate(dept.id)}
              />
            ))}
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
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateDepartmentModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            schoolId={schoolId}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
