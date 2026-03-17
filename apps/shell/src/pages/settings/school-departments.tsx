/**
 * School Departments Page
 * 
 * Manage departments for a school using DataTable with modal CRUD.
 * Supports both tenant-scoped (shared) and school-scoped departments.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Search,
  Building2,
  Globe,
  Edit,
  Trash2,
  UserCircle,
  X,
  AlertTriangle,
} from 'lucide-react'
import { tenantService } from '@/services/tenant.service'
import type { Department, CreateDepartmentDto } from '@edforge/types'
import { Button, TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'

// ============================================================================
// DEPARTMENT FORM MODAL
// ============================================================================

interface DepartmentFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  department?: Department | null
  onClose: () => void
  onSubmit: (data: CreateDepartmentDto) => void
  isLoading: boolean
}

function DepartmentFormModal({
  isOpen,
  mode,
  department,
  onClose,
  onSubmit,
  isLoading,
}: DepartmentFormModalProps) {
  const [name, setName] = useState(department?.name || '')
  const [code, setCode] = useState(department?.code || '')
  const [description, setDescription] = useState(department?.description || '')

  // Reset form when modal opens/closes or department changes
  useState(() => {
    if (isOpen && department) {
      setName(department.name)
      setCode(department.code)
      setDescription(department.description || '')
    } else if (isOpen && !department) {
      setName('')
      setCode('')
      setDescription('')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      code,
      description: description || undefined,
    } as CreateDepartmentDto)
  }

  if (!isOpen) return null

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
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {mode === 'create' ? 'Create Department' : 'Edit Department'}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {mode === 'create' ? 'Add a new department to this school' : 'Update department details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Department Name <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
              placeholder="e.g., Science"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Code <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={mode === 'edit'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., SCI"
              required
              minLength={2}
              maxLength={10}
            />
            {mode === 'create' && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                2-10 characters. Cannot be changed after creation.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Description <span className="text-[rgb(var(--text-tertiary))] font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all resize-none"
              rows={3}
              maxLength={500}
              placeholder="Brief description of the department"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={'outline'} type="submit" isLoading={isLoading}>
              {mode === 'create' ? 'Create Department' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  isOpen: boolean
  department: Department | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteConfirmModal({ isOpen, department, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) {
  if (!isOpen || !department) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rust-500/10">
            <AlertTriangle className="w-5 h-5 text-rust-500" />
          </div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Delete Department</h2>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
          Are you sure you want to delete <strong>"{department.name}"</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// SCOPE BADGE
// ============================================================================

function ScopeBadge({ scope }: { scope: 'tenant' | 'school' }) {
  if (scope === 'tenant') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400">
        <Globe className="w-3 h-3" />
        Organization
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400">
      <Building2 className="w-3 h-3" />
      School
    </span>
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
  const [modalState, setModalState] = useState<{
    mode: 'create' | 'edit' | 'delete' | null
    department: Department | null
  }>({ mode: null, department: null })

  // Fetch departments
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', schoolId],
    queryFn: () => tenantService.getDepartments(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentDto) => tenantService.createDepartment(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      setModalState({ mode: null, department: null })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (departmentId: string) => tenantService.deleteDepartment(schoolId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      setModalState({ mode: null, department: null })
    },
  })

  // Filter departments
  const filteredDepartments = useMemo(() => {
    let result = departments || []
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (dept) =>
          dept.name.toLowerCase().includes(query) ||
          dept.code.toLowerCase().includes(query)
      )
    }
    
    // Apply scope filter
    if (filterScope !== 'all') {
      result = result.filter((dept) => dept.scope === filterScope)
    }
    
    return result
  }, [departments, searchQuery, filterScope])

  // Table columns
  const columns: ColumnDef<Department, unknown>[] = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'Code',
      size: 100,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[rgb(var(--text-secondary))]">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const dept = row.original
        return (
          <div>
            <div className="font-medium text-[rgb(var(--text-primary))]">{dept.name}</div>
            {dept.description && (
              <div className="text-xs text-[rgb(var(--text-tertiary))] truncate max-w-xs">
                {dept.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => <ScopeBadge scope={row.original.scope} />,
    },
    {
      id: 'headName',
      accessorFn: (dept) => dept.headName ?? '',
      header: 'Department Head',
      cell: ({ row }) => {
        const dept = row.original
        return dept.headName ? (
          <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
            <UserCircle className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            {dept.headName}
          </span>
        ) : (
          <span className="text-sm text-[rgb(var(--text-tertiary))]">--</span>
        )
      },
    },
    createActionsColumn<Department>({
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModalState({ mode: 'edit', department: row.original })}
            className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
            title="Edit department"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalState({ mode: 'delete', department: row.original })}
            className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-rust-500 hover:bg-rust-500/10 transition-colors"
            title="Delete department"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ], [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Departments</h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            Manage academic and administrative departments
          </p>
        </div>
        <Button variant={'outline'} onClick={() => setModalState({ mode: 'create', department: null })}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
          />
        </div>

        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
          className="px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
        >
          <option value="all">All Scopes</option>
          <option value="school">School Only</option>
          <option value="tenant">Organization</option>
        </select>
      </div>

      {/* DataTable */}
      <TanstackDataTable
        columns={columns}
        data={filteredDepartments}
        getRowId={(dept) => dept.id}
        isLoading={isLoading}
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: searchQuery ? `No departments match "${searchQuery}"` : 'No departments found',
          description: searchQuery
            ? 'Try adjusting your search or filter'
            : 'Create your first department to organize your school',
          action: !searchQuery ? {
            label: 'Create Department',
            onClick: () => setModalState({ mode: 'create', department: null }),
          } : undefined,
        }}
      />

      {/* Modals */}
      <AnimatePresence>
        {modalState.mode === 'create' && (
          <DepartmentFormModal
            isOpen={true}
            mode="create"
            onClose={() => setModalState({ mode: null, department: null })}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        )}
        {modalState.mode === 'edit' && modalState.department && (
          <DepartmentFormModal
            isOpen={true}
            mode="edit"
            department={modalState.department}
            onClose={() => setModalState({ mode: null, department: null })}
            onSubmit={(data) => {
              // Note: Edit functionality is limited until backend supports PATCH
              createMutation.mutate(data)
            }}
            isLoading={createMutation.isPending}
          />
        )}
        {modalState.mode === 'delete' && modalState.department && (
          <DeleteConfirmModal
            isOpen={true}
            department={modalState.department}
            onClose={() => setModalState({ mode: null, department: null })}
            onConfirm={() => deleteMutation.mutate(modalState.department!.id)}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
