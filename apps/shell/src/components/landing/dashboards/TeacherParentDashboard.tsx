import { BookOpen, MessageCircle, TrendingUp, Users, Calendar, CheckCircle, Bell, Award } from 'lucide-react'
import { getUserAvatar, getStudentAvatar } from '../../../lib/avatar'
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
      className="relative overflow-hidden transition-all duration-800"
      style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-xl)', boxShadow: 'var(--lp-shadow-dashboard)' }}
    >
      <div className="flex h-[min(480px,65vh)] md:h-[min(560px,70vh)]">
        {/* Sidebar — hidden on mobile */}
        <div
          className="hidden md:block w-20"
          style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderRight: '1px solid rgb(var(--border-primary))' }}
        >
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div
              className="flex h-10 w-10 items-center justify-center shadow-lg transition-all duration-150 ease-in-out"
              style={{ backgroundColor: 'rgba(var(--brand-primary),0.2)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-md)' }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'classroom'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
              }
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'communication'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
              }
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'progress'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
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
            style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderBottom: '1px solid rgba(var(--brand-primary),0.1)' }}
          >
            <h1 style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))', paddingTop: '0.75rem' }}>Classroom Hub</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5" style={{ color: 'rgb(var(--text-tertiary))' }} />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--lp-chart-primary)' }} />
              </div>
              <img
                src={getUserAvatar('Teacher User')}
                alt="Teacher User"
                className="h-8 w-8 rounded-full"
                style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="relative h-[calc(100%-4rem)] overflow-hidden p-6" style={{ backgroundColor: 'rgba(var(--surface-primary),0.5)' }}>
            <AnimatePresence mode="wait">
            {/* Classroom State */}
            {activeState === 'classroom' && (
            <motion.div
              key="classroom"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Today's Schedule - Grade 5A</h3>
              <div className="space-y-3">
                {[
                  { time: '08:30 AM', subject: 'Mathematics', topic: 'Fractions & Decimals', status: 'completed' },
                  { time: '09:45 AM', subject: 'English Literature', topic: 'Creative Writing Workshop', status: 'in-progress' },
                  { time: '11:00 AM', subject: 'Science', topic: 'Ecosystem & Food Chains', status: 'upcoming' },
                ].map((lesson, i) => (
                  <div
                    key={i}
                    className="shadow-lg transition-all"
                    style={{
                      backgroundColor: 'rgb(var(--surface-secondary))',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'rgba(var(--brand-primary),0.08)',
                      borderRadius: 'var(--lp-radius-md)',
                      padding: 'var(--lp-card-padding)',
                      boxShadow: lesson.status === 'in-progress' ? '0 0 0 2px var(--lp-chart-primary)' : 'var(--lp-shadow-card)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{lesson.time.split(' ')[0]}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{lesson.time.split(' ')[1]}</div>
                        </div>
                        <div className="h-12 w-1 rounded-full" style={{ backgroundColor: 'var(--lp-chart-primary)' }} />
                        <div>
                          <div style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{lesson.subject}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{lesson.topic}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.status === 'completed' && <CheckCircle className="h-5 w-5" style={{ color: 'var(--lp-chart-success)' }} />}
                        {lesson.status === 'in-progress' && <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--lp-chart-primary)' }} />}
                        {lesson.status === 'upcoming' && <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Upcoming</div>}
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recent Messages</h3>
              <div className="space-y-3">
                {[
                  { from: 'Mrs. Johnson (Parent)', message: 'Thank you for the progress report. Could we schedule a meeting?', time: '10 min ago', unread: true },
                  { from: 'Mr. Thompson (Principal)', message: 'Faculty meeting moved to Wednesday 3 PM', time: '1 hour ago', unread: true },
                  { from: 'Mrs. Garcia (Parent)', message: "Emma will be absent tomorrow due to doctor's appointment", time: '2 hours ago', unread: false },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className="shadow-lg transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'rgb(var(--surface-secondary))',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'rgba(var(--brand-primary),0.08)',
                      borderRadius: 'var(--lp-radius-md)',
                      padding: 'var(--lp-card-padding)',
                      boxShadow: msg.unread ? '0 0 0 1px var(--lp-chart-primary)' : 'var(--lp-shadow-card)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <img
                          src={getUserAvatar(msg.from)}
                          alt={msg.from}
                          className="h-10 w-10 rounded-full"
                          style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{msg.from}</span>
                            {msg.unread && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--lp-chart-primary)' }} />}
                          </div>
                          <p className="mt-1" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{msg.message}</p>
                          <span className="mt-2 inline-block" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{msg.time}</span>
                        </div>
                      </div>
                      <MessageCircle className="h-5 w-5" style={{ color: 'rgb(var(--text-tertiary))' }} />
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Student Performance Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Subject Mastery</h4>
                  <div className="space-y-4">
                    {[
                      { subject: 'Mathematics Mastery', pct: 92, gradient: 'linear-gradient(to right, #2a9d8f, #3bc4b4)' },
                      { subject: 'Science Proficiency', pct: 88, gradient: 'linear-gradient(to right, #2a9d8f, #5ec4b6)' },
                      { subject: 'Language Arts', pct: 75, gradient: 'linear-gradient(to right, #e9c46a, #f4a261)' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                          <span style={{ color: 'rgb(var(--text-secondary))' }}>{s.subject}</span>
                          <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{s.pct}%</span>
                        </div>
                        <div className="w-full overflow-hidden rounded-full" style={{ height: '6px', backgroundColor: 'rgba(var(--brand-primary),0.1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.gradient }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Assignments Submitted</h4>
                  <div className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'var(--lp-chart-primary)' }}>24/26</div>
                  <div className="space-y-2">
                    <div className="flex justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>On Time</span>
                      <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'var(--lp-chart-success)', fontVariantNumeric: 'tabular-nums' }}>22</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Late</span>
                      <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'var(--lp-chart-accent)', fontVariantNumeric: 'tabular-nums' }}>2</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Missing</span>
                      <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'var(--lp-chart-danger)', fontVariantNumeric: 'tabular-nums' }}>2</span>
                    </div>
                  </div>
                </div>
                <div
                  className="col-span-2 shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Top Performers This Week</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Emma Thompson', achievement: 'Perfect score on Math quiz', score: 100 },
                      { name: 'Liam Chen', achievement: 'Outstanding essay submission', score: 98 },
                      { name: 'Sophia Martinez', achievement: 'Science project excellence', score: 96 },
                    ].map((student, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3"
                        style={{ backgroundColor: 'rgba(var(--brand-primary),0.04)', borderRadius: 'var(--lp-radius-sm)' }}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getStudentAvatar(student.name)}
                            alt={student.name}
                            className="h-10 w-10 rounded-full"
                            style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
                          />
                          <div>
                            <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{student.name}</div>
                            <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{student.achievement}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" style={{ color: 'var(--lp-chart-primary)' }} />
                          <span style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'var(--lp-chart-primary)', fontVariantNumeric: 'tabular-nums' }}>{student.score}</span>
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Parent Engagement Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Users className="h-5 w-5" style={{ color: 'var(--lp-chart-primary)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Parent Participation</div>
                  </div>
                  <div className="mb-3" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'var(--lp-chart-primary)' }}>92%</div>
                  <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>24 of 26 parents actively engaged</div>
                </div>
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <MessageCircle className="h-5 w-5" style={{ color: 'var(--lp-chart-primary)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Response Rate</div>
                  </div>
                  <div className="mb-3" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'var(--lp-chart-primary)' }}>4.2h</div>
                  <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Average parent response time</div>
                </div>
                <div
                  className="col-span-2 shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Upcoming Parent Conferences</h4>
                  <div className="space-y-3">
                    {[
                      { parent: 'Mr. & Mrs. Johnson', student: 'Emma Johnson', date: 'Tomorrow, 3:30 PM' },
                      { parent: 'Mrs. Rodriguez', student: 'Carlos Rodriguez', date: 'Thu, 4:00 PM' },
                      { parent: 'Mr. Chen', student: 'Liam Chen', date: 'Fri, 2:30 PM' },
                    ].map((conf, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3"
                        style={{ backgroundColor: 'rgba(var(--brand-primary),0.04)', borderRadius: 'var(--lp-radius-sm)' }}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getUserAvatar(conf.parent)}
                            alt={conf.parent}
                            className="h-10 w-10 rounded-full"
                            style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
                          />
                          <div>
                            <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{conf.parent}</div>
                            <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Re: {conf.student}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'var(--lp-chart-primary)' }}>{conf.date}</div>
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
