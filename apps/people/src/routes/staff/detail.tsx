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
    XCircle,
    Activity,
    Globe,
    Briefcase,
} from 'lucide-react'
import { peopleService } from '../../services/people.service'
import type { SecurityOverview, UserSession, SchoolAssignment, UserResponseDto } from '../../services/people.service'
import { getStaffAvatar } from '../../lib/avatar'

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

type StaffTab = 'overview' | 'assignments' | 'security'

const TABS: { id: StaffTab; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'assignments', label: 'Assignments', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Shield },
]

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

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
        inactive: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
        suspended: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    }

    const config = statusConfig[status] || statusConfig.inactive

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
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

function OverviewTab({ user, security }: { user: UserResponseDto; security?: SecurityOverview }) {
    return (
        <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
            {/* Profile Information */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-5">
                {/* Contact Information */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Email</span>
                            <p className="text-sm text-[rgb(var(--text-primary))]">{user.email}</p>
                        </div>
                        {user.phone && (
                            <div className="space-y-1">
                                <span className="text-xs text-[rgb(var(--text-tertiary))]">Phone</span>
                                <p className="text-sm text-[rgb(var(--text-primary))]">{user.phone}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Address */}
                {user.address && (
                    <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            Address
                        </h3>
                        <div className="text-sm text-[rgb(var(--text-secondary))] space-y-0.5">
                            {user.address.street && <p>{user.address.street}</p>}
                            {user.address.street2 && <p>{user.address.street2}</p>}
                            <p>
                                {[user.address.city, user.address.state, user.address.postalCode]
                                    .filter(Boolean)
                                    .join(', ')}
                            </p>
                            {user.address.country && <p>{user.address.country}</p>}
                        </div>
                    </div>
                )}

                {/* Account Details */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        Account Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">User ID</span>
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs font-mono text-[rgb(var(--text-secondary))] truncate max-w-[200px]" title={user.userId}>
                                    {user.userId}
                                </p>
                                <CopyButton text={user.userId} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Global Role</span>
                            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{user.globalRole}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Created</span>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                {new Date(user.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Last Updated</span>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                {new Date(user.updatedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={fadeInUp} className="space-y-5">
                {/* Security Summary */}
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

                {/* Account Status */}
                <div className="rounded-xl border border-[rgb(var(--border-secondary))] p-5">
                    <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Account Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[rgb(var(--text-secondary))]">Status</span>
                            <StatusBadge status={user.status} />
                        </div>
                        {security?.accountLocked && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-sm text-red-600 dark:text-red-400">Account Locked</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function AssignmentsTab({ 
    assignments, 
    isLoading 
}: { 
    assignments: SchoolAssignment[] | undefined
    isLoading: boolean 
}) {
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
                        Manage role access across different schools
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors text-sm font-medium shadow-sm">
                    <Plus className="w-4 h-4" />
                    Assign Role
                </button>
            </motion.div>

            {/* Assignments List */}
            <motion.div variants={fadeInUp}>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse h-24 bg-[rgb(var(--surface-secondary))] rounded-xl" />
                        ))}
                    </div>
                ) : !assignments || assignments.length === 0 ? (
                    <div className="text-center py-16 bg-[rgb(var(--surface-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
                        <School className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
                        <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Active Assignments</h4>
                        <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
                            This user is not currently assigned to any schools. Click "Assign Role" to grant access.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => (
                            <motion.div
                                key={`${assignment.schoolId}-${assignment.role}`}
                                variants={fadeInUp}
                                className="flex items-center justify-between p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:border-teal-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                        <School className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[rgb(var(--text-primary))]">
                                            {assignment.schoolName || 'Unknown School'}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-secondary))]">
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                {assignment.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                        <Key className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
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
    const { userId } = useParams({ from: '/staff/$userId' })
    const [activeTab, setActiveTab] = useState<StaffTab>('overview')

    // Fetch User
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => peopleService.getUser(userId),
    })

    // Fetch Assignments
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['user', userId, 'assignments'],
        queryFn: () => peopleService.getUserAssignments(userId),
    })

    // Fetch Security (only when security tab is active or for overview)
    const { data: security, isLoading: isLoadingSecurity } = useQuery({
        queryKey: ['user', userId, 'security'],
        queryFn: () => peopleService.getUserSecurity(userId),
    })

    // Fetch Sessions (only when security tab is active)
    const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['user', userId, 'sessions'],
        queryFn: () => peopleService.getUserSessions(userId),
        enabled: activeTab === 'security',
    })

    if (isLoadingUser) {
        return <LoadingSkeleton />
    }

    if (!user) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center py-16">
                    <User className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">User Not Found</h2>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        The requested user could not be found.
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

    const displayName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User'

    const avatarUrl = user.avatarUrl || getStaffAvatar(user.email || displayName)

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
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[rgb(var(--surface-primary))] ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                        </div>

                        {/* Name & Meta */}
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
                                {displayName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                                <span className="text-[rgb(var(--text-tertiary))] truncate">{user.email}</span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <span className="font-medium text-teal-600 dark:text-teal-400">
                                    {user.globalRole}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                    </div>

                    {/* Tabs — left-aligned */}
                    <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id
                            const Icon = tab.icon
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
                                <OverviewTab user={user} security={security} />
                            )}
                            {activeTab === 'assignments' && (
                                <AssignmentsTab 
                                    assignments={assignments} 
                                    isLoading={isLoadingAssignments} 
                                />
                            )}
                            {activeTab === 'security' && (
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
        </div>
    )
}
