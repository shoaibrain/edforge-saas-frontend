import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { DollarSign, CreditCard, Receipt, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RequirePermission } from '@/components/secure'

export const Route = createFileRoute('/_protected/finance')({
  component: FinancePage,
})

function FinancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-slate-900"
        >
          Finance
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 mt-1"
        >
          Manage billing, payroll, expenses, and financial reports
        </motion.p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RequirePermission action="view" resource="billing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Billing</h3>
              <p className="text-sm text-slate-500 mt-1">
                Invoices and fee collection
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="payroll">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Payroll</h3>
              <p className="text-sm text-slate-500 mt-1">
                Salary and compensation
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="expenses">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-amber-500/10 w-fit mb-4 group-hover:bg-amber-500/20 transition-colors">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Expenses</h3>
              <p className="text-sm text-slate-500 mt-1">
                Track and approve expenses
              </p>
            </Card>
          </motion.div>
        </RequirePermission>

        <RequirePermission action="view" resource="reports:finance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-4 group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Reports</h3>
              <p className="text-sm text-slate-500 mt-1">
                Financial analytics
              </p>
            </Card>
          </motion.div>
        </RequirePermission>
      </div>

      {/* Placeholder content */}
      <Card className="p-8 text-center">
        <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Finance Module
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          This is a placeholder for the Finance feature module. 
          Full implementation will include billing management, 
          payroll processing, expense tracking, and financial reporting.
        </p>
      </Card>
    </div>
  )
}

