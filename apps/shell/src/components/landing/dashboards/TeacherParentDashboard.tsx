import { BookOpen, MessageCircle, TrendingUp, Users, Calendar, CheckCircle, Bell, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

type TeacherParentState = 'classroom' | 'communication' | 'progress' | 'collaboration'

interface TeacherParentDashboardProps {
  activeState: TeacherParentState
}

export function TeacherParentDashboard({ activeState }: TeacherParentDashboardProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <div
      role="img"
      aria-label="Teacher and parent dashboard demonstration showing classroom management and communication features"
      className="relative overflow-hidden rounded-2xl shadow-xl shadow-black/40 transition-all duration-800"
      style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
    >
      <div className="flex h-[min(480px,65vh)] md:h-[min(560px,70vh)]">
        {/* Sidebar — hidden on mobile */}
        <div
          className="hidden md:block w-20"
          style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderRight: '1px solid rgba(42,157,143,0.1)' }}
        >
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all duration-300"
              style={{ backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'classroom'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
              }
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'communication'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
              }
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'progress'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
              }
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Top Navigation */}
          <div
            className="flex h-16 items-center justify-between px-6"
            style={{ backgroundColor: '#102630', borderBottom: '1px solid rgba(42,157,143,0.1)' }}
          >
            <h1 className="text-base font-semibold sm:text-lg" style={{ color: '#e8edf0' }}>Classroom Hub</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5" style={{ color: '#8aafbf' }} />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full" style={{ backgroundColor: '#2a9d8f' }} />
              </div>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#162e3b', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#8aafbf' }}
              >
                TU
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] overflow-hidden p-6" style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}>
            <AnimatePresence mode="wait">
            {/* Classroom State */}
            {activeState === 'classroom' && (
            <motion.div
              key="classroom"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Today's Schedule - Grade 5A</h3>
              <div className="space-y-3">
                {[
                  { time: '08:30 AM', subject: 'Mathematics', topic: 'Fractions & Decimals', status: 'completed' },
                  { time: '09:45 AM', subject: 'English Literature', topic: 'Creative Writing Workshop', status: 'in-progress' },
                  { time: '11:00 AM', subject: 'Science', topic: 'Ecosystem & Food Chains', status: 'upcoming' },
                ].map((lesson, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 shadow-lg transition-all ${
                      lesson.status === 'in-progress' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: '#102630',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'rgba(42,157,143,0.1)',
                      ...(lesson.status === 'in-progress' ? { ringColor: '#2a9d8f', boxShadow: '0 0 0 2px #2a9d8f' } : {}),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold" style={{ color: '#e8edf0' }}>{lesson.time.split(' ')[0]}</div>
                          <div className="text-xs" style={{ color: '#8aafbf' }}>{lesson.time.split(' ')[1]}</div>
                        </div>
                        <div className="h-12 w-1 rounded-full" style={{ background: 'linear-gradient(to bottom, #2a9d8f, #2a9d8f)' }} />
                        <div>
                          <div className="font-semibold" style={{ color: '#e8edf0' }}>{lesson.subject}</div>
                          <div className="text-sm" style={{ color: '#8aafbf' }}>{lesson.topic}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {lesson.status === 'in-progress' && <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: '#2a9d8f' }} />}
                        {lesson.status === 'upcoming' && <div className="text-xs" style={{ color: '#8aafbf' }}>Upcoming</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {/* Communication State */}
            {activeState === 'communication' && (
            <motion.div
              key="communication"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Recent Messages</h3>
              <div className="space-y-3">
                {[
                  { from: 'Mrs. Johnson (Parent)', message: 'Thank you for the progress report. Could we schedule a meeting?', time: '10 min ago', unread: true },
                  { from: 'Mr. Thompson (Principal)', message: 'Faculty meeting moved to Wednesday 3 PM', time: '1 hour ago', unread: true },
                  { from: 'Mrs. Garcia (Parent)', message: "Emma will be absent tomorrow due to doctor's appointment", time: '2 hours ago', unread: false },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 shadow-lg transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: '#102630',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'rgba(42,157,143,0.1)',
                      ...(msg.unread ? { boxShadow: '0 0 0 1px #2a9d8f' } : {}),
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: '#162e3b', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#8aafbf' }}
                        >
                          {msg.from.charAt(0)}
                          {msg.from.split(' ')[1]?.charAt(0) || ''}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: '#e8edf0' }}>{msg.from}</span>
                            {msg.unread && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#2a9d8f' }} />}
                          </div>
                          <p className="mt-1 text-sm" style={{ color: '#8aafbf' }}>{msg.message}</p>
                          <span className="mt-2 inline-block text-xs" style={{ color: '#8aafbf' }}>{msg.time}</span>
                        </div>
                      </div>
                      <MessageCircle className="h-5 w-5" style={{ color: '#8aafbf' }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {/* Progress State */}
            {activeState === 'progress' && (
            <motion.div
              key="progress"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Student Performance Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Subject Mastery</h4>
                  <div className="space-y-4">
                    {[
                      { subject: 'Mathematics Mastery', pct: 92, color: '#e76f51' },
                      { subject: 'Science Proficiency', pct: 88, color: '#2a9d8f' },
                      { subject: 'Language Arts', pct: 75, color: '#e9c46a' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: '#8aafbf' }}>{s.subject}</span>
                          <span className="font-medium" style={{ color: s.color }}>{s.pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#162e3b' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Assignments Submitted</h4>
                  <div className="mb-4 text-lg font-bold sm:text-3xl md:text-4xl" style={{ color: '#2a9d8f' }}>24/26</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#8aafbf' }}>On Time</span>
                      <span className="font-medium text-green-500">22</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#8aafbf' }}>Late</span>
                      <span className="font-medium text-yellow-500">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#8aafbf' }}>Missing</span>
                      <span className="font-medium text-red-500">2</span>
                    </div>
                  </div>
                </div>
                <div
                  className="col-span-2 rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Top Performers This Week</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Emma Thompson', achievement: 'Perfect score on Math quiz', score: 100 },
                      { name: 'Liam Chen', achievement: 'Outstanding essay submission', score: 98 },
                      { name: 'Sophia Martinez', achievement: 'Science project excellence', score: 96 },
                    ].map((student, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg p-3"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(to bottom right, #2a9d8f, #2a9d8f)' }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>{student.name}</div>
                            <div className="text-xs" style={{ color: '#8aafbf' }}>{student.achievement}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" style={{ color: '#2a9d8f' }} />
                          <span className="text-lg font-bold" style={{ color: '#2a9d8f' }}>{student.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {/* Collaboration State */}
            {activeState === 'collaboration' && (
            <motion.div
              key="collaboration"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Parent Engagement Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
                      <Users className="h-5 w-5" style={{ color: '#2a9d8f' }} />
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>Parent Participation</div>
                  </div>
                  <div className="mb-3 text-lg font-bold sm:text-3xl md:text-4xl" style={{ color: '#2a9d8f' }}>92%</div>
                  <div className="text-sm" style={{ color: '#8aafbf' }}>24 of 26 parents actively engaged</div>
                </div>
                <div
                  className="rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
                      <MessageCircle className="h-5 w-5" style={{ color: '#2a9d8f' }} />
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>Response Rate</div>
                  </div>
                  <div className="mb-3 text-lg font-bold sm:text-3xl md:text-4xl" style={{ color: '#2a9d8f' }}>4.2h</div>
                  <div className="text-sm" style={{ color: '#8aafbf' }}>Average parent response time</div>
                </div>
                <div
                  className="col-span-2 rounded-2xl p-5 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Upcoming Parent Conferences</h4>
                  <div className="space-y-3">
                    {[
                      { parent: 'Mr. & Mrs. Johnson', student: 'Emma Johnson', date: 'Tomorrow, 3:30 PM' },
                      { parent: 'Mrs. Rodriguez', student: 'Carlos Rodriguez', date: 'Thu, 4:00 PM' },
                      { parent: 'Mr. Chen', student: 'Liam Chen', date: 'Fri, 2:30 PM' },
                    ].map((conf, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg p-3"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: '#162e3b', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#8aafbf' }}
                          >
                            {conf.parent.charAt(0)}{conf.parent.split(' ').pop()?.charAt(0) || ''}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>{conf.parent}</div>
                            <div className="text-xs" style={{ color: '#8aafbf' }}>Re: {conf.student}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium" style={{ color: '#2a9d8f' }}>{conf.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
