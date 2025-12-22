/**
 * Finance Module Bootstrap
 *
 * Entry point for the Finance federated module.
 * Contains Billing, Payroll, Tuition, and Expenses.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  CreditCard,
  Users,
  GraduationCap,
  Receipt,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Button } from '@edforge/ui'

type FinanceSection = 'overview' | 'billing' | 'payroll' | 'tuition' | 'expenses'

const NAV_ITEMS = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  { id: 'payroll' as const, label: 'Payroll', icon: Users },
  { id: 'tuition' as const, label: 'Tuition', icon: GraduationCap },
  { id: 'expenses' as const, label: 'Expenses', icon: Receipt },
]

export function FinanceModule() {
  const [activeSection, setActiveSection] = useState<FinanceSection>('overview')

  const stats = [
    { label: 'Revenue (MTD)', value: '$125,890', change: '+12.3%', trend: 'up', icon: DollarSign },
    { label: 'Outstanding', value: '$23,456', change: '-5.2%', trend: 'down', icon: CreditCard },
    { label: 'Payroll (MTD)', value: '$89,234', change: '+2.1%', trend: 'up', icon: Users },
    { label: 'Expenses (MTD)', value: '$34,567', change: '+8.7%', trend: 'up', icon: Receipt },
  ]

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-golden-500 to-caramel-500">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Finance</h1>
              <p className="text-text-secondary">
                Manage billing, payroll, tuition, and expenses
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mt-6 -mb-px overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all duration-200
                  ${
                    activeSection === item.id
                      ? 'bg-surface-primary border-golden-500 text-golden-600'
                      : 'border-transparent text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
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
                            <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-aqua-600' : 'text-rust-500'}`}>
                              {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {stat.change}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-golden-500/10">
                            <stat.icon className="w-6 h-6 text-golden-600" />
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
                    { label: 'New Invoice', icon: CreditCard },
                    { label: 'Process Payroll', icon: Users },
                    { label: 'Record Payment', icon: DollarSign },
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default FinanceModule

