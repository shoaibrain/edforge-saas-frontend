import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  GraduationCap,
  Users,
  TrendingUp,
  MapPin,
  UserCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Search,
  Bell,
  School,
  ArrowRight,
  BrainCircuit,
} from 'lucide-react'

type AdminDashboardState = 'overview' | 'multi-campus' | 'hr' | 'analytics'

interface AdminDashboardProps {
  activeState: AdminDashboardState
}

// --- Mock Data ---

const overviewData = [
  { name: 'Jan', budget: 4000, actual: 2400 },
  { name: 'Feb', budget: 3000, actual: 1398 },
  { name: 'Mar', budget: 2000, actual: 9800 },
  { name: 'Apr', budget: 2780, actual: 3908 },
  { name: 'May', budget: 1890, actual: 4800 },
  { name: 'Jun', budget: 2390, actual: 3800 },
  { name: 'Jul', budget: 3490, actual: 4300 },
]

const campusData = [
  { name: 'Lincoln High', type: 'High School', students: 1240, staff: 85, health: 98, status: 'Optimal', icon: Building2 },
  { name: 'Washington MS', type: 'Middle School', students: 850, staff: 62, health: 92, status: 'Good', icon: School },
  { name: 'Jefferson Elem', type: 'Elementary', students: 600, staff: 45, health: 88, status: 'Attention', icon: School },
  { name: 'Roosevelt Acad', type: 'High School', students: 1100, staff: 78, health: 95, status: 'Optimal', icon: Building2 },
  { name: 'Kennedy Prep', type: 'K-12', students: 920, staff: 70, health: 96, status: 'Optimal', icon: Building2 },
]

const hrData = [
  { name: 'Teaching', value: 65, color: '#3b82f6' },
  { name: 'Admin', value: 15, color: '#10b981' },
  { name: 'Support', value: 20, color: '#f59e0b' },
]

