import { useState, useMemo, useCallback, Fragment } from 'react'
import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnOrderState,
} from '@tanstack/react-table'
import { Transition, Menu, MenuButton, MenuItems, MenuItem, Switch } from '@headlessui/react'
import {
  Users,
  GraduationCap,
  UserCheck,
  UserX,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Pencil,
  Trash2,
  Settings2,
  GripVertical,
  X,
  Check,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import {
  ALL_PEOPLE,
  type Person,
  type PersonType,
  type PersonStatus,
  getPersonFullName,
  getPersonTypeLabel,
  getPersonStatusColor,
  getPersonTypeColor,
  getPeopleStats,
} from '@/lib/mock-data'

export const Route = createFileRoute('/_protected/people')({
  component: PeopleLayout,
})

// ============================================================================
// LAYOUT - Handles routing between list and child routes (e.g., /people/new)
// ============================================================================

function PeopleLayout() {
  const matches = useMatches()
  // Check if we're at exactly /people (not a child route like /people/new)
  const isExactPeopleRoute = matches[matches.length - 1]?.routeId === '/_protected/people'
  
  if (isExactPeopleRoute) {
    return <PeoplePage />
  }
  
  // Render child routes (wizard, details, etc.)
  return <Outlet />
}

const columnHelper = createColumnHelper<Person>()

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconBg, 
  iconColor,
  delay = 0 
}: { 
  label: string
  value: number | string
  icon: typeof Users
  iconBg: string
  iconColor: string
  delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -4 : 0,
    shadow: hovered ? 20 : 8,
    config: config.wobbly,
  })

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
        boxShadow: springProps.shadow.to(s => `0 ${s}px ${s * 2}px -${s/2}px rgba(0,0,0,0.1)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <Card className="p-5 cursor-default">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${iconBg}`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">{label}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </animated.div>
  )
}

// ============================================================================
// ANIMATED TYPE FILTER TABS WITH REACT-SPRING
// ============================================================================

function TypeFilterTabs({ 
  activeType, 
  onTypeChange 
}: { 
  activeType: PersonType | 'all'
  onTypeChange: (type: PersonType | 'all') => void
}) {
  const types: { value: PersonType | 'all'; label: string; icon: typeof Users }[] = [
    { value: 'all', label: 'All People', icon: Users },
    { value: 'student', label: 'Students', icon: GraduationCap },
    { value: 'teacher', label: 'Teachers', icon: UserCheck },
    { value: 'staff', label: 'Staff', icon: Users },
    { value: 'guardian', label: 'Guardians', icon: Users },
  ]

  return (
    <div className="inline-flex items-center p-1 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      {types.map((type) => {
        const isActive = activeType === type.value
        return (
          <TabButton
            key={type.value}
            type={type}
            isActive={isActive}
            onClick={() => onTypeChange(type.value)}
          />
        )
      })}
    </div>
  )
}

function TabButton({ 
  type, 
  isActive, 
  onClick 
}: { 
  type: { value: PersonType | 'all'; label: string; icon: typeof Users }
  isActive: boolean
  onClick: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered && !isActive ? 1.02 : 1,
    y: isActive ? 0 : 0,
    config: { tension: 400, friction: 30 },
  })

  const bgSpring = useSpring({
    opacity: isActive ? 1 : 0,
    scale: isActive ? 1 : 0.95,
    config: { tension: 350, friction: 28 },
  })

  return (
    <animated.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        transform: spring.scale.to(s => `scale(${s})`),
      }}
      className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
    >
      {/* Active background */}
      <animated.div
        style={{
          opacity: bgSpring.opacity,
          transform: bgSpring.scale.to(s => `scale(${s})`),
        }}
        className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-500/20 to-cyan-500/15 dark:from-teal-500/30 dark:to-cyan-500/20 border border-teal-500/30 dark:border-cyan-500/40"
      />
      
      <type.icon className={`w-4 h-4 relative z-10 transition-colors duration-150 ${
        isActive 
          ? 'text-teal-600 dark:text-cyan-400' 
          : hovered 
            ? 'text-[rgb(var(--text-secondary))]'
            : 'text-[rgb(var(--text-tertiary))]'
      }`} />
      <span className={`hidden sm:inline relative z-10 transition-colors duration-150 whitespace-nowrap ${
        isActive 
          ? 'text-teal-700 dark:text-cyan-300 font-semibold' 
          : hovered
            ? 'text-[rgb(var(--text-secondary))]'
            : 'text-[rgb(var(--text-tertiary))]'
      }`}>
        {type.label}
      </span>
    </animated.button>
  )
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: PersonStatus }) {
  const colors = getPersonStatusColor(status)
  const labels: Record<PersonStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    graduated: 'Graduated',
    suspended: 'Suspended',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {labels[status]}
    </span>
  )
}

