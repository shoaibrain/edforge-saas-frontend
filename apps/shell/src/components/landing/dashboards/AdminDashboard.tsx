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
  AlertCircle,
  Bell,
  School,
  ArrowRight,
  BrainCircuit,
  MoreHorizontal,
} from 'lucide-react'
import { getStaffAvatar } from '../../../lib/avatar'

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
  { name: 'Teaching', value: 65, color: '#2a9d8f' },
  { name: 'Admin', value: 15, color: '#5ec4b6' },
  { name: 'Support', value: 20, color: '#e9c46a' },
]

export function AdminDashboard({ activeState }: AdminDashboardProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Administrative dashboard demonstration showing school management features"
      className="relative overflow-hidden transition-all duration-500 flex flex-col h-[min(480px,65vh)] md:h-[min(560px,70vh)]"
      style={{ backgroundColor: 'rgb(var(--surface-secondary))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-xl)', boxShadow: 'var(--lp-shadow-dashboard)' }}
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
          style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderRight: '1px solid rgb(var(--border-primary))' }}
        >
          <div className="flex h-full flex-col py-6">
            {/* Logo Area */}
            <div className={`mb-8 flex items-center gap-3 px-6 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center shadow-lg"
                style={{ backgroundColor: 'var(--lp-chart-primary)', color: 'rgb(var(--text-inverted))', borderRadius: 'var(--lp-radius-sm)', boxShadow: '0 10px 15px -3px rgba(var(--brand-primary),0.2)' }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <span
                className={`tracking-tight transition-opacity duration-300 ${
                  isSidebarCollapsed ? 'hidden opacity-0' : 'opacity-100'
                }`}
                style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
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
                  className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-all duration-150 ease-in-out ${
                    isSidebarCollapsed ? 'justify-center px-0' : ''
                  }`}
                  style={
                    activeState === item.state
                      ? { backgroundColor: 'rgba(var(--brand-primary),0.15)', color: 'var(--lp-chart-primary)', borderRadius: 'var(--lp-radius-sm)' }
                      : { color: 'rgb(var(--text-tertiary))', borderRadius: 'var(--lp-radius-sm)' }
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isSidebarCollapsed ? 'hidden w-0 opacity-0' : 'opacity-100'
                    }`}
                    style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)' }}
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
          style={{ backgroundColor: 'rgba(var(--surface-primary),0.3)' }}
        >
          {/* Top Navigation */}
          <div
            className="flex h-14 shrink-0 items-center justify-between px-6 backdrop-blur-md"
            style={{ borderBottom: '1px solid rgba(var(--brand-primary),0.1)' }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden p-1.5 md:block"
                style={{ color: 'rgb(var(--text-secondary))', borderRadius: 'var(--lp-radius-sm)' }}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-1.5 transition-colors" style={{ borderRadius: 'var(--lp-radius-sm)' }}>
                <Bell className="h-4 w-4" style={{ color: 'rgb(var(--text-secondary))' }} />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--lp-chart-danger)', boxShadow: '0 0 0 2px rgb(var(--surface-primary))' }}
                />
              </button>
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <div className="leading-none" style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Dr. R. Wilson</div>
                  <div className="mt-0.5" style={{ fontSize: '10px', color: 'rgb(var(--text-secondary))' }}>Superintendent</div>
                </div>
                <div className="relative">
                  <img
                    src={getStaffAvatar('Dr. R. Wilson')}
                    alt="Dr. R. Wilson"
                    className="h-8 w-8 rounded-full"
                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)' }}
                  />
                  <span
                    className="absolute bottom-0 right-0 h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--lp-chart-success)', border: '1px solid rgb(var(--surface-primary))' }}
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>District Overview</h2>
                  <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Real-time performance metrics.</p>
                </div>
                <button
                  className="p-1.5 transition-colors"
                  style={{ borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-secondary))' }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                <MetricCard title="Total Students" value="45,231" trend="+2.5%" trendUp icon={GraduationCap} color="text-[#2a9d8f]" bgColor="bg-[rgba(42,157,143,0.1)]" />
                <MetricCard title="Total Staff" value="3,402" trend="+1.2%" trendUp icon={Users} color="text-[#5ec4b6]" bgColor="bg-[rgba(94,196,182,0.1)]" />
                <MetricCard title="Avg Attendance" value="94.2%" trend="+0.8%" trendUp icon={UserCheck} color="text-[#e9c46a]" bgColor="bg-[rgba(233,196,106,0.1)]" />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-7">
                <div
                  className="col-span-4 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Financial Performance</h3>
                    <select
                      className="px-2 py-0.5 outline-none"
                      style={{ fontSize: '10px', backgroundColor: 'rgb(var(--surface-primary))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: '6px', color: 'rgb(var(--text-primary))' }}
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
                            <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(42,157,143,0.1)" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8aafbf' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8aafbf' }} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#102630', borderColor: 'rgba(42,157,143,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e8edf0' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#2a9d8f" strokeWidth={2} fillOpacity={1} fill="url(#colorBudget)" />
                        <Area type="monotone" dataKey="budget" stroke="#8aafbf" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div
                  className="col-span-3 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h3 className="mb-3" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Action Items</h3>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Budget Review', desc: 'Q3 allocation pending', color: 'var(--lp-chart-danger)' },
                      { title: 'Staff Hiring', desc: '3 Science positions', color: 'var(--lp-chart-accent)' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2.5 transition-colors"
                        style={{ backgroundColor: 'rgba(var(--surface-primary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)' }}
                      >
                        <div className="mt-1 h-1.5 w-1.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <div>
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: 'rgb(var(--text-secondary))' }}>{item.desc}</div>
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Campus Operations</h2>
                  <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Live status of all educational facilities.</p>
                </div>
                <button
                  className="px-3 py-1.5 font-medium transition-colors"
                  style={{ fontSize: 'var(--lp-font-label)', backgroundColor: 'rgb(var(--surface-primary))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
                >
                  Filter
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campusData.slice(0, 3).map((campus, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-col overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(42,157,143,0.05)]"
                    style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', boxShadow: 'var(--lp-shadow-card)' }}
                  >
                    <div className="h-20 w-full relative overflow-hidden bg-gradient-to-br from-[rgba(42,157,143,0.2)] to-[rgba(42,157,143,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div
                        className="absolute top-14 left-4 z-20 flex h-10 w-10 items-center justify-center shadow-sm"
                        style={{ backgroundColor: 'rgb(var(--surface-secondary))', border: '4px solid rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-md)' }}
                      >
                        <campus.icon className="h-5 w-5" style={{ color: 'rgb(var(--text-primary))' }} />
                      </div>
                      <div className="mt-6 flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div className="pr-2">
                            <h3 className="font-bold text-base leading-tight truncate max-w-[120px]" title={campus.name} style={{ color: 'rgb(var(--text-primary))' }}>{campus.name}</h3>
                            <p className="mt-0.5 truncate" style={{ fontSize: '10px', color: 'rgb(var(--text-secondary))' }}>{campus.type}</p>
                          </div>
                          <span
                            className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: campus.status === 'Optimal' ? 'rgba(52,211,153,0.1)' : campus.status === 'Good' ? 'rgba(42,157,143,0.1)' : 'rgba(233,196,106,0.1)',
                              color: campus.status === 'Optimal' ? 'var(--lp-chart-success)' : campus.status === 'Good' ? 'var(--lp-chart-primary)' : 'var(--lp-chart-accent)',
                            }}
                          >
                            {campus.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="p-2.5" style={{ backgroundColor: 'rgba(var(--surface-tertiary),0.5)', borderRadius: 'var(--lp-radius-sm)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                              <GraduationCap className="h-3 w-3" />
                              <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)' }}>Students</span>
                            </div>
                            <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.students}</div>
                          </div>
                          <div className="p-2.5" style={{ backgroundColor: 'rgba(var(--surface-tertiary),0.5)', borderRadius: 'var(--lp-radius-sm)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                              <Users className="h-3 w-3" />
                              <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)' }}>Staff</span>
                            </div>
                            <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.staff}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1" style={{ fontSize: '10px' }}>
                            <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-secondary))' }}>Health Score</span>
                            <span style={{ fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.health}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${campus.health}%`, backgroundColor: campus.health > 90 ? 'var(--lp-chart-success)' : 'var(--lp-chart-accent)' }}
                            />
                          </div>
                        </div>
                        <button
                          className="mt-auto pt-4 flex w-full items-center justify-center gap-2 py-1.5 font-medium transition-colors"
                          style={{ fontSize: 'var(--lp-font-label)', backgroundColor: 'rgba(var(--surface-primary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >

              <div className="mb-5">
                <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Workforce Analytics</h2>
                <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>Staff distribution and retention metrics.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div
                  className="shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h3 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Role Distribution</h3>
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
                        <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-secondary))' }}>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Retention Rate</h3>
                      <span style={{ color: 'var(--lp-chart-success)', fontWeight: 'var(--lp-weight-heading)', fontSize: 'var(--lp-font-dashboard-value)' }}>96.5%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)' }}>
                      <div className="h-full w-[96.5%] rounded-full" style={{ backgroundColor: 'var(--lp-chart-success)' }} />
                    </div>
                    <p className="mt-2" style={{ fontSize: '10px', color: 'rgb(var(--text-secondary))' }}>Top 5% of districts in the state</p>
                  </div>

                  <div
                    className="shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Professional Development</h3>
                      <span style={{ color: 'var(--lp-chart-secondary)', fontWeight: 'var(--lp-weight-heading)', fontSize: 'var(--lp-font-dashboard-value)' }}>842 hrs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Advanced Pedagogy', progress: 75 },
                        { name: 'Digital Literacy', progress: 45 },
                      ].map((course, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between" style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>
                            <span>{course.name}</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(var(--brand-primary),0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: 'var(--lp-chart-primary)' }} />
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >

              <div className="mb-5">
                <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Predictive Insights</h2>
                <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>AI-driven analysis for future planning.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div
                  className="col-span-2 shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h3 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Student Performance Forecast</h3>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overviewData}>
                        <defs>
                          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8aafbf' }} dy={10} interval={Math.ceil(overviewData.length / 3)} />
                        <YAxis axisLine={false} tickLine={false} tick={false} width={0} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#102630', borderColor: 'rgba(42,157,143,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e8edf0' }}
                        />
                        <Line type="monotone" dataKey="actual" stroke="#2a9d8f" strokeWidth={2.5} dot={{ r: 3, fill: '#2a9d8f', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="budget" stroke="#8aafbf" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="shadow-sm backdrop-blur-sm"
                    style={{ background: 'linear-gradient(to bottom right, rgba(42,157,143,0.1), rgba(42,157,143,0.05))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)' }}
                  >
                    <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--lp-chart-primary)' }}>
                      <BrainCircuit className="h-5 w-5" />
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)' }}>Intelligent Insight</h3>
                    </div>
                    <p className="leading-relaxed text-pretty" style={{ fontSize: 'var(--lp-font-label)', color: 'rgba(var(--text-primary),0.8)' }}>
                      Enrollment projection models indicate a <strong>12% surge in STEM demand</strong> for Q3.
                    </p>
                    <div
                      className="mt-2 p-2"
                      style={{ fontSize: '10px', backgroundColor: 'rgba(var(--surface-primary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.1)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
                    >
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'var(--lp-chart-primary)' }}>Recommended Action:</span> Reallocate <strong>$45k</strong> from surplus to secure 3 adjunct lab instructors.
                    </div>
                    <button
                      className="mt-4 w-full px-3 py-2 transition-colors"
                      style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.3)', borderRadius: 'var(--lp-radius-sm)', color: 'var(--lp-chart-secondary)', backgroundColor: 'transparent' }}
                    >
                      Execute Allocation
                    </button>
                  </div>

                  <div
                    className="shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                  >
                    <h3 className="mb-3" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Risk Assessment</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5" style={{ backgroundColor: 'rgba(231,111,81,0.1)', borderRadius: 'var(--lp-radius-sm)', color: 'var(--lp-chart-danger)' }}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)' }}>Budget Variance</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-heading)', backgroundColor: 'rgba(231,111,81,0.2)', padding: '2px 6px', borderRadius: '4px' }}>HIGH</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5" style={{ backgroundColor: 'rgba(233,196,106,0.1)', borderRadius: 'var(--lp-radius-sm)', color: 'var(--lp-chart-accent)' }}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)' }}>Staff Turnover</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-heading)', backgroundColor: 'rgba(233,196,106,0.2)', padding: '2px 6px', borderRadius: '4px' }}>MED</span>
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
      className="shadow-sm backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
      style={{ backgroundColor: 'rgba(var(--surface-secondary),0.5)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(var(--brand-primary),0.08)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`p-2 ${bgColor}`} style={{ borderRadius: 'var(--lp-radius-sm)' }}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="flex items-center" style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)', color: trendUp ? 'var(--lp-chart-success)' : 'var(--lp-chart-danger)' }}>
          {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3 rotate-180" />}
          {trend}
        </span>
      </div>
      <div>
        <div className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{value}</div>
        <div className="mt-0.5" style={{ fontSize: '10px', color: 'rgb(var(--text-secondary))' }}>{title}</div>
      </div>
    </div>
  )
})
