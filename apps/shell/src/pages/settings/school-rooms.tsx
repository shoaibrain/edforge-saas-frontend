/**
 * School Rooms / Locations Page (Task 3.10)
 *
 * Manage physical locations / rooms for a school.
 * Table view + CRUD drawer.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Drawer, DrawerFooter, Select } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/hooks/useLocations'
import {
  SettingsEmptyState,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import type {
  LocationResponseDto,
  CreateLocationDto,
  UpdateLocationDto,
} from '@aibrains/shared-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCATION_TYPE_OPTIONS = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'gym', label: 'Gymnasium' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'library', label: 'Library' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
]

function useLocationTypeOptions() {
  const { t } = useTranslation('settings')
  return LOCATION_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(`schoolRooms.types.${option.value}`, { defaultValue: option.label }),
  }))
}

const LOCATION_TYPE_ICONS: Record<string, string> = {
  classroom: 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]',
  lab: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  gym: 'bg-[rgb(var(--state-success-bg)/0.18)]0/10 text-[rgb(var(--state-success-fg))]',
  auditorium: 'bg-amber-500/10 text-amber-600',
  library: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  office: 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))]',
  other: 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))]',
}

// ============================================================================
// FORM STATE
// ============================================================================

interface RoomFormState {
  roomNumber: string
  buildingName: string
  floorNumber: string
  capacity: string
  locationType: string
  isActive: boolean
  description: string
}

const EMPTY_FORM: RoomFormState = {
  roomNumber: '',
  buildingName: '',
  floorNumber: '',
  capacity: '',
  locationType: 'classroom',
  isActive: true,
  description: '',
}

function locationToForm(loc: LocationResponseDto): RoomFormState {
  return {
    roomNumber: loc.roomNumber,
    buildingName: loc.buildingName || '',
    floorNumber: loc.floorNumber != null ? String(loc.floorNumber) : '',
    capacity: loc.capacity != null ? String(loc.capacity) : '',
    locationType: loc.locationType,
    isActive: loc.isActive,
    description: loc.description || '',
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolRoomsPageProps {
  schoolId: string
}

export default function SchoolRoomsPage({ schoolId }: SchoolRoomsPageProps) {
  const { t } = useTranslation('settings')
  const locationTypeOptions = useLocationTypeOptions()
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<LocationResponseDto | null>(null)
  const [form, setForm] = useState<RoomFormState>(EMPTY_FORM)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const { data: locationsData, isLoading } = useLocations(schoolId)
  const createMutation = useCreateLocation(schoolId)
  const updateMutation = useUpdateLocation(schoolId)
  const deleteMutation = useDeleteLocation(schoolId)

  const locations = locationsData?.items || []

  // Filter
  const filteredLocations = searchQuery
    ? locations.filter(
        (loc) =>
          loc.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (loc.buildingName && loc.buildingName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          loc.locationType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : locations

  // ── Handlers ──
  const openCreate = () => {
    setEditingRoom(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (loc: LocationResponseDto) => {
    setEditingRoom(loc)
    setForm(locationToForm(loc))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRoom(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = () => {
    if (!form.roomNumber.trim()) {
      toast.error(t('schoolRooms.validation.roomNumberRequired'))
      return
    }

    if (editingRoom) {
      const updates: UpdateLocationDto = {}
      if (form.roomNumber !== editingRoom.roomNumber) updates.roomNumber = form.roomNumber
      if (form.buildingName !== (editingRoom.buildingName || '')) updates.buildingName = form.buildingName || undefined
      if (form.floorNumber !== (editingRoom.floorNumber != null ? String(editingRoom.floorNumber) : ''))
        updates.floorNumber = form.floorNumber ? parseInt(form.floorNumber) : undefined
      if (form.capacity !== (editingRoom.capacity != null ? String(editingRoom.capacity) : ''))
        updates.capacity = form.capacity ? parseInt(form.capacity) : undefined
      if (form.locationType !== editingRoom.locationType) updates.locationType = form.locationType as any
      if (form.isActive !== editingRoom.isActive) updates.isActive = form.isActive
      if (form.description !== (editingRoom.description || '')) updates.description = form.description || undefined

      updateMutation.mutate(
        { locationId: editingRoom.locationId, data: updates },
        { onSuccess: closeForm }
      )
    } else {
      const createData: CreateLocationDto = {
        roomNumber: form.roomNumber,
        locationType: form.locationType as any,
        isActive: form.isActive,
        ...(form.buildingName && { buildingName: form.buildingName }),
        ...(form.floorNumber && { floorNumber: parseInt(form.floorNumber) }),
        ...(form.capacity && { capacity: parseInt(form.capacity) }),
        ...(form.description && { description: form.description }),
      }
      createMutation.mutate(createData, { onSuccess: closeForm })
    }
  }

  const handleDelete = (locationId: string) => {
    deleteMutation.mutate(locationId, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }

  // ── Stats ──
  const activeCount = locations.filter((l) => l.isActive).length
  const typeBreakdown = locations.reduce<Record<string, number>>((acc, loc) => {
    acc[loc.locationType] = (acc[loc.locationType] || 0) + 1
    return acc
  }, {})

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-[rgb(var(--background-secondary))] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[rgb(var(--state-success-bg)/0.14)] to-[rgb(var(--action-primary-bg))]/10 border border-[rgb(var(--state-success-border)/0.35)]">
            <MapPin className="w-5 h-5 text-[rgb(var(--state-success-fg))]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('schoolRooms.title')}</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {t('schoolRooms.summary', { count: locations.length, active: activeCount })}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 me-1.5" />
          {t('schoolRooms.actions.add')}
        </Button>
      </div>

      {/* Stats pills */}
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${LOCATION_TYPE_ICONS[type] || 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]'}`}
            >
              {locationTypeOptions.find((option) => option.value === type)?.label || type}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      {locations.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('schoolRooms.searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
          />
        </div>
      )}

      {/* Room Table / List */}
      {locations.length === 0 ? (
        <SettingsEmptyState
          icon={MapPin}
          title={t('schoolRooms.empty.title')}
          description={t('schoolRooms.empty.description')}
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 me-1.5" />
              {t('schoolRooms.actions.add')}
            </Button>
          }
        />
      ) : (
        <div className="border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[rgb(var(--background-secondary))] text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
            <div className="col-span-2">{t('schoolRooms.table.room')}</div>
            <div className="col-span-2">{t('schoolRooms.table.building')}</div>
            <div className="col-span-2">{t('schoolRooms.table.type')}</div>
            <div className="col-span-1">{t('schoolRooms.table.floor')}</div>
            <div className="col-span-2">{t('schoolRooms.table.capacity')}</div>
            <div className="col-span-1">{t('schoolRooms.table.status')}</div>
            <div className="col-span-2 text-end">{t('schoolRooms.table.actions')}</div>
          </div>

          {/* Table body */}
          <motion.div variants={staggerChildren} initial="initial" animate="animate">
            {filteredLocations.map((loc) => (
              <motion.div
                key={loc.locationId}
                variants={fadeInUp}
                className="group grid grid-cols-12 gap-2 items-center px-4 py-3 border-t border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--background-secondary))]/50 transition-colors"
              >
                <div className="col-span-2">
                  <span className="font-medium text-sm text-[rgb(var(--text-primary))]">{loc.roomNumber}</span>
                </div>
                <div className="col-span-2 text-sm text-[rgb(var(--text-secondary))] truncate">
                  {loc.buildingName || '-'}
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LOCATION_TYPE_ICONS[loc.locationType] || 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]'}`}>
                    {locationTypeOptions.find((option) => option.value === loc.locationType)?.label || loc.locationType}
                  </span>
                </div>
                <div className="col-span-1 text-sm text-[rgb(var(--text-secondary))]">
                  {loc.floorNumber != null ? loc.floorNumber : '-'}
                </div>
                <div className="col-span-2 text-sm text-[rgb(var(--text-secondary))]">
                  {loc.capacity != null ? t('schoolRooms.capacitySeats', { count: loc.capacity }) : '-'}
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${loc.isActive ? 'text-[rgb(var(--action-secondary-fg))]' : 'text-[rgb(var(--text-tertiary))]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${loc.isActive ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--text-tertiary))]'}`} />
                    {loc.isActive ? t('schoolRooms.status.active') : t('schoolRooms.status.inactive')}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(loc)}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(loc.locationId)}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredLocations.length === 0 && searchQuery && (
            <div className="px-4 py-8 text-center text-sm text-[rgb(var(--text-tertiary))]">
              {t('schoolRooms.empty.noMatches', { query: searchQuery })}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Drawer */}
      <Drawer
        open={showForm}
        onClose={closeForm}
        title={editingRoom ? t('schoolRooms.drawer.editTitle') : t('schoolRooms.drawer.addTitle')}
        description={editingRoom ? t('schoolRooms.drawer.editDescription') : t('schoolRooms.drawer.addDescription')}
        size="sm"
      >
        <div className="space-y-5">
          {/* Room Number */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolRooms.form.roomNumber')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              type="text"
              value={form.roomNumber}
              onChange={(e) => setForm(f => ({ ...f, roomNumber: e.target.value }))}
              placeholder={t('schoolRooms.form.roomNumberPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Building */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolRooms.form.buildingName')}</label>
            <input
              type="text"
              value={form.buildingName}
              onChange={(e) => setForm(f => ({ ...f, buildingName: e.target.value }))}
              placeholder={t('schoolRooms.form.buildingPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Floor + Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolRooms.form.floor')}</label>
              <input
                type="number"
                value={form.floorNumber}
                onChange={(e) => setForm(f => ({ ...f, floorNumber: e.target.value }))}
                placeholder={t('schoolRooms.form.floorPlaceholder')}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolRooms.form.capacity')}</label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
                placeholder={t('schoolRooms.form.capacityPlaceholder')}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
          </div>

          {/* Location Type */}
          <Select
            label={t('schoolRooms.form.roomType')}
            value={form.locationType}
            onChange={(v) => { if (v) setForm(f => ({ ...f, locationType: v })) }}
            options={locationTypeOptions}
          />

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-[rgb(var(--border-primary))]"
            />
            <span className="text-[rgb(var(--text-secondary))]">{t('schoolRooms.form.active')}</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolRooms.form.description')}</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('schoolRooms.form.descriptionPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          <DrawerFooter>
            <Button variant="ghost" size="sm" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRoom ? t('common.update') : t('common.create')}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10">
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{t('schoolRooms.delete.title')}</h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {t('schoolRooms.delete.description')}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)}>{t('common.cancel')}</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
