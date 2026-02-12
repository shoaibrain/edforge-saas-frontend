/**
 * Staff Detail Page
 * 
 * Enterprise-grade user profile page with:
 * - Animated tab navigation (Overview | Assignments | Security)
 * - Comprehensive user information display
 * - Security overview and session management
 * - Role assignment management
 */

import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
    User,
    Mail,
    Shield,
    School,
    Plus,
    ArrowLeft,
    GraduationCap,
    Copy,
    Check,
    Clock,
    MapPin,
    Monitor,
    Smartphone,
    Tablet,
    Key,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Globe,
    Briefcase,
    Edit2,
    Trash2,
    Loader2,
    Award,
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
    EmploymentHistory,
    SectionAssociations,
    LeaveManagement,
} from '../../components/staff'
import { useSchools } from '../../hooks/useSchools'
import { useRemoveAssignment } from '../../hooks'
import { getStaffAvatar } from '../../lib/avatar'
import { formatDate, formatEmploymentType } from '../../lib/utils'

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

type StaffTab = 'overview' | 'assignments' | 'credentials' | 'employment-history' | 'sections' | 'leave' | 'security'

const TABS: { id: StaffTab; label: string; icon: typeof User; teachingOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'assignments', label: 'Assignments', icon: Briefcase },
    { id: 'credentials', label: 'Credentials', icon: Award },
    { id: 'employment-history', label: 'History', icon: History },
    { id: 'sections', label: 'Sections', icon: BookOpen, teachingOnly: true },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'security', label: 'Security', icon: Shield },
]

const TEACHING_ROLES = ['teacher', 'substitute']

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CopyButton({ text }: { text: string }) {
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
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
            title="Copy to clipboard"
        >
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Check className="w-4 h-4 text-emerald-500" />
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

function SecurityScoreRing({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 36
    const progress = (score / 100) * circumference
    const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
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
            <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-8">
                <div className="animate-pulse space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[rgb(var(--surface-secondary))] rounded-lg" />
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-[rgb(var(--surface-secondary))] rounded-lg" />
                            <div className="h-4 w-32 bg-[rgb(var(--surface-secondary))] rounded" />
                        </div>
                    </div>
                    <div className="h-64 bg-[rgb(var(--surface-secondary))] rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

function OverviewTab({ staff, security, schoolMap }: { staff: StaffResponseDto; security?: SecurityOverview; schoolMap: Map<string, string> }) {
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
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
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{formatDate(staff.birthDate)}</p>
                            </div>
                        )}
                        {staff.gender && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Gender</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))] capitalize">{staff.gender.replace('_', ' ')}</p>
                            </div>
                        )}
                        {staff.hispanicLatinoEthnicity !== undefined && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Hispanic/Latino</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.hispanicLatinoEthnicity ? 'Yes' : 'No'}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Staff Unique ID</span>
                            <p className="text-sm font-mono text-teal-600 dark:text-teal-400 font-medium">{staff.staffUniqueId}</p>
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
                        {staff.department && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Department</span>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">{staff.department}</p>
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
                                <p className="text-sm text-[rgb(var(--text-primary))]">{staff.phone}</p>
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
                                        <p className="text-sm text-[rgb(var(--text-secondary))]">{tel.telephoneNumber}</p>
                                        {tel.telephoneNumberTypeDescriptor && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]">
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
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] mb-1">
                                                {address.addressTypeDescriptor}
                                            </span>
                                        )}
                                        {address.streetNumberName && <p>{address.streetNumberName}</p>}
                                        <p>
                                            {[address.city, address.stateAbbreviationDescriptor, address.postalCode]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
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
                                <div key={i} className="p-3 rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{contact.name}</p>
                                        {contact.relationship && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]">
                                                {contact.relationship}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                                        {contact.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {contact.phone}
                                            </span>
                                        )}
                                        {contact.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {contact.email}
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
                        <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                                    Staff Unique ID
                                </span>
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Ed-Fi Identifier</span>
                            </div>
                            <p className="text-lg font-mono font-semibold text-teal-600 dark:text-teal-400">
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
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Key className="w-3 h-3" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400">
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
                                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
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
        </motion.div>
    )
}

