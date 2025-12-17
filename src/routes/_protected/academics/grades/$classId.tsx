/**
 * Class Gradebook Page
 * 
 * Detailed gradebook for a specific class with:
 * - Student grade list
 * - Assignment management
 * - Grade entry and editing
 * - Export functionality
 */

import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useState, Fragment } from 'react'
import { motion } from 'framer-motion'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Save,
  X,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/academics/grades/$classId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'grades', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ClassGradebookPage,
})

// Mock class data
const MOCK_CLASS = {
  id: 'class-001',
  name: 'Biology 101',
  teacher: 'Dr. Sarah Mitchell',
  grade: '9th Grade',
  term: 'Fall 2024',
  students: 28,
}

// Mock assignments
const MOCK_ASSIGNMENTS = [
  { id: 'asgn-001', name: 'Cell Structure Quiz', type: 'quiz', maxScore: 50, weight: 10, dueDate: '2024-09-15' },
  { id: 'asgn-002', name: 'Lab Report: Microscopy', type: 'homework', maxScore: 100, weight: 15, dueDate: '2024-09-28' },
  { id: 'asgn-003', name: 'Midterm Exam', type: 'test', maxScore: 100, weight: 25, dueDate: '2024-10-15' },
  { id: 'asgn-004', name: 'Genetics Project', type: 'project', maxScore: 100, weight: 20, dueDate: '2024-11-10' },
]

