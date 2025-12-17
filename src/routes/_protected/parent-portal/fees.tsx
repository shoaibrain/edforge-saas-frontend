/**
 * Parent Portal - Fees View
 * 
 * View and manage fee payments
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  ArrowLeft,
  DollarSign,
  Check,
  Clock,
  AlertCircle,
  Receipt,
  Download,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/parent-portal/fees')({
  component: ParentFeesPage,
})

// Mock data
const MOCK_CHILDREN = [
  { id: 'student-001', name: 'Emma Thompson', grade: '8th Grade' },
  { id: 'student-002', name: 'Lucas Thompson', grade: '5th Grade' },
]

const MOCK_FEES = {
  'student-001': {
    totalDue: 150,
    totalPaid: 5650,
    fees: [
      { id: 'fee-001', name: 'Lab Fee - Spring 2024', amount: 150, dueDate: '2024-03-20', status: 'pending' },
      { id: 'fee-002', name: 'Tuition - Spring Semester', amount: 5500, dueDate: '2024-01-15', status: 'paid', paidDate: '2024-01-10' },
      { id: 'fee-003', name: 'Registration Fee', amount: 200, dueDate: '2023-08-01', status: 'paid', paidDate: '2023-07-28' },
    ],
  },
  'student-002': {
    totalDue: 0,
    totalPaid: 5500,
    fees: [
      { id: 'fee-004', name: 'Tuition - Spring Semester', amount: 5500, dueDate: '2024-01-15', status: 'paid', paidDate: '2024-01-12' },
    ],
  },
}

function ParentFeesPage() {
  const [selectedStudent, setSelectedStudent] = useState(MOCK_CHILDREN[0].id)
  
  const studentData = MOCK_FEES[selectedStudent as keyof typeof MOCK_FEES]
  const selectedChild = MOCK_CHILDREN.find(c => c.id === selectedStudent)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400'
      case 'pending': return 'bg-golden-400/20 text-golden-600 dark:text-golden-400'
      case 'overdue': return 'bg-rust-100 dark:bg-rust-900/30 text-rust-600 dark:text-rust-400'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
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
            Fee Payments
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            View and manage school fee payments
          </p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Make Payment
        </Button>
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

      {studentData && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Card className={`p-5 ${studentData.totalDue > 0 ? 'border-l-4 border-l-golden-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">Amount Due</p>
                  <p className={`text-3xl font-bold mt-1 ${studentData.totalDue > 0 ? 'text-golden-600 dark:text-golden-400' : 'text-aqua-600 dark:text-aqua-400'}`}>
                    ${studentData.totalDue.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${studentData.totalDue > 0 ? 'bg-golden-400/20' : 'bg-aqua-400/20'}`}>
                  {studentData.totalDue > 0 
                    ? <Clock className="w-6 h-6 text-golden-600 dark:text-golden-400" />
                    : <Check className="w-6 h-6 text-aqua-600 dark:text-aqua-400" />
                  }
                </div>
              </div>
              {studentData.totalDue > 0 && (
                <Button className="w-full mt-4">Pay Now</Button>
              )}
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">Total Paid (YTD)</p>
                  <p className="text-3xl font-bold text-[rgb(var(--text-primary))] mt-1">
                    ${studentData.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
                  <DollarSign className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Fees List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Fee History for {selectedChild?.name}
                </h2>
              </div>
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                {studentData.fees.map((fee) => (
                  <div key={fee.id} className="p-5 flex items-center justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))]">
                        <Receipt className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                      </div>
                      <div>
                        <p className="font-medium text-[rgb(var(--text-primary))]">{fee.name}</p>
                        <p className="text-sm text-[rgb(var(--text-tertiary))]">
                          Due: {new Date(fee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {fee.paidDate && ` • Paid: ${new Date(fee.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                        ${fee.amount.toLocaleString()}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)}
                        {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                      </span>
                      {fee.status === 'paid' && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {fee.status === 'pending' && (
                        <Button size="sm">Pay</Button>
                      )}
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

