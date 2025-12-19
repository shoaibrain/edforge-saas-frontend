/**
 * Grades Overview Page
 * 
 * Central hub for grade management with:
 * - Class gradebook links
 * - Grade summary statistics
 * - Recent grade activity
 */

import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
  ChevronRight,
  Search,
  Plus,
  FileSpreadsheet,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_protected/academics/gradebooks')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'grades', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: GradesPage,
})

// Mock class data
const MOCK_CLASSES = [
  {
    id: 'class-001',
    name: 'Biology 101',
    teacher: 'Dr. Sarah Mitchell',
    grade: '9th Grade',
    students: 28,
    avgGrade: 3.4,
    pendingGrades: 5,
  },
  {
    id: 'class-002',
    name: 'Algebra II',
    teacher: 'Mr. Michael Johnson',
    grade: '10th Grade',
    students: 30,
    avgGrade: 3.2,
    pendingGrades: 0,
  },
  {
    id: 'class-003',
    name: 'Chemistry AP',
    teacher: 'Dr. Sarah Mitchell',
    grade: '11th Grade',
    students: 22,
    avgGrade: 3.6,
    pendingGrades: 12,
  },
  {
    id: 'class-004',
    name: 'English Literature',
    teacher: 'Ms. Emily Davis',
    grade: '10th Grade',
    students: 25,
    avgGrade: 3.5,
    pendingGrades: 3,
  },
  {
    id: 'class-005',
    name: 'History 201',
    teacher: 'Mr. James Wilson',
    grade: '11th Grade',
    students: 27,
    avgGrade: 3.3,
    pendingGrades: 0,
  },
]

const MOCK_STATS = {
  totalClasses: 24,
  totalStudents: 1247,
  avgGPA: 3.42,
  pendingGrades: 45,
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  suffix,
}: {
  label: string
  value: string | number
  icon: typeof GraduationCap
  iconBg: string
  iconColor: string
  suffix?: string
}) {
  const [hovered, setHovered] = useState(false)

  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -2 : 0,
    config: config.gentle,
  })

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--text-tertiary))]">{label}</p>
            <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
              {value}{suffix}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </Card>
    </animated.div>
  )
}

// ============================================================================
// CLASS CARD
// ============================================================================

function ClassCard({ cls }: { cls: typeof MOCK_CLASSES[0] }) {
  const [hovered, setHovered] = useState(false)

  const springProps = useSpring({
    scale: hovered ? 1.01 : 1,
    x: hovered ? 4 : 0,
    config: config.gentle,
  })

  return (
    <Link to="/academics/gradebooks/$classId" params={{ classId: cls.id }}>
      <animated.div
        style={{
          transform: springProps.scale.to(s => `scale(${s}) translateX(${springProps.x.get()}px)`),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{cls.name}</h3>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">{cls.grade} • {cls.teacher}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{cls.students}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Students</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{cls.avgGrade.toFixed(1)}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Avg GPA</p>
              </div>
              {cls.pendingGrades > 0 && (
                <div className="px-2.5 py-1 rounded-full bg-golden-400/20 text-golden-600 dark:text-golden-400 text-xs font-semibold">
                  {cls.pendingGrades} pending
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </div>
          </div>
        </Card>
      </animated.div>
    </Link>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GradesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClasses = MOCK_CLASSES.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.grade.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            Grade Management
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Manage class gradebooks and student assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Classes"
          value={MOCK_STATS.totalClasses}
          icon={BookOpen}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Total Students"
          value={MOCK_STATS.totalStudents.toLocaleString()}
          icon={Users}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Average GPA"
          value={MOCK_STATS.avgGPA.toFixed(2)}
          icon={TrendingUp}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Pending Grades"
          value={MOCK_STATS.pendingGrades}
          icon={GraduationCap}
          iconBg="bg-rust-400/20"
          iconColor="text-rust-600 dark:text-rust-400"
        />
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search classes by name, teacher, or grade level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Classes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          Class Gradebooks
        </h2>
        {filteredClasses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-50" />
            <p className="text-lg font-medium text-[rgb(var(--text-secondary))]">No classes found</p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Try adjusting your search criteria
            </p>
          </Card>
        ) : (
          filteredClasses.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))
        )}
      </motion.div>
    </div>
  )
}

