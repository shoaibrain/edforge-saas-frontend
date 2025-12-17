/**
 * Student Schedule Page
 * 
 * Displays the student's weekly class schedule.
 */

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/_protected/student-portal/schedule')({
  component: StudentSchedulePage,
})

// Mock schedule data
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const MOCK_SCHEDULE: Record<string, Array<{
  id: number
  time: string
  endTime: string
  subject: string
  teacher: string
  room: string
  type: 'class' | 'lab' | 'study' | 'lunch'
}>> = {
  Monday: [
    { id: 1, time: '8:00 AM', endTime: '9:20 AM', subject: 'Mathematics', teacher: 'Mr. Johnson', room: 'Room 201', type: 'class' },
    { id: 2, time: '9:30 AM', endTime: '10:50 AM', subject: 'Biology 101', teacher: 'Dr. Mitchell', room: 'Science Lab A', type: 'lab' },
    { id: 3, time: '11:00 AM', endTime: '12:20 PM', subject: 'English Literature', teacher: 'Ms. Davis', room: 'Room 105', type: 'class' },
    { id: 4, time: '12:30 PM', endTime: '1:20 PM', subject: 'Lunch', teacher: '', room: 'Cafeteria', type: 'lunch' },
    { id: 5, time: '1:30 PM', endTime: '2:50 PM', subject: 'History', teacher: 'Mr. Wilson', room: 'Room 302', type: 'class' },
  ],
  Tuesday: [
    { id: 1, time: '8:00 AM', endTime: '9:20 AM', subject: 'Biology 101', teacher: 'Dr. Mitchell', room: 'Room 203', type: 'class' },
    { id: 2, time: '9:30 AM', endTime: '10:50 AM', subject: 'Physical Education', teacher: 'Mr. Garcia', room: 'Gymnasium', type: 'class' },
    { id: 3, time: '11:00 AM', endTime: '12:20 PM', subject: 'Mathematics', teacher: 'Mr. Johnson', room: 'Room 201', type: 'class' },
    { id: 4, time: '12:30 PM', endTime: '1:20 PM', subject: 'Lunch', teacher: '', room: 'Cafeteria', type: 'lunch' },
    { id: 5, time: '1:30 PM', endTime: '2:50 PM', subject: 'Study Hall', teacher: '', room: 'Library', type: 'study' },
  ],
  Wednesday: [
    { id: 1, time: '8:00 AM', endTime: '9:20 AM', subject: 'English Literature', teacher: 'Ms. Davis', room: 'Room 105', type: 'class' },
    { id: 2, time: '9:30 AM', endTime: '10:50 AM', subject: 'History', teacher: 'Mr. Wilson', room: 'Room 302', type: 'class' },
    { id: 3, time: '11:00 AM', endTime: '12:20 PM', subject: 'Art', teacher: 'Ms. Brown', room: 'Art Studio', type: 'class' },
    { id: 4, time: '12:30 PM', endTime: '1:20 PM', subject: 'Lunch', teacher: '', room: 'Cafeteria', type: 'lunch' },
    { id: 5, time: '1:30 PM', endTime: '2:50 PM', subject: 'Mathematics', teacher: 'Mr. Johnson', room: 'Room 201', type: 'class' },
  ],
  Thursday: [
    { id: 1, time: '8:00 AM', endTime: '9:20 AM', subject: 'Biology 101', teacher: 'Dr. Mitchell', room: 'Science Lab A', type: 'lab' },
    { id: 2, time: '9:30 AM', endTime: '10:50 AM', subject: 'English Literature', teacher: 'Ms. Davis', room: 'Room 105', type: 'class' },
    { id: 3, time: '11:00 AM', endTime: '12:20 PM', subject: 'Physical Education', teacher: 'Mr. Garcia', room: 'Gymnasium', type: 'class' },
    { id: 4, time: '12:30 PM', endTime: '1:20 PM', subject: 'Lunch', teacher: '', room: 'Cafeteria', type: 'lunch' },
    { id: 5, time: '1:30 PM', endTime: '2:50 PM', subject: 'History', teacher: 'Mr. Wilson', room: 'Room 302', type: 'class' },
  ],
  Friday: [
    { id: 1, time: '8:00 AM', endTime: '9:20 AM', subject: 'Mathematics', teacher: 'Mr. Johnson', room: 'Room 201', type: 'class' },
    { id: 2, time: '9:30 AM', endTime: '10:50 AM', subject: 'Music', teacher: 'Mr. Lee', room: 'Music Room', type: 'class' },
    { id: 3, time: '11:00 AM', endTime: '12:20 PM', subject: 'Biology 101', teacher: 'Dr. Mitchell', room: 'Room 203', type: 'class' },
    { id: 4, time: '12:30 PM', endTime: '1:20 PM', subject: 'Lunch', teacher: '', room: 'Cafeteria', type: 'lunch' },
    { id: 5, time: '1:30 PM', endTime: '2:50 PM', subject: 'Study Hall', teacher: '', room: 'Library', type: 'study' },
  ],
}

