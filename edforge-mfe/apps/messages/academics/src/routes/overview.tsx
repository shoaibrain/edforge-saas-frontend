import { motion } from 'framer-motion'
import {
    GraduationCap,
    Users,
    Clock,
    BookOpen,
    UserPlus,
    BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Button } from '@edforge/ui'

export function Overview() {
    // Mock stats
    const stats = [
        { label: 'Total Students', value: '1,234', change: '+23 this month', icon: GraduationCap },
        { label: 'Active Teachers', value: '89', change: '+2 this year', icon: Users },
        { label: 'Attendance Rate', value: '94.5%', change: '+0.3% vs last week', icon: Clock },
        { label: 'Classes', value: '156', change: '32 active today', icon: BookOpen },
    ]

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-text-tertiary">{stat.label}</p>
                                        <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                                        <p className="text-sm text-aqua-600">{stat.change}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-teal-500/10">
                                        <stat.icon className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-text-primary">Quick Actions</h3>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Add Student', icon: UserPlus },
                        { label: 'Record Attendance', icon: Clock },
                        { label: 'Enter Grades', icon: BookOpen },
                        { label: 'View Reports', icon: BarChart3 },
                    ].map((action) => (
                        <Button key={action.label} variant="outline" className="h-auto py-4 flex-col gap-2">
                            <action.icon className="w-5 h-5" />
                            <span>{action.label}</span>
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
