import { BookOpen, Trophy, Star, Target, Zap, Award, TrendingUp, Clock } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

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
  return (
    <div role="img" aria-label="Student learning dashboard demonstration showing courses, achievements, and progress" className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/40 transition-all duration-800">
      <div className="flex h-[min(600px,70vh)] md:h-[min(700px,75vh)]">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:block w-20 border-r border-border bg-card/50">
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'learning' ? 'bg-purple-500/20 text-purple-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'engagement' ? 'bg-purple-500/20 text-purple-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'achievements' ? 'bg-purple-500/20 text-purple-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Top Navigation */}
          <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <h1 className="text-base font-semibold text-foreground sm:text-lg">My Learning Dashboard</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-500">Level 12</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                SU
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] overflow-hidden bg-background/50 p-6">
            {/* Learning State */}
            {activeState === 'learning' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Continue Learning</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { subject: 'Mathematics', progress: 78, lesson: 'Algebra: Solving Equations', color: 'from-blue-500 to-blue-600' },
                  { subject: 'Science', progress: 65, lesson: 'Chemistry: Periodic Table', color: 'from-green-500 to-green-600' },
                  { subject: 'History', progress: 92, lesson: 'World War II', color: 'from-orange-500 to-orange-600' },
                  { subject: 'English', progress: 54, lesson: 'Shakespeare: Macbeth', color: 'from-purple-500 to-purple-600' },
                ].map((course, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-lg transition-all hover:scale-[1.02]">
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${course.color} shadow-lg`}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{course.subject}</div>
                        <div className="text-xs text-muted-foreground">{course.lesson}</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-background/50">
                      <div className={`h-full rounded-full bg-gradient-to-r ${course.color}`} style={{ width: `${course.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{course.progress}% Complete</span>
                      <span className="font-medium text-purple-500">Continue &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Engagement State */}
            {activeState === 'engagement' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <div className="grid h-full grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Trophy className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="text-sm font-medium text-foreground">Your Achievements</div>
                  </div>
                  <div className="mb-4 text-3xl font-bold text-purple-500 sm:text-4xl md:text-5xl">247</div>
                  <div className="mb-4 text-sm text-muted-foreground">Total Points This Month</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weekly Rank</span>
                      <span className="font-semibold text-foreground">#3 in Class</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Streak</span>
                      <span className="font-semibold text-orange-500">12 Days</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Recent Badges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, name: 'Math Master', color: 'from-yellow-500 to-orange-500' },
                      { icon: Zap, name: 'Speed Reader', color: 'from-blue-500 to-purple-500' },
                      { icon: Star, name: 'Perfect Score', color: 'from-pink-500 to-red-500' },
                      { icon: Target, name: 'On Target', color: 'from-green-500 to-teal-500' },
                    ].map((badge, i) => (
                      <div key={i} className="rounded-xl bg-background/50 p-3 text-center transition-all hover:scale-105">
                        <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${badge.color} shadow-lg`}>
                          <badge.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-xs font-medium text-foreground">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Class Leaderboard</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Emma T.', points: 289, rank: 1 },
                      { name: 'Liam C.', points: 265, rank: 2 },
                      { name: 'You', points: 247, rank: 3 },
                      { name: 'Sofia M.', points: 234, rank: 4 },
                    ].map((student, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg p-3 ${
                          student.name === 'You' ? 'bg-purple-500/10 ring-2 ring-purple-500' : 'bg-background/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-sm font-bold ${
                              i === 0 ? 'ring-2 ring-yellow-500' : ''
                            }`}
                          >
                            #{student.rank}
                          </div>
                          <span className={`font-medium ${student.name === 'You' ? 'text-purple-500' : 'text-foreground'}`}>
                            {student.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-foreground">{student.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Achievements State */}
            {activeState === 'achievements' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Your Progress Journey</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Overall Grade</h4>
                  <div className="mb-4 flex items-center justify-center">
                    <div className="relative h-32 w-32">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset="28.9"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-foreground sm:text-3xl">A-</div>
                        <div className="text-xs text-muted-foreground">88.5%</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">Keep up the great work!</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Subject Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { subject: 'Math', grade: 'A', color: 'text-blue-500' },
                      { subject: 'Science', grade: 'A-', color: 'text-green-500' },
                      { subject: 'English', grade: 'B+', color: 'text-purple-500' },
                      { subject: 'History', grade: 'A', color: 'text-orange-500' },
                    ].map((subj, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-background/50 p-2">
                        <span className="text-sm text-foreground">{subj.subject}</span>
                        <span className={`text-lg font-bold ${subj.color}`}>{subj.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Recent Achievements</h4>
                  <div className="space-y-3">
                    {[
                      { title: 'Perfect Quiz Score', subject: 'Mathematics', date: 'Today', icon: Target },
                      { title: 'Essay Excellence', subject: 'English', date: 'Yesterday', icon: BookOpen },
                      { title: 'Science Project A+', subject: 'Science', date: '2 days ago', icon: Award },
                    ].map((achievement, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-background/50 p-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                          <achievement.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{achievement.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {achievement.subject} &middot; {achievement.date}
                          </div>
                        </div>
                        <Award className="h-5 w-5 text-purple-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Personalized State */}
            {activeState === 'personalized' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Recommended For You</h3>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Target className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-sm font-medium text-foreground">Today's Focus Areas</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyData}>
                          <defs>
                            <linearGradient id="learningGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="url(#learningGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#ec4899', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {[
                      { topic: 'Practice algebra word problems', reason: "You're close to mastering this!", priority: 'high' },
                      { topic: 'Review periodic table elements', reason: 'Quiz coming up on Friday', priority: 'medium' },
                      { topic: 'Read Chapter 7 of Macbeth', reason: 'Stay ahead for class discussion', priority: 'low' },
                    ].map((focus, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-background/50 p-3 transition-all hover:scale-[1.02]">
                        <div
                          className={`mt-1 h-3 w-3 rounded-full ${
                            focus.priority === 'high' ? 'bg-red-500' : focus.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{focus.topic}</div>
                          <div className="text-xs text-muted-foreground">{focus.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <div className="text-sm font-medium text-foreground">Study Time</div>
                    </div>
                    <div className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">3.5h</div>
                    <div className="text-xs text-muted-foreground">This week</div>
                    <div className="mt-3 text-xs text-green-500">+45 min from last week</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <div className="text-sm font-medium text-foreground">Growth Rate</div>
                    </div>
                    <div className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">+12%</div>
                    <div className="text-xs text-muted-foreground">vs last month</div>
                    <div className="mt-3 text-xs text-green-500">Above average!</div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