// ============================================================================
// TYPE BADGE
// ============================================================================

function TypeBadge({ type }: { type: PersonType }) {
  const colors = getPersonTypeColor(type)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {getPersonTypeLabel(type)}
    </span>
  )
}

// ============================================================================
// ACTIONS MENU
// ============================================================================

function ActionsMenu({ person: _person }: { person: Person }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="p-2 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors">
        <MoreHorizontal className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
          <MenuItem>
            {({ active }) => (
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                <Eye className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                View Details
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }) => (
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                <Pencil className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                Edit
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }) => (
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                <Mail className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                Send Email
              </button>
            )}
          </MenuItem>
          <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
          <MenuItem>
            {({ active }) => (
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''} text-rust-600 dark:text-rust-400`}>
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// DRAGGABLE COLUMN ITEM WITH REACT-SPRING
// ============================================================================

interface DraggableColumnItemProps {
  id: string
  label: string
  index: number
  isVisible: boolean
  onToggle: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  isDragging: boolean
  draggedIndex: number | null
}

function DraggableColumnItem({
  label,
  index,
  isVisible,
  onToggle,
  onDragStart,
  onDragOver,
  onDragEnd,
  draggedIndex,
}: DraggableColumnItemProps) {
  const isBeingDragged = draggedIndex === index
  const [isHovered, setIsHovered] = useState(false)
  
  const spring = useSpring({
    scale: isBeingDragged ? 1.05 : 1,
    y: isBeingDragged ? -8 : 0,
    shadow: isBeingDragged ? 25 : isHovered ? 12 : 6,
    opacity: isBeingDragged ? 0.95 : 1,
    borderColor: isBeingDragged 
      ? 'rgba(20, 184, 166, 0.5)' 
      : isHovered 
        ? 'rgba(20, 184, 166, 0.3)' 
        : 'rgba(100, 116, 139, 0.2)',
    config: config.wobbly,
  })

  return (
    <animated.div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(index)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: spring.scale.to((s) => `scale(${s}) translateY(${spring.y.get()}px)`),
        boxShadow: spring.shadow.to(s => `0 ${s}px ${s * 1.5}px -${s/3}px rgba(0,0,0,0.15)`),
        opacity: spring.opacity,
        borderColor: spring.borderColor,
        zIndex: isBeingDragged ? 50 : 1,
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-[rgb(var(--surface-tertiary))] cursor-grab active:cursor-grabbing transition-colors"
    >
      <GripVertical className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      <span className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{label}</span>
      <Switch
        checked={isVisible}
        onChange={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isVisible ? 'bg-teal-500 dark:bg-cyan-500' : 'bg-[rgb(var(--border-primary))]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isVisible ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </Switch>
    </animated.div>
  )
}

// ============================================================================
// TABLE SETTINGS MODAL WITH REACT-SPRING
// ============================================================================

interface TableSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  columns: { id: string; label: string }[]
  columnOrder: string[]
  columnVisibility: VisibilityState
  onColumnOrderChange: (newOrder: string[]) => void
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  onReset: () => void
}

function TableSettingsModal({
  isOpen,
  onClose,
  columns,
  columnOrder,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onReset,
}: TableSettingsModalProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localOrder, setLocalOrder] = useState(columnOrder)

  // Sync local order with prop
  useState(() => {
    setLocalOrder(columnOrder)
  })

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(20px)',
    config: { tension: 300, friction: 30 },
  })

  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 280, friction: 60 },
  })

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    
    const newOrder = [...localOrder]
    const [draggedItem] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, draggedItem)
    setLocalOrder(newOrder)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onColumnOrderChange(localOrder)
  }

  const toggleVisibility = (columnId: string) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    })
  }

  // Sort columns by current local order
  const orderedColumns = localOrder
    .map(id => columns.find(col => col.id === id))
    .filter(Boolean) as { id: string; label: string }[]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <animated.div
        style={{ opacity: backdropSpring.opacity }}
        className="fixed inset-0 bg-ink-500/60 dark:bg-ink-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <animated.div
          style={modalSpring}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
                <Settings2 className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Table Settings
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  Drag to reorder, toggle to show/hide
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors"
            >
              <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {orderedColumns.map((column, index) => (
              <DraggableColumnItem
                key={column.id}
                id={column.id}
                label={column.label}
                index={index}
                isVisible={columnVisibility[column.id] !== false}
                onToggle={() => toggleVisibility(column.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex !== null}
                draggedIndex={draggedIndex}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
            <button
              onClick={() => {
                onReset()
                setLocalOrder(columns.map(c => c.id))
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-500 dark:bg-cyan-500 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        </animated.div>
      </div>
    </div>
  )
}

// ============================================================================
// FILTERS PANEL WITH REACT-SPRING
// ============================================================================

interface FiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    status: PersonStatus[]
    department: string[]
  }
  onFiltersChange: (filters: { status: PersonStatus[]; department: string[] }) => void
  departments: string[]
}

function FiltersPanel({ isOpen, onClose, filters, onFiltersChange, departments }: FiltersPanelProps) {
  const statuses: PersonStatus[] = ['active', 'inactive', 'on_leave', 'graduated', 'suspended']

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(20px)',
    config: { tension: 300, friction: 30 },
  })

  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 280, friction: 60 },
  })

  const toggleStatus = (status: PersonStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const toggleDepartment = (dept: string) => {
    const newDepts = filters.department.includes(dept)
      ? filters.department.filter(d => d !== dept)
      : [...filters.department, dept]
    onFiltersChange({ ...filters, department: newDepts })
  }

  const clearAll = () => {
    onFiltersChange({ status: [], department: [] })
  }

  const activeFiltersCount = filters.status.length + filters.department.length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <animated.div
        style={{ opacity: backdropSpring.opacity }}
        className="fixed inset-0 bg-ink-500/60 dark:bg-ink-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <animated.div
          style={modalSpring}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-golden-400/20">
                <SlidersHorizontal className="w-5 h-5 text-golden-600 dark:text-golden-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Filters
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  {activeFiltersCount > 0 ? `${activeFiltersCount} active` : 'No filters applied'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors"
            >
              <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    isActive={filters.status.includes(status)}
                    onClick={() => toggleStatus(status)}
                    colorClass={getPersonStatusColor(status)}
                  />
                ))}
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-3">Department</h3>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <FilterChip
                    key={dept}
                    label={dept}
                    isActive={filters.department.includes(dept)}
                    onClick={() => toggleDepartment(dept)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white brand-gradient-warm rounded-xl hover:opacity-90 transition-opacity"
            >
              Apply Filters
            </button>
          </div>
        </animated.div>
      </div>
    </div>
  )
}

// ============================================================================
// FILTER CHIP WITH REACT-SPRING
// ============================================================================

function FilterChip({ 
  label, 
  isActive, 
  onClick,
  colorClass,
}: { 
  label: string
  isActive: boolean
  onClick: () => void
  colorClass?: { bg: string; text: string }
}) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered ? 1.05 : 1,
    y: isActive ? -2 : 0,
    config: config.gentle,
  })

  return (
    <animated.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s}) translateY(${spring.y.get()}px)`),
      }}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? colorClass 
            ? `${colorClass.bg} ${colorClass.text} ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-secondary))] ring-teal-500/50`
            : 'bg-teal-500/15 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-300 ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-secondary))] ring-teal-500/50'
          : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))]'
      }`}
    >
      {label}
    </animated.button>
  )
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

const DEFAULT_COLUMN_ORDER = ['name', 'type', 'role', 'department', 'status', 'phone', 'actions']

const COLUMN_LABELS: Record<string, string> = {
  name: 'Person',
  type: 'Type',
  role: 'Role / Grade',
  department: 'Department',
  status: 'Status',
  phone: 'Contact',
  actions: 'Actions',
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function PeoplePage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeType, setActiveType] = useState<PersonType | 'all'>('all')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(DEFAULT_COLUMN_ORDER)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<{
    status: PersonStatus[]
    department: string[]
  }>({ status: [], department: [] })

  const stats = getPeopleStats()

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>()
    ALL_PEOPLE.forEach(p => {
      if (p.department) depts.add(p.department)
    })
    return Array.from(depts).sort()
  }, [])

  // Filter data by type and advanced filters
  const filteredData = useMemo(() => {
    let data = ALL_PEOPLE

    // Filter by type
    if (activeType !== 'all') {
      data = data.filter(person => person.type === activeType)
    }

    // Filter by status
    if (advancedFilters.status.length > 0) {
      data = data.filter(person => advancedFilters.status.includes(person.status))
    }

    // Filter by department
    if (advancedFilters.department.length > 0) {
      data = data.filter(person => 
        person.department && advancedFilters.department.includes(person.department)
      )
    }

    return data
  }, [activeType, advancedFilters])

  // Define columns
  const columns = useMemo<ColumnDef<Person, any>[]>(() => [
    columnHelper.accessor(row => getPersonFullName(row), {
      id: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-[rgb(var(--text-primary))] transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Person
          <ArrowUpDown className="w-4 h-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={getPersonFullName(row.original)} size="sm" shape="rounded" />
          <div>
            <p className="font-medium text-[rgb(var(--text-primary))]">
              {getPersonFullName(row.original)}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{row.original.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('type', {
      id: 'type',
      header: 'Type',
      cell: ({ getValue }) => <TypeBadge type={getValue()} />,
      filterFn: 'equals',
    }),
    columnHelper.accessor('role', {
      id: 'role',
      header: 'Role / Grade',
      cell: ({ row }) => (
        <span className="text-[rgb(var(--text-secondary))]">
          {row.original.role || row.original.grade || '-'}
        </span>
      ),
    }),
    columnHelper.accessor('department', {
      id: 'department',
      header: 'Department',
      cell: ({ getValue }) => (
        <span className="text-[rgb(var(--text-secondary))]">{getValue() || '-'}</span>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    columnHelper.accessor('phone', {
      id: 'phone',
      header: 'Contact',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 text-[rgb(var(--text-tertiary))]">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsMenu person={row.original} />,
    }),
  ], [])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const resetTableSettings = useCallback(() => {
    setColumnOrder(DEFAULT_COLUMN_ORDER)
    setColumnVisibility({})
  }, [])

  const activeFiltersCount = advancedFilters.status.length + advancedFilters.department.length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            People
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Manage students, teachers, staff, and guardians
          </p>
        </div>
        {/* Add Person button removed - use global "Add New" dropdown in header */}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
          delay={0.1}
        />
        <StatCard
          label="Teachers"
          value={stats.totalTeachers}
          icon={UserCheck}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
          delay={0.15}
        />
        <StatCard
          label="Admin Staff"
          value={stats.totalStaff}
          icon={Users}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
          delay={0.2}
        />
        <StatCard
          label="On Leave"
          value={stats.onLeave}
          icon={UserX}
          iconBg="bg-caramel-400/20"
          iconColor="text-caramel-600 dark:text-caramel-400"
          delay={0.25}
        />
      </div>

      {/* Filters & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 p-3 bg-[rgb(var(--surface-secondary))] rounded-2xl border border-[rgb(var(--border-primary))]"
      >
        {/* Type Filter Tabs */}
        <TypeFilterTabs activeType={activeType} onTypeChange={setActiveType} />
        
        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-[rgb(var(--border-primary))]" />
        
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search people..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition-all"
          />
        </div>
        
        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-[rgb(var(--border-primary))]" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Filters Button */}
          <AnimatedIconButton 
            icon={Filter}
            label="Filters"
            onClick={() => setIsFiltersOpen(true)}
            badge={activeFiltersCount > 0 ? activeFiltersCount : undefined}
            isActive={activeFiltersCount > 0}
          />

          {/* Table Settings Button */}
          <AnimatedIconButton 
            icon={Settings2}
            label="Columns"
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-2xl bg-[rgb(var(--surface-tertiary))]">
                          <Users className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
                        </div>
                        <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">No people found</p>
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} row={row} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
            <div className="text-sm text-[rgb(var(--text-tertiary))]">
              Showing{' '}
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>
              {' - '}
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
                )}
              </span>
              {' of '}
              <span className="font-medium text-[rgb(var(--text-primary))]">{filteredData.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <PaginationButton
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                icon={ChevronsLeft}
              />
              <PaginationButton
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                icon={ChevronLeft}
              />
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                  const pageIndex = table.getState().pagination.pageIndex
                  let pageNumber: number
                  
                  if (table.getPageCount() <= 5) {
                    pageNumber = i
                  } else if (pageIndex < 3) {
                    pageNumber = i
                  } else if (pageIndex > table.getPageCount() - 4) {
                    pageNumber = table.getPageCount() - 5 + i
                  } else {
                    pageNumber = pageIndex - 2 + i
                  }
                  
                  return (
                    <PageButton
                      key={pageNumber}
                      pageNumber={pageNumber}
                      isActive={pageIndex === pageNumber}
                      onClick={() => table.setPageIndex(pageNumber)}
                    />
                  )
                })}
              </div>

              <PaginationButton
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                icon={ChevronRight}
              />
              <PaginationButton
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                icon={ChevronsRight}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Table Settings Modal */}
      <TableSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        columns={DEFAULT_COLUMN_ORDER.map(id => ({ id, label: COLUMN_LABELS[id] }))}
        columnOrder={columnOrder}
        columnVisibility={columnVisibility}
        onColumnOrderChange={setColumnOrder}
        onColumnVisibilityChange={setColumnVisibility}
        onReset={resetTableSettings}
      />

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        departments={departments}
      />
    </div>
  )
}

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

function AnimatedIconButton({ 
  icon: Icon, 
  label, 
  onClick,
  badge,
  isActive,
}: { 
  icon: typeof Filter
  label: string
  onClick: () => void
  badge?: number
  isActive?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered ? 1.05 : 1,
    config: config.gentle,
  })

  return (
    <animated.button 
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s})`),
      }}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[rgb(var(--surface-secondary))] border rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-colors ${
        isActive 
          ? 'border-golden-500/50 text-golden-600 dark:text-golden-400' 
          : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && (
        <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-golden-500 rounded-full">
          {badge}
        </span>
      )}
    </animated.button>
  )
}

