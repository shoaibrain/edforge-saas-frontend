/**
 * Curriculum Management Module
 *
 * Unified curriculum interface for the Academics domain.
 * This consolidated view brings together all curriculum-related functionality:
 * - Courses: Course catalog and section definitions
 * - Grade Levels: Academic progression structure
 * - Standards: Learning standards alignment (Common Core, state standards)
 *
 * Design Philosophy:
 * Curriculum design is a hierarchical process—standards inform courses,
 * courses are offered at grade levels, and all must align for accreditation.
 * This unified view provides curriculum coordinators a complete picture.
 */

import { useState } from 'react'
import {
  BookOpen,
  Layers,
  Target,
  FileText,
  CheckCircle,
  Clock,
  Settings,
} from 'lucide-react'

type CurriculumTab = 'courses' | 'grade-levels' | 'standards'

export function CurriculumModule() {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('courses')

  const tabs = [
    {
      id: 'courses' as const,
      label: 'Courses',
      icon: BookOpen,
      description: 'Course catalog and offerings',
    },
    {
      id: 'grade-levels' as const,
      label: 'Grade Levels',
      icon: Layers,
      description: 'Academic progression structure',
    },
    {
      id: 'standards' as const,
      label: 'Standards',
      icon: Target,
      description: 'Learning standards alignment',
    },
  ]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
              <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Curriculum Management
              </h1>
              <p className="text-text-secondary mt-1">
                Define courses, map learning standards, and organize curriculum by grade level
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Curriculum tabs">
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
        {activeTab === 'courses' && <CoursesContent />}
        {activeTab === 'grade-levels' && <GradeLevelsContent />}
        {activeTab === 'standards' && <StandardsContent />}
      </div>
    </div>
  )
}

function CoursesContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value="87"
          accent="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Active This Term"
          value="64"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={FileText}
          label="Electives"
          value="23"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Clock}
          label="Pending Approval"
          value="5"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Product Description Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-rose-500/10">
            <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Course Catalog
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Define and manage your institution's course offerings. Each course includes 
              credit hours, prerequisites, grade level eligibility, and standards alignment. 
              Courses flow into the master schedule and gradebook automatically.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Settings className="w-4 h-4" />
              <span>Course approval workflows configured in System Admin → Access Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Course Directory
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Browse courses by department, grade level, or subject area. 
          Click a course to view its full details, prerequisites, and 
          historical enrollment data.
        </p>
      </div>
    </div>
  )
}

function GradeLevelsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Grade Level Structure
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Define the academic progression path from entry to graduation. Grade levels 
              determine course eligibility, homeroom assignments, and state reporting 
              classifications. Each level can have unique promotion requirements.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Customizable grade level naming (K, 1-12, or custom)</li>
              <li>• Promotion requirements and credit thresholds</li>
              <li>• State reporting code mappings for Ed-Fi compliance</li>
              <li>• Age-based enrollment eligibility rules</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grade Level Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
          <div
            key={grade}
            className="bg-surface-secondary rounded-lg border border-border-secondary p-4 text-center hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <div className="text-2xl font-bold text-text-primary mb-1">{grade}</div>
            <div className="text-xs text-text-tertiary">Grade {grade === 'K' ? 'Kindergarten' : grade}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StandardsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Learning Standards
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Align instructional content with state and district frameworks. Import 
              Common Core, Next Generation Science Standards, or state-specific standards. 
              Link standards to courses and assessments for competency-based reporting.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Import from CASE-compliant standards repositories</li>
              <li>• Hierarchical organization (domains, clusters, standards)</li>
              <li>• Cross-walk between different frameworks</li>
              <li>• Standards mastery tracking by student</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Standards Frameworks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Common Core State Standards</h4>
              <p className="text-xs text-text-secondary">ELA & Mathematics</p>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">1,247 standards imported</div>
        </div>

        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Next Generation Science Standards</h4>
              <p className="text-xs text-text-secondary">Science & Engineering</p>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">342 standards imported</div>
        </div>
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
  icon: typeof BookOpen
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

export default CurriculumModule

