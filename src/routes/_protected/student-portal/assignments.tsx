/**
 * Student Assignments Page
 * 
 * Displays the student's upcoming and past assignments.
 */

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/_protected/student-portal/assignments')({
  component: StudentAssignmentsPage,
})

// Mock assignments data
const MOCK_UPCOMING = [
  {
    id: 1,
    title: 'Lab Report: Photosynthesis',
    subject: 'Biology 101',
    dueDate: '2024-03-20',
    type: 'Lab Report',
    status: 'pending',
    description: 'Write a detailed lab report on the photosynthesis experiment conducted in class.',
  },
  {
    id: 2,
    title: 'Problem Set 5',
    subject: 'Mathematics',
    dueDate: '2024-03-18',
    type: 'Homework',
    status: 'pending',
    description: 'Complete problems 1-15 from Chapter 7.',
  },
  {
    id: 3,
    title: 'Research Paper Outline',
    subject: 'History',
    dueDate: '2024-03-22',
    type: 'Project',
    status: 'pending',
    description: 'Submit an outline for your research paper on the Industrial Revolution.',
  },
  {
    id: 4,
    title: 'Poetry Analysis Essay',
    subject: 'English Literature',
    dueDate: '2024-03-25',
    type: 'Essay',
    status: 'pending',
    description: 'Analyze the use of imagery in Robert Frost\'s "The Road Not Taken".',
  },
]

const MOCK_COMPLETED = [
  {
    id: 5,
    title: 'Midterm Exam',
    subject: 'Biology 101',
    dueDate: '2024-03-15',
    type: 'Exam',
    status: 'completed',
    grade: '88/100',
  },
  {
    id: 6,
    title: 'Algebra Quiz 3',
    subject: 'Mathematics',
    dueDate: '2024-03-14',
    type: 'Quiz',
    status: 'completed',
    grade: '45/50',
  },
  {
    id: 7,
    title: 'Shakespeare Essay',
    subject: 'English Literature',
    dueDate: '2024-03-10',
    type: 'Essay',
    status: 'completed',
    grade: '95/100',
  },
]

function getTypeBadge(type: string): string {
  const styles: Record<string, string> = {
    'Lab Report': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'Homework': 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    'Project': 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
    'Essay': 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    'Exam': 'bg-rust-500/15 text-rust-600 dark:text-rust-400',
    'Quiz': 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  }
  return styles[type] ?? 'bg-gray-500/15 text-gray-600'
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diff = due.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDueDateColor(daysUntil: number): string {
  if (daysUntil < 0) return 'text-rust-500'
  if (daysUntil <= 2) return 'text-rust-500'
  if (daysUntil <= 5) return 'text-golden-500'
  return 'text-teal-500 dark:text-cyan-400'
}

function StudentAssignmentsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          My Assignments
        </h1>
        <p className="text-[rgb(var(--text-secondary))]">
          Track your homework, projects, and upcoming due dates
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{MOCK_UPCOMING.length}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{MOCK_COMPLETED.length}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rust-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rust-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                {MOCK_UPCOMING.filter(a => getDaysUntilDue(a.dueDate) <= 3).length}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Due Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-golden-400/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-golden-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                {Math.min(...MOCK_UPCOMING.map(a => getDaysUntilDue(a.dueDate)))}
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Days to Next</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upcoming Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-golden-500" />
          Upcoming Assignments
        </h2>
        <div className="space-y-3">
          {MOCK_UPCOMING.map((assignment, index) => {
            const daysUntil = getDaysUntilDue(assignment.dueDate)
            const dueDateColor = getDueDateColor(daysUntil)
            
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                          {assignment.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(assignment.type)}`}>
                          {assignment.type}
                        </span>
                      </div>
                      <p className="text-sm text-[rgb(var(--text-tertiary))] mb-2">
                        {assignment.subject}
                      </p>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {assignment.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold ${dueDateColor}`}>
                        {daysUntil === 0 ? 'Due Today' : 
                         daysUntil === 1 ? 'Due Tomorrow' :
                         daysUntil < 0 ? 'Overdue' :
                         `${daysUntil} days left`}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Completed Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-500" />
          Recently Completed
        </h2>
        <Card>
          <div className="divide-y divide-[rgb(var(--border-secondary))]">
            {MOCK_COMPLETED.map((assignment) => (
              <div key={assignment.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[rgb(var(--text-primary))]">
                      {assignment.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(assignment.type)}`}>
                      {assignment.type}
                    </span>
                  </div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {assignment.subject}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-600 dark:text-cyan-400">
                    {assignment.grade}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

