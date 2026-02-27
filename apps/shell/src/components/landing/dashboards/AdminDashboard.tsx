import { useState, memo } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
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
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Administrative dashboard demonstration showing school management features"
      className="relative overflow-hidden rounded-2xl shadow-xl shadow-black/40 transition-all duration-500 flex flex-col h-[min(480px,65vh)] md:h-[min(560px,70vh)]"
      style={{ backgroundColor: '#102630', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
    >
      {/* Glass Overlay Effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#2a9d8f]/5 via-transparent to-[#2a9d8f]/5" />

      {/* Dashboard Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`relative z-10 hidden backdrop-blur-xl transition-all duration-500 ease-in-out md:block ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
          style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderRight: '1px solid rgba(42,157,143,0.1)' }}
        >
          <div className="flex h-full flex-col py-6">
            {/* Logo Area */}
            <div className={`mb-8 flex items-center gap-3 px-6 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-lg"
                style={{ backgroundColor: '#2a9d8f', color: '#050b0f', boxShadow: '0 10px 15px -3px rgba(42,157,143,0.2)' }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <span
                className={`font-bold text-lg tracking-tight transition-opacity duration-300 ${
                  isSidebarCollapsed ? 'hidden opacity-0' : 'opacity-100'
                }`}
                style={{ color: '#e8edf0' }}
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
                    isSidebarCollapsed ? 'justify-center px-0' : ''
                  }`}
                  style={
                    activeState === item.state
                      ? { backgroundColor: '#2a9d8f', color: '#050b0f', boxShadow: '0 4px 6px -1px rgba(42,157,143,0.2)' }
                      : { color: '#8aafbf' }
                  }
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
        <div
          className="flex flex-1 flex-col overflow-hidden backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(10,26,36,0.3)' }}
        >
          {/* Top Navigation */}
          <div
            className="flex h-14 shrink-0 items-center justify-between px-6 backdrop-blur-md"
            style={{ borderBottom: '1px solid rgba(42,157,143,0.1)' }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden rounded-lg p-1.5 md:block"
                style={{ color: '#8aafbf' }}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: '#8aafbf' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-48 rounded-lg pl-9 text-xs outline-none transition-all"
                  style={{
                    backgroundColor: 'rgba(10,26,36,0.5)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(42,157,143,0.1)',
                    color: '#e8edf0',
                  }}
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-lg p-1.5 transition-colors">
                <Bell className="h-4 w-4" style={{ color: '#8aafbf' }} />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500"
                  style={{ boxShadow: '0 0 0 2px #0a1a24' }}
                />
              </button>
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold leading-none" style={{ color: '#e8edf0' }}>Dr. R. Wilson</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#8aafbf' }}>Superintendent</div>
                </div>
                <div className="relative">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#162e3b', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#8aafbf' }}
                  >
                    RW
                  </div>
                  <span
                    className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500"
                    style={{ border: '1px solid #0a1a24' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative flex-1 overflow-hidden p-5">
            <AnimatePresence mode="wait">
            {activeState === 'overview' && (
            <motion.div
              key="overview"
              className="absolute inset-0 p-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: '#e8edf0' }}>District Overview</h2>
                  <p className="text-xs" style={{ color: '#8aafbf' }}>Real-time performance metrics.</p>
                </div>
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ backgroundColor: '#0a1a24', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#e8edf0' }}
                >
                  Export
                </button>
              </div>

              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                <MetricCard title="Total Students" value="45,231" trend="+2.5%" trendUp icon={GraduationCap} color="text-blue-500" bgColor="bg-blue-500/10" />
                <MetricCard title="Total Staff" value="3,402" trend="+1.2%" trendUp icon={Users} color="text-purple-500" bgColor="bg-purple-500/10" />
                <MetricCard title="Avg Attendance" value="94.2%" trend="+0.8%" trendUp icon={UserCheck} color="text-orange-500" bgColor="bg-orange-500/10" />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-7">
                <div
                  className="col-span-4 rounded-xl p-4 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: '#e8edf0' }}>Financial Performance</h3>
                    <select
                      className="rounded-md px-2 py-0.5 text-[10px] outline-none"
                      style={{ backgroundColor: '#0a1a24', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#e8edf0' }}
                    >
                      <option>This Year</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData}>
                        <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(42,157,143,0.1)" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8aafbf' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8aafbf' }} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#102630', borderColor: 'rgba(42,157,143,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e8edf0' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBudget)" />
                        <Area type="monotone" dataKey="budget" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div
                  className="col-span-3 rounded-xl p-4 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h3 className="mb-3 font-semibold text-sm" style={{ color: '#e8edf0' }}>Action Items</h3>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Budget Review', desc: 'Q3 allocation pending', color: 'bg-red-500' },
                      { title: 'Staff Hiring', desc: '3 Science positions', color: 'bg-yellow-500' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg p-2.5 transition-colors"
                        style={{ backgroundColor: 'rgba(10,26,36,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                      >
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${item.color} shadow-sm`} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: '#e8edf0' }}>{item.title}</div>
                          <div className="text-[10px]" style={{ color: '#8aafbf' }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {activeState === 'multi-campus' && (
            <motion.div
              key="multi-campus"
              className="absolute inset-0 p-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: '#e8edf0' }}>Campus Operations</h2>
                  <p className="text-xs" style={{ color: '#8aafbf' }}>Live status of all educational facilities.</p>
                </div>
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ backgroundColor: '#0a1a24', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#e8edf0' }}
                >
                  Filter
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campusData.slice(0, 3).map((campus, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2a9d8f]/5"
                    style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <div className="h-20 w-full relative overflow-hidden bg-gradient-to-br from-[#2a9d8f]/20 to-[#2a9d8f]/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    </div>
                    <div className="p-4">
                      <div
                        className="absolute top-14 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ backgroundColor: '#102630', border: '4px solid #0a1a24' }}
                      >
                        <campus.icon className="h-5 w-5" style={{ color: '#e8edf0' }} />
                      </div>
                      <div className="mt-6">
                        <div className="flex items-start justify-between">
                          <div className="pr-2">
                            <h3 className="font-bold text-base leading-tight truncate max-w-[120px]" title={campus.name} style={{ color: '#e8edf0' }}>{campus.name}</h3>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8aafbf' }}>{campus.type}</p>
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
                          <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(22,46,59,0.5)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: '#8aafbf' }}>
                              <GraduationCap className="h-3 w-3" />
                              <span className="text-[10px] font-medium">Students</span>
                            </div>
                            <div className="text-base font-bold" style={{ color: '#e8edf0' }}>{campus.students}</div>
                          </div>
                          <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(22,46,59,0.5)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: '#8aafbf' }}>
                              <Users className="h-3 w-3" />
                              <span className="text-[10px] font-medium">Staff</span>
                            </div>
                            <div className="text-base font-bold" style={{ color: '#e8edf0' }}>{campus.staff}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-medium" style={{ color: '#8aafbf' }}>Health Score</span>
                            <span className="font-bold" style={{ color: '#e8edf0' }}>{campus.health}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#162e3b' }}>
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${campus.health > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${campus.health}%` }}
                            />
                          </div>
                        </div>
                        <button
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'rgba(10,26,36,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#e8edf0' }}
                        >
                          View Dashboard
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            )}

            {activeState === 'hr' && (
            <motion.div
              key="hr"
              className="absolute inset-0 p-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >

              <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight" style={{ color: '#e8edf0' }}>Workforce Analytics</h2>
                <p className="text-xs" style={{ color: '#8aafbf' }}>Staff distribution and retention metrics.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div
                  className="rounded-xl p-5 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h3 className="mb-4 font-semibold text-sm" style={{ color: '#e8edf0' }}>Role Distribution</h3>
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
                        <span className="text-[10px] font-medium" style={{ color: '#8aafbf' }}>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-xl p-5 shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-sm" style={{ color: '#e8edf0' }}>Retention Rate</h3>
                      <span className="text-green-500 font-bold text-base">96.5%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#162e3b' }}>
                      <div className="h-full w-[96.5%] rounded-full bg-green-500" />
                    </div>
                    <p className="mt-2 text-[10px]" style={{ color: '#8aafbf' }}>Top 5% of districts in the state</p>
                  </div>

                  <div
                    className="rounded-xl p-5 shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-sm" style={{ color: '#e8edf0' }}>Professional Development</h3>
                      <span className="text-blue-500 font-bold text-base">842 hrs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Advanced Pedagogy', progress: 75 },
                        { name: 'Digital Literacy', progress: 45 },
                      ].map((course, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between text-[10px] font-medium" style={{ color: '#e8edf0' }}>
                            <span>{course.name}</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#162e3b' }}>
                            <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: '#2a9d8f' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {activeState === 'analytics' && (
            <motion.div
              key="analytics"
              className="absolute inset-0 p-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >

              <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight" style={{ color: '#e8edf0' }}>Predictive Insights</h2>
                <p className="text-xs" style={{ color: '#8aafbf' }}>AI-driven analysis for future planning.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div
                  className="col-span-2 rounded-xl p-5 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                >
                  <h3 className="mb-4 font-semibold text-sm" style={{ color: '#e8edf0' }}>Student Performance Forecast</h3>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overviewData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(42,157,143,0.1)" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8aafbf' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8aafbf' }} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#102630', borderColor: 'rgba(42,157,143,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e8edf0' }}
                        />
                        <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="budget" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-xl p-5 shadow-sm backdrop-blur-sm bg-gradient-to-br from-[#2a9d8f]/10 to-[#2a9d8f]/10"
                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <div className="mb-3 flex items-center gap-2" style={{ color: '#2a9d8f' }}>
                      <BrainCircuit className="h-5 w-5" />
                      <h3 className="font-semibold text-sm">Intelligent Insight</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-pretty" style={{ color: 'rgba(232,237,240,0.8)' }}>
                      Enrollment projection models indicate a <strong>12% surge in STEM demand</strong> for Q3.
                    </p>
                    <div
                      className="mt-2 rounded-lg p-2 text-[10px]"
                      style={{ backgroundColor: 'rgba(10,26,36,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)', color: '#e8edf0' }}
                    >
                      <span className="font-semibold" style={{ color: '#2a9d8f' }}>Recommended Action:</span> Reallocate <strong>$45k</strong> from surplus to secure 3 adjunct lab instructors.
                    </div>
                    <button
                      className="mt-4 w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{ backgroundColor: '#2a9d8f', color: '#050b0f', boxShadow: '0 10px 15px -3px rgba(42,157,143,0.2)' }}
                    >
                      Execute Allocation
                    </button>
                  </div>

                  <div
                    className="rounded-xl p-5 shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
                  >
                    <h3 className="mb-3 font-semibold text-sm" style={{ color: '#e8edf0' }}>Risk Assessment</h3>
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
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

const MetricCard = memo(function MetricCard({
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
    <div
      className="rounded-xl p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
      style={{ backgroundColor: 'rgba(16,38,48,0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(42,157,143,0.1)' }}
    >
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
        <div className="text-lg font-bold tracking-tight" style={{ color: '#e8edf0' }}>{value}</div>
        <div className="mt-0.5 text-[10px]" style={{ color: '#8aafbf' }}>{title}</div>
      </div>
    </div>
  )
})
