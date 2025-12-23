import { motion } from 'framer-motion'
import {
    GraduationCap,
} from 'lucide-react'
import { ReactNode } from 'react'



export function AcademicsLayout({ children }: { children: ReactNode }) {
    // const navigate = useNavigate()
    // const location = useLocation()

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="bg-surface-secondary border-b border-border-primary">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Academics</h1>
                            <p className="text-text-secondary">
                                Manage students, teachers, attendance, and academic records
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}

                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    )
}
