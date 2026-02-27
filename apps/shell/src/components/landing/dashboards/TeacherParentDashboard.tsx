import { BookOpen, MessageCircle, TrendingUp, Users, Calendar, CheckCircle, Bell, Award } from 'lucide-react'

type TeacherParentState = 'classroom' | 'communication' | 'progress' | 'collaboration'

interface TeacherParentDashboardProps {
  activeState: TeacherParentState
}

export function TeacherParentDashboard({ activeState }: TeacherParentDashboardProps) {
  return (
    <div role="img" aria-label="Teacher and parent dashboard demonstration showing classroom management and communication features" className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/40 transition-all duration-800">
      <div className="flex h-[min(600px,70vh)] md:h-[min(700px,75vh)]">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:block w-20 border-r border-border bg-card/50">
          <div className="flex h-full flex-col items-center gap-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'classroom' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'communication' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeState === 'progress' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Top Navigation */}
          <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <h1 className="text-base font-semibold text-foreground sm:text-lg">Classroom Hub</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
              </div>
              <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                TU
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] overflow-hidden bg-background/50 p-6">
            {/* Classroom State */}
            {activeState === 'classroom' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Today's Schedule - Grade 5A</h3>
              <div className="space-y-3">
                {[
                  { time: '08:30 AM', subject: 'Mathematics', topic: 'Fractions & Decimals', status: 'completed' },
                  { time: '09:45 AM', subject: 'English Literature', topic: 'Creative Writing Workshop', status: 'in-progress' },
                  { time: '11:00 AM', subject: 'Science', topic: 'Ecosystem & Food Chains', status: 'upcoming' },
                  { time: '01:30 PM', subject: 'Physical Education', topic: 'Team Sports', status: 'upcoming' },
                  { time: '02:45 PM', subject: 'Art', topic: 'Mixed Media Projects', status: 'upcoming' },
                ].map((lesson, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border border-border bg-card p-4 shadow-lg transition-all ${
                      lesson.status === 'in-progress' ? 'ring-2 ring-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-foreground">{lesson.time.split(' ')[0]}</div>
                          <div className="text-xs text-muted-foreground">{lesson.time.split(' ')[1]}</div>
                        </div>
                        <div className="h-12 w-1 rounded-full bg-gradient-to-b from-accent to-primary" />
                        <div>
                          <div className="font-semibold text-foreground">{lesson.subject}</div>
                          <div className="text-sm text-muted-foreground">{lesson.topic}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {lesson.status === 'in-progress' && <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />}
                        {lesson.status === 'upcoming' && <div className="text-xs text-muted-foreground">Upcoming</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Communication State */}
            {activeState === 'communication' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Messages</h3>
              <div className="space-y-3">
                {[
                  { from: 'Mrs. Johnson (Parent)', message: 'Thank you for the progress report. Could we schedule a meeting?', time: '10 min ago', unread: true },
                  { from: 'Mr. Thompson (Principal)', message: 'Faculty meeting moved to Wednesday 3 PM', time: '1 hour ago', unread: true },
                  { from: 'Mrs. Garcia (Parent)', message: "Emma will be absent tomorrow due to doctor's appointment", time: '2 hours ago', unread: false },
                  { from: 'Ms. Chen (Co-Teacher)', message: "Let's coordinate on the science project presentations", time: '5 hours ago', unread: false },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border border-border bg-card p-4 shadow-lg transition-all hover:scale-[1.02] ${
                      msg.unread ? 'ring-1 ring-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {msg.from.charAt(0)}
                          {msg.from.split(' ')[1]?.charAt(0) || ''}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{msg.from}</span>
                            {msg.unread && <div className="h-2 w-2 rounded-full bg-accent" />}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{msg.message}</p>
                          <span className="mt-2 inline-block text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                      </div>
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Progress State */}
            {activeState === 'progress' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Student Performance Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Subject Mastery</h4>
                  <div className="space-y-4">
                    {[
                      { subject: 'Mathematics Mastery', pct: 92, color: '#e76f51' },
                      { subject: 'Science Proficiency', pct: 88, color: '#2a9d8f' },
                      { subject: 'Language Arts', pct: 75, color: '#e9c46a' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.subject}</span>
                          <span className="font-medium" style={{ color: s.color }}>{s.pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Assignments Submitted</h4>
                  <div className="mb-4 text-2xl font-bold text-accent sm:text-3xl md:text-4xl">24/26</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On Time</span>
                      <span className="font-medium text-green-500">22</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Late</span>
                      <span className="font-medium text-yellow-500">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Missing</span>
                      <span className="font-medium text-red-500">2</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Top Performers This Week</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Emma Thompson', achievement: 'Perfect score on Math quiz', score: 100 },
                      { name: 'Liam Chen', achievement: 'Outstanding essay submission', score: 98 },
                      { name: 'Sophia Martinez', achievement: 'Science project excellence', score: 96 },
                    ].map((student, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-background/50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-sm font-bold text-white">
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.achievement}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-accent" />
                          <span className="text-lg font-bold text-accent">{student.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Collaboration State */}
            {activeState === 'collaboration' && (
            <div className="absolute inset-0 p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Parent Engagement Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-sm font-medium text-foreground">Parent Participation</div>
                  </div>
                  <div className="mb-3 text-2xl font-bold text-accent sm:text-3xl md:text-4xl">92%</div>
                  <div className="text-sm text-muted-foreground">24 of 26 parents actively engaged</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-sm font-medium text-foreground">Response Rate</div>
                  </div>
                  <div className="mb-3 text-2xl font-bold text-primary sm:text-3xl md:text-4xl">4.2h</div>
                  <div className="text-sm text-muted-foreground">Average parent response time</div>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-lg">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Upcoming Parent Conferences</h4>
                  <div className="space-y-3">
                    {[
                      { parent: 'Mr. & Mrs. Johnson', student: 'Emma Johnson', date: 'Tomorrow, 3:30 PM' },
                      { parent: 'Mrs. Rodriguez', student: 'Carlos Rodriguez', date: 'Thu, 4:00 PM' },
                      { parent: 'Mr. Chen', student: 'Liam Chen', date: 'Fri, 2:30 PM' },
                    ].map((conf, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-background/50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {conf.parent.charAt(0)}{conf.parent.split(' ').pop()?.charAt(0) || ''}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{conf.parent}</div>
                            <div className="text-xs text-muted-foreground">Re: {conf.student}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-accent">{conf.date}</div>
                        </div>
                      </div>
                    ))}
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
