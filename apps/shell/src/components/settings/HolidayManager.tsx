/**
 * HolidayManager Component
 * 
 * Manage holidays for an academic year.
 * Supports creating and deleting holidays with type categorization.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  UserCircle,
  X,
  AlertTriangle,
} from 'lucide-react'
import { tenantService, type Holiday, type CreateHolidayDto } from '@/services/tenant.service'
import { Button, Select } from '@edforge/ui'

// ============================================================================
// CONSTANTS
// ============================================================================

const HOLIDAY_TYPE_OPTIONS: { value: Holiday['holidayType']; label: string }[] = [
  { value: 'federal', label: 'Federal Holiday' },
  { value: 'state', label: 'State Holiday' },
  { value: 'local', label: 'Local Holiday' },
  { value: 'school', label: 'School Holiday' },
  { value: 'religious', label: 'Religious Holiday' },
  { value: 'other', label: 'Other' },
]

const HOLIDAY_TYPE_COLORS: Record<Holiday['holidayType'], string> = {
  federal: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10 text-[rgb(var(--state-info-fg))] dark:text-[rgb(var(--state-info-fg))]',
  state: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  local: 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--state-info-fg))] ',
  school: 'bg-golden-500/10 text-golden-700 dark:text-golden-400',
  religious: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  other: 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]',
}

// ============================================================================
// CREATE HOLIDAY MODAL
// ============================================================================

interface CreateHolidayModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateHolidayDto) => void
  isLoading: boolean
}

function CreateHolidayModal({ isOpen, onClose, onSubmit, isLoading }: CreateHolidayModalProps) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [holidayType, setHolidayType] = useState<Holiday['holidayType']>('school')
  const [affectsStudents, setAffectsStudents] = useState(true)
  const [affectsStaff, setAffectsStaff] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      date,
      endDate: endDate || undefined,
      holidayType,
      affectsStudents,
      affectsStaff,
    })
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
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Add Holiday</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Create a new holiday for this academic year
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
              Holiday Name <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
              placeholder="e.g., Thanksgiving"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                Start Date <span className="text-rust-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                End Date <span className="text-[rgb(var(--text-tertiary))] font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
              />
            </div>
          </div>

          <Select
            label="Holiday Type"
            value={holidayType}
            onChange={(v) => { if (v) setHolidayType(v as Holiday['holidayType']) }}
            options={HOLIDAY_TYPE_OPTIONS}
          />

          {/* Affects toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Applies to</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={affectsStudents}
                  onChange={(e) => setAffectsStudents(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.40)]"
                />
                <span className="text-sm text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                  <UserCircle className="w-4 h-4" />
                  Students
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={affectsStaff}
                  onChange={(e) => setAffectsStaff(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.40)]"
                />
                <span className="text-sm text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Staff
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Add Holiday
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================================================
// DELETE CONFIRMATION
// ============================================================================

interface DeleteConfirmModalProps {
  isOpen: boolean
  holiday: Holiday | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteConfirmModal({ isOpen, holiday, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) {
  if (!isOpen || !holiday) return null

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
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Delete Holiday</h2>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
          Are you sure you want to delete <strong>"{holiday.name}"</strong>?
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
// HOLIDAY ITEM
// ============================================================================

interface HolidayItemProps {
  holiday: Holiday
  onDelete: () => void
}

function HolidayItem({ holiday, onDelete }: HolidayItemProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const dateRange = holiday.endDate && holiday.endDate !== holiday.date
    ? `${formatDate(holiday.date)} - ${formatDate(holiday.endDate)}`
    : formatDate(holiday.date)

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-tertiary))] group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(var(--background-tertiary))]">
          <Calendar className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[rgb(var(--text-primary))]">{holiday.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOLIDAY_TYPE_COLORS[holiday.holidayType]}`}>
              {HOLIDAY_TYPE_OPTIONS.find(o => o.value === holiday.holidayType)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            <span>{dateRange}</span>
            <span className="flex items-center gap-1">
              {holiday.affectsStudents && (
                <span className="flex items-center gap-0.5">
                  <UserCircle className="w-3 h-3" />
                  Students
                </span>
              )}
              {holiday.affectsStudents && holiday.affectsStaff && ' · '}
              {holiday.affectsStaff && (
                <span className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  Staff
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-rust-500 hover:bg-rust-500/10 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete holiday"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface HolidayManagerProps {
  schoolId: string
  yearId: string
}

export function HolidayManager({ schoolId, yearId }: HolidayManagerProps) {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null)

  // Fetch holidays
  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', schoolId, yearId],
    queryFn: () => tenantService.getHolidays(schoolId, yearId),
    enabled: !!schoolId && !!yearId,
    staleTime: 5 * 60 * 1000,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateHolidayDto) => tenantService.createHoliday(schoolId, yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', schoolId, yearId] })
      setShowCreateModal(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (holidayId: string) => tenantService.deleteHoliday(schoolId, yearId, holidayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', schoolId, yearId] })
      setHolidayToDelete(null)
    },
  })

  const displayHolidays = holidays || []

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Holidays ({displayHolidays.length})
        </h4>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:bg-[rgb(var(--action-primary-bg))]/10 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Holiday
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-[rgb(var(--background-tertiary))] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Holiday list */}
      {!isLoading && displayHolidays.length > 0 && (
        <div className="space-y-2">
          {displayHolidays.map((holiday) => (
            <HolidayItem
              key={holiday.holidayId}
              holiday={holiday}
              onDelete={() => setHolidayToDelete(holiday)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayHolidays.length === 0 && (
        <div className="text-center py-6 text-[rgb(var(--text-tertiary))]">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No holidays scheduled</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm text-[rgb(var(--action-secondary-fg))]  hover:underline mt-1"
          >
            Add your first holiday
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateHolidayModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        )}
        {holidayToDelete && (
          <DeleteConfirmModal
            isOpen={!!holidayToDelete}
            holiday={holidayToDelete}
            onClose={() => setHolidayToDelete(null)}
            onConfirm={() => deleteMutation.mutate(holidayToDelete.holidayId)}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
