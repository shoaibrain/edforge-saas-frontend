/**
 * School Switcher — Shell V2
 *
 * Compact school selector for the topbar. Extracted from Sidebar's SidebarSchoolSelector
 * and adapted for horizontal topbar placement.
 *
 * Role-based behavior:
 * - TenantAdmin: See all schools, switch between them, create new
 * - Principal/Staff/Teacher: See assigned schools only, can switch
 * - Student/Parent: Fixed to enrolled school, no switching
 */

import { useState, Fragment } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Check,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'
import { tenantService } from '../../services/tenant.service'
import { getRoleCategory } from '@edforge/types'
import type { School as SchoolType } from '@edforge/types'
import { getSchoolAvatar } from '../../lib/avatar'
import { cn } from '../../lib/utils'

export function SchoolSwitcher() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setActiveSchoolId = useAppStore((s) => s.setActiveSchoolId)
  const isTransitioning = useAppStore((s) => s.isSchoolTransitioning)
  const [query, setQuery] = useState('')

  // Fetch real schools from API
  const { data: allSchools = [], isLoading } = useQuery({
    queryKey: ['schools', user?.tenantId],
    queryFn: () => tenantService.getSchools(user?.tenantId || ''),
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
  })

  const schoolsArray: SchoolType[] = Array.isArray(allSchools) ? allSchools : []

  if (!user) return null

  // Role-based behavior
  const userAssignedSchoolIds = Object.keys(user.assignments || {})
  const firstAssignedSchoolId = userAssignedSchoolIds[0]
  const firstAssignedRole = firstAssignedSchoolId ? user.assignments[firstAssignedSchoolId] : null
  const roleCategory = firstAssignedRole ? getRoleCategory(firstAssignedRole) : null
  const isStudentOrParent = roleCategory === 'student' || roleCategory === 'parent'
  const isTenantAdmin = user.globalRole === 'TenantAdmin'

  const visibleSchools = isTenantAdmin
    ? schoolsArray
    : schoolsArray.filter(s => userAssignedSchoolIds.includes(s.id))

  const activeSchool = schoolsArray.find(s => s.id === activeSchoolId)

  const filteredSchools = query === ''
    ? visibleSchools
    : visibleSchools.filter(school =>
        school.name.toLowerCase().includes(query.toLowerCase()) ||
        school.code.toLowerCase().includes(query.toLowerCase())
      )

  const handleCreateSchool = () => {
    navigate({ to: '/settings/organization/schools/new', search: { leaId: undefined } })
  }

  // ── EMPTY STATE ──
  if (!isLoading && schoolsArray.length === 0) {
    if (isTenantAdmin) {
      return (
        <button
          onClick={handleCreateSchool}
          className="flex items-center gap-2 h-10 px-2 rounded-[10px] transition-colors"
          style={{ color: 'var(--shell-text-2)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/20 to-[rgb(var(--action-primary-bg-hover))]/20 border border-dashed border-[rgb(var(--border-focus)/0.40)] flex items-center justify-center flex-shrink-0">
            <Plus className="w-3.5 h-3.5 text-[rgb(var(--action-secondary-fg))] " />
          </div>
          <span className="text-xs font-medium">Create school</span>
        </button>
      )
    }
    return (
      <div className="flex items-center gap-2 h-10 px-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-xs" style={{ color: 'var(--shell-text-3)' }}>No school assigned</span>
      </div>
    )
  }

  // ── STUDENT/PARENT — fixed display ──
  if (isStudentOrParent && activeSchool) {
    return (
      <div className="flex items-center gap-2 h-10 px-2">
        <img
          src={getSchoolAvatar(activeSchool.name, { size: 30 })}
          alt={activeSchool.name}
          className="w-8 h-8 rounded-lg flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold truncate max-w-40" style={{ color: 'var(--shell-school-name)' }}>
            {activeSchool.name}
          </p>
          <p className="text-[9.5px] font-medium truncate" style={{ color: 'var(--shell-school-code)' }}>
            {activeSchool.code}
          </p>
        </div>
      </div>
    )
  }

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] animate-pulse flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-3 w-20 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
          <div className="h-2 w-12 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // ── DROPDOWN — admin/staff ──
  const dropdownContent = (
    <>
      {visibleSchools.length > 3 && (
        <div className="p-3 border-b border-[rgb(var(--border-secondary))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Find School..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.50)] focus:border-teal-500 transition-all"
            />
          </div>
        </div>
      )}

      <div className="px-4 py-2.5">
        <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
          {isTenantAdmin ? 'All Schools' : 'Your Schools'}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto scrollbar-thin px-2 pb-2">
        {filteredSchools.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-[rgb(var(--text-tertiary))]">No schools found</p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const isSelected = school.id === activeSchoolId
            const userRole = user.assignments[school.id]
            return (
              <MenuItem key={school.id}>
                {({ active }) => (
                  <button
                    disabled={isTransitioning}
                    onClick={() => {
                      if (isTransitioning) return
                      setActiveSchoolId(school.id)
                      setQuery('')
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150',
                      isTransitioning && 'opacity-60 pointer-events-none',
                      active && 'bg-[rgb(var(--interactive-hover))]',
                      isSelected && 'bg-[rgb(var(--action-primary-bg))]/10 /15'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg overflow-hidden flex-shrink-0',
                      isSelected ? 'ring-2 ring-teal-500' : 'ring-1 ring-[rgb(var(--border-primary))]'
                    )}>
                      <img
                        src={getSchoolAvatar(school.name, { size: 40 })}
                        alt={school.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isSelected ? 'text-[rgb(var(--state-info-fg))] ' : 'text-[rgb(var(--text-primary))]'
                        )}>
                          {school.name}
                        </p>
                        {school.status === 'setup' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">
                            Setup
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {userRole || school.code}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[rgb(var(--action-primary-bg))]  flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />
                      </div>
                    )}
                  </button>
                )}
              </MenuItem>
            )
          })
        )}
      </div>

      {isTenantAdmin && (
        <div className="border-t border-[rgb(var(--border-secondary))] p-2">
          <MenuItem>
            {({ active }) => (
              <button
                onClick={handleCreateSchool}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400 rounded-xl transition-colors font-medium',
                  active && 'bg-[rgb(var(--action-primary-bg))]/10'
                )}
              >
                <Plus className="w-4 h-4" />
                Create New School
              </button>
            )}
          </MenuItem>
        </div>
      )}
    </>
  )

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="flex items-center gap-2 h-10 px-2 rounded-[10px] transition-colors flex-shrink-0"
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--shell-ni-hover)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <img
          src={getSchoolAvatar(activeSchool?.name || 'school', { size: 30 })}
          alt={activeSchool?.name}
          className={cn(
            'w-8 h-8 rounded-lg flex-shrink-0',
            isTransitioning && 'animate-pulse'
          )}
        />
        <div className="min-w-0 text-left" style={{ lineHeight: 1.2 }}>
          <p className="text-[12.5px] font-semibold truncate max-w-40" style={{ color: 'var(--shell-school-name)', transition: 'color 0.3s' }}>
            {activeSchool?.name || 'Select School'}
          </p>
          <p className="text-[9.5px] font-medium truncate" style={{ color: 'var(--shell-school-code)', transition: 'color 0.3s' }}>
            {isTransitioning ? 'Switching...' : activeSchool?.code || 'Choose school'}
          </p>
        </div>
        <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '-2px' }}>
          <path d="M3 4.5l3 3 3-3" stroke="var(--shell-school-code)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems
          anchor="bottom start"
          className={cn(
            'w-80 rounded-2xl z-50 overflow-hidden',
            'bg-[rgb(var(--surface-secondary))]/85 backdrop-blur-xl',
            'border border-white/10 dark:border-white/5',
            'shadow-xl shadow-black/10 dark:shadow-black/40',
            'ring-1 ring-inset ring-white/5',
            '[--anchor-gap:8px]'
          )}
        >
          {dropdownContent}
        </MenuItems>
      </Transition>
    </Menu>
  )
}
