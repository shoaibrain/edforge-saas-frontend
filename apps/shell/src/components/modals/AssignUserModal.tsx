import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, School as SchoolIcon, ChevronDown, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../../services/users.service'
import { tenantService } from '../../services/tenant.service'
import { useAuthStore } from '@/stores/auth.store'
import type { SchoolRole } from '@edforge/types'
import { Combobox } from '@headlessui/react'

interface AssignUserModalProps {
    isOpen: boolean
    onClose: () => void
    preselectedUserId?: string
}

const ROLES: { id: SchoolRole; name: string; description: string }[] = [
    { id: 'Principal', name: 'Principal', description: 'Full school access' },
    { id: 'Teacher', name: 'Teacher', description: 'Classroom management' },
    { id: 'Staff', name: 'Staff', description: 'Operational access' },
    { id: 'Accountant', name: 'Accountant', description: 'Financial management' },
    { id: 'Student', name: 'Student', description: 'Student portal access' },
    { id: 'Parent', name: 'Parent', description: 'Parent portal access' },
]

export default function AssignUserModal({ isOpen, onClose, preselectedUserId }: AssignUserModalProps) {
    const queryClient = useQueryClient()
    const user = useAuthStore((s) => s.user)

    // Form State
    const [selectedUser, setSelectedUser] = useState<string | null>(preselectedUserId || null)
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [searchUserQuery, setSearchUserQuery] = useState('')

    // Data Fetching
    const { data: usersData } = useQuery({
        queryKey: ['users', 'list'],
        queryFn: () => usersService.listUsers(100), // Fetch enough for search
        staleTime: 5 * 60 * 1000,
    })

    // Returns School[] directly
    const { data: schoolsData, isLoading: isLoadingSchools } = useQuery({
        queryKey: ['schools', 'list'],
        queryFn: () => tenantService.getSchools(user?.tenantId || ''),
        enabled: !!user?.tenantId,
        staleTime: 5 * 60 * 1000,
    })

    // Mutation
    const assignMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUser || !selectedSchool || !selectedRole) throw new Error('Missing fields')
            return usersService.assignRole(selectedUser, {
                schoolId: selectedSchool,
                role: selectedRole,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] }) // Refresh lists
            onClose()
            // Reset state
            setSelectedUser(null)
            setSelectedSchool(null)
            setSelectedRole(null)
        },
    })

    // Computed
    const filteredUsers = searchUserQuery === ''
        ? usersData?.items || []
        : usersData?.items.filter((user) =>
            `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes(searchUserQuery.toLowerCase().replace(/\s+/g, '')) ||
            user.email.toLowerCase().includes(searchUserQuery.toLowerCase())
        ) || []

    const handleClose = () => {
        setSelectedUser(preselectedUserId || null)
        setSelectedSchool(null)
        setSelectedRole(null)
        onClose()
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                                    >
                                        Assign User Role
                                    </Dialog.Title>
                                    <button
                                        onClick={handleClose}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Step 1: User Selection (if not preselected) */}
                                    {!preselectedUserId && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Select User
                                            </label>
                                            <Combobox value={selectedUser} onChange={setSelectedUser}>
                                                <div className="relative mt-1">
                                                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm">
                                                        <Combobox.Input
                                                            className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0"
                                                            displayValue={(userId: string) => {
                                                                const u = usersData?.items.find(u => u.userId === userId)
                                                                return u ? `${u.firstName} ${u.lastName} (${u.email})` : ''
                                                            }}
                                                            onChange={(event) => setSearchUserQuery(event.target.value)}
                                                            placeholder="Search by name or email..."
                                                        />
                                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronDown
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </Combobox.Button>
                                                    </div>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                        afterLeave={() => setSearchUserQuery('')}
                                                    >
                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                                                            {filteredUsers.length === 0 && searchUserQuery !== '' ? (
                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-400">
                                                                    Nothing found.
                                                                </div>
                                                            ) : (
                                                                filteredUsers.map((user) => (
                                                                    <Combobox.Option
                                                                        key={user.userId}
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-teal-600 text-white' : 'text-gray-900 dark:text-gray-200'
                                                                            }`
                                                                        }
                                                                        value={user.userId}
                                                                    >
                                                                        {({ selected, active }) => (
                                                                            <>
                                                                                <div className="flex flex-col">
                                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                                        {user.firstName} {user.lastName}
                                                                                    </span>
                                                                                    <span className={`block truncate text-xs ${active ? 'text-teal-200' : 'text-gray-500'}`}>
                                                                                        {user.email}
                                                                                    </span>
                                                                                </div>
                                                                                {selected ? (
                                                                                    <span
                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'
                                                                                            }`}
                                                                                    >
                                                                                        <Check className="h-5 w-5" aria-hidden="true" />
                                                                                    </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Combobox.Option>
                                                                ))
                                                            )}
                                                        </Combobox.Options>
                                                    </Transition>
                                                </div>
                                            </Combobox>
                                        </div>
                                    )}

                                    {/* Step 2: School Selection */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Assign to School
                                        </label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                            {!isLoadingSchools && schoolsData && schoolsData.map((school) => (
                                                <button
                                                    key={school.id}
                                                    onClick={() => setSelectedSchool(school.id)}
                                                    className={`
                                    flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                                    ${selectedSchool === school.id
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                `}
                                                >
                                                    <div className={`p-2 rounded-md ${selectedSchool === school.id ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        <SchoolIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{school.name}</div>
                                                        <div className="text-xs text-gray-500">{school.code}</div>
                                                    </div>
                                                    {selectedSchool === school.id && <Check className="w-5 h-5 text-teal-600 ml-auto" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Step 3: Role Selection */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Select Role
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ROLES.map((role) => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => setSelectedRole(role.id)}
                                                    className={`
                                    flex flex-col items-start p-3 rounded-lg border text-left transition-all h-full
                                    ${selectedRole === role.id
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                `}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 w-full">
                                                        {role.name}
                                                        {selectedRole === role.id && <Check className="w-4 h-4 text-teal-600 ml-auto" />}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => assignMutation.mutate()}
                                        disabled={!selectedUser || !selectedSchool || !selectedRole || assignMutation.isPending}
                                    >
                                        {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
