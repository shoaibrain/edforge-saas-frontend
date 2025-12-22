/**
 * Academics Module Overview Page
 * 
 * Provides the overview page for the Academics module at /academics.
 * Shows key stats and quick access cards to sub-routes.
 */

import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Layers,
  MapPinHouse,
  ContactRound,
  ClipboardCheck,
  TrendingUp,
  Atom,
} from 'lucide-react'
import { ModuleOverviewPage } from '../components/layout/ModuleOverviewPage'
import type { ModuleStat, ModuleActionCard } from '../components/layout/ModuleOverviewPage'

// ============================================================================
// ACADEMICS OVERVIEW PAGE
// ============================================================================

export default function AcademicsPage() {
  // Stats for the academics module
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
      iconBg: 'bg-golden-400/20',
      iconColor: 'text-golden-600 dark:text-golden-400',
    },
    {
      label: 'Curriculum Progress',
      value: '78%',
      change: '+5%',
      changeType: 'positive',
      icon: TrendingUp,
      iconBg: 'bg-vanilla-400/30 dark:bg-vanilla-400/20',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    },
  ]

  // Action cards linking to sub-routes
  const actionCards: ModuleActionCard[] = [
    {
      id: 'students',
      title: 'Students',
      description: 'Enrollment, profiles, and student records',
      icon: Users,
      href: '/academics/students',
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20 group-hover:bg-teal-500/25 dark:group-hover:bg-cyan-500/30',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      permission: { action: 'view', resource: 'students' },
    },
    {
      id: 'enrollment',
      title: 'Enrollment',
      description: 'Student enrollment and registration',
      icon: Atom,
      href: '/academics/enrollment',
      iconBg: 'bg-purple-500/15 dark:bg-purple-500/20 group-hover:bg-purple-500/25 dark:group-hover:bg-purple-500/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      permission: { action: 'view', resource: 'curriculum' },
    },
    {
      id: 'teachers',
      title: 'Teachers',
      description: 'Faculty profiles and assignments',
      icon: ContactRound,
      href: '/academics/teachers',
      iconBg: 'bg-aqua-400/20 group-hover:bg-aqua-400/30',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
      permission: { action: 'view', resource: 'students' },
    },
    {
      id: 'gradelevels',
      title: 'Grade Levels',
      description: 'Manage grade levels and progressions',
      icon: Layers,
      href: '/academics/gradelevels',
      iconBg: 'bg-golden-400/20 group-hover:bg-golden-400/30',
      iconColor: 'text-golden-600 dark:text-golden-400',
      permission: { action: 'view', resource: 'students' },
    },
    {
      id: 'classrooms',
      title: 'Classrooms',
      description: 'Room assignments and schedules',
      icon: MapPinHouse,
      href: '/academics/classrooms',
      iconBg: 'bg-caramel-400/20 group-hover:bg-caramel-400/30',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      permission: { action: 'view', resource: 'classes' },
    },
    {
      id: 'curriculum',
      title: 'Curriculum',
      description: 'Subjects, syllabi, and lesson plans',
      icon: BookOpen,
      href: '/academics/curriculum',
      iconBg: 'bg-rust-400/20 group-hover:bg-rust-400/30',
      iconColor: 'text-rust-600 dark:text-rust-400',
      permission: { action: 'view', resource: 'curriculum' },
    },
    {
      id: 'calendar',
      title: 'School Calendar',
      description: 'Academic year and term schedules',
      icon: Calendar,
      href: '/academics/schoolcalendar',
      iconBg: 'bg-vanilla-400/25 dark:bg-vanilla-400/20 group-hover:bg-vanilla-400/35 dark:group-hover:bg-vanilla-400/30',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
      permission: { action: 'view', resource: 'curriculum' },
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
