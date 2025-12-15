import { useState, Fragment, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import { useSpring, animated } from '@react-spring/web'
import {
  Search,
  Bell,
  ChevronDown,
  Check,
  Plus,
  Users,
  User,
  GraduationCap,
  UserPlus,
  Settings,
  FileText,
  Moon,
  Sun,
  Monitor,
  LogOut,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useThemeStore, type Theme } from '@/stores/theme.store'
import { useQuickAddPersonModal, useInviteTeamModal, useAddClassroomModal, useAddGradeLevelModal } from '@/stores/modal.store'
import { Avatar } from '@/components/ui/Avatar'
import { getSchoolAvatar } from '@/lib/avatar'
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette'
import { 
  ADD_NEW_OPTIONS, 
  ADD_NEW_CATEGORIES,
  getOptionsGroupedByCategory,
  getContextAwareOptions,
  type AddNewOption,
} from '@/config/add-new-options'
import { can, type Action, type Resource } from '@/lib/abac'
import { cn } from '@/lib/utils'

// ============================================================================
// MOCK PEOPLE DATA
// ============================================================================

interface MockPerson {
  id: string
  name: string
  type: 'student' | 'staff'
  grade?: string
  role?: string
}

const MOCK_PEOPLE: MockPerson[] = [
  { id: 'std-001', name: 'Emma Thompson', type: 'student', grade: '10th' },
  { id: 'std-002', name: 'Liam Anderson', type: 'student', grade: '11th' },
  { id: 'std-003', name: 'Sophia Martinez', type: 'student', grade: '9th' },
  { id: 'std-004', name: 'Noah Williams', type: 'student', grade: '12th' },
  { id: 'stf-001', name: 'Dr. Amanda Foster', type: 'staff', role: 'Principal' },
  { id: 'stf-002', name: 'Robert Martinez', type: 'staff', role: 'Teacher' },
  { id: 'stf-003', name: 'Sarah Johnson', type: 'staff', role: 'Teacher' },
]

// ============================================================================
// SCHOOL SELECTOR
// ============================================================================

function SchoolSelector() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setActiveSchoolId = useAppStore((s) => s.setActiveSchoolId)
  const [query, setQuery] = useState('')

  if (!user) return null

  const userSchools = Object.keys(user.assignments)
  const activeSchool = activeSchoolId ? MOCK_SCHOOLS[activeSchoolId] : null

  const filteredSchools = query === ''
    ? userSchools
    : userSchools.filter((schoolId) =>
        MOCK_SCHOOLS[schoolId]?.name.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200 group">
        <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-[rgb(var(--border-primary))] ring-offset-1 ring-offset-[rgb(var(--surface-secondary))]">
          <img 
            src={getSchoolAvatar(activeSchool?.name || 'school', { size: 32 })} 
            alt={activeSchool?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))] max-w-[140px] truncate">
            {activeSchool?.name || 'Select School'}
          </p>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
            {activeSchoolId ? user.assignments[activeSchoolId] : 'Choose school'}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-secondary))] transition-colors" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-95 translate-y-1"
      >
        <MenuItems className="absolute left-0 mt-2 w-80 origin-top-left rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <input
                type="text"
                placeholder="Find School..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Schools Label */}
          <div className="px-4 py-2.5">
            <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Your Schools</span>
          </div>

          {/* Schools List */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin px-2 pb-2">
            {filteredSchools.map((schoolId) => {
              const school = MOCK_SCHOOLS[schoolId]
              const isSelected = schoolId === activeSchoolId
              return (
                <MenuItem key={schoolId}>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setActiveSchoolId(schoolId)
                        setQuery('')
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ${
                        active ? 'bg-[rgb(var(--interactive-hover))]' : ''
                      } ${isSelected ? 'bg-teal-500/10 dark:bg-cyan-500/15' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${isSelected ? 'ring-2 ring-teal-500' : 'ring-1 ring-[rgb(var(--border-primary))]'}`}>
                        <img
                          src={getSchoolAvatar(school?.name || schoolId, { size: 40 })}
                          alt={school?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-teal-700 dark:text-cyan-300' : 'text-[rgb(var(--text-primary))]'}`}>
                          {school?.name}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">{user.assignments[schoolId]}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-teal-500 dark:bg-cyan-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )}
                </MenuItem>
              )
            })}
          </div>

          {/* Create School */}
          {user.globalRole === 'TenantAdmin' && (
            <div className="border-t border-[rgb(var(--border-secondary))] p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-teal-600 dark:text-cyan-400 hover:bg-teal-500/10 rounded-xl transition-colors font-medium">
                <Plus className="w-4 h-4" />
                Create New School
              </button>
            </div>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// PEOPLE SELECTOR
// ============================================================================

function PeopleSelector() {
  const [query, setQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<typeof MOCK_PEOPLE[0] | null>(null)

  const filteredPeople = query === ''
    ? MOCK_PEOPLE
    : MOCK_PEOPLE.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase())
      )

  const students = filteredPeople.filter(p => p.type === 'student')
  const staff = filteredPeople.filter(p => p.type === 'staff')

  return (
    <Combobox value={selectedPerson} onChange={setSelectedPerson}>
      <div className="relative">
        <div className="flex items-center">
          <span className="text-[rgb(var(--border-primary))] mx-3 text-xl font-light">/</span>
          <Combobox.Button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200 group">
            {selectedPerson ? (
              <>
                <Avatar name={selectedPerson.name} size="xs" shape="rounded" />
                <span className="text-sm font-medium text-[rgb(var(--text-primary))] max-w-[120px] truncate hidden sm:inline">
                  {selectedPerson.name}
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                </div>
                <span className="text-sm text-[rgb(var(--text-tertiary))] hidden sm:inline">Find Person...</span>
              </>
            )}
            <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-secondary))] transition-colors" />
          </Combobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className="absolute left-0 mt-2 w-80 origin-top-left rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-[rgb(var(--border-secondary))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <ComboboxInput
                  placeholder="Search people..."
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {/* Students */}
              {students.length > 0 && (
                <div className="px-2 pt-2">
                  <div className="px-2 py-2 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-golden-500" />
                    <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Students</span>
                  </div>
                  {students.map((person) => (
                    <ComboboxOption
                      key={person.id}
                      value={person}
                      className={({ active }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                          active ? 'bg-[rgb(var(--interactive-hover))]' : ''
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <Avatar name={person.name} size="sm" shape="rounded" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? 'text-teal-700 dark:text-cyan-300' : 'text-[rgb(var(--text-primary))]'}`}>
                              {person.name}
                            </p>
                            <p className="text-xs text-[rgb(var(--text-tertiary))]">{person.grade} Grade</p>
                          </div>
                          {selected && <Check className="w-4 h-4 text-teal-500 dark:text-cyan-400" />}
                        </>
                      )}
                    </ComboboxOption>
                  ))}
                </div>
              )}

              {/* Staff */}
              {staff.length > 0 && (
                <div className="px-2 pt-2 pb-2">
                  <div className="px-2 py-2 flex items-center gap-2 border-t border-[rgb(var(--border-secondary))] -mx-2 px-4 pt-3">
                    <User className="w-3.5 h-3.5 text-teal-500 dark:text-cyan-400" />
                    <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Staff</span>
                  </div>
                  {staff.map((person) => (
                    <ComboboxOption
                      key={person.id}
                      value={person}
                      className={({ active }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                          active ? 'bg-[rgb(var(--interactive-hover))]' : ''
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <Avatar name={person.name} size="sm" shape="rounded" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? 'text-teal-700 dark:text-cyan-300' : 'text-[rgb(var(--text-primary))]'}`}>
                              {person.name}
                            </p>
                            <p className="text-xs text-[rgb(var(--text-tertiary))]">{person.role}</p>
                          </div>
                          {selected && <Check className="w-4 h-4 text-teal-500 dark:text-cyan-400" />}
                        </>
                      )}
                    </ComboboxOption>
                  ))}
                </div>
              )}

              {filteredPeople.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <Users className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">No people found</p>
                </div>
              )}
            </div>

            {/* Add New Person */}
            <div className="border-t border-[rgb(var(--border-secondary))] p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-teal-600 dark:text-cyan-400 hover:bg-teal-500/10 rounded-xl transition-colors font-medium">
                <UserPlus className="w-4 h-4" />
                Add New Person
              </button>
            </div>
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  )
}

