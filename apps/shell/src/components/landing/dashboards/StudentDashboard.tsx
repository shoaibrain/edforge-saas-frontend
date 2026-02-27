import { BookOpen, Trophy, Star, Target, Zap } from 'lucide-react'
import { getStudentAvatar } from '../../../lib/avatar'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

type StudentState = 'learning' | 'engagement' | 'achievements' | 'personalized'

interface StudentDashboardProps {
  activeState: StudentState
}

const weeklyData = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 60 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 80 },
  { name: 'Fri', value: 70 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 85 },
]

export function StudentDashboard({ activeState }: StudentDashboardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Student learning dashboard demonstration showing courses, achievements, and progress"
      className="relative overflow-hidden transition-all duration-800"
      style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-xl)', boxShadow: 'var(--lp-shadow-dashboard)' }}
    >
      <div className="flex h-[min(480px,65vh)] md:h-[min(560px,70vh)]">
        {/* Sidebar — hidden on mobile */}
        <div
          className="hidden md:block w-20"
          style={{ borderRight: '1px solid rgb(var(--border-primary))', backgroundColor: 'rgba(var(--surface-secondary),0.5)' }}
        >
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div
              className="flex h-10 w-10 items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #2a9d8f, #1a6b7a)', color: '#ffffff', borderRadius: 'var(--lp-radius-md)' }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'learning'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
              }
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'engagement'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
              }
            >
              <Zap className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center transition-all duration-150 ease-in-out"
              style={
                activeState === 'achievements'
                  ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                  : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
              }
            >
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Top Navigation */}
          <div
            className="flex h-16 items-center justify-between px-6"
            style={{ borderBottom: '1px solid rgba(var(--brand-primary),0.1)', backgroundColor: 'rgb(var(--surface-secondary))' }}
          >
            <h1 style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))', paddingTop: '0.75rem' }}>My Learning Dashboard</h1>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{ border: '1px solid rgba(var(--brand-primary),0.2)', background: 'linear-gradient(to right, rgba(var(--brand-primary),0.15), rgba(var(--brand-primary),0.08))' }}
              >
                <Star className="h-4 w-4" style={{ color: 'var(--lp-chart-primary)' }} />
                <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-subheading)', color: 'var(--lp-chart-primary)' }}>Level 12</span>
              </div>
              <img
                src={getStudentAvatar('Student User')}
                alt="Student User"
                className="h-8 w-8 rounded-full"
                style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="relative h-[calc(100%-4rem)] overflow-hidden p-6" style={{ backgroundColor: 'rgba(var(--surface-primary),0.5)' }}>
            <AnimatePresence mode="wait">
            {/* Learning State */}
            {activeState === 'learning' && (
            <motion.div
              key="learning"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Continue Learning</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { subject: 'Mathematics', progress: 78, lesson: 'Algebra: Solving Equations', gradient: 'linear-gradient(to bottom right, #2a9d8f, #1a6b7a)' },
                  { subject: 'Science', progress: 65, lesson: 'Chemistry: Periodic Table', gradient: 'linear-gradient(to bottom right, #1a8a7a, #14706a)' },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="shadow-lg transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)' }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center shadow-lg" style={{ background: course.gradient, borderRadius: 'var(--lp-radius-md)' }}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{course.subject}</div>
                        <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{course.lesson}</div>
                      </div>
                    </div>
                    <div className="mb-2 w-full overflow-hidden rounded-full" style={{ height: '6px', backgroundColor: 'rgba(var(--brand-primary),0.1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: course.gradient }} />
                    </div>
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>{course.progress}% Complete</span>
                      <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'var(--lp-chart-primary)' }}>Continue &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {/* Engagement State */}
            {activeState === 'engagement' && (
            <motion.div
              key="engagement"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="grid h-full grid-cols-2 gap-4">
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Trophy className="h-6 w-6" style={{ color: 'var(--lp-chart-primary)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Your Achievements</div>
                  </div>
                  <div className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'var(--lp-chart-primary)' }}>247</div>
                  <div className="mb-4" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Total Points This Month</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Weekly Rank</span>
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>#3 in Class</span>
                    </div>
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Streak</span>
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'var(--lp-chart-accent)' }}>12 Days</span>
                    </div>
                  </div>
                </div>
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recent Badges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, name: 'Math Master', gradient: 'linear-gradient(to bottom right, #e9c46a, #f4a261)' },
                      { icon: Zap, name: 'Speed Reader', gradient: 'linear-gradient(to bottom right, #2a9d8f, #1a6b7a)' },
                      { icon: Star, name: 'Perfect Score', gradient: 'linear-gradient(to bottom right, #5ec4b6, #2a9d8f)' },
                      { icon: Target, name: 'On Target', gradient: 'linear-gradient(to bottom right, #34d399, #2a9d8f)' },
                    ].map((badge, i) => (
                      <div
                        key={i}
                        className="p-3 text-center transition-all hover:scale-105"
                        style={{ backgroundColor: 'rgba(var(--brand-primary),0.04)', borderRadius: 'var(--lp-radius-md)' }}
                      >
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full shadow-lg" style={{ background: badge.gradient }}>
                          <badge.icon className="h-6 w-6 text-white" />
                        </div>
                        <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {/* Achievements State */}
            {activeState === 'achievements' && (
            <motion.div
              key="achievements"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Your Progress Journey</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Overall Grade</h4>
                  <div className="mb-4 flex items-center justify-center">
                    <div className="relative h-32 w-32">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(var(--brand-primary),0.12)" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#2a9d8f"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset="28.9"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>A-</div>
                        <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>88.5%</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Keep up the great work!</div>
                </div>
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Subject Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { subject: 'Math', grade: 'A', color: 'var(--lp-chart-primary)' },
                      { subject: 'Science', grade: 'A-', color: 'var(--lp-chart-secondary)' },
                      { subject: 'English', grade: 'B+', color: '#1a8a7a' },
                      { subject: 'History', grade: 'A', color: 'var(--lp-chart-primary)' },
                    ].map((subj, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2"
                        style={{ backgroundColor: 'rgba(var(--brand-primary),0.04)', borderRadius: 'var(--lp-radius-sm)' }}
                      >
                        <span style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-primary))' }}>{subj.subject}</span>
                        <span style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: subj.color }}>{subj.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {/* Personalized State */}
            {activeState === 'personalized' && (
            <motion.div
              key="personalized"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recommended For You</h3>
              <div className="space-y-4">
                <div
                  className="shadow-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Target className="h-5 w-5" style={{ color: 'var(--lp-chart-primary)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Today's Focus Areas</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-[150px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyData}>
                          <defs>
                            <linearGradient id="learningGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#2a9d8f" />
                              <stop offset="100%" stopColor="#1a6b7a" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="rgb(var(--text-tertiary))" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgb(var(--surface-primary))', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}
                            itemStyle={{ color: 'rgb(var(--text-primary))' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="url(#learningGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#1a6b7a', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#2a9d8f' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {[
                      { topic: 'Practice algebra word problems', reason: "You're close to mastering this!", priority: 'high' },
                      { topic: 'Review periodic table elements', reason: 'Quiz coming up on Friday', priority: 'medium' },
                    ].map((focus, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: 'rgba(var(--brand-primary),0.04)', borderRadius: 'var(--lp-radius-sm)' }}
                      >
                        <div
                          className="mt-1 h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: focus.priority === 'high' ? 'var(--lp-chart-danger)' : focus.priority === 'medium' ? 'var(--lp-chart-warning)' : 'var(--lp-chart-success)',
                          }}
                        />
                        <div className="flex-1">
                          <div style={{ fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{focus.topic}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{focus.reason}</div>
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