export function AdminDashboard({ activeState }: AdminDashboardProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  return (
    <div role="img" aria-label="Administrative dashboard demonstration showing school management features" className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/20 transition-all duration-500 flex flex-col h-[min(500px,70vh)] md:h-[min(600px,75vh)]">
      {/* Glass Overlay Effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5" />

      {/* Dashboard Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`relative z-10 hidden border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-500 ease-in-out md:block ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="flex h-full flex-col py-6">
            {/* Logo Area */}
            <div className={`mb-8 flex items-center gap-3 px-6 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Building2 className="h-5 w-5" />
              </div>
              <span
                className={`font-bold text-lg tracking-tight transition-opacity duration-300 ${
                  isSidebarCollapsed ? 'hidden opacity-0' : 'opacity-100'
                }`}
              >
                EdForge
              </span>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-1.5 px-3">
              {[
                { icon: BarChart3, label: 'Overview', state: 'overview' },
                { icon: MapPin, label: 'Campuses', state: 'multi-campus' },
                { icon: UserCheck, label: 'HR & Staff', state: 'hr' },
                { icon: TrendingUp, label: 'Analytics', state: 'analytics' },
              ].map((item) => (
                <div
                  key={item.state}
                  className={`group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    activeState === item.state
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      isSidebarCollapsed ? 'hidden w-0 opacity-0' : 'opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background/30 backdrop-blur-sm">
          {/* Top Navigation */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden rounded-lg p-1.5 hover:bg-muted md:block"
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-48 rounded-lg border border-border/50 bg-background/50 pl-9 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-lg p-1.5 hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-background" />
              </button>
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold leading-none">Dr. R. Wilson</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Superintendent</div>
                </div>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                    RW
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background bg-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative flex-1 overflow-hidden p-5">
            {activeState === 'overview' && (
            <div className="absolute inset-0 p-5 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">District Overview</h2>
                  <p className="text-xs text-muted-foreground">Real-time performance metrics.</p>
                </div>
                <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Export
                </button>
              </div>

              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Students" value="45,231" trend="+2.5%" trendUp icon={GraduationCap} color="text-blue-500" bgColor="bg-blue-500/10" />
                <MetricCard title="Total Staff" value="3,402" trend="+1.2%" trendUp icon={Users} color="text-purple-500" bgColor="bg-purple-500/10" />
                <MetricCard title="Budget Utilized" value="68%" trend="-4.1%" trendUp={false} icon={DollarSign} color="text-green-500" bgColor="bg-green-500/10" />
                <MetricCard title="Avg Attendance" value="94.2%" trend="+0.8%" trendUp icon={UserCheck} color="text-orange-500" bgColor="bg-orange-500/10" />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm backdrop-blur-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Financial Performance</h3>
                    <select className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] outline-none">
                      <option>This Year</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData}>
                        <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBudget)" />
                        <Area type="monotone" dataKey="budget" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-span-3 rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold text-sm">Action Items</h3>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Budget Review', desc: 'Q3 allocation pending', color: 'bg-red-500' },
                      { title: 'Staff Hiring', desc: '3 Science positions', color: 'bg-yellow-500' },
                      { title: 'Facility Check', desc: 'North Wing maint.', color: 'bg-blue-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-2.5 transition-colors hover:bg-muted/50">
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${item.color} shadow-sm`} />
                        <div>
                          <div className="text-xs font-medium text-foreground">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeState === 'multi-campus' && (
            <div className="absolute inset-0 p-5 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Campus Operations</h2>
                  <p className="text-xs text-muted-foreground">Live status of all educational facilities.</p>
                </div>
                <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Filter
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campusData.map((campus, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                    <div className="h-20 w-full relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    </div>
                    <div className="p-4">
                      <div className="absolute top-14 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-background bg-card shadow-sm">
                        <campus.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="mt-6">
                        <div className="flex items-start justify-between">
                          <div className="pr-2">
                            <h3 className="font-bold text-base leading-tight truncate max-w-[120px]" title={campus.name}>{campus.name}</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{campus.type}</p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              campus.status === 'Optimal'
                                ? 'bg-green-500/10 text-green-500'
                                : campus.status === 'Good'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {campus.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-muted/50 p-2.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                              <GraduationCap className="h-3 w-3" />
                              <span className="text-[10px] font-medium">Students</span>
                            </div>
                            <div className="text-base font-bold">{campus.students}</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                              <Users className="h-3 w-3" />
                              <span className="text-[10px] font-medium">Staff</span>
                            </div>
                            <div className="text-base font-bold">{campus.staff}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-medium text-muted-foreground">Health Score</span>
                            <span className="font-bold">{campus.health}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${campus.health > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${campus.health}%` }}
                            />
                          </div>
                        </div>
                        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border/50 bg-background/50 py-1.5 text-xs font-medium transition-colors hover:bg-muted hover:text-primary group-hover:border-primary/20">
                          View Dashboard
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {activeState === 'hr' && (
            <div className="absolute inset-0 p-5 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">

              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Workforce Analytics</h2>
                <p className="text-xs text-muted-foreground">Staff distribution and retention metrics.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
                  <h3 className="mb-4 font-semibold text-sm">Role Distribution</h3>
                  <div className="flex items-center justify-center">
                    <div className="h-[200px] w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={hrData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {hrData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-4">
                    {hrData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-medium text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Retention Rate</h3>
                      <span className="text-green-500 font-bold text-base">96.5%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[96.5%] rounded-full bg-green-500" />
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">Top 5% of districts in the state</p>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Professional Development</h3>
                      <span className="text-blue-500 font-bold text-base">842 hrs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Advanced Pedagogy', progress: 75 },
                        { name: 'Digital Literacy', progress: 45 },
                        { name: 'Inclusive Classroom', progress: 90 },
                      ].map((course, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between text-[10px] font-medium">
                            <span>{course.name}</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeState === 'analytics' && (
            <div className="absolute inset-0 p-5 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">

              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Predictive Insights</h2>
                <p className="text-xs text-muted-foreground">AI-driven analysis for future planning.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="col-span-2 rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
                  <h3 className="mb-4 font-semibold text-sm">Student Performance Forecast</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overviewData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="budget" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 p-5 shadow-sm backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <BrainCircuit className="h-5 w-5" />
                      <h3 className="font-semibold text-sm">Intelligent Insight</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80 text-pretty">
                      Enrollment projection models indicate a <strong>12% surge in STEM demand</strong> for Q3.
                    </p>
                    <div className="mt-2 rounded-lg bg-background/50 p-2 text-[10px] border border-primary/10">
                      <span className="font-semibold text-primary">Recommended Action:</span> Reallocate <strong>$45k</strong> from surplus to secure 3 adjunct lab instructors.
                    </div>
                    <button className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                      Execute Allocation
                    </button>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
                    <h3 className="mb-3 font-semibold text-sm">Risk Assessment</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-2.5 text-red-600">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Budget Variance</span>
                        </div>
                        <span className="text-[10px] font-bold bg-red-500/20 px-1.5 py-0.5 rounded">HIGH</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 p-2.5 text-yellow-600">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Staff Turnover</span>
                        </div>
                        <span className="text-[10px] font-bold bg-yellow-500/20 px-1.5 py-0.5 rounded">MED</span>
                      </div>
                    </div>
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

function MetricCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string
  value: string
  trend: string
  trendUp: boolean
  icon: React.ElementType
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className={`flex items-center text-[10px] font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3 rotate-180" />}
          {trend}
        </span>
      </div>
      <div>
        <div className="text-xl font-bold text-foreground tracking-tight">{value}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">{title}</div>
      </div>
    </div>
  )
}