function TableRow({ row }: { row: any }) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    backgroundColor: hovered ? 'rgba(100, 116, 139, 0.08)' : 'rgba(0, 0, 0, 0)',
    config: { tension: 300, friction: 30 },
  })

  return (
    <animated.tr
      style={spring}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="transition-colors"
    >
      {row.getVisibleCells().map((cell: any) => (
        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </animated.tr>
  )
}

function PaginationButton({ 
  onClick, 
  disabled, 
  icon: Icon 
}: { 
  onClick: () => void
  disabled: boolean
  icon: typeof ChevronLeft 
}) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered && !disabled ? 1.1 : 1,
    config: config.gentle,
  })

  return (
    <animated.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s})`),
      }}
      className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Icon className="w-4 h-4" />
    </animated.button>
  )
}

function PageButton({ 
  pageNumber, 
  isActive, 
  onClick 
}: { 
  pageNumber: number
  isActive: boolean
  onClick: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered && !isActive ? 1.1 : 1,
    y: isActive ? -2 : 0,
    config: config.gentle,
  })

  return (
    <animated.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s}) translateY(${spring.y.get()}px)`),
      }}
      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-teal-500 dark:bg-cyan-500 text-white'
          : 'text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))]'
      }`}
    >
      {pageNumber + 1}
    </animated.button>
  )
}
