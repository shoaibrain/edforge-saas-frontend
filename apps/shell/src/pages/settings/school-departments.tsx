/**
 * School Departments Page
 * 
 * Manage departments for a school using DataTable with modal CRUD.
 * Supports both tenant-scoped (shared) and school-scoped departments.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
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
import type { RowSelectionState } from '@tanstack/react-table'
import { tenantService } from '@/services/tenant.service'
import { useAuthStore } from '@/stores/auth.store'
import { can } from '@edforge/abac'
import type { Department, CreateDepartmentDto } from '@edforge/types'
import { Button, TanstackDataTable, createActionsColumn, createSelectColumn, SelectionContextBar, type SelectionAction, type ColumnDef, type FacetedFilterConfig } from '@edforge/ui'

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
  const { t } = useTranslation('settings')
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
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {mode === 'create' ? t('schoolDepartments.form.createTitle') : t('schoolDepartments.form.editTitle')}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {mode === 'create' ? t('schoolDepartments.form.createDescription') : t('schoolDepartments.form.editDescription')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolDepartments.form.name')} <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
              placeholder={t('schoolDepartments.form.namePlaceholder')}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolDepartments.form.code')} <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={mode === 'edit'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t('schoolDepartments.form.codePlaceholder')}
              required
              minLength={2}
              maxLength={10}
            />
            {mode === 'create' && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                {t('schoolDepartments.form.codeHint')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolDepartments.form.description')} <span className="text-[rgb(var(--text-tertiary))] font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all resize-none"
              rows={3}
              maxLength={500}
              placeholder={t('schoolDepartments.form.descriptionPlaceholder')}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant={'outline'} type="submit" isLoading={isLoading}>
              {mode === 'create' ? t('schoolDepartments.actions.create') : t('common.saveChanges')}
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
  const { t } = useTranslation('settings')
  if (!isOpen || !department) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rust-500/10">
            <AlertTriangle className="w-5 h-5 text-rust-500" />
          </div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('schoolDepartments.delete.title')}</h2>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
          {t('schoolDepartments.delete.descriptionPrefix')} <strong>"{department.name}"</strong>? {t('schoolDepartments.delete.descriptionSuffix')}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            {t('common.delete')}
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
  const { t } = useTranslation('settings')
  if (scope === 'tenant') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ">
        <Globe className="w-3 h-3" />
        {t('schoolDepartments.scope.organization')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--state-info-fg))] ">
      <Building2 className="w-3 h-3" />
      {t('schoolDepartments.scope.school')}
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
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [modalState, setModalState] = useState<{
    mode: 'create' | 'edit' | 'delete' | null
    department: Department | null
  }>({ mode: null, department: null })
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<Department[] | null>(null)
  // Lifted selection state so the bulk-delete confirm can clear it (⑨).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

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

  // Search remains a page-level input (lives outside the DataTable card
  // alongside the Add Department button). The scope filter has moved into
  // the DataTable's `facets` slot below — it's purely client-side, so the
  // facet's per-value counts stay accurate.
  const filteredDepartments = useMemo(() => {
    const all = departments || []
    if (!searchQuery.trim()) return all
    const query = searchQuery.toLowerCase()
    return all.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query),
    )
  }, [departments, searchQuery])

  const scopeFacet: FacetedFilterConfig = {
    columnId: 'scope',
    title: t('schoolDepartments.table.scope'),
    options: [
      { value: 'tenant', label: t('schoolDepartments.scope.organization') },
      { value: 'school', label: t('schoolDepartments.scope.school') },
    ],
  }

  // ── ⑨ Selection Context Bar — retires the legacy floating pill. Every
  // selected department is deletable today (no disqualifying state), so the
  // action applies to the full selection; it renders locked (visible, not
  // hidden) for roles without `departments:delete`.
  const { user } = useAuthStore.getState()
  const canDeleteDepartments = user
    ? can(user, { action: 'delete', resource: 'departments', schoolId })
    : false

  const selectedDepartments = useMemo(() => {
    const all = departments ?? []
    const ids = new Set(Object.keys(rowSelection).filter((id) => rowSelection[id]))
    return all.filter((d) => ids.has(d.id))
  }, [departments, rowSelection])

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const byId = new Map(selectedDepartments.map((d) => [d.id, d]))
    const rowsFor = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((d): d is Department => !!d)
    return [
      {
        id: 'delete',
        label: t('schoolDepartments.actions.deleteSelected'),
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        applicableIds: selectedDepartments.map((d) => d.id),
        locked: !canDeleteDepartments,
        lockedReason: t('schoolDepartments.selection.lockedDelete'),
        onAction: (ids) => setBulkDeleteTarget(rowsFor(ids)),
      },
    ]
  }, [selectedDepartments, canDeleteDepartments, t])

  const singleDepartment = selectedDepartments.length === 1 ? selectedDepartments[0] : null
  const selectionBar = (
    <SelectionContextBar
      selectedCount={selectedDepartments.length}
      totalCount={filteredDepartments.length}
      onClear={() => setRowSelection({})}
      onSelectAll={() =>
        setRowSelection(Object.fromEntries(filteredDepartments.map((d) => [d.id, true])))
      }
      actions={selectionActions}
      aria-label={t('headerZone.selection.aria')}
      labels={{
        selected: (count) => t('headerZone.selection.selected', { count }),
        selectAll: (total) => t('headerZone.selection.selectAll', { count: total }),
        clear: t('headerZone.selection.clear'),
      }}
      peek={
        singleDepartment ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {singleDepartment.name}
            </div>
            <div className="truncate font-mono text-2xs text-[rgb(var(--text-tertiary))]">
              {singleDepartment.code}
            </div>
          </div>
        ) : undefined
      }
    />
  )

  // Table columns
  const columns: ColumnDef<Department, unknown>[] = useMemo(() => [
    createSelectColumn<Department>(),
    {
      accessorKey: 'code',
      header: t('schoolDepartments.table.code'),
      size: 100,
      meta: { mobile: { area: 'trailing' } },
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[rgb(var(--text-secondary))]">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: t('schoolDepartments.table.name'),
      meta: { mobile: { area: 'title' } },
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
      header: t('schoolDepartments.table.scope'),
      filterFn: 'arrIncludesSome',
      cell: ({ row }) => <ScopeBadge scope={row.original.scope} />,
    },
    {
      id: 'headName',
      accessorFn: (dept) => dept.headName ?? '',
      header: t('schoolDepartments.table.departmentHead'),
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
            className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
            title={t('schoolDepartments.actions.edit')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalState({ mode: 'delete', department: row.original })}
            className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-rust-500 hover:bg-rust-500/10 transition-colors"
            title={t('schoolDepartments.actions.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ], [t])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('schoolDepartments.title')}</h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {t('schoolDepartments.description')}
          </p>
        </div>
        <Button variant={'outline'} onClick={() => setModalState({ mode: 'create', department: null })}>
          <Plus className="w-4 h-4 mr-1.5" />
          {t('schoolDepartments.actions.add')}
        </Button>
      </div>

      {/* Search lives outside the DataTable card so it stays visible next to
          the Add Department button (a settings-page convention). Scope is a
          DataTable facet for live per-value counts. */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder={t('schoolDepartments.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
          />
        </div>
      </div>

      {/* DataTable */}
      <TanstackDataTable
        columns={columns}
        data={filteredDepartments}
        getRowId={(dept) => dept.id}
        isLoading={isLoading}
        tableId="shell.departments"
        enableSorting
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableColumnVisibility
        facets={[scopeFacet]}
        selectionBar={selectionBar}
        exportOptions={{ filename: 'departments', formats: ['csv'] }}
        defaultSort={[{ id: 'name', desc: false }]}
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        maxHeight="calc(100vh - 15rem)"
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: searchQuery ? t('schoolDepartments.empty.noMatches', { query: searchQuery }) : t('schoolDepartments.empty.title'),
          description: searchQuery
            ? t('schoolDepartments.empty.adjustSearch')
            : t('schoolDepartments.empty.description'),
          action: !searchQuery ? {
            label: t('schoolDepartments.actions.create'),
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
        {bulkDeleteTarget && bulkDeleteTarget.length > 0 && (
          <BulkDeleteConfirmModal
            departments={bulkDeleteTarget}
            onClose={() => setBulkDeleteTarget(null)}
            onConfirm={async () => {
              // No backend bulk endpoint yet — fan out the existing single-row
              // mutation and surface aggregate success/failure to the operator.
              const results = await Promise.allSettled(
                bulkDeleteTarget.map((d) => deleteMutation.mutateAsync(d.id)),
              )
              const failures = results.filter((r) => r.status === 'rejected').length
              setBulkDeleteTarget(null)
              setRowSelection({})
              if (failures === 0) {
                toast.success(t('schoolDepartments.bulkDelete.success', { count: results.length }))
              } else {
                toast.error(t('schoolDepartments.bulkDelete.partial', { deleted: results.length - failures, failed: failures }))
              }
            }}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// BULK DELETE CONFIRM MODAL
// ============================================================================

function BulkDeleteConfirmModal({
  departments,
  onClose,
  onConfirm,
  isDeleting,
}: {
  departments: Department[]
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  const { t } = useTranslation('settings')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rust-500/10">
            <AlertTriangle className="w-5 h-5 text-rust-500" />
          </div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('schoolDepartments.bulkDelete.title', { count: departments.length })}
          </h2>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
          {t('schoolDepartments.bulkDelete.description')}
        </p>
        <ul className="mb-6 max-h-40 overflow-y-auto rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-2 space-y-1">
          {departments.map((d) => (
            <li key={d.id} className="text-sm text-[rgb(var(--text-primary))]">
              <span className="font-mono text-xs text-[rgb(var(--text-tertiary))] mr-2">{d.code}</span>
              {d.name}
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            {t('schoolDepartments.bulkDelete.confirm', { count: departments.length })}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
