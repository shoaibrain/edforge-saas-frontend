import { BookOpen, Trophy, Star, Target, Zap } from 'lucide-react'
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
      className="relative overflow-hidden rounded-2xl shadow-xl shadow-black/40 transition-all duration-800"
      style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
    >
      <div className="flex h-[min(480px,65vh)] md:h-[min(560px,70vh)]">
        {/* Sidebar — hidden on mobile */}
        <div
          className="hidden md:block w-20 border-r"
          style={{ borderColor: 'rgba(42,157,143,0.1)', backgroundColor: 'rgba(16,38,48,0.5)' }}
        >
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #2a9d8f, #1a6b7a)', color: '#ffffff' }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'learning'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
              }
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'engagement'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
              }
            >
              <Zap className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={
                activeState === 'achievements'
                  ? { backgroundColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }
                  : { color: '#8aafbf' }
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
            className="flex h-16 items-center justify-between border-b px-6"
            style={{ borderColor: 'rgba(42,157,143,0.1)', backgroundColor: '#102630' }}
          >
            <h1 className="text-base font-semibold sm:text-lg" style={{ color: '#e8edf0' }}>My Learning Dashboard</h1>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{ border: '1px solid rgba(42,157,143,0.2)', background: 'linear-gradient(to right, rgba(42,157,143,0.15), rgba(26,107,122,0.15))' }}
              >
                <Star className="h-4 w-4" style={{ color: '#2a9d8f' }} />
                <span className="text-sm font-semibold" style={{ color: '#2a9d8f' }}>Level 12</span>
              </div>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#162e3b', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#8aafbf' }}
              >
                SU
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] overflow-hidden p-6" style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}>
            <AnimatePresence mode="wait">
            {/* Learning State */}
            {activeState === 'learning' && (
            <motion.div
              key="learning"
              className="absolute inset-0 p-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Continue Learning</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { subject: 'Mathematics', progress: 78, lesson: 'Algebra: Solving Equations', color: 'from-[#2a9d8f] to-[#1a6b7a]' },
                  { subject: 'Science', progress: 65, lesson: 'Chemistry: Periodic Table', color: 'from-[#1a8a7a] to-[#14706a]' },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 shadow-lg transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${course.color} shadow-lg`}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold" style={{ color: '#e8edf0' }}>{course.subject}</div>
                        <div className="text-xs" style={{ color: '#8aafbf' }}>{course.lesson}</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${course.color}`} style={{ width: `${course.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#8aafbf' }}>{course.progress}% Complete</span>
                      <span className="font-medium" style={{ color: '#2a9d8f' }}>Continue &rarr;</span>
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <div className="grid h-full grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
                      <Trophy className="h-6 w-6" style={{ color: '#2a9d8f' }} />
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>Your Achievements</div>
                  </div>
                  <div className="mb-4 text-lg font-bold" style={{ color: '#2a9d8f' }}>247</div>
                  <div className="mb-4 text-xs" style={{ color: '#8aafbf' }}>Total Points This Month</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#8aafbf' }}>Weekly Rank</span>
                      <span className="font-semibold" style={{ color: '#e8edf0' }}>#3 in Class</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#8aafbf' }}>Streak</span>
                      <span className="font-semibold text-orange-500">12 Days</span>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Recent Badges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, name: 'Math Master', color: 'from-yellow-500 to-orange-500' },
                      { icon: Zap, name: 'Speed Reader', color: 'from-[#2a9d8f] to-[#1a6b7a]' },
                      { icon: Star, name: 'Perfect Score', color: 'from-pink-500 to-red-500' },
                      { icon: Target, name: 'On Target', color: 'from-green-500 to-teal-500' },
                    ].map((badge, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3 text-center transition-all hover:scale-105"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}
                      >
                        <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${badge.color} shadow-lg`}>
                          <badge.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-xs font-medium" style={{ color: '#e8edf0' }}>{badge.name}</div>
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Your Progress Journey</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Overall Grade</h4>
                  <div className="mb-4 flex items-center justify-center">
                    <div className="relative h-32 w-32">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#162e3b" strokeWidth="8" />
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
                        <div className="text-2xl font-bold sm:text-3xl" style={{ color: '#e8edf0' }}>A-</div>
                        <div className="text-xs" style={{ color: '#8aafbf' }}>88.5%</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm" style={{ color: '#8aafbf' }}>Keep up the great work!</div>
                </div>
                <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h4 className="mb-4 text-sm font-semibold" style={{ color: '#e8edf0' }}>Subject Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { subject: 'Math', grade: 'A', color: '#2a9d8f' },
                      { subject: 'Science', grade: 'A-', color: '#3ab5a5' },
                      { subject: 'English', grade: 'B+', color: '#1a8a7a' },
                      { subject: 'History', grade: 'A', color: '#1a6b7a' },
                    ].map((subj, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg p-2"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}
                      >
                        <span className="text-sm" style={{ color: '#e8edf0' }}>{subj.subject}</span>
                        <span className="text-lg font-bold" style={{ color: subj.color }}>{subj.grade}</span>
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ color: '#e8edf0' }}>Recommended For You</h3>
              <div className="space-y-4">
                <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: '#102630', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
                      <Target className="h-5 w-5" style={{ color: '#2a9d8f' }} />
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#e8edf0' }}>Today's Focus Areas</div>
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
                          <XAxis dataKey="name" stroke="#8aafbf" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0a1a24', borderColor: 'rgba(42,157,143,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#e8edf0' }}
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
                        className="flex items-start gap-3 rounded-lg p-3 transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)' }}
                      >
                        <div
                          className={`mt-1 h-3 w-3 rounded-full ${
                            focus.priority === 'high' ? 'bg-red-500' : focus.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: '#e8edf0' }}>{focus.topic}</div>
                          <div className="text-xs" style={{ color: '#8aafbf' }}>{focus.reason}</div>
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