function AssignmentsTab({
    assignments,
    isLoading,
    staffId,
    schoolMap,
    onOpenAssignModal,
}: {
    assignments: StaffAssignmentResponseDto[] | undefined
    isLoading: boolean
    staffId: string
    schoolMap: Map<string, string>
    onOpenAssignModal: () => void
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
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">School Assignments</h3>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Manage role assignments across different schools
                    </p>
                </div>
                <button
                    onClick={onOpenAssignModal}
                    className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Assign to School
                </button>
            </motion.div>

            {/* FTE Indicator */}
            {hasAssignments && activeAssignments.some(a => typeof a.fullTimeEquivalency === 'number') && (
                <motion.div variants={fadeInUp} className="rounded-xl border border-[rgb(var(--border-secondary))] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Total FTE</span>
                        <span className={`text-sm font-bold ${totalFTE > 1 ? 'text-red-600 dark:text-red-400' : 'text-[rgb(var(--text-primary))]'}`}>
                            {totalFTE.toFixed(2)}
                        </span>
                    </div>
                    <div className="w-full bg-[rgb(var(--surface-tertiary))] rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${totalFTE > 1 ? 'bg-red-500' : totalFTE > 0.8 ? 'bg-amber-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min(totalFTE * 100, 100)}%` }}
                        />
                    </div>
                    {totalFTE > 1 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overcommitted — total FTE exceeds 1.0
                        </p>
                    )}
                </motion.div>
            )}

            {/* Assignments List */}
            <motion.div variants={fadeInUp}>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse h-24 bg-[rgb(var(--surface-secondary))] rounded-xl" />
                        ))}
                    </div>
                ) : !hasAssignments ? (
                    <div className="text-center py-16 bg-[rgb(var(--surface-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
                        <School className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
                        <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Active Assignments</h4>
                        <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
                            This staff member is not currently assigned to any schools. Click &quot;Assign to School&quot; to add one.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => {
                            const schoolName = schoolMap.get(assignment.schoolId) || assignment.schoolName || 'Unknown School'
                            const hasEnded = assignment.endDate && new Date(assignment.endDate) < new Date()
                            const isRemoving = removingId === assignment.assignmentId

                            return (
                                <motion.div
                                    key={assignment.assignmentId}
                                    variants={fadeInUp}
                                    className="flex items-center justify-between p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:border-teal-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                            <School className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-[rgb(var(--text-primary))]">
                                                    {schoolName}
                                                </h4>
                                                {hasEnded && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400">
                                                        Ended
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-secondary))]">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                    {getRoleLabel(assignment.role)}
                                                </span>
                                                {assignment.department && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]">
                                                        {assignment.department}
                                                    </span>
                                                )}
                                                {assignment.isPrimary && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                                        Primary
                                                    </span>
                                                )}
                                                {typeof assignment.fullTimeEquivalency === 'number' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        FTE: {assignment.fullTimeEquivalency.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                                                {assignment.positionTitle && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {assignment.positionTitle}
                                                    </span>
                                                )}
                                                <span>Since {formatDate(assignment.beginDate)}</span>
                                                {assignment.endDate && (
                                                    <span>Ended {formatDate(assignment.endDate)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingAssignment(assignment)}
                                            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                            title="Edit assignment"
                                            disabled={isRemoving}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveAssignment(assignment.assignmentId)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-[rgb(var(--text-tertiary))] hover:text-red-600 transition-colors"
                                            title="Remove assignment"
                                            disabled={isRemoving}
                                        >
                                            {isRemoving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
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
                    <div className="animate-pulse h-48 bg-[rgb(var(--surface-secondary))] rounded-xl" />
                    <div className="animate-pulse h-64 bg-[rgb(var(--surface-secondary))] rounded-xl" />
                </div>
            ) : (
                <>
                    {/* Security Score Card */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6 flex flex-col items-center justify-center">
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
                        <div className="lg:col-span-2 bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6">
                            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Security Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className={`p-2 rounded-lg ${security?.mfaEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            Two-Factor Auth
                                        </p>
                                        <p className={`text-xs ${security?.mfaEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {security?.mfaEnabled ? `Enabled (${security.mfaMethod || 'TOTP'})` : 'Not Enabled'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
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
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
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
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))]">
                                    <div className={`p-2 rounded-lg ${(security?.failedLoginAttempts ?? 0) > 0 ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
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
                    <motion.div variants={fadeInUp} className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6">
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
                                            ? 'border-teal-500/30 bg-teal-500/5'
                                            : 'border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-primary))]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]">
                                                <DeviceIcon deviceType={session.deviceType} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                                        {session.browser} on {session.os}
                                                    </p>
                                                    {session.isCurrent && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400">
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
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Staff Member Not Found</h2>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        The requested staff member could not be found.
                    </p>
                    <Link
                        to="/staff"
                        className="inline-flex items-center gap-2 mt-6 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Staff Directory
                    </Link>
                </div>
            </div>
        )
    }

    const displayName = [staff.firstName, staff.lastSurname].filter(Boolean).join(' ') || 'Unknown Staff'
    const avatarUrl = getStaffAvatar(staff.staffId)
    const statusDotColor = staff.employmentStatus === 'active' ? 'bg-emerald-500'
        : staff.employmentStatus === 'on_leave' ? 'bg-amber-500'
        : 'bg-gray-400'

    return (
        <div className="min-h-full">
            <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-0">
                {/* Header Section */}
                <div className="space-y-0">
                    {/* Profile Info */}
                    <div className="flex items-start gap-5 pb-6">
                        <Link
                            to="/staff"
                            className="p-2 -ml-2 mt-1 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-16 h-16 rounded-xl object-cover ring-2 ring-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[rgb(var(--surface-primary))] ${statusDotColor}`} />
                        </div>

                        {/* Name & Meta */}
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
                                {displayName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                                <span className="text-[rgb(var(--text-tertiary))] truncate">{staff.email}</span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <span className="font-medium text-teal-600 dark:text-teal-400">
                                    {getRoleLabel(staff.role)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <StaffStatusBadge status={staff.employmentStatus} />
                            </div>
                        </div>
                    </div>

                    {/* Tabs — left-aligned */}
                    <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id
                            const Icon = tab.icon
                            // Hide security tab if staff has no linked user
                            if (tab.id === 'security' && !staff.userId) return null
                            // Hide sections tab for non-teaching roles
                            if (tab.teachingOnly && !TEACHING_ROLES.includes(staff.role)) return null
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none
                                        ${isActive
                                            ? 'text-[rgb(var(--text-primary))]'
                                            : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                                        }
                                    `}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'opacity-70'}`} />
                                        {tab.label}
                                    </span>

                                    {/* Active Indicator Line */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="staffTabIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {activeTab === 'overview' && (
                                <OverviewTab staff={staff} security={security} schoolMap={schoolMap} />
                            )}
                            {activeTab === 'assignments' && (
                                <AssignmentsTab
                                    assignments={assignments}
                                    isLoading={isLoadingAssignments}
                                    staffId={staffId}
                                    schoolMap={schoolMap}
                                    onOpenAssignModal={() => setIsAssignModalOpen(true)}
                                />
                            )}
                            {activeTab === 'credentials' && (
                                <CredentialsSection staffId={staffId} />
                            )}
                            {activeTab === 'employment-history' && (
                                <EmploymentHistory staffId={staffId} currentStatus={staff.employmentStatus} />
                            )}
                            {activeTab === 'sections' && TEACHING_ROLES.includes(staff.role) && (
                                <SectionAssociations staffId={staffId} staffRole={staff.role} />
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
