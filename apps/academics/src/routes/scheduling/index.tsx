/**
 * Master Scheduling Module
 *
 * Unified scheduling interface for the Academics domain.
 * This consolidated view brings together all scheduling-related functionality:
 * - Class Schedules: Section and period assignments
 * - Timetables: Visual weekly/daily grids
 * - Classrooms: Room allocation and capacity management
 *
 * Design Philosophy:
 * Scheduling is inherently interconnected—you can't assign a class
 * without considering room availability, teacher schedules, and time slots.
 * This unified view eliminates the friction of switching between related pages.
 */

import { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LayoutGrid,
  CalendarDays,
  Building2,
  AlertTriangle,
  Settings,
} from 'lucide-react'

type SchedulingTab = 'schedules' | 'timetables' | 'classrooms'

export function SchedulingModule() {
  const [activeTab, setActiveTab] = useState<SchedulingTab>('schedules')

  const tabs = [
    {
      id: 'schedules' as const,
      label: 'Class Schedules',
      icon: CalendarDays,
      description: 'Section and period assignments',
    },
    {
      id: 'timetables' as const,
      label: 'Timetables',
      icon: LayoutGrid,
      description: 'Visual weekly/daily grids',
    },
    {
      id: 'classrooms' as const,
      label: 'Classrooms',
      icon: Building2,
      description: 'Room allocation and capacity',
    },
  ]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Master Scheduling
              </h1>
              <p className="text-text-secondary mt-1">
                Build and manage master schedules, assign teachers, and allocate rooms
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Scheduling tabs">
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
        {activeTab === 'schedules' && <SchedulesContent />}
        {activeTab === 'timetables' && <TimetablesContent />}
        {activeTab === 'classrooms' && <ClassroomsContent />}
      </div>
    </div>
  )
}

function SchedulesContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Active Sections"
          value="156"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Users}
          label="Teachers Scheduled"
          value="42"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Clock}
          label="Time Periods"
          value="8"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Conflicts"
          value="3"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Product Description Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Class Section Management
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Assign teachers to course sections, set meeting times, and manage enrollment 
              caps. The scheduling engine automatically detects conflicts and suggests 
              resolution options when teachers or rooms are double-booked.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Settings className="w-4 h-4" />
              <span>Configure bell schedules and terms in System Admin → Schools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <CalendarDays className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Master Schedule Builder
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Select a term and grade level to begin building or editing the master schedule. 
          Drag sections to time slots and the system will validate room and teacher availability.
        </p>
      </div>
    </div>
  )
}

function TimetablesContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10">
            <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Visual Timetable Grid
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              View and print weekly timetables for teachers, students, or classrooms. 
              The visual grid makes it easy to spot gaps, overlaps, and optimization 
              opportunities in your schedule.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Weekly view with color-coded subjects</li>
              <li>• Export to PDF for distribution</li>
              <li>• Teacher and student personalized views</li>
              <li>• Rotating schedule support (A/B days)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <LayoutGrid className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Select View Type
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Choose to view timetables by teacher, student, or classroom. 
          Each perspective optimizes the display for that user's daily workflow.
        </p>
      </div>
    </div>
  )
}

function ClassroomsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Room & Facility Management
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Define classrooms with capacity limits, equipment inventory, and 
              accessibility features. The system prevents over-enrollment and 
              ensures ADA-compliant room assignments for students with accommodations.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Capacity tracking and enrollment limits</li>
              <li>• Equipment and resource inventory per room</li>
              <li>• Accessibility compliance tracking</li>
              <li>• Utilization reports and optimization suggestions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Total Rooms"
          value="48"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="Total Capacity"
          value="1,440"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={MapPin}
          label="Accessible Rooms"
          value="32"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <Building2 className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Room Directory
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Search and filter classrooms by building, floor, capacity, or equipment. 
          Click a room to view its full schedule and utilization metrics.
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
  icon: typeof Calendar
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

export default SchedulingModule