// ============================================================================
// GLOBAL SEARCH BUTTON
// ============================================================================

function GlobalSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] border border-[rgb(var(--border-primary))] rounded-xl transition-all duration-200 hover:border-teal-500/50"
    >
      <Search className="w-4 h-4" />
      <span className="hidden md:inline">Search...</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-md text-[rgb(var(--text-tertiary))]">
        ⌘K
      </kbd>
    </button>
  )
}

// ============================================================================
// ADD NEW DROPDOWN - ENHANCED WITH CONTEXT AWARENESS
// ============================================================================

function AddNewOptionItem({ 
  option, 
  isHighlighted,
  onSelect 
}: { 
  option: AddNewOption
  isHighlighted?: boolean
  onSelect: (option: AddNewOption) => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    x: hovered ? 4 : 0,
    scale: hovered ? 1.02 : 1,
    config: { tension: 400, friction: 25 },
  })

  const Icon = option.icon

  return (
    <MenuItem>
      {({ active }) => (
        <animated.button
          style={{
            transform: springProps.x.to(x => `translateX(${x}px) scale(${springProps.scale.get()})`),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onSelect(option)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
            active && 'bg-[rgb(var(--interactive-hover))]',
            isHighlighted && 'bg-teal-500/5 dark:bg-cyan-500/5'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', option.iconBg)}>
            <Icon className={cn('w-4.5 h-4.5', option.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{option.label}</p>
              {isHighlighted && (
                <Sparkles className="w-3 h-3 text-golden-500" />
              )}
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{option.description}</p>
          </div>
          {option.shortcut && (
            <kbd className="hidden lg:flex items-center px-2 py-1 text-[10px] font-semibold bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-md text-[rgb(var(--text-tertiary))]">
              {option.shortcut}
            </kbd>
          )}
        </animated.button>
      )}
    </MenuItem>
  )
}

function AddNewDropdown() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  // Modal hooks
  const quickAddModal = useQuickAddPersonModal()
  const inviteModal = useInviteTeamModal()
  const classroomModal = useAddClassroomModal()
  const gradeLevelModal = useAddGradeLevelModal()

  // Check permission helper
  const hasPermission = useCallback((action: Action, resource: Resource) => {
    return can(user, { action, resource, schoolId: activeSchoolId || undefined })
  }, [user, activeSchoolId])

  // Filter options based on permissions and active school
  const filteredOptions = useMemo(() => {
    return ADD_NEW_OPTIONS.filter((option) => {
      // Check permission
      if (option.permission) {
        if (!hasPermission(option.permission.action, option.permission.resource)) {
          return false
        }
      }
      // Check if requires active school
      if (option.requiresActiveSchool && !activeSchoolId) {
        return false
      }
      return true
    })
  }, [hasPermission, activeSchoolId])

  // Get context-aware options
  const { highlighted, other } = useMemo(() => {
    return getContextAwareOptions(filteredOptions, location.pathname)
  }, [filteredOptions, location.pathname])

  // Group remaining options by category
  const groupedOptions = useMemo(() => {
    return getOptionsGroupedByCategory(other)
  }, [other])

  // Handle option selection
  const handleSelect = (option: AddNewOption) => {
    switch (option.actionType) {
      case 'quick-add-person':
        quickAddModal.open({
          personType: option.actionData?.personType as any,
        })
        break
      case 'invite':
        inviteModal.open()
        break
      case 'modal':
        if (option.id === 'new-classroom') {
          classroomModal.open()
        } else if (option.id === 'new-grade-level') {
          gradeLevelModal.open()
        }
        // TODO: Handle other modal types
        break
      case 'wizard':
        navigate({ 
          to: '/people/new', 
          search: { 
            type: option.actionData?.personType as 'student' | 'teacher' | 'staff' | 'guardian' 
          } 
        })
        break
    }
  }

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200',
            'brand-gradient-warm hover:opacity-90',
            'shadow-md shadow-golden-500/20 hover:shadow-lg hover:shadow-golden-500/30',
            open && 'ring-2 ring-golden-400/50 ring-offset-2 ring-offset-[rgb(var(--surface-secondary))]'
          )}>
            <Plus className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-45')} />
            <span className="hidden sm:inline">Add New</span>
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl shadow-ink-500/15 dark:shadow-black/30 z-50 overflow-hidden">
              {/* Highlighted Options (Context-Aware) */}
              {highlighted.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-golden-500" />
                    <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                      Suggested
                    </span>
                  </div>
                  {highlighted.map((option) => (
                    <AddNewOptionItem
                      key={option.id}
                      option={option}
                      isHighlighted
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}

              {/* Categorized Options */}
              {Array.from(groupedOptions.entries()).map(([category, options]) => {
                if (options.length === 0) return null
                
                return (
                  <div key={category} className="py-2 border-t border-[rgb(var(--border-secondary))] first:border-t-0">
                    <div className="px-4 py-2">
                      <span className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                        {ADD_NEW_CATEGORIES[category as keyof typeof ADD_NEW_CATEGORIES]?.label || category}
                      </span>
                    </div>
                    {options.map((option) => (
                      <AddNewOptionItem
                        key={option.id}
                        option={option}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                )
              })}

              {/* Empty State */}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--surface-tertiary))] flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
                  </div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {activeSchoolId 
                      ? 'No actions available for your role'
                      : 'Select a school to add items'
                    }
                  </p>
                </div>
              )}
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  )
}

