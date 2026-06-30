/**
 * Staff Detail Page
 * 
 * Enterprise-grade user profile page with:
 * - Animated tab navigation (Overview | Assignments | Security)
 * - Comprehensive user information display
 * - Security overview and session management
 * - Role assignment management
 */

import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQuery, useQueries } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import { Tabs } from '@edforge/ui'
import { AnimatedIcon, type IconName } from '@edforge/ui/motion'
import {
    User,
    Mail,
    Shield,
    School,
    Plus,
    ArrowLeft,
    Copy,
    Check,
    Clock,
    MapPin,
    Monitor,
    MoreVertical,
    Smartphone,
    Tablet,
    Key,
    AlertTriangle,
    CheckCircle2,
    Activity,
    BarChart3,
    Globe,
    Briefcase,
    Eye,
    EyeOff,
    Users,
    Edit2,
    Trash2,
    Loader2,
    Award,
    GraduationCap,
    CalendarDays,
    History,
    BookOpen,
    Phone,
    Heart,
} from 'lucide-react'
import { staffService } from '../../services/staff.service'
import type { StaffResponseDto, StaffAssignmentResponseDto } from '@aibrains/shared-types'
import { peopleService } from '../../services/people.service'
import type { SecurityOverview, UserSession } from '../../services/people.service'
import {
    StaffStatusBadge,
    getRoleLabel,
    AssignToSchoolModal,
    EditAssignmentModal,
    CredentialsSection,
    TrainingsSection,
    EmploymentHistory,
    LeaveManagement,
} from '../../components/staff'
import { useSchools } from '../../hooks/useSchools'
import { apiGet } from '../../lib/api'
import { useRemoveAssignment } from '../../hooks'
import { getStaffAvatar } from '../../lib/avatar'
import { formatDate, formatEmploymentType } from '../../lib/utils'
import { useCurrentAcademicYear } from '../../hooks/useAcademicYear'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' }
    }
}

// ============================================================================
// TYPES
// ============================================================================

type StaffTab = 'overview' | 'profile' | 'assignments' | 'credentials' | 'trainings' | 'employment-history' | 'leave' | 'security'

interface GradeRecord {
    gradeId: string
    percentage?: number
    letterGrade?: string
}

function percentageToLetter(avg: number): string {
    if (avg >= 93) return 'A'
    if (avg >= 90) return 'A-'
    if (avg >= 87) return 'B+'
    if (avg >= 83) return 'B'
    if (avg >= 80) return 'B-'
    if (avg >= 77) return 'C+'
    if (avg >= 73) return 'C'
    if (avg >= 70) return 'C-'
    if (avg >= 67) return 'D+'
    if (avg >= 60) return 'D'
    return 'F'
}

interface SectionData {
    sectionId: string
    courseId: string
    courseName?: string
    courseCode?: string
    sectionNumber: string
    sectionName?: string
    schoolId: string
    primaryTeacherId: string
    primaryTeacherName?: string
    periodName?: string
    locationRoomNumber?: string
    currentEnrollment: number
    maxEnrollment: number
    isActive: boolean
}

const TABS: { id: StaffTab; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'assignments', label: 'Assignments', icon: Briefcase },
    { id: 'credentials', label: 'Credentials', icon: Award },
    { id: 'trainings', label: 'Trainings', icon: GraduationCap },
    { id: 'employment-history', label: 'History', icon: History },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'security', label: 'Security', icon: Shield },
]

// Signature glyph per tab (clean counterparts only); unmapped tabs stay static.
const TAB_SIGNATURE: Partial<Record<StaffTab, IconName>> = {
    overview: 'overview',
    profile: 'account',
    trainings: 'academics',
    'employment-history': 'auditlog',
    security: 'security',
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CopyButton({ text }: { text: string }) {
    const { t } = useTranslation('people')
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
            title={t('actions.copyToClipboard')}
        >
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Check className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Copy className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    )
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
    switch (deviceType) {
        case 'mobile':
            return <Smartphone className="w-4 h-4" />
        case 'tablet':
            return <Tablet className="w-4 h-4" />
        default:
            return <Monitor className="w-4 h-4" />
    }
}

function StaffActionsDropdown({ onAssignToSchool }: { onAssignToSchool: () => void }) {
    const { t } = useTranslation('people')
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                title={t('actions.actions')}
            >
                <MoreVertical className="w-5 h-5" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-secondary))] rounded-lg shadow-lg z-50 py-1">
                    <button
                        onClick={() => {
                            onAssignToSchool()
                            setOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('actions.assignToSchool')}
                    </button>
                </div>
            )}
        </div>
    )
}

