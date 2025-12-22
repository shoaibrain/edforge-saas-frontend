/**
 * Academics Module Bootstrap
 *
 * Entry point for the Academics federated module.
 * Contains Students, Teachers, Attendance, Gradebook, and Enrollment.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Users,
  Clock,
  BookOpen,
  UserPlus,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Button } from '@edforge/ui'
import { useCanAccess } from '@edforge/abac'

type AcademicsSection = 'overview' | 'students' | 'teachers' | 'attendance' | 'gradebook' | 'enrollment'

const NAV_ITEMS = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'students' as const, label: 'Students', icon: GraduationCap, resource: 'students' },
  { id: 'teachers' as const, label: 'Teachers', icon: Users, resource: 'teachers' },
  { id: 'attendance' as const, label: 'Attendance', icon: Clock, resource: 'attendance' },
  { id: 'gradebook' as const, label: 'Gradebook', icon: BookOpen, resource: 'gradebook' },
  { id: 'enrollment' as const, label: 'Enrollment', icon: UserPlus, resource: 'enrollment' },
]

export function AcademicsModule() {
  const [activeSection, setActiveSection] = useState<AcademicsSection>('overview')

  // Mock stats
  const stats = [
    { label: 'Total Students', value: '1,234', change: '+23 this month', icon: GraduationCap },
    { label: 'Active Teachers', value: '89', change: '+2 this year', icon: Users },
    { label: 'Attendance Rate', value: '94.5%', change: '+0.3% vs last week', icon: Clock },
    { label: 'Classes', value: '156', change: '32 active today', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Academics</h1>
              <p className="text-text-secondary">
                Manage students, teachers, attendance, and academic records
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mt-6 -mb-px overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const hasAccess = item.resource ? useCanAccess(item.resource as any) : true
              if (!hasAccess) return null

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all duration-200
                    ${
                      activeSection === item.id
                        ? 'bg-surface-primary border-teal-500 text-teal-600 dark:text-cyan-400'
                        : 'border-transparent text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-sm text-text-tertiary">{stat.label}</p>
                            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                            <p className="text-sm text-aqua-600">{stat.change}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-teal-500/10">
                            <stat.icon className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-text-primary">Quick Actions</h3>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Add Student', icon: UserPlus },
                    { label: 'Record Attendance', icon: Clock },
                    { label: 'Enter Grades', icon: BookOpen },
                    { label: 'View Reports', icon: BarChart3 },
                  ].map((action) => (
                    <Button key={action.label} variant="outline" className="h-auto py-4 flex-col gap-2">
                      <action.icon className="w-5 h-5" />
                      <span>{action.label}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection !== 'overview' && (
            <div className="p-8 text-center">
              <p className="text-text-secondary">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} module content will be rendered here.
              </p>
              <p className="text-sm text-text-tertiary mt-2">
                This placeholder will be replaced with the actual module component.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AcademicsModule