function getTypeColor(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case 'lab':
      return { 
        bg: 'bg-violet-500/10', 
        border: 'border-violet-500/20',
        text: 'text-violet-600 dark:text-violet-400'
      }
    case 'lunch':
      return { 
        bg: 'bg-golden-400/10', 
        border: 'border-golden-400/20',
        text: 'text-golden-600 dark:text-golden-400'
      }
    case 'study':
      return { 
        bg: 'bg-aqua-400/10', 
        border: 'border-aqua-400/20',
        text: 'text-aqua-700 dark:text-aqua-400'
      }
    default:
      return { 
        bg: 'bg-teal-500/10', 
        border: 'border-teal-500/20',
        text: 'text-teal-600 dark:text-cyan-400'
      }
  }
}

function StudentSchedulePage() {
  // Get current day for highlighting
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          My Schedule
        </h1>
        <p className="text-[rgb(var(--text-secondary))]">
          Your weekly class schedule for Fall 2024
        </p>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4"
      >
        {['class', 'lab', 'lunch', 'study'].map((type) => {
          const colors = getTypeColor(type)
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg} border ${colors.border}`} />
              <span className="text-sm text-[rgb(var(--text-tertiary))] capitalize">{type}</span>
            </div>
          )
        })}
      </motion.div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {DAYS.map((day, dayIndex) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + dayIndex * 0.05 }}
          >
            <Card className={`overflow-hidden ${day === today ? 'ring-2 ring-teal-500' : ''}`}>
              {/* Day Header */}
              <div className={`p-3 border-b border-[rgb(var(--border-secondary))] ${
                day === today ? 'bg-teal-500/10' : 'bg-[rgb(var(--surface-tertiary))]'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${day === today ? 'text-teal-500' : 'text-[rgb(var(--text-tertiary))]'}`} />
                  <span className={`font-semibold ${day === today ? 'text-teal-600 dark:text-cyan-400' : 'text-[rgb(var(--text-primary))]'}`}>
                    {day}
                  </span>
                  {day === today && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500 text-white ml-auto">
                      Today
                    </span>
                  )}
                </div>
              </div>

              {/* Classes */}
              <div className="divide-y divide-[rgb(var(--border-secondary))]">
                {MOCK_SCHEDULE[day]?.map((item) => {
                  const colors = getTypeColor(item.type)
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 ${colors.bg} border-l-2 ${colors.border}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3 text-[rgb(var(--text-tertiary))]" />
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">
                          {item.time} - {item.endTime}
                        </span>
                      </div>
                      <p className={`font-medium text-sm ${colors.text}`}>
                        {item.subject}
                      </p>
                      {item.teacher && (
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                          {item.teacher}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-[rgb(var(--text-tertiary))]" />
                        <span className="text-xs text-[rgb(var(--text-tertiary))]">
                          {item.room}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

