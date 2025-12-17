/**
 * Parent Portal - Attendance View
 * 
 * View children's attendance records
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/parent-portal/attendance')({
  validateSearch: (search: Record<string, unknown>) => ({
    studentId: (search.studentId as string) || undefined,
  }),
  component: ParentAttendancePage,
})

// Mock data
const MOCK_CHILDREN = [
  { id: 'student-001', name: 'Emma Thompson', grade: '8th Grade' },
  { id: 'student-002', name: 'Lucas Thompson', grade: '5th Grade' },
]

const MOCK_ATTENDANCE = {
  'student-001': {
    rate: 96.5,
    present: 87,
    absent: 2,
    late: 3,
    excused: 1,
    recent: [
      { date: '2024-03-15', status: 'present', checkIn: '08:45 AM' },
      { date: '2024-03-14', status: 'present', checkIn: '08:40 AM' },
      { date: '2024-03-13', status: 'late', checkIn: '09:15 AM', note: 'Traffic delay' },
      { date: '2024-03-12', status: 'present', checkIn: '08:42 AM' },
      { date: '2024-03-11', status: 'absent', note: 'Sick - called in' },
      { date: '2024-03-08', status: 'present', checkIn: '08:38 AM' },
      { date: '2024-03-07', status: 'excused', note: 'Medical appointment' },
    ],
  },
  'student-002': {
    rate: 94.2,
    present: 82,
    absent: 4,
    late: 2,
    excused: 2,
    recent: [
      { date: '2024-03-15', status: 'present', checkIn: '08:50 AM' },
      { date: '2024-03-14', status: 'absent', note: 'Sick' },
      { date: '2024-03-13', status: 'present', checkIn: '08:48 AM' },
      { date: '2024-03-12', status: 'present', checkIn: '08:45 AM' },
      { date: '2024-03-11', status: 'late', checkIn: '09:05 AM', note: 'Bus late' },
    ],
  },
}

function ParentAttendancePage() {
  const { studentId } = Route.useSearch()
  const [selectedStudent, setSelectedStudent] = useState(studentId || MOCK_CHILDREN[0].id)
  
  const studentData = MOCK_ATTENDANCE[selectedStudent as keyof typeof MOCK_ATTENDANCE]
  const selectedChild = MOCK_CHILDREN.find(c => c.id === selectedStudent)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <Check className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
      case 'absent': return <X className="w-4 h-4 text-rust-600 dark:text-rust-400" />
      case 'late': return <Clock className="w-4 h-4 text-golden-600 dark:text-golden-400" />
      case 'excused': return <AlertCircle className="w-4 h-4 text-vanilla-600 dark:text-vanilla-400" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400'
      case 'absent': return 'bg-rust-100 dark:bg-rust-900/30 text-rust-600 dark:text-rust-400'
      case 'late': return 'bg-golden-400/20 text-golden-600 dark:text-golden-400'
      case 'excused': return 'bg-vanilla-400/30 text-vanilla-700 dark:text-vanilla-400'
      default: return ''
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/parent-portal"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Parent Portal
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
          Attendance Records
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">
          View your children's daily attendance
        </p>
      </motion.div>

      {/* Student Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        {MOCK_CHILDREN.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedStudent(child.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              selectedStudent === child.id
                ? 'bg-teal-500/10 dark:bg-cyan-500/10 border-teal-500/50 dark:border-cyan-500/50'
                : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
            }`}
          >
            <Avatar name={child.name} size="sm" />
            <div className="text-left">
              <p className={`font-medium ${selectedStudent === child.id ? 'text-teal-600 dark:text-cyan-400' : 'text-[rgb(var(--text-primary))]'}`}>
                {child.name}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">{child.grade}</p>
            </div>
          </button>
        ))}
      </motion.div>

      {studentData && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <Card className="p-5">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Attendance Rate</p>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">{studentData.rate}%</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Present</p>
              <p className="text-2xl font-bold text-aqua-600 dark:text-aqua-400 mt-1">{studentData.present}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Absent</p>
              <p className="text-2xl font-bold text-rust-600 dark:text-rust-400 mt-1">{studentData.absent}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Late</p>
              <p className="text-2xl font-bold text-golden-600 dark:text-golden-400 mt-1">{studentData.late}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Excused</p>
              <p className="text-2xl font-bold text-vanilla-600 dark:text-vanilla-400 mt-1">{studentData.excused}</p>
            </Card>
          </motion.div>

          {/* Recent Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Recent Attendance for {selectedChild?.name}
                </h2>
              </div>
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                {studentData.recent.map((record, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))]">
                        <Calendar className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                      </div>
                      <div>
                        <p className="font-medium text-[rgb(var(--text-primary))]">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        {record.note && (
                          <p className="text-sm text-[rgb(var(--text-tertiary))]">{record.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.checkIn && (
                        <span className="text-sm text-[rgb(var(--text-tertiary))]">
                          Check-in: {record.checkIn}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