// Type definition for student grades
interface StudentGradeRecord {
  studentId: string
  name: string
  grades: Record<string, number | null>
  currentGrade: string
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

// Mock student grades
const MOCK_STUDENT_GRADES: StudentGradeRecord[] = [
  {
    studentId: 'student-001',
    name: 'Emma Thompson',
    grades: { 'asgn-001': 45, 'asgn-002': 92, 'asgn-003': 88, 'asgn-004': 95 },
    currentGrade: 'A-',
    percentage: 91.2,
    trend: 'up',
  },
  {
    studentId: 'student-002',
    name: 'Lucas Thompson',
    grades: { 'asgn-001': 38, 'asgn-002': 82, 'asgn-003': 75, 'asgn-004': null },
    currentGrade: 'B',
    percentage: 80.2,
    trend: 'stable',
  },
  {
    studentId: 'student-003',
    name: 'Sophia Martinez',
    grades: { 'asgn-001': 48, 'asgn-002': 95, 'asgn-003': 92, 'asgn-004': 98 },
    currentGrade: 'A',
    percentage: 95.1,
    trend: 'up',
  },
  {
    studentId: 'student-004',
    name: 'Noah Williams',
    grades: { 'asgn-001': 35, 'asgn-002': 78, 'asgn-003': 72, 'asgn-004': null },
    currentGrade: 'C+',
    percentage: 76.5,
    trend: 'down',
  },
  {
    studentId: 'student-005',
    name: 'Olivia Brown',
    grades: { 'asgn-001': 42, 'asgn-002': 88, 'asgn-003': 85, 'asgn-004': 90 },
    currentGrade: 'B+',
    percentage: 87.3,
    trend: 'up',
  },
]

// ============================================================================
// GRADE CELL COMPONENT
// ============================================================================

function GradeCell({ 
  score, 
  maxScore, 
  onSave,
  canEdit,
}: { 
  score: number | null
  maxScore: number
  onSave: (score: number) => void
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(score?.toString() ?? '')

  const handleSave = () => {
    const numValue = parseFloat(editValue)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxScore) {
      onSave(numValue)
      setIsEditing(false)
    }
  }

  const percentage = score !== null ? (score / maxScore) * 100 : null
  const colorClass = percentage === null 
    ? 'text-[rgb(var(--text-tertiary))]'
    : percentage >= 90 
      ? 'text-aqua-700 dark:text-aqua-400'
      : percentage >= 80 
        ? 'text-teal-600 dark:text-cyan-400'
        : percentage >= 70 
          ? 'text-golden-600 dark:text-golden-400'
          : percentage >= 60 
            ? 'text-caramel-600 dark:text-caramel-400'
            : 'text-rust-600 dark:text-rust-400'

  if (isEditing && canEdit) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-16 px-2 py-1 text-sm text-center bg-[rgb(var(--surface-tertiary))] border border-teal-500/50 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          autoFocus
          min={0}
          max={maxScore}
        />
        <button onClick={handleSave} className="p-1 text-aqua-600 hover:bg-aqua-100 dark:hover:bg-aqua-900/30 rounded">
          <Save className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-tertiary))] rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => canEdit && setIsEditing(true)}
      className={`w-16 py-1 text-sm font-medium rounded transition-colors ${colorClass} ${canEdit ? 'hover:bg-[rgb(var(--surface-tertiary))] cursor-pointer' : ''}`}
      disabled={!canEdit}
    >
      {score !== null ? `${score}/${maxScore}` : '—'}
    </button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ClassGradebookPage() {
  const { classId: _classId } = Route.useParams()
  // TODO: Fetch class data using _classId
  const [searchQuery, setSearchQuery] = useState('')
  const [grades, setGrades] = useState<StudentGradeRecord[]>(MOCK_STUDENT_GRADES)

  const handleGradeChange = (studentId: string, assignmentId: string, score: number) => {
    setGrades(prev => prev.map(student => {
      if (student.studentId === studentId) {
        return {
          ...student,
          grades: { ...student.grades, [assignmentId]: score } as Record<string, number | null>,
        }
      }
      return student
    }))
  }

  const filteredStudents = grades.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const canEditGrades = can(user, { action: 'edit', resource: 'grades', schoolId: activeSchoolId ?? undefined })

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/academics/grades"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grade Management
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            {MOCK_CLASS.name}
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            {MOCK_CLASS.grade} • {MOCK_CLASS.teacher} • {MOCK_CLASS.term}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canEditGrades && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-lg text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
          />
        </div>
      </motion.div>

      {/* Gradebook Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[rgb(var(--text-primary))] sticky left-0 bg-[rgb(var(--surface-tertiary))] z-10 min-w-[200px]">
                    Student
                  </th>
                  {MOCK_ASSIGNMENTS.map((assignment) => (
                    <th key={assignment.id} className="text-center py-3 px-2 text-sm font-semibold text-[rgb(var(--text-primary))] min-w-[100px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="truncate max-w-[90px]" title={assignment.name}>{assignment.name}</span>
                        <span className="text-xs font-normal text-[rgb(var(--text-tertiary))]">
                          {assignment.weight}% • {assignment.maxScore}pts
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[rgb(var(--text-primary))] min-w-[100px]">
                    Current Grade
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[rgb(var(--text-primary))] w-12">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr 
                    key={student.studentId} 
                    className={`border-b border-[rgb(var(--border-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors ${
                      idx % 2 === 0 ? 'bg-[rgb(var(--surface-secondary))]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="sm" />
                        <Link 
                          to="/academics/students/$studentId"
                          params={{ studentId: student.studentId }}
                          className="font-medium text-[rgb(var(--text-primary))] hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
                        >
                          {student.name}
                        </Link>
                      </div>
                    </td>
                    {MOCK_ASSIGNMENTS.map((assignment) => (
                      <td key={assignment.id} className="py-3 px-2 text-center">
                        <GradeCell
                          score={student.grades[assignment.id as keyof typeof student.grades]}
                          maxScore={assignment.maxScore}
                          onSave={(score) => handleGradeChange(student.studentId, assignment.id, score)}
                          canEdit={canEditGrades}
                        />
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${
                          student.percentage >= 90 ? 'text-aqua-700 dark:text-aqua-400' :
                          student.percentage >= 80 ? 'text-teal-600 dark:text-cyan-400' :
                          student.percentage >= 70 ? 'text-golden-600 dark:text-golden-400' :
                          'text-rust-600 dark:text-rust-400'
                        }`}>
                          {student.currentGrade}
                        </span>
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">
                          {student.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.trend === 'up' && (
                        <TrendingUp className="w-5 h-5 mx-auto text-aqua-500" />
                      )}
                      {student.trend === 'down' && (
                        <TrendingDown className="w-5 h-5 mx-auto text-rust-500" />
                      )}
                      {student.trend === 'stable' && (
                        <div className="w-5 h-0.5 mx-auto bg-[rgb(var(--text-tertiary))] rounded" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-lg font-medium text-[rgb(var(--text-secondary))]">No students found</p>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Assignment Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-3">Assignments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_ASSIGNMENTS.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{assignment.name}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {assignment.type} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {canEditGrades && (
                  <Menu as="div" className="relative">
                    <MenuButton className="p-1 rounded hover:bg-[rgb(var(--interactive-hover))]">
                      <MoreHorizontal className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </MenuButton>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
                        <MenuItem>
                          {({ active }) => (
                            <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''} text-rust-600 dark:text-rust-400`}>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

