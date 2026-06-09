/**
 * Structure Tab — V2
 *
 * 2-column layout: Departments (left) | Rooms (right)
 * Full CRUD via modals (departments) and drawers (rooms).
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { tenantService } from '@/services/tenant.service'
import {
  useLocations,
  useCreateLocation,
  useDeleteLocation,
} from '@/hooks/useLocations'
import { Drawer, DrawerFooter, Field, Input, Textarea, Checkbox, Select } from '@edforge/ui'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type ScopeFilter = 'all' | 'school' | 'organization'

const ROOM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  classroom: { bg: 'rgba(55,138,221,0.1)', text: '#378ADD' },
  lab: { bg: 'rgba(29,158,117,0.1)', text: '#1D9E75' },
  hall: { bg: 'rgba(239,159,39,0.1)', text: '#EF9F27' },
  gym: { bg: 'rgba(29,158,117,0.1)', text: '#1D9E75' },
  auditorium: { bg: 'rgba(239,159,39,0.1)', text: '#EF9F27' },
  library: { bg: 'rgba(127,119,221,0.1)', text: '#7F77DD' },
  office: { bg: 'rgba(255,255,255,0.05)', text: 'rgb(var(--text-tertiary))' },
}

const LOCATION_TYPE_OPTIONS = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'gym', label: 'Gymnasium' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'library', label: 'Library' },
  { value: 'office', label: 'Office' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'other', label: 'Other' },
]

interface RoomFormState {
  roomNumber: string
  buildingName: string
  floorNumber: string
  capacity: string
  locationType: string
  isActive: boolean
  description: string
}

const EMPTY_ROOM_FORM: RoomFormState = {
  roomNumber: '',
  buildingName: '',
  floorNumber: '',
  capacity: '',
  locationType: 'classroom',
  isActive: true,
  description: '',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StructureTabProps {
  schoolId: string
}

export default function StructureTab({ schoolId }: StructureTabProps) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <DepartmentsColumn schoolId={schoolId} />
      <RoomsColumn schoolId={schoolId} />
    </div>
  )
}

// ============================================================================
// DEPARTMENTS COLUMN
// ============================================================================

function DepartmentsColumn({ schoolId }: { schoolId: string }) {
  const queryClient = useQueryClient()
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments', schoolId],
    queryFn: () => tenantService.getDepartments(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  const depts = Array.isArray(departments) ? departments : (departments as any)?.data ?? []

  const filteredDepts = depts.filter((d: any) => {
    const matchesScope = scopeFilter === 'all' || d.scope === scopeFilter
    return matchesScope
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; code: string; description?: string }) =>
      tenantService.createDepartment(schoolId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      toast.success('Department created')
      closeModal()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create department'),
  })

  const deleteMutation = useMutation({
    mutationFn: (deptId: string) => tenantService.deleteDepartment(schoolId, deptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', schoolId] })
      toast.success('Department deleted')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete department'),
  })

  const openModal = () => {
    setFormName('')
    setFormCode('')
    setFormDescription('')
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formCode.trim()) return
    createMutation.mutate({
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim() || undefined,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Departments</h3>
        <button
          onClick={openModal}
          className="bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Department
        </button>
      </div>

      {/* Scope bug warning */}
      <div className="flex items-start gap-2 bg-[rgba(239,159,39,0.05)] border border-[rgba(239,159,39,0.14)] rounded-lg px-3 py-2 text-xs text-[#EF9F27] mb-2.5">
        <span className="flex-shrink-0">⚠️</span>
        <span><strong>Known issue:</strong> Organization-level departments are not creating correctly — only school-level departments work.</span>
      </div>

      {/* Department list card */}
      <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl">
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(127,119,221,0.1)] flex items-center justify-center text-sm">🏛️</div>
            <div>
              <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Departments</h4>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Academic and administrative departments</p>
            </div>
          </div>
          <Select
            aria-label="Filter by scope"
            size="sm"
            className="w-36"
            value={scopeFilter}
            onChange={v => { if (v) setScopeFilter(v as ScopeFilter) }}
            options={[
              { value: 'all', label: 'All Scopes' },
              { value: 'school', label: 'School Only' },
              { value: 'organization', label: 'Organization' },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="p-4 animate-pulse space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[rgb(var(--background-secondary))] rounded-lg" />)}
          </div>
        ) : filteredDepts.length > 0 ? (
          <div>
            {filteredDepts.map((dept: any) => {
              const isSchool = dept.scope === 'school'
              return (
                <div key={dept.id || dept.departmentId} className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{dept.name}</span>
                    {dept.code && (
                      <span className="text-xs font-mono text-[rgb(var(--text-tertiary))]">{dept.code}</span>
                    )}
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isSchool
                        ? 'bg-[rgba(55,138,221,0.1)] text-[#378ADD]'
                        : 'bg-[rgba(127,119,221,0.1)] text-[#7F77DD]'
                    }`}>
                      {isSchool ? 'School' : 'Org'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      {dept.teacherCount ?? dept.memberCount ?? 0} members
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete department "${dept.name}"?`)) {
                          deleteMutation.mutate(dept.id || dept.departmentId)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-2xl opacity-40 mb-2">👥</div>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-1">No departments found</h4>
            <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-64 mx-auto leading-relaxed">
              Create your first department to organize your school's academic structure.
            </p>
          </div>
        )}
      </div>

      {/* Scope explainer */}
      <div className="mt-2 bg-[rgba(127,119,221,0.04)] border border-[rgba(127,119,221,0.1)] rounded-lg px-3 py-2.5 text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
        <strong className="text-[#7F77DD]">Scope explained:</strong><br />
        <strong className="text-[rgb(var(--text-secondary))]">School-level</strong> departments belong to this school only.<br />
        <strong className="text-[rgb(var(--text-secondary))]">Organization-level</strong> departments are shared across all schools in your organization.
      </div>

      {/* Create Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
              <div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Create Department</h3>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">Add a new department to this school</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Field label="Department Name" required>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g., Science"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
              <Field label="Code" required helperText="2-10 characters. Cannot be changed after creation.">
                <Input
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className="font-mono"
                  placeholder="e.g., SCI"
                  required
                  minLength={2}
                  maxLength={10}
                />
              </Field>
              <Field label="Description" optionalText="optional">
                <Textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  resize="none"
                  placeholder="Brief description of the department"
                />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !formName.trim() || !formCode.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ROOMS COLUMN
// ============================================================================

function RoomsColumn({ schoolId }: { schoolId: string }) {
  const [showDrawer, setShowDrawer] = useState(false)
  const [form, setForm] = useState<RoomFormState>(EMPTY_ROOM_FORM)

  const { data: locationsData, isLoading } = useLocations(schoolId)
  const rooms = (locationsData as any)?.items || (locationsData as any)?.data || (Array.isArray(locationsData) ? locationsData : [])

  const createMutation = useCreateLocation(schoolId)
  const deleteMutation = useDeleteLocation(schoolId)

  const openDrawer = () => {
    setForm(EMPTY_ROOM_FORM)
    setShowDrawer(true)
  }

  const closeDrawer = () => setShowDrawer(false)

  const handleSave = () => {
    if (!form.roomNumber.trim()) {
      toast.error('Room number is required')
      return
    }
    createMutation.mutate(
      {
        roomNumber: form.roomNumber.trim(),
        buildingName: form.buildingName.trim() || undefined,
        floorNumber: form.floorNumber ? parseInt(form.floorNumber, 10) : undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        locationType: (form.locationType || 'classroom') as any,
        isActive: form.isActive,
        description: form.description.trim() || undefined,
      } as any,
      {
        onSuccess: () => {
          toast.success('Room created')
          closeDrawer()
        },
      }
    )
  }

  const updateField = <K extends keyof RoomFormState>(key: K, value: RoomFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Rooms & Locations</h3>
        <button
          onClick={openDrawer}
          className="bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Room
        </button>
      </div>

      <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[rgba(29,158,117,0.1)] flex items-center justify-center text-sm">📍</div>
          <div>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Rooms & Locations</h4>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{rooms.length} rooms · {rooms.filter((r: any) => r.isActive !== false).length} active</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 animate-pulse">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-[rgb(var(--background-secondary))] rounded-lg" />)}
            </div>
          </div>
        ) : rooms.length > 0 ? (
          <div className="p-4 grid grid-cols-2 gap-2">
            {rooms.map((room: any) => {
              const typeColor = ROOM_TYPE_COLORS[room.locationType?.toLowerCase() || room.roomType?.toLowerCase()] || ROOM_TYPE_COLORS.classroom
              return (
                <div key={room.id || room.locationId} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5 group relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[rgb(var(--text-primary))]">{room.roomNumber || room.name}</span>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ background: typeColor.bg, color: typeColor.text }}
                    >
                      {room.locationType || room.roomType || 'Classroom'}
                    </span>
                  </div>
                  {room.buildingName && (
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">{room.buildingName}</div>
                  )}
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {room.capacity ? `Capacity: ${room.capacity}` : ''}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete room "${room.roomNumber}"?`)) {
                        deleteMutation.mutate(room.id || room.locationId)
                      }
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-2xl opacity-40 mb-2">📍</div>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-1">No rooms configured</h4>
            <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-64 mx-auto leading-relaxed">
              Add physical rooms and locations for scheduling. Rooms are assigned to class sections.
            </p>
          </div>
        )}
      </div>

      {/* Room fields hint */}
      <div className="mt-2 bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2.5 text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
        <strong className="text-[#1D9E75]">Room fields:</strong> Room number, name, type (classroom / lab / hall / gym), capacity, building/floor location, and active status.
      </div>

      {/* Add Room Drawer */}
      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title="Add Room"
        description="Create a new physical location for this school"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <Field label="Room Number" required>
            <Input
              value={form.roomNumber}
              onChange={e => updateField('roomNumber', e.target.value)}
              placeholder="e.g., 101"
              maxLength={20}
            />
          </Field>
          <Field label="Building Name" optionalText={null}>
            <Input
              value={form.buildingName}
              onChange={e => updateField('buildingName', e.target.value)}
              placeholder="e.g., Main Building"
              maxLength={100}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Floor" optionalText={null}>
              <Input
                type="number"
                value={form.floorNumber}
                onChange={e => updateField('floorNumber', e.target.value)}
                placeholder="e.g., 1"
              />
            </Field>
            <Field label="Capacity" optionalText={null}>
              <Input
                type="number"
                value={form.capacity}
                onChange={e => updateField('capacity', e.target.value)}
                placeholder="e.g., 30"
                min={1}
                max={500}
              />
            </Field>
          </div>
          <Select
            label="Location Type"
            optionalText={null}
            value={form.locationType}
            onChange={v => updateField('locationType', v ?? 'classroom')}
            options={LOCATION_TYPE_OPTIONS}
          />
          <Field label="Description" optionalText={null}>
            <Textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={2}
              maxLength={255}
              resize="none"
              placeholder="Optional description"
            />
          </Field>
          <Checkbox
            id="room-active"
            label="Active"
            checked={form.isActive}
            onChange={e => updateField('isActive', e.target.checked)}
          />
        </div>
        <DrawerFooter>
          <button
            onClick={closeDrawer}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || !form.roomNumber.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Room'}
          </button>
        </DrawerFooter>
      </Drawer>
    </div>
  )
}
