/**
 * Student Grades Page
 * 
 * Displays the student's grades across all classes and terms.
 */

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/_protected/student-portal/grades')({
  component: StudentGradesPage,
})

// Mock grades data
const MOCK_GRADES = [
  { 
    id: 1, 
    subject: 'Biology 101', 
    teacher: 'Dr. Sarah Mitchell',
    currentGrade: 'A-', 
    percentage: 91.2, 
    trend: 'up',
    assignments: [
      { name: 'Cell Structure Quiz', score: 45, maxScore: 50, weight: '10%' },
      { name: 'Lab Report: Microscopy', score: 92, maxScore: 100, weight: '15%' },
      { name: 'Midterm Exam', score: 88, maxScore: 100, weight: '25%' },
    ]
  },
  { 
    id: 2, 
    subject: 'Mathematics', 
    teacher: 'Mr. Michael Johnson',
    currentGrade: 'B+', 
    percentage: 84.5, 
    trend: 'stable',
    assignments: [
      { name: 'Algebra Quiz 1', score: 42, maxScore: 50, weight: '10%' },
      { name: 'Problem Set 1', score: 85, maxScore: 100, weight: '10%' },
      { name: 'Midterm Exam', score: 78, maxScore: 100, weight: '30%' },
    ]
  },
  { 
    id: 3, 
    subject: 'English Literature', 
    teacher: 'Ms. Emily Davis',
    currentGrade: 'A', 
    percentage: 94.0, 
    trend: 'up',
    assignments: [
      { name: 'Essay: Shakespeare', score: 95, maxScore: 100, weight: '20%' },
      { name: 'Reading Quiz 3', score: 48, maxScore: 50, weight: '10%' },
    ]
  },
  { 
    id: 4, 
    subject: 'History', 
    teacher: 'Mr. James Wilson',
    currentGrade: 'B', 
    percentage: 82.0, 
    trend: 'down',
    assignments: [
      { name: 'Chapter 5 Test', score: 80, maxScore: 100, weight: '25%' },
      { name: 'Research Paper', score: 84, maxScore: 100, weight: '30%' },
    ]
  },
]

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-teal-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-rust-500" />
    default:
      return <Minus className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
  }
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-teal-600 dark:text-cyan-400'
  if (grade.startsWith('B')) return 'text-golden-600 dark:text-golden-400'
  if (grade.startsWith('C')) return 'text-amber-600 dark:text-amber-400'
  return 'text-rust-600 dark:text-rust-400'
}

function StudentGradesPage() {
  // Calculate overall GPA
  const overallGPA = MOCK_GRADES.reduce((sum, g) => sum + g.percentage, 0) / MOCK_GRADES.length / 25

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          My Grades
        </h1>
        <p className="text-[rgb(var(--text-secondary))]">
          View your academic progress across all classes
        </p>
      </motion.div>

      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Overall GPA</p>
              <p className="text-4xl font-bold text-[rgb(var(--text-primary))]">
                {overallGPA.toFixed(2)}
              </p>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                Fall 2024 Semester
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-golden-400/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-golden-600 dark:text-golden-400" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Grades by Subject */}
      <div className="space-y-4">
        {MOCK_GRADES.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="overflow-hidden">
              {/* Subject Header */}
              <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      {subject.subject}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">{subject.teacher}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(subject.trend)}
                      <span className="text-sm text-[rgb(var(--text-tertiary))]">
                        {subject.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${getGradeColor(subject.currentGrade)}`}>
                      {subject.currentGrade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                {subject.assignments.map((assignment, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {assignment.name}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        Weight: {assignment.weight}
                      </p>
                    </div>
                    <p className="font-semibold text-[rgb(var(--text-primary))]">
                      {assignment.score}/{assignment.maxScore}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

