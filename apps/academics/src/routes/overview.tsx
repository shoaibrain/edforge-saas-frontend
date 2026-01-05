/**
 * Academics Overview Page
 * 
 * Main landing page for the Academics module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    GraduationCap,
    Users,
    ClipboardCheck,
    TrendingUp,
    Atom,
    ContactRound,
    Layers,
    MapPinHouse,
    BookOpen,
    Calendar,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the academics module - matching the legacy app
    const stats: ModuleStat[] = [
        {
            label: 'Total Students',
            value: '1,247',
            change: '+12%',
            changeType: 'positive',
            icon: Users,
            iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
            iconColor: 'text-teal-600 dark:text-cyan-400',
        },
        {
            label: 'Active Classes',
            value: '48',
            change: '+3',
            changeType: 'positive',
            icon: GraduationCap,
            iconBg: 'bg-aqua-400/20',
            iconColor: 'text-aqua-700 dark:text-aqua-400',
        },
        {
            label: 'Attendance Rate',
            value: '94.2%',
            change: '+1.2%',
            changeType: 'positive',
            icon: ClipboardCheck,
            iconBg: 'bg-amber-400/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Curriculum Progress',
            value: '78%',
            change: '+5%',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-emerald-400/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ]

    // Action cards linking to sub-routes - matching the legacy app
    const actionCards: ModuleActionCard[] = [
        {
            id: 'students',
            title: 'Students',
            description: 'Enrollment, profiles, and student records',
            icon: Users,
            href: '/academics/students',
            iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20 group-hover:bg-teal-500/25 dark:group-hover:bg-cyan-500/30',
            iconColor: 'text-teal-600 dark:text-cyan-400',
        },
        {
            id: 'enrollment',
            title: 'Enrollment',
            description: 'Student enrollment and registration',
            icon: Atom,
            href: '/academics/enrollment',
            iconBg: 'bg-purple-500/15 dark:bg-purple-500/20 group-hover:bg-purple-500/25 dark:group-hover:bg-purple-500/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            id: 'teachers',
            title: 'Teachers',
            description: 'Faculty profiles and assignments',
            icon: ContactRound,
            href: '/academics/teachers',
            iconBg: 'bg-blue-400/20 group-hover:bg-blue-400/30',
            iconColor: 'text-blue-700 dark:text-blue-400',
        },
        {
            id: 'gradelevels',
            title: 'Grade Levels',
            description: 'Manage grade levels and progressions',
            icon: Layers,
            href: '/academics/gradelevels',
            iconBg: 'bg-amber-400/20 group-hover:bg-amber-400/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'classrooms',
            title: 'Classrooms',
            description: 'Room assignments and schedules',
            icon: MapPinHouse,
            href: '/academics/classrooms',
            iconBg: 'bg-orange-400/20 group-hover:bg-orange-400/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            id: 'curriculum',
            title: 'Curriculum',
            description: 'Subjects, syllabi, and lesson plans',
            icon: BookOpen,
            href: '/academics/curriculum',
            iconBg: 'bg-rose-400/20 group-hover:bg-rose-400/30',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            id: 'calendar',
            title: 'School Calendar',
            description: 'Academic year and term schedules',
            icon: Calendar,
            href: '/academics/schoolcalendar',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="academics"
            title="Academics"
            description="Manage students, classes, curriculum, and grades"
            icon={GraduationCap}
            stats={stats}
            actionCards={actionCards}
        />
    )
}
