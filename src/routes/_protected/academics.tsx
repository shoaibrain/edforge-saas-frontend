import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { GraduationCap, Users, BookOpen, ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RequirePermission } from '@/components/secure'

export const Route = createFileRoute('/_protected/academics')({
  component: AcademicsPage,
})

function AcademicsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-slate-900"
        >
          Academics
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 mt-1"
        >
          Manage students, classes, curriculum, and grades
        </motion.p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RequirePermission action="view" resource="students">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Students</h3>
              <p className="text-sm text-slate-500 mt-1">
                Enrollment, profiles, and records
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="classes">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Classes</h3>
              <p className="text-sm text-slate-500 mt-1">
                Class schedules and assignments
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="curriculum">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-4 group-hover:bg-purple-500/20 transition-colors">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Curriculum</h3>
              <p className="text-sm text-slate-500 mt-1">
                Subjects, syllabi, and plans
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="grades">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-amber-500/10 w-fit mb-4 group-hover:bg-amber-500/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Grades</h3>
              <p className="text-sm text-slate-500 mt-1">
                Assessments and report cards
              </p>
            </Card>
          </motion.div>
        </RequirePermission>
      </div>

      {/* Placeholder content */}
      <Card className="p-8 text-center">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Academics Module
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          This is a placeholder for the Academics feature module. 
          Full implementation will include student management, 
          class scheduling, curriculum planning, and grade tracking.
        </p>
      </Card>
    </div>
  )
}

