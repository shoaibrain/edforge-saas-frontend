/**
 * Academic Analytics Page
 * 
 * Comprehensive academic performance analytics with:
 * - Performance trends
 * - Grade distributions
 * - Subject-wise analysis
 * - Student cohort comparisons
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_protected/analytics/academic')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'grades', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: AcademicAnalyticsPage,
})

// Mock analytics data
const MOCK_STATS = {
  averageGPA: 3.42,
  gpaChange: 0.12,
  passRate: 94.5,
  passRateChange: 2.3,
  honorRollStudents: 312,
  honorRollChange: 28,
  atRiskStudents: 45,
  atRiskChange: -8,
}

const MOCK_GRADE_DISTRIBUTION = [
  { grade: 'A', count: 312, percentage: 25 },
  { grade: 'B', count: 437, percentage: 35 },
  { grade: 'C', count: 312, percentage: 25 },
  { grade: 'D', count: 125, percentage: 10 },
  { grade: 'F', count: 61, percentage: 5 },
]

const MOCK_SUBJECT_PERFORMANCE = [
  { subject: 'Mathematics', avgGrade: 3.2, students: 1247, trend: 'up' },
  { subject: 'English', avgGrade: 3.5, students: 1247, trend: 'up' },
  { subject: 'Science', avgGrade: 3.4, students: 1089, trend: 'stable' },
  { subject: 'History', avgGrade: 3.6, students: 892, trend: 'up' },
  { subject: 'Art', avgGrade: 3.8, students: 456, trend: 'stable' },
  { subject: 'Physical Education', avgGrade: 3.9, students: 1247, trend: 'up' },
]

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ 
  label, 
  value, 
  change,
  changeType,
  icon: Icon, 
  iconBg, 
  iconColor,
  suffix,
  prefix,
}: { 
  label: string
  value: string | number
  change: string | number
  changeType: 'positive' | 'negative'
  icon: typeof GraduationCap
  iconBg: string
  iconColor: string
  suffix?: string
  prefix?: string
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -4 : 0,
    config: config.gentle,
  })

  const TrendIcon = changeType === 'positive' ? ArrowUpRight : ArrowDownRight

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[rgb(var(--text-tertiary))]">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
              {prefix}{value}{suffix}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            changeType === 'positive' 
              ? 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400' 
              : 'bg-rust-100 text-rust-600 dark:bg-rust-900/30 dark:text-rust-400'
          }`}>
            <TrendIcon className="w-3 h-3" />
            {change}
          </div>
          <span className="text-xs text-[rgb(var(--text-tertiary))]">vs last term</span>
        </div>
      </Card>
    </animated.div>
  )
}

// ============================================================================
// GRADE DISTRIBUTION BAR
// ============================================================================

function GradeDistributionBar({ grade, count, percentage }: { grade: string; count: number; percentage: number }) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    width: `${percentage}%`,
    opacity: hovered ? 1 : 0.85,
    config: { tension: 280, friction: 60 },
  })

  const gradeColors: Record<string, string> = {
    'A': 'bg-aqua-500',
    'B': 'bg-teal-500 dark:bg-cyan-500',
    'C': 'bg-golden-500',
    'D': 'bg-caramel-500',
    'F': 'bg-rust-500',
  }

  return (
    <div 
      className="flex items-center gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-8 text-sm font-semibold text-[rgb(var(--text-primary))]">{grade}</div>
      <div className="flex-1 h-8 bg-[rgb(var(--surface-tertiary))] rounded-lg overflow-hidden">
        <animated.div
          style={springProps}
          className={`h-full ${gradeColors[grade]} rounded-lg flex items-center justify-end pr-3`}
        >
          <span className="text-xs font-semibold text-white">{count}</span>
        </animated.div>
      </div>
      <div className="w-12 text-sm text-[rgb(var(--text-tertiary))] text-right">{percentage}%</div>
    </div>
  )
}

// ============================================================================
// SUBJECT ROW
// ============================================================================

function SubjectRow({ subject, avgGrade, students, trend }: { subject: string; avgGrade: number; students: number; trend: string }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <div className="flex items-center justify-between p-4 hover:bg-[rgb(var(--interactive-hover))] transition-colors rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
          <BookOpen className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--text-primary))]">{subject}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{students.toLocaleString()} students</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{avgGrade.toFixed(1)}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">Avg GPA</p>
        </div>
        {TrendIcon && (
          <TrendIcon className={`w-5 h-5 ${trend === 'up' ? 'text-aqua-500' : 'text-rust-500'}`} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AcademicAnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<'term' | 'year' | 'all'>('term')

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
            Academic Analytics
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Student performance insights and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]">
            {(['term', 'year', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timePeriod === period
                    ? 'bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] shadow-sm'
                    : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                }`}
              >
                {period === 'term' ? 'This Term' : period === 'year' ? 'This Year' : 'All Time'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Average GPA"
          value={MOCK_STATS.averageGPA}
          change={`+${MOCK_STATS.gpaChange}`}
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Pass Rate"
          value={MOCK_STATS.passRate}
          suffix="%"
          change={`+${MOCK_STATS.passRateChange}%`}
          changeType="positive"
          icon={Award}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Honor Roll"
          value={MOCK_STATS.honorRollStudents}
          change={`+${MOCK_STATS.honorRollChange}`}
          changeType="positive"
          icon={GraduationCap}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="At-Risk Students"
          value={MOCK_STATS.atRiskStudents}
          change={`${MOCK_STATS.atRiskChange}`}
          changeType="positive"
          icon={Users}
          iconBg="bg-rust-400/20"
          iconColor="text-rust-600 dark:text-rust-400"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Grade Distribution
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                Overall grade breakdown across all subjects
              </p>
            </div>
            <div className="p-5 space-y-4">
              {MOCK_GRADE_DISTRIBUTION.map((item) => (
                <GradeDistributionBar
                  key={item.grade}
                  grade={item.grade}
                  count={item.count}
                  percentage={item.percentage}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Subject Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Subject Performance
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                Average GPA by subject area
              </p>
            </div>
            <div className="p-2">
              {MOCK_SUBJECT_PERFORMANCE.map((item) => (
                <SubjectRow
                  key={item.subject}
                  subject={item.subject}
                  avgGrade={item.avgGrade}
                  students={item.students}
                  trend={item.trend}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