// ============================================================================
// USER MENU WITH THEME PICKER
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()

  if (!user) return null

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center rounded-full ring-2 ring-[rgb(var(--border-primary))] ring-offset-2 ring-offset-[rgb(var(--surface-secondary))] hover:ring-teal-500/50 transition-all duration-200">
        <Avatar
          name={user.name}
          size="sm"
          shape="circle"
        />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-95 translate-y-1"
      >
        <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" shape="rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[rgb(var(--text-primary))] truncate">{user.name}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/15 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                  {user.globalRole}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Picker */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">Theme</span>
              <div className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]">
                {themes.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setTheme(value)
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      theme === value
                        ? 'bg-teal-500 dark:bg-cyan-500 text-white shadow-sm'
                        : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))]'
                    }`}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <User className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">My Profile</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">View and edit profile</p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Settings</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">Manage preferences</p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Help & Support</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">Get help with Edforge</p>
                  </div>
                </button>
              )}
            </MenuItem>
          </div>

          <div className="border-t border-[rgb(var(--border-secondary))] py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rust-100 dark:bg-rust-900/30 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-rust-500" />
                  </div>
                  <span className="text-sm font-medium text-rust-600 dark:text-rust-400">Sign out</span>
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================

export function Header() {
  const commandPalette = useCommandPalette()

  return (
    <>
      <header className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
        {/* Left Section */}
        <div className="flex items-center">
          <SchoolSelector />
          <PeopleSelector />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <GlobalSearchButton onClick={commandPalette.toggle} />
          
          {/* Documentation */}
          <button className="p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200">
            <FileText className="w-5 h-5" />
          </button>
          
          <AddNewDropdown />

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rust-500 rounded-full ring-2 ring-[rgb(var(--surface-secondary))]" />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette open={commandPalette.open} onClose={commandPalette.close} />
    </>
  )
}
