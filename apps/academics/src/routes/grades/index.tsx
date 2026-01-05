/**
 * Grades & Assessments Module
 *
 * Unified gradebook management for the Academics domain.
 * This consolidated view brings together all assessment-related functionality:
 * - Gradebook: Primary grade entry and management
 * - Assessments: Formative and summative assessment tracking
 * - Exams: High-stakes testing and examination records
 *
 * Design Philosophy:
 * Rather than navigating between separate pages for related tasks,
 * educators can access all grading workflows from a single, tabbed interface.
 * This reduces cognitive load and accelerates the daily grade entry workflow.
 */

import { useState } from 'react'
import {
  GraduationCap,
  BookCheck,
  FileText,
  Calculator,
  TrendingUp,
  Users,
  Calendar,
  Settings,
} from 'lucide-react'

type GradesTab = 'gradebook' | 'assessments' | 'exams'

export function GradesModule() {
  const [activeTab, setActiveTab] = useState<GradesTab>('gradebook')

  const tabs = [
    {
      id: 'gradebook' as const,
      label: 'Gradebook',
      icon: BookCheck,
      description: 'Enter and manage student grades by class and assignment',
    },
    {
      id: 'assessments' as const,
      label: 'Assessments',
      icon: FileText,
      description: 'Track formative and summative assessments',
    },
    {
      id: 'exams' as const,
      label: 'Exams',
      icon: Calculator,
      description: 'Manage examinations and standardized tests',
    },
  ]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <GraduationCap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Grades & Assessments
              </h1>
              <p className="text-text-secondary mt-1">
                Unified gradebook management for formative and summative assessments
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Grades tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg
                  transition-colors duration-150
                  ${
                    activeTab === tab.id
                      ? 'bg-surface-primary text-text-primary border-t border-x border-border-secondary -mb-px'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'gradebook' && <GradebookContent />}
        {activeTab === 'assessments' && <AssessmentsContent />}
        {activeTab === 'exams' && <ExamsContent />}
      </div>
    </div>
  )
}

function GradebookContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Classes Active"
          value="12"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={FileText}
          label="Pending Grades"
          value="47"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Class Average"
          value="82.4%"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Grading Period"
          value="Q2"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Product Description Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10">
            <BookCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Grade Entry & Management
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Configure grading scales, enter scores, and generate progress reports aligned 
              with your district's grading policies. The gradebook supports weighted categories, 
              custom grade calculations, and real-time GPA computation.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Settings className="w-4 h-4" />
              <span>Configure grading scales and policies in System Admin → Access Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for gradebook grid */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Select a Class to Begin
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Choose a class from your assigned courses to view and edit student grades. 
          Changes sync in real-time and are visible to students and parents based on 
          your school's grade release settings.
        </p>
      </div>
    </div>
  )
}

function AssessmentsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Assessment Library
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Create, schedule, and track formative assessments including quizzes, 
              classwork, and projects. Link assessments to learning standards for 
              standards-based grading and comprehensive progress monitoring.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Formative assessments for daily/weekly check-ins</li>
              <li>• Standards alignment for competency-based reporting</li>
              <li>• Rubric-based scoring with customizable criteria</li>
              <li>• Assessment analytics and item analysis</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          No Upcoming Assessments
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Create your first assessment to start tracking student progress. 
          Assessments can be linked to specific courses and standards.
        </p>
      </div>
    </div>
  )
}

function ExamsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10">
            <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Examinations & Testing
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Manage high-stakes examinations including midterms, finals, and 
              state-mandated standardized tests. Track testing accommodations 
              for students with IEPs and 504 plans.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Exam scheduling with room and proctor assignments</li>
              <li>• Accommodation tracking integrated with Special Programs</li>
              <li>• Score import from external testing platforms</li>
              <li>• Historical exam performance analytics</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <Calculator className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Exam Schedule Empty
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          No examinations are currently scheduled. Create exam periods in 
          Scheduling to begin organizing your testing calendar.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof GraduationCap
  label: string
  value: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default GradesModule