function SecurityScoreRing({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 36
    const progress = (score / 100) * circumference
    const color = score >= 80 ? 'text-[rgb(var(--state-success-fg))]' : score >= 50 ? 'text-amber-500' : 'text-[rgb(var(--state-danger-fg))]'
    const bgColor = score >= 80 ? 'stroke-emerald-500/20' : score >= 50 ? 'stroke-amber-500/20' : 'stroke-red-500/20'

    return (
        <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    className={bgColor}
                    strokeWidth="6"
                    fill="none"
                />
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    className={color}
                    strokeWidth="6"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{score}</span>
            </div>
        </div>
    )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
    return (
        <div className="min-h-full">
            <div className="max-w-full mx-auto px-6 py-6 space-y-8">
                <div className="animate-pulse space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[rgb(var(--background-secondary))] rounded-lg" />
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-[rgb(var(--background-secondary))] rounded-lg" />
                            <div className="h-4 w-32 bg-[rgb(var(--background-secondary))] rounded" />
                        </div>
                    </div>
                    <div className="h-64 bg-[rgb(var(--background-secondary))] rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

function ProfileTab({ staff, security, schoolMap }: { staff: StaffResponseDto; security?: SecurityOverview; schoolMap: Map<string, string> }) {
    const [showSensitive, setShowSensitive] = useState(false)
    const mask = (value: string | undefined | null) => (!showSensitive && value ? '••••••••' : (value || '—'))
    const addresses = staff.addresses ?? []
    // These fields are stored by the backend but not yet on StaffResponseDto
    const staffAny = staff as Record<string, unknown>
    const telephones = staffAny.telephones as Array<{ telephoneNumber: string; telephoneNumberTypeDescriptor?: string }> | undefined
    const emergencyContacts = staffAny.emergencyContacts as Array<{ name: string; relationship?: string; phone?: string; email?: string }> | undefined
    const maidenName = staffAny.maidenName as string | undefined
    const yearsOfPriorProfessionalExperience = staffAny.yearsOfPriorProfessionalExperience as number | undefined

    return (
        <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Privacy toggle */}
            <motion.div variants={fadeInUp} className="flex items-center justify-end">
                <button
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
                >
                    {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSensitive ? 'Hide sensitive details' : 'Show sensitive details'}
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Profile Information */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-5">
                {/* Demographics */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Demographics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">First Name</span>
                            <p className="text-sm text-[rgb(var(--text-primary))] font-medium">{staff.firstName || '—'}</p>
                        </div>
                        {staff.middleName && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Middle Name</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.middleName}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Last Name</span>
                            <p className="text-sm text-[rgb(var(--text-primary))] font-medium">{staff.lastSurname || '—'}</p>
                        </div>
                        {staff.generationCodeSuffix && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Suffix</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.generationCodeSuffix}</p>
                            </div>
                        )}
                        {maidenName && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Maiden Name</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{maidenName}</p>
                            </div>
                        )}
                        {staff.birthDate && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Date of Birth</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{mask(formatDate(staff.birthDate))}</p>
                            </div>
                        )}
                        {staff.gender && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Gender</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))] capitalize">{mask(staff.gender.replace('_', ' '))}</p>
                            </div>
                        )}
                        {staff.hispanicLatinoEthnicity !== undefined && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Hispanic/Latino</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{mask(staff.hispanicLatinoEthnicity ? 'Yes' : 'No')}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Staff Unique ID</span>
                            <p className="text-sm font-mono text-[rgb(var(--action-secondary-fg))]  font-medium">{staff.staffUniqueId}</p>
                        </div>
                    </div>
                </div>

                {/* Employment Information */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" />
                        Employment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Role</span>
                            <p className="text-sm text-[rgb(var(--text-primary))] font-medium">{getRoleLabel(staff.role)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Employment Status</span>
                            <div><StaffStatusBadge status={staff.employmentStatus} /></div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Employment Type</span>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">{formatEmploymentType(staff.employmentType)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Hire Date</span>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">{formatDate(staff.hireDate)}</p>
                        </div>
                        {staff.departmentName && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Department</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.departmentName}</p>
                            </div>
                        )}
                        {staff.title && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Title</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.title}</p>
                            </div>
                        )}
                        {typeof staff.yearsOfPriorTeachingExperience === 'number' && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Teaching Experience</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.yearsOfPriorTeachingExperience} years</p>
                            </div>
                        )}
                        {typeof yearsOfPriorProfessionalExperience === 'number' && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Professional Experience</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{yearsOfPriorProfessionalExperience} years</p>
                            </div>
                        )}
                        {staff.highlyQualifiedTeacher && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Highly Qualified</span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ">
                                    <CheckCircle2 className="w-3 h-3" />
                                    HQT Certified
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Email</span>
                            <p className="text-sm text-[rgb(var(--text-primary))]">{staff.email || '—'}</p>
                        </div>
                        {staff.phone && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Phone</span>
                                <p className="text-sm text-[rgb(var(--text-primary))]">{mask(staff.phone)}</p>
                            </div>
                        )}
                    </div>

                    {/* Telephones with type badges */}
                    {telephones && telephones.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
                            <h4 className="text-xs text-[rgb(var(--text-tertiary))] mb-3 flex items-center gap-1.5">
                                <Phone className="w-3 h-3" />
                                Phone Numbers
                            </h4>
                            <div className="space-y-2">
                                {telephones.map((tel, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <p className="text-sm text-[rgb(var(--text-secondary))]">{mask(tel.telephoneNumber)}</p>
                                        {tel.telephoneNumberTypeDescriptor && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
                                                {tel.telephoneNumberTypeDescriptor}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Addresses */}
                    {addresses.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
                            <h4 className="text-xs text-[rgb(var(--text-tertiary))] mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                {addresses.length === 1 ? 'Address' : 'Addresses'}
                            </h4>
                            <div className="space-y-3">
                                {addresses.map((address, i) => (
                                    <div key={i} className="text-sm text-[rgb(var(--text-secondary))] space-y-0.5">
                                        {address.addressTypeDescriptor && (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] mb-1">
                                                {address.addressTypeDescriptor}
                                            </span>
                                        )}
                                        {showSensitive ? (
                                            <>
                                                {address.streetNumberName && <p>{address.streetNumberName}</p>}
                                                <p>
                                                    {[address.city, address.stateAbbreviationDescriptor, address.postalCode]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            </>
                                        ) : (
                                            <p>••••••••</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Emergency Contacts */}
                {emergencyContacts && emergencyContacts.length > 0 && (
                    <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5" />
                            Emergency Contacts
                        </h3>
                        <div className="space-y-3">
                            {emergencyContacts.map((contact, i) => (
                                <div key={i} className="p-3 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{mask(contact.name)}</p>
                                        {contact.relationship && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
                                                {contact.relationship}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                                        {contact.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {mask(contact.phone)}
                                            </span>
                                        )}
                                        {contact.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {mask(contact.email)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Staff Identity & System Access */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        Staff Identity & System Access
                    </h3>
                    <div className="space-y-4">
                        {/* Staff Unique ID — Ed-Fi identifier (prominent) */}
                        <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.12)] border border-[rgb(var(--border-focus)/0.35)]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[rgb(var(--action-secondary-fg))]  uppercase tracking-wider">
                                    Staff Unique ID
                                </span>
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Ed-Fi Identifier</span>
                            </div>
                            <p className="text-lg font-mono font-semibold text-[rgb(var(--action-secondary-fg))] ">
                                {staff.staffUniqueId}
                            </p>
                            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                                Human-readable identifier for HR and Ed-Fi reporting
                            </p>
                        </div>

                        {/* System Staff ID — Internal UUID */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                                    System Staff ID
                                </span>
                                <CopyButton text={staff.staffId} />
                            </div>
                            <p className="text-xs font-mono text-[rgb(var(--text-secondary))] break-all">
                                {staff.staffId}
                            </p>
                            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                                Internal database identifier (UUID)
                            </p>
                        </div>

                        {/* Platform Access */}
                        <div className="pt-3 border-t border-[rgb(var(--border-secondary))]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                                        Platform Access
                                    </span>
                                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                                        {staff.userId ? 'Linked user account for system login' : 'No user account linked — cannot log in'}
                                    </p>
                                </div>
                                {staff.userId ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ">
                                        <Key className="w-3 h-3" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] ">
                                        No Account
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Primary School */}
                        {(staff.primarySchoolName || staff.primarySchoolId) && (
                            <div className="pt-3 border-t border-[rgb(var(--border-secondary))]">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Primary School</span>
                                <p className="text-sm text-[rgb(var(--text-primary))] font-medium mt-1">
                                    {staff.primarySchoolName || schoolMap.get(staff.primarySchoolId) || staff.primarySchoolId}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={fadeInUp} className="space-y-5">
                {/* Security Summary — only if staff has linked user */}
                {staff.userId && (
                    <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Security Summary
                        </h3>
                        <div className="space-y-0">
                            <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-secondary))]">
                                <span className="text-sm text-[rgb(var(--text-secondary))]">MFA Status</span>
                                {security?.mfaEnabled ? (
                                    <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--state-success-fg))] ">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Enabled
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Not Enabled
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-secondary))]">
                                <span className="text-sm text-[rgb(var(--text-secondary))]">Active Sessions</span>
                                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                    {security?.activeSessions ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-sm text-[rgb(var(--text-secondary))]">Last Login</span>
                                <span className="text-sm text-[rgb(var(--text-primary))]">
                                    {security?.lastLoginAt
                                        ? new Date(security.lastLoginAt).toLocaleDateString()
                                        : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Employment Status */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Employment Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[rgb(var(--text-secondary))]">Status</span>
                            <StaffStatusBadge status={staff.employmentStatus} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[rgb(var(--text-secondary))]">Type</span>
                            <span className="text-sm text-[rgb(var(--text-primary))]">{formatEmploymentType(staff.employmentType)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[rgb(var(--text-secondary))]">Hired</span>
                            <span className="text-sm text-[rgb(var(--text-primary))]">{formatDate(staff.hireDate)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
            </div>
        </motion.div>
    )
}

function OverviewTab({
    staff,
    assignments,
    sections,
    sectionsLoading,
    schoolMap,
}: {
    staff: StaffResponseDto
    assignments: StaffAssignmentResponseDto[] | undefined
    sections: SectionData[] | undefined
    sectionsLoading: boolean
    schoolMap: Map<string, string>
}) {
    const primarySchoolId = staff.primarySchoolId

    // Current academic year for enrollment queries
    const { data: currentYear } = useCurrentAcademicYear(primarySchoolId)

    // Enrollment summary for staffing ratio
    const { data: enrollmentSummary } = useQuery<{ totalEnrolled: number } | null>({
        queryKey: ['enrollment-summary', primarySchoolId, currentYear?.yearId],
        queryFn: async () => {
            try {
                return await apiGet<{ totalEnrolled: number }>(
                    `/academics/schools/${primarySchoolId}/years/${currentYear!.yearId}/enrollments/summary`,
                )
            } catch {
                return null
            }
        },
        enabled: !!primarySchoolId && !!currentYear?.yearId,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    // Staff count at primary school for staffing ratio
    const { data: staffAtSchool } = useQuery<number>({
        queryKey: ['staff-count', primarySchoolId],
        queryFn: async () => {
            try {
                const result = await apiGet<{ items: unknown[] }>('/staff', { schoolId: primarySchoolId, limit: 100 })
                return result.items?.length ?? 0
            } catch {
                return 0
            }
        },
        enabled: !!primarySchoolId,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    // Grade queries for each section (parallel)
    const sectionIds = sections?.map(s => s.sectionId) ?? []
    const gradeQueries = useQueries({
        queries: sectionIds.map(sectionId => {
            const section = sections!.find(s => s.sectionId === sectionId)!
            return {
                queryKey: ['grades', 'section', sectionId, section.schoolId],
                queryFn: async () => {
                    try {
                        return await apiGet<GradeRecord[]>(
                            `/academics/grades/section/${sectionId}`,
                            { schoolId: section.schoolId },
                        )
                    } catch {
                        return [] as GradeRecord[]
                    }
                },
                staleTime: 5 * 60 * 1000,
                retry: false,
            }
        }),
    })

    // Compute section-level grade averages
    const sectionGradeMap = new Map<string, { avg: number; letter: string } | null>()
    sectionIds.forEach((sectionId, i) => {
        const grades = gradeQueries[i]?.data
        if (!grades || grades.length === 0) {
            sectionGradeMap.set(sectionId, null)
            return
        }
        const withPercentage = grades.filter(g => typeof g.percentage === 'number')
        if (withPercentage.length === 0) {
            sectionGradeMap.set(sectionId, null)
            return
        }
        const avg = withPercentage.reduce((s, g) => s + g.percentage!, 0) / withPercentage.length
        sectionGradeMap.set(sectionId, { avg: Math.round(avg), letter: percentageToLetter(avg) })
    })

    // Overall stats
    const totalSections = sections?.length ?? 0
    const totalStudents = sections?.reduce((sum, s) => sum + (s.currentEnrollment ?? 0), 0) ?? 0
    const totalCapacity = sections?.reduce((sum, s) => sum + (s.maxEnrollment ?? 0), 0) ?? 0
    const capacityPercent = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0

    // Overall average grade across all sections
    const allAvgs = [...sectionGradeMap.values()].filter(v => v !== null).map(v => v!.avg)
    const overallAvg = allAvgs.length > 0 ? Math.round(allAvgs.reduce((s, a) => s + a, 0) / allAvgs.length) : null
    const overallLetter = overallAvg !== null ? percentageToLetter(overallAvg) : null

    // Staffing ratio
    const staffCount = staffAtSchool ?? 0
    const studentCount = enrollmentSummary?.totalEnrolled ?? 0
    const staffingRatio = staffCount > 0 ? Math.round(studentCount / staffCount) : null

    // Active assignments
    const activeAssignments = assignments?.filter(a => !a.endDate || new Date(a.endDate) >= new Date()) ?? []

    const isTeachingStaff = totalSections > 0

    return (
        <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Stat Cards */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">Sections</p>
                    <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                        {sectionsLoading ? '—' : totalSections}
                    </p>
                </div>
                <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">Students</p>
                    <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                        {sectionsLoading ? '—' : totalStudents}
                    </p>
                </div>
                <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">Capacity</p>
                    <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                        {sectionsLoading ? '—' : `${capacityPercent}%`}
                    </p>
                </div>
                <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">Avg Grade</p>
                    <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                        {overallLetter ? `${overallLetter} (${overallAvg})` : '—'}
                    </p>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Assignments + Section Performance */}
                <div className="lg:col-span-2 space-y-6">
                    {/* School Assignments */}
                    <motion.div variants={fadeInUp} className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />
                            School Assignments
                        </h3>
                        {activeAssignments.length === 0 ? (
                            <p className="text-sm text-[rgb(var(--text-tertiary))]">No active assignments</p>
                        ) : (
                            <div className="space-y-2">
                                {activeAssignments.map(a => (
                                    <div key={a.assignmentId} className="flex items-center justify-between p-2.5 rounded-lg bg-[rgb(var(--background-tertiary))]">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                                                {schoolMap.get(a.schoolId) || a.schoolName || 'Unknown School'}
                                            </p>
                                            <p className="text-xs text-[rgb(var(--text-tertiary))]">
                                                {getRoleLabel(a.role)}
                                                {typeof a.fullTimeEquivalency === 'number' && ` · FTE ${a.fullTimeEquivalency.toFixed(2)}`}
                                                {a.beginDate && ` · ${formatDate(a.beginDate)}`}
                                            </p>
                                        </div>
                                        {a.isPrimary && (
                                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]  flex-shrink-0">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Section Performance Table */}
                    {isTeachingStaff && (
                        <motion.div variants={fadeInUp} className="rounded-xl border border-[rgb(var(--border-secondary))]">
                            <div className="p-5 pb-3">
                                <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Section Performance
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[rgb(var(--background-tertiary))]">
                                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Course</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Enrolled</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Avg Grade</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Att %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                                        {sectionsLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center">
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[rgb(var(--text-tertiary))]" />
                                                </td>
                                            </tr>
                                        ) : (
                                            sections?.map(section => {
                                                const gradeInfo = sectionGradeMap.get(section.sectionId)
                                                return (
                                                    <tr key={section.sectionId} className="bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors">
                                                        <td className="px-5 py-3">
                                                            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                                                {section.courseName || '—'}
                                                            </p>
                                                            {section.courseCode && (
                                                                <p className="text-xs text-[rgb(var(--text-tertiary))]">{section.courseCode}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-sm text-[rgb(var(--text-secondary))]">
                                                            {section.currentEnrollment} / {section.maxEnrollment}
                                                        </td>
                                                        <td className="px-5 py-3 text-sm">
                                                            {gradeInfo ? (
                                                                <span className="font-medium text-[rgb(var(--text-primary))]">
                                                                    {gradeInfo.letter} ({gradeInfo.avg})
                                                                </span>
                                                            ) : (
                                                                <span className="text-[rgb(var(--text-tertiary))]">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-sm text-[rgb(var(--text-tertiary))]">
                                                            —
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Non-teaching fallback */}
                    {!isTeachingStaff && !sectionsLoading && (
                        <motion.div variants={fadeInUp} className="text-center py-12 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
                            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">No Teaching Sections</h4>
                            <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-xs mx-auto">
                                This staff member is not assigned as a teacher to any sections.
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Staffing Ratio */}
                <div className="space-y-6">
                    <motion.div variants={fadeInUp} className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Staffing Ratio
                        </h3>
                        {primarySchoolId ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[rgb(var(--text-secondary))]">Staff</span>
                                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{staffCount || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[rgb(var(--text-secondary))]">Students</span>
                                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{studentCount || '—'}</span>
                                </div>
                                <div className="pt-3 border-t border-[rgb(var(--border-secondary))]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">Ratio</span>
                                        <span className="text-lg font-bold text-[rgb(var(--text-primary))]">
                                            {staffingRatio !== null ? `1:${staffingRatio}` : '—'}
                                        </span>
                                    </div>
                                </div>
                                {schoolMap.get(primarySchoolId) && (
                                    <p className="text-xs text-[rgb(var(--text-tertiary))] pt-2">
                                        At {schoolMap.get(primarySchoolId)}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-[rgb(var(--text-tertiary))]">No primary school assigned</p>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

function AssignmentsTab({
    assignments,
    isLoading,
    staffId,
    schoolMap,
    sections,
    sectionsLoading,
}: {
    assignments: StaffAssignmentResponseDto[] | undefined
    isLoading: boolean
    staffId: string
    schoolMap: Map<string, string>
    sections: SectionData[] | undefined
    sectionsLoading: boolean
}) {
    const removeAssignment = useRemoveAssignment()
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [editingAssignment, setEditingAssignment] = useState<StaffAssignmentResponseDto | null>(null)

    const handleRemoveAssignment = async (assignmentId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to remove this assignment? This action cannot be undone.'
        )
        if (!confirmed) return

        setRemovingId(assignmentId)
        try {
            await removeAssignment.mutateAsync({ staffId, assignmentId })
            toast.success('Assignment removed successfully')
        } catch {
            toast.error('Failed to remove assignment')
        } finally {
            setRemovingId(null)
        }
    }

    // Calculate total FTE across active assignments
    const activeAssignments = assignments?.filter(a => !a.endDate || new Date(a.endDate) >= new Date()) ?? []
    const totalFTE = activeAssignments.reduce((sum, a) => sum + (a.fullTimeEquivalency ?? 0), 0)
    const hasAssignments = assignments && assignments.length > 0

    return (
        <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Section Label */}
            <motion.div variants={fadeInUp}>
                <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">School Assignments</h3>
            </motion.div>

            {/* FTE Indicator */}
            {hasAssignments && activeAssignments.some(a => typeof a.fullTimeEquivalency === 'number') && (
                <motion.div variants={fadeInUp} className="rounded-lg border border-[rgb(var(--border-secondary))] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">Total FTE</span>
                        <span className={`text-xs font-bold ${totalFTE > 1 ? 'text-[rgb(var(--state-danger-fg))] ' : 'text-[rgb(var(--text-primary))]'}`}>
                            {totalFTE.toFixed(2)}
                        </span>
                    </div>
                    <div className="w-full bg-[rgb(var(--background-tertiary))] rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all ${totalFTE > 1 ? 'bg-[rgb(var(--state-danger-fg))]' : totalFTE > 0.8 ? 'bg-amber-500' : 'bg-[rgb(var(--action-primary-bg))]'}`}
                            style={{ width: `${Math.min(totalFTE * 100, 100)}%` }}
                        />
                    </div>
                    {totalFTE > 1 && (
                        <p className="text-xs text-[rgb(var(--state-danger-fg))]  mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overcommitted — exceeds 1.0
                        </p>
                    )}
                </motion.div>
            )}

            {/* Assignments List */}
            <motion.div variants={fadeInUp}>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse h-14 bg-[rgb(var(--background-secondary))] rounded-lg" />
                        ))}
                    </div>
                ) : !hasAssignments ? (
                    <div className="text-center py-12 bg-[rgb(var(--background-secondary))] rounded-lg border-2 border-dashed border-[rgb(var(--border-secondary))]">
                        <School className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
                        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">No Assignments</h4>
                        <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-xs mx-auto">
                            Use the actions menu to assign this staff member to a school.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {assignments.map((assignment) => {
                            const schoolName = schoolMap.get(assignment.schoolId) || assignment.schoolName || 'Unknown School'
                            const hasEnded = assignment.endDate && new Date(assignment.endDate) < new Date()
                            const isRemoving = removingId === assignment.assignmentId

                            return (
                                <motion.div
                                    key={assignment.assignmentId}
                                    variants={fadeInUp}
                                    className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))] hover:border-[rgb(var(--border-focus)/0.35)] transition-all group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">
                                                {schoolName}
                                            </h4>
                                            {hasEnded && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]  flex-shrink-0">
                                                    Ended
                                                </span>
                                            )}
                                            {assignment.isPrimary && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]  flex-shrink-0">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-[rgb(var(--text-tertiary))]">
                                            <span className="font-medium text-[rgb(var(--text-secondary))]">{getRoleLabel(assignment.role)}</span>
                                            {assignment.departmentName && (
                                                <>
                                                    <span className="text-[rgb(var(--border-secondary))]">&middot;</span>
                                                    <span>{assignment.departmentName}</span>
                                                </>
                                            )}
                                            {typeof assignment.fullTimeEquivalency === 'number' && (
                                                <>
                                                    <span className="text-[rgb(var(--border-secondary))]">&middot;</span>
                                                    <span className="text-[rgb(var(--state-info-fg))] ">FTE {assignment.fullTimeEquivalency.toFixed(2)}</span>
                                                </>
                                            )}
                                            <span className="text-[rgb(var(--border-secondary))]">&middot;</span>
                                            <span>
                                                {formatDate(assignment.beginDate)}
                                                {assignment.endDate && ` \u2013 ${formatDate(assignment.endDate)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3">
                                        <button
                                            onClick={() => setEditingAssignment(assignment)}
                                            className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                            title="Edit"
                                            disabled={isRemoving}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveAssignment(assignment.assignmentId)}
                                            className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                                            title="Remove"
                                            disabled={isRemoving}
                                        >
                                            {isRemoving ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            {/* Edit Assignment Modal */}
            <EditAssignmentModal
                open={!!editingAssignment}
                onClose={() => setEditingAssignment(null)}
                staffId={staffId}
                assignment={editingAssignment}
            />

            {/* Teaching Sections */}
            {sectionsLoading ? (
                <motion.div variants={fadeInUp} className="mt-6">
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse h-10 bg-[rgb(var(--background-secondary))] rounded-lg" />
                        ))}
                    </div>
                </motion.div>
            ) : sections && sections.length > 0 ? (
                <motion.div variants={fadeInUp} className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Teaching Sections</h3>
                        <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))]">
                            <span><strong className="text-[rgb(var(--text-primary))] font-semibold">{sections.length}</strong> sections</span>
                            <span className="text-[rgb(var(--border-secondary))]">&middot;</span>
                            <span><strong className="text-[rgb(var(--text-primary))] font-semibold">{sections.reduce((sum, s) => sum + (s.currentEnrollment ?? 0), 0)}</strong> students</span>
                        </div>
                    </div>

                    {/* Sections grouped by school */}
                    {Object.entries(
                        sections.reduce<Record<string, SectionData[]>>((acc, section) => {
                            const key = schoolMap.get(section.schoolId) || section.schoolId || 'Unknown School'
                            if (!acc[key]) acc[key] = []
                            acc[key].push(section)
                            return acc
                        }, {})
                    ).map(([schoolName, schoolSections]) => (
                        <div key={schoolName}>
                            <h4 className="text-xs font-medium text-[rgb(var(--text-tertiary))] mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                {schoolName}
                                <span className="font-normal">({schoolSections.length})</span>
                            </h4>
                            <div className="overflow-hidden rounded-lg border border-[rgb(var(--border-secondary))]">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[rgb(var(--background-tertiary))]">
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Course</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Section</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Period</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Room</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Enrolled</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                                        {schoolSections.map((section) => (
                                            <tr
                                                key={section.sectionId}
                                                className="bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
                                            >
                                                <td className="px-3 py-2">
                                                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                                                        {section.courseName || '\u2014'}
                                                    </p>
                                                    {section.courseCode && (
                                                        <p className="text-xs text-[rgb(var(--text-tertiary))]">{section.courseCode}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                                                        {section.sectionName || section.sectionNumber}
                                                    </p>
                                                    {section.sectionName && (
                                                        <p className="text-xs text-[rgb(var(--text-tertiary))]">#{section.sectionNumber}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                                                    {section.periodName || '\u2014'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                                                    {section.locationRoomNumber || '\u2014'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                                                    {section.currentEnrollment} / {section.maxEnrollment}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </motion.div>
            ) : null}
        </motion.div>
    )
}

function SecurityTab({ 
    security, 
    sessions,
    isLoading 
}: { 
    security?: SecurityOverview
    sessions?: UserSession[]
    isLoading: boolean 
}) {
    return (
        <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {isLoading ? (
                <div className="space-y-6">
                    <div className="animate-pulse h-48 bg-[rgb(var(--background-secondary))] rounded-xl" />
                    <div className="animate-pulse h-64 bg-[rgb(var(--background-secondary))] rounded-xl" />
                </div>
            ) : (
                <>
                    {/* Security Score Card */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6 flex flex-col items-center justify-center">
                            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Security Score</h3>
                            <SecurityScoreRing score={security?.securityScore ?? 0} />
                            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-4 text-center">
                                {(security?.securityScore ?? 0) >= 80
                                    ? 'Excellent security posture'
                                    : (security?.securityScore ?? 0) >= 50
                                        ? 'Room for improvement'
                                        : 'Security attention needed'}
                            </p>
                        </div>

                        {/* Security Status */}
                        <div className="lg:col-span-2 bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6">
                            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Security Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className={`p-2 rounded-lg ${security?.mfaEnabled ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]' : 'bg-amber-500/10 text-amber-600'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            Two-Factor Auth
                                        </p>
                                        <p className={`text-xs ${security?.mfaEnabled ? 'text-[rgb(var(--state-success-fg))] ' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {security?.mfaEnabled ? `Enabled (${security.mfaMethod || 'TOTP'})` : 'Not Enabled'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]">
                                        <Monitor className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            Active Sessions
                                        </p>
                                        <p className="text-xs text-[rgb(var(--text-secondary))]">
                                            {security?.activeSessions ?? 0} device{(security?.activeSessions ?? 0) !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            Password
                                        </p>
                                        <p className="text-xs text-[rgb(var(--text-secondary))]">
                                            {security?.passwordLastChangedAt
                                                ? `Changed ${new Date(security.passwordLastChangedAt).toLocaleDateString()}`
                                                : 'Never changed'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className={`p-2 rounded-lg ${(security?.failedLoginAttempts ?? 0) > 0 ? 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]' : 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]'}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            Failed Logins
                                        </p>
                                        <p className="text-xs text-[rgb(var(--text-secondary))]">
                                            {security?.failedLoginAttempts ?? 0} recent attempts
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recommendations */}
                    {security?.recommendations && security.recommendations.length > 0 && (
                        <motion.div variants={fadeInUp} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Security Recommendations
                            </h3>
                            <ul className="space-y-2">
                                {security.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-[rgb(var(--text-secondary))] flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Active Sessions */}
                    <motion.div variants={fadeInUp} className="bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6">
                        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                            Active Sessions
                        </h3>
                        {sessions && sessions.length > 0 ? (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <div
                                        key={session.sessionId}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${session.isCurrent
                                            ? 'border-[rgb(var(--border-focus)/0.35)] bg-[rgb(var(--state-info-bg)/0.12)]'
                                            : 'border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-primary))]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]">
                                                <DeviceIcon deviceType={session.deviceType} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                                        {session.browser} on {session.os}
                                                    </p>
                                                    {session.isCurrent && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))] ">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {session.ipAddress}
                                                    </span>
                                                    {session.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {session.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-[rgb(var(--text-tertiary))]">Last active</p>
                                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                                {new Date(session.lastActivityAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[rgb(var(--text-tertiary))] text-center py-8">
                                No active sessions found
                            </p>
                        )}
                    </motion.div>
                </>
            )}
        </motion.div>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StaffDetailPage() {
    const { t } = useTranslation('people')
    const { staffId } = useParams({ from: '/staff/$staffId' })
    const [activeTab, setActiveTab] = useState<StaffTab>('overview')
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

    // Schools lookup for resolving schoolId → name
    const { schoolMap } = useSchools()

    // Fetch Staff
    const { data: staff, isLoading: isLoadingStaff } = useQuery({
        queryKey: ['staff', staffId],
        queryFn: () => staffService.getStaff(staffId),
    })

    // Fetch Assignments
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['staff', staffId, 'assignments'],
        queryFn: () => staffService.getStaffAssignments(staffId),
    })

    // Fetch Teaching Sections — lazy-loaded when Assignments tab is active
    const { data: sections, isLoading: isLoadingSections } = useQuery<SectionData[]>({
        queryKey: ['sections', 'teacher', staffId],
        queryFn: async () => {
            try {
                const response = await apiGet<{ items: SectionData[] } | SectionData[]>(
                    '/academics/sections',
                    { teacherId: staffId },
                )
                if (Array.isArray(response)) return response
                return response.items ?? []
            } catch {
                return []
            }
        },
        enabled: !!staffId && (activeTab === 'overview' || activeTab === 'assignments'),
        staleTime: 60_000,
        retry: false,
    })

    // Fetch Security — only if staff has a linked user account
    const { data: security, isLoading: isLoadingSecurity } = useQuery({
        queryKey: ['user', staff?.userId, 'security'],
        queryFn: () => peopleService.getUserSecurity(staff!.userId!),
        enabled: !!staff?.userId,
    })

    // Fetch Sessions — only when security tab is active and staff has linked user
    const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['user', staff?.userId, 'sessions'],
        queryFn: () => peopleService.getUserSessions(staff!.userId!),
        enabled: activeTab === 'security' && !!staff?.userId,
    })

    if (isLoadingStaff) {
        return <LoadingSkeleton />
    }

    if (!staff) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center py-16">
                    <User className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">{t('detail.notFound.title')}</h2>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        {t('detail.notFound.description')}
                    </p>
                    <Link
                        to="/staff"
                        className="inline-flex items-center gap-2 mt-6 px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--state-info-fg))] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('detail.backToDirectory')}
                    </Link>
                </div>
            </div>
        )
    }

    const displayName = [staff.firstName, staff.lastSurname].filter(Boolean).join(' ') || t('detail.unknownStaff')
    const avatarUrl = getStaffAvatar(staff.staffId)
    const statusDotColor = staff.employmentStatus === 'active' ? 'bg-[rgb(var(--state-success-fg))]'
        : staff.employmentStatus === 'on_leave' ? 'bg-amber-500'
        : 'bg-[rgb(var(--text-tertiary))]'

    return (
        <div className="min-h-full">
            <div className="max-w-full mx-auto px-6 py-6 space-y-0">
                {/* Header Section */}
                <div className="space-y-0">
                    {/* Profile Info */}
                    <div className="flex items-start gap-4 pb-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-14 h-14 rounded-xl object-cover ring-2 ring-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--background-primary))] ${statusDotColor}`} />
                        </div>

                        {/* Name & Meta */}
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
                                {displayName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-sm">
                                <span className="text-[rgb(var(--text-tertiary))] truncate">{staff.email}</span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <span className="font-medium text-[rgb(var(--action-secondary-fg))] ">
                                    {getRoleLabel(staff.role)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <StaffStatusBadge status={staff.employmentStatus} />
                            </div>
                        </div>

                        {/* Actions Menu */}
                        <StaffActionsDropdown onAssignToSchool={() => setIsAssignModalOpen(true)} />
                    </div>

                    {/* Tabs — left-aligned (shared Tabs primitive) */}
                    <Tabs
                        tabs={TABS.filter((tab) => !(tab.id === 'security' && !staff.userId)).map((tab) => {
                            const Icon = tab.icon
                            const sig = TAB_SIGNATURE[tab.id]
                            return {
                                id: tab.id,
                                label: (
                                    <span className="flex items-center gap-2">
                                        <AnimatedIcon name={sig} icon={Icon} size={16} applyAccent={false} />
                                        {t(`tabs.${tab.id}`, { defaultValue: tab.label })}
                                    </span>
                                ),
                            }
                        })}
                        value={activeTab}
                        onChange={(v) => setActiveTab(v as StaffTab)}
                        aria-label={t('detail.sectionsAria')}
                    />
                </div>

                {/* Content Area */}
                <div className="min-h-128 pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    staff={staff}
                                    assignments={assignments}
                                    sections={sections}
                                    sectionsLoading={isLoadingSections}
                                    schoolMap={schoolMap}
                                />
                            )}
                            {activeTab === 'profile' && (
                                <ProfileTab staff={staff} security={security} schoolMap={schoolMap} />
                            )}
                            {activeTab === 'assignments' && (
                                <AssignmentsTab
                                    assignments={assignments}
                                    isLoading={isLoadingAssignments}
                                    staffId={staffId}
                                    schoolMap={schoolMap}
                                    sections={sections}
                                    sectionsLoading={isLoadingSections}
                                />
                            )}
                            {activeTab === 'credentials' && (
                                <CredentialsSection staffId={staffId} />
                            )}
                            {activeTab === 'trainings' && (
                                <TrainingsSection staffId={staffId} />
                            )}
                            {activeTab === 'employment-history' && (
                                <EmploymentHistory staffId={staffId} currentStatus={staff.employmentStatus} />
                            )}
                            {activeTab === 'leave' && (
                                <LeaveManagement staffId={staffId} staffName={displayName} />
                            )}
                            {activeTab === 'security' && staff.userId && (
                                <SecurityTab
                                    security={security}
                                    sessions={sessionsData?.sessions}
                                    isLoading={isLoadingSecurity || isLoadingSessions}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Assign to School Modal */}
            <AssignToSchoolModal
                open={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                staffId={staffId}
                staffName={displayName}
            />
        </div>
    )
}
