/**
 * Student Attendance Page
 * 
 * Displays the student's attendance records.
 */

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ClipboardCheck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/_protected/student-portal/attendance')({
  component: StudentAttendancePage,
})

// Mock attendance data
const MOCK_ATTENDANCE_SUMMARY = {
  totalDays: 85,
  present: 82,
  absent: 2,
  late: 1,
  excused: 0,
  attendanceRate: 96.5,
}

const MOCK_ATTENDANCE_RECORDS = [
  { date: '2024-03-15', status: 'present', checkIn: '8:45 AM' },
  { date: '2024-03-14', status: 'present', checkIn: '8:40 AM' },
  { date: '2024-03-13', status: 'late', checkIn: '9:15 AM', notes: 'Traffic delay' },
  { date: '2024-03-12', status: 'present', checkIn: '8:42 AM' },
  { date: '2024-03-11', status: 'present', checkIn: '8:38 AM' },
  { date: '2024-03-08', status: 'absent', notes: 'Sick' },
  { date: '2024-03-07', status: 'present', checkIn: '8:50 AM' },
  { date: '2024-03-06', status: 'present', checkIn: '8:44 AM' },
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'present':
      return <CheckCircle className="w-5 h-5 text-teal-500" />
    case 'absent':
      return <XCircle className="w-5 h-5 text-rust-500" />
    case 'late':
      return <Clock className="w-5 h-5 text-golden-500" />
    case 'excused':
      return <AlertCircle className="w-5 h-5 text-aqua-500" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    present: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    absent: 'bg-rust-500/15 text-rust-600 dark:text-rust-400',
    late: 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
    excused: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
  }
  return styles[status] ?? 'bg-gray-500/15 text-gray-600'
}

function StudentAttendancePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          My Attendance
        </h1>
        <p className="text-[rgb(var(--text-secondary))]">
          Track your attendance records for the current semester
        </p>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Attendance Rate</p>
              <p className="text-4xl font-bold text-[rgb(var(--text-primary))]">
                {MOCK_ATTENDANCE_SUMMARY.attendanceRate}%
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-teal-500/15 dark:bg-cyan-500/20 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {MOCK_ATTENDANCE_SUMMARY.present}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Present</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-rust-500/10 border border-rust-500/20">
              <p className="text-2xl font-bold text-rust-600 dark:text-rust-400">
                {MOCK_ATTENDANCE_SUMMARY.absent}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Absent</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-golden-400/15 border border-golden-400/30">
              <p className="text-2xl font-bold text-golden-600 dark:text-golden-400">
                {MOCK_ATTENDANCE_SUMMARY.late}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Late</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-aqua-400/15 border border-aqua-400/30">
              <p className="text-2xl font-bold text-aqua-700 dark:text-aqua-400">
                {MOCK_ATTENDANCE_SUMMARY.excused}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Excused</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Recent Records
            </h2>
          </div>
          <div className="divide-y divide-[rgb(var(--border-secondary))]">
            {MOCK_ATTENDANCE_RECORDS.map((record, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(record.status)}
                  <div>
                    <p className="font-medium text-[rgb(var(--text-primary))]">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    {record.checkIn && (
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        Check-in: {record.checkIn}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        Note: {record.notes}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full capitalize ${getStatusBadge(record.status)}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

