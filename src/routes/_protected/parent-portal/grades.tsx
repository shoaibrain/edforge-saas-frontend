/**
 * Parent Portal - Grades View
 * 
 * View children's academic grades and progress
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/parent-portal/grades')({
  validateSearch: (search: Record<string, unknown>) => ({
    studentId: (search.studentId as string) || undefined,
  }),
  component: ParentGradesPage,
})

// Mock data
const MOCK_CHILDREN = [
  { id: 'student-001', name: 'Emma Thompson', grade: '8th Grade' },
  { id: 'student-002', name: 'Lucas Thompson', grade: '5th Grade' },
]

const MOCK_GRADES = {
  'student-001': {
    gpa: 3.8,
    rank: '15/145',
    subjects: [
      { name: 'Biology 101', grade: 'A-', score: 91.2, trend: 'up', teacher: 'Dr. Sarah Mitchell' },
      { name: 'Mathematics', grade: 'B+', score: 84.5, trend: 'stable', teacher: 'Mr. Michael Johnson' },
      { name: 'English Literature', grade: 'A', score: 93.8, trend: 'up', teacher: 'Ms. Emily Davis' },
      { name: 'History', grade: 'B', score: 82.1, trend: 'down', teacher: 'Mr. James Wilson' },
      { name: 'Physical Education', grade: 'A+', score: 98.0, trend: 'stable', teacher: 'Coach Roberts' },
    ],
  },
  'student-002': {
    gpa: 3.5,
    rank: '28/120',
    subjects: [
      { name: 'Science', grade: 'B+', score: 86.5, trend: 'up', teacher: 'Mrs. Anderson' },
      { name: 'Math', grade: 'B', score: 82.0, trend: 'stable', teacher: 'Mr. Lee' },
      { name: 'Reading', grade: 'A-', score: 90.5, trend: 'up', teacher: 'Ms. Johnson' },
      { name: 'Social Studies', grade: 'B+', score: 85.2, trend: 'stable', teacher: 'Mr. Davis' },
    ],
  },
}

function ParentGradesPage() {
  const { studentId } = Route.useSearch()
  const [selectedStudent, setSelectedStudent] = useState(studentId || MOCK_CHILDREN[0].id)
  
  const studentData = MOCK_GRADES[selectedStudent as keyof typeof MOCK_GRADES]
  const selectedChild = MOCK_CHILDREN.find(c => c.id === selectedStudent)

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-aqua-700 dark:text-aqua-400'
    if (score >= 80) return 'text-teal-600 dark:text-cyan-400'
    if (score >= 70) return 'text-golden-600 dark:text-golden-400'
    return 'text-rust-600 dark:text-rust-400'
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            Academic Grades
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            View your children's academic progress
          </p>
        </div>
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

      {/* Summary Cards */}
      {studentData && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">Current GPA</p>
                  <p className="text-3xl font-bold text-[rgb(var(--text-primary))] mt-1">{studentData.gpa.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
                  <GraduationCap className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">Class Rank</p>
                  <p className="text-3xl font-bold text-[rgb(var(--text-primary))] mt-1">{studentData.rank}</p>
                </div>
                <div className="p-3 rounded-xl bg-golden-400/20">
                  <Award className="w-6 h-6 text-golden-600 dark:text-golden-400" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">Subjects</p>
                  <p className="text-3xl font-bold text-[rgb(var(--text-primary))] mt-1">{studentData.subjects.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-aqua-400/20">
                  <BookOpen className="w-6 h-6 text-aqua-700 dark:text-aqua-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Grades Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Subject Grades for {selectedChild?.name}
                </h2>
              </div>
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                {studentData.subjects.map((subject, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))]">
                        <BookOpen className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                      </div>
                      <div>
                        <p className="font-medium text-[rgb(var(--text-primary))]">{subject.name}</p>
                        <p className="text-sm text-[rgb(var(--text-tertiary))]">{subject.teacher}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getGradeColor(subject.score)}`}>
                          {subject.grade}
                        </p>
                        <p className="text-sm text-[rgb(var(--text-tertiary))]">{subject.score}%</p>
                      </div>
                      <div className="w-6">
                        {subject.trend === 'up' && <TrendingUp className="w-5 h-5 text-aqua-500" />}
                        {subject.trend === 'down' && <TrendingDown className="w-5 h-5 text-rust-500" />}
                        {subject.trend === 'stable' && <div className="w-5 h-0.5 bg-[rgb(var(--text-tertiary))] rounded" />}
                      </div>
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

